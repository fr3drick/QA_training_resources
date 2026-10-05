const express = require('express');
const db = require('./db');
const { hashPassword, signToken, requireAuth, TOKEN_TTL_SECONDS } = require('./auth');
const { version } = require('../package.json');

const RISK_CHECK_MS = Number(process.env.RISK_CHECK_MS || 50);
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const round2 = (n) => Math.round(n * 100) / 100;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const app = express();
app.use(express.json({ limit: '100kb' }));

// One log line per request: method, path, status, duration.
app.use((req, res, next) => {
  const started = process.hrtime.bigint();
  res.on('finish', () => {
    const ms = Number(process.hrtime.bigint() - started) / 1e6;
    console.log(`${req.method} ${req.originalUrl} ${res.statusCode} ${ms.toFixed(1)}ms`);
  });
  next();
});

// ---------------------------------------------------------------------------
// Health
// ---------------------------------------------------------------------------
app.get('/health', async (req, res) => {
  try {
    await db.query('SELECT 1');
    res.json({ status: 'ok', db: 'up', version });
  } catch {
    res.status(503).json({ status: 'degraded', db: 'down', version });
  }
});

// ---------------------------------------------------------------------------
// Auth
// ---------------------------------------------------------------------------
app.post('/auth/register', async (req, res) => {
  const body = req.body || {};
  const missing = ['first_name', 'last_name', 'email', 'password'].filter((f) => !body[f]);
  if (missing.length) {
    return res.status(400).json({ error: 'Missing required fields', fields: missing });
  }
  const { first_name, last_name, email, password, country = null } = body;
  if (!EMAIL_PATTERN.test(email)) {
    return res.status(400).json({ error: 'Invalid email address' });
  }
  if (password.length < 8) {
    return res.status(400).json({ error: 'Password must be at least 8 characters' });
  }

  try {
    const { rows } = await db.query(
      `INSERT INTO customers (first_name, last_name, email, password_hash, country)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, first_name, last_name, email, country, is_active, created_at`,
      [first_name, last_name, email, hashPassword(password), country],
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    if (err.code === '23505') {
      return res.status(409).json({ error: 'Email already registered' });
    }
    throw err;
  }
});

app.post('/auth/login', async (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) {
    return res.status(400).json({ error: 'email and password are required' });
  }
  const { rows } = await db.query(
    'SELECT id, password_hash, is_active FROM customers WHERE email = $1',
    [email],
  );
  if (!rows.length) {
    return res.status(401).json({ error: 'No account found for that email' });
  }
  if (rows[0].password_hash !== hashPassword(password)) {
    return res.status(401).json({ error: 'Incorrect password' });
  }
  if (!rows[0].is_active) {
    return res.status(403).json({ error: 'Account is disabled' });
  }
  res.json({
    access_token: signToken({ sub: rows[0].id }),
    token_type: 'Bearer',
    expires_in: TOKEN_TTL_SECONDS,
  });
});

app.get('/me', requireAuth, async (req, res) => {
  const { rows } = await db.query(
    `SELECT id, first_name, last_name, email, country, is_active, created_at
     FROM customers WHERE id = $1`,
    [req.customerId],
  );
  if (!rows.length) return res.status(404).json({ error: 'Customer not found' });
  res.json(rows[0]);
});

// ---------------------------------------------------------------------------
// Products
// ---------------------------------------------------------------------------
const PRODUCT_COLUMNS = 'id, sku, name, description, category, price, stock';

