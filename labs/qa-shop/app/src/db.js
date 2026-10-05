const { Pool, types } = require('pg');

// Return NUMERIC columns as JavaScript numbers rather than strings.
types.setTypeParser(1700, (value) => parseFloat(value));

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgres://qa:qa@localhost:5432/qa_shop',
  max: Number(process.env.DB_POOL_SIZE || 10),
});

module.exports = {
  pool,
  query: (text, params) => pool.query(text, params),
};
