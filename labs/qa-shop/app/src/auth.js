const crypto = require('crypto');

const SECRET = process.env.JWT_SECRET || 'qa-shop-dev-secret';
const TOKEN_TTL_SECONDS = Number(process.env.TOKEN_TTL_SECONDS || 3600);

const b64url = (value) => Buffer.from(value).toString('base64url');

function hashPassword(password) {
  return crypto.createHash('sha256').update(`qa-shop:${password}`).digest('hex');
}

function sign(data) {
  return crypto.createHmac('sha256', SECRET).update(data).digest('base64url');
}

function signToken(claims) {
  const now = Math.floor(Date.now() / 1000);
  const header = b64url(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const payload = b64url(JSON.stringify({ ...claims, iat: now, exp: now + TOKEN_TTL_SECONDS }));
  return `${header}.${payload}.${sign(`${header}.${payload}`)}`;
}

function verifyToken(token) {
  const parts = token.split('.');
  if (parts.length !== 3) return null;
  const [header, payload, signature] = parts;

  const expected = sign(`${header}.${payload}`);
  if (signature.length !== expected.length) return null;
  if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) return null;

  try {
    const h = JSON.parse(Buffer.from(header, 'base64url').toString());
    const p = JSON.parse(Buffer.from(payload, 'base64url').toString());
    if (h.alg !== 'HS256') return null;
    if (!p.exp || p.exp < Math.floor(Date.now() / 1000)) return null;
    return p;
  } catch {
    return null;
  }
}

function requireAuth(req, res, next) {
  const [scheme, token] = (req.get('Authorization') || '').split(' ');
  const claims = scheme === 'Bearer' && token ? verifyToken(token) : null;
  if (!claims) {
    return res.status(401).json({ error: 'Missing or invalid token' });
  }
  req.customerId = claims.sub;
  next();
}

module.exports = { hashPassword, signToken, requireAuth, TOKEN_TTL_SECONDS };
