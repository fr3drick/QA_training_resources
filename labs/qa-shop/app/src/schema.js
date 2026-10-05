const fs = require('fs');
const path = require('path');
const db = require('./db');

const SQL_DIR = process.env.SQL_DIR || path.join(__dirname, '..', '..', 'db');
const FILES = ['01-schema.sql', '02-seed.sql'];

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function waitForDatabase(attempts = 60) {
  for (let i = 1; i <= attempts; i++) {
    try {
      await db.query('SELECT 1');
      return;
    } catch (err) {
      if (i === attempts) throw err;
      console.log(`Waiting for database (${i}/${attempts}): ${err.message}`);
      await sleep(1000);
    }
  }
}

async function applySqlFiles() {
  for (const file of FILES) {
    const started = Date.now();
    await db.query(fs.readFileSync(path.join(SQL_DIR, file), 'utf8'));
    console.log(`Applied ${file} in ${Date.now() - started} ms`);
  }
}

async function ensureSchema() {
  await waitForDatabase();
  const { rows } = await db.query("SELECT to_regclass('public.customers') AS t");
  if (rows[0].t) return;
  console.log('Empty database: creating schema and loading seed data...');
  await applySqlFiles();
}

async function resetDatabase() {
  await waitForDatabase();
  await db.query('DROP SCHEMA public CASCADE; CREATE SCHEMA public;');
  await applySqlFiles();
}

module.exports = { ensureSchema, resetDatabase };