app.get('/products', async (req, res) => {
  const page = Number(req.query.page ?? 1);
  const limit = Number(req.query.limit ?? 20);
  if (!Number.isInteger(page) || !Number.isInteger(limit) || limit < 1) {
    return res.status(400).json({ error: 'page and limit must be positive integers' });
  }

  const params = [];
  let where = 'WHERE is_active = true';
  if (req.query.category) {
    params.push(req.query.category);
    where += ` AND category = $${params.length}`;
  }

  const count = await db.query(`SELECT count(*)::int AS total FROM products ${where}`, params);
  const { rows } = await db.query(
    `SELECT ${PRODUCT_COLUMNS} FROM products ${where}
     ORDER BY id LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
    [...params, limit, (page - 1) * limit],
  );
  res.json({ data: rows, page, limit, total: count.rows[0].total });
});

app.get('/products/search', async (req, res) => {
  const q = String(req.query.q || '').trim();
  if (q.length < 2) {
    return res.status(400).json({ error: 'q must be at least 2 characters' });
  }
  const { rows } = await db.query(
    `SELECT ${PRODUCT_COLUMNS} FROM products
     WHERE is_active = true
       AND (name ILIKE '%' || $1 || '%' OR description ILIKE '%' || $1 || '%')
     ORDER BY name
     LIMIT 50`,
    [q],
  );
  res.json({ data: rows, count: rows.length });
});

app.get('/products/:id', async (req, res) => {
  const { rows } = await db.query(
    `SELECT ${PRODUCT_COLUMNS} FROM products WHERE id = $1 AND is_active = true`,
    [req.params.id],
  );
  if (!rows.length) return res.status(404).json({ error: 'Product not found' });
  res.json(rows[0]);
});

// ---------------------------------------------------------------------------
// Orders
// ---------------------------------------------------------------------------
async function loadOrder(id) {
  const order = await db.query(
    `SELECT id, customer_id, status, subtotal, discount, total_amount, coupon_code,
            created_at, updated_at
     FROM orders WHERE id = $1`,
    [id],
  );
  if (!order.rows.length) return null;
  const items = await db.query(
    `SELECT product_id, qty, unit_price, line_total
     FROM order_items WHERE order_id = $1 ORDER BY id`,
    [id],
  );
  return { ...order.rows[0], currency: 'NGN', items: items.rows };
}

function parseOrderId(req, res) {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id < 1) {
    res.status(400).json({ error: 'Order id must be a positive integer' });
    return null;
  }
  return id;
}

app.post('/orders', requireAuth, async (req, res) => {
  const { items, coupon_code } = req.body || {};
  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: 'items must be a non-empty array' });
  }
  for (const item of items) {
    if (!Number.isInteger(item?.product_id) || !Number.isInteger(item?.qty)) {
      return res.status(400).json({ error: 'product_id and qty must be integers' });
    }
    if (item.qty < 0 || item.qty > 10) {
      return res.status(400).json({ error: 'qty must be between 1 and 10' });
    }
  }

  const lines = [];
  for (const item of items) {
    const { rows } = await db.query(
      'SELECT id, price, stock, is_active FROM products WHERE id = $1',
      [item.product_id],
    );
    const product = rows[0];
    if (!product || !product.is_active) {
      return res.status(422).json({ error: `Product ${item.product_id} not found` });
    }
    if (product.stock < item.qty) {
      return res.status(409).json({
        error: `Insufficient stock for product ${item.product_id}`,
        available: product.stock,
      });
    }
    lines.push({
      product_id: product.id,
      qty: item.qty,
      unit_price: product.price,
      line_total: round2(product.price * item.qty),
    });
  }
  const subtotal = round2(lines.reduce((sum, l) => sum + l.line_total, 0));

  let discount = 0;
  if (coupon_code !== undefined && coupon_code !== null) {
    const { rows } = await db.query(
      `SELECT code, percent_off, min_order_amount FROM coupons
       WHERE code = $1 AND is_active = true AND (expires_at IS NULL OR expires_at > now())`,
      [coupon_code],
    );
    const coupon = rows[0];
    if (!coupon) {
      return res.status(422).json({ error: 'Invalid or expired coupon' });
    }
    if (subtotal < coupon.min_order_amount) {
      return res.status(422).json({
        error: `Order must be at least ${coupon.min_order_amount} to use this coupon`,
      });
    }
    const used = await db.query(
      `SELECT 1 FROM orders WHERE customer_id = $1 AND coupon_code = $2 AND status = 'paid'`,
      [req.customerId, coupon.code],
    );
    if (used.rows.length) {
      return res.status(409).json({ error: 'You have already used this coupon' });
    }
    discount = round2((subtotal * coupon.percent_off) / 100);
  }
  const total = round2(subtotal - discount);

  // Fraud / risk check with the payment provider (simulated).
  await sleep(RISK_CHECK_MS);

  const created = await db.query(
    `INSERT INTO orders (customer_id, subtotal, discount, total_amount, coupon_code)
     VALUES ($1, $2, $3, $4, $5) RETURNING id`,
    [req.customerId, subtotal, discount, total, coupon_code ?? null],
  );
  const orderId = created.rows[0].id;
  for (const l of lines) {
    await db.query(
      `INSERT INTO order_items (order_id, product_id, qty, unit_price, line_total)
       VALUES ($1, $2, $3, $4, $5)`,
      [orderId, l.product_id, l.qty, l.unit_price, l.line_total],
    );
    await db.query('UPDATE products SET stock = stock - $2 WHERE id = $1', [l.product_id, l.qty]);
  }

  res.status(201).location(`/orders/${orderId}`).json(await loadOrder(orderId));
});

app.get('/orders', requireAuth, async (req, res) => {
  const { rows } = await db.query(
    `SELECT id, status, subtotal, discount, total_amount, coupon_code, created_at
     FROM orders WHERE customer_id = $1
     ORDER BY created_at DESC LIMIT 50`,
    [req.customerId],
  );
  res.json({ data: rows, count: rows.length });
});

app.get('/orders/:id', requireAuth, async (req, res) => {
  const id = parseOrderId(req, res);
  if (id === null) return;
  const order = await loadOrder(id);
  if (!order) return res.status(404).json({ error: 'Order not found' });
  res.json(order);
});

app.post('/orders/:id/pay', requireAuth, async (req, res) => {
  const id = parseOrderId(req, res);
  if (id === null) return;
  const order = await loadOrder(id);
  if (!order || order.customer_id !== req.customerId) {
    return res.status(404).json({ error: 'Order not found' });
  }
  if (order.status !== 'pending') {
    return res.status(409).json({ error: `Cannot pay an order with status '${order.status}'` });
  }
  await db.query(`UPDATE orders SET status = 'paid', updated_at = now() WHERE id = $1`, [id]);
  res.json(await loadOrder(id));
});

app.post('/orders/:id/cancel', requireAuth, async (req, res) => {
  const id = parseOrderId(req, res);
  if (id === null) return;
  const order = await loadOrder(id);
  if (!order || order.customer_id !== req.customerId) {
    return res.status(404).json({ error: 'Order not found' });
  }
  if (order.status === 'cancelled') {
    return res.status(409).json({ error: 'Order is already cancelled' });
  }
  await db.query(`UPDATE orders SET status = 'cancelled', updated_at = now() WHERE id = $1`, [id]);
  for (const item of order.items) {
    await db.query('UPDATE products SET stock = stock + $2 WHERE id = $1', [item.product_id, item.qty]);
  }
  res.json(await loadOrder(id));
});

// ---------------------------------------------------------------------------
// Fallbacks
// ---------------------------------------------------------------------------
app.use((req, res) => {
  res.status(404).json({ error: `No route for ${req.method} ${req.path}` });
});

app.use((err, req, res, next) => {
  console.error(err);
  res.status(err.status || 500).json({ error: err.message, stack: err.stack });
});

module.exports = app;
