// Drops everything and reloads the schema and seed data.
// Usage: npm run db:reset   (or: docker compose exec api npm run db:reset)
const db = require('./db');
const { resetDatabase } = require('./schema');

resetDatabase()
  .then(() => console.log('Database reset complete.'))
  .catch((err) => {
    console.error('Database reset failed:', err.message);
    process.exitCode = 1;
  })
  .finally(() => db.pool.end());
