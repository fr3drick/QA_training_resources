#!/usr/bin/env node
// Lists which specification rules (R1-R22) a Postman collection covers, based on the
// "(R<n>)" tags in request names.
//
// Usage: node coverage.js qa-shop.postman_collection.json
const fs = require('fs');

const RULES = 22;
const file = process.argv[2];
if (!file) {
  console.error('Usage: node coverage.js <collection.json>');
  process.exit(2);
}

const coverage = new Map();
function walk(items, folder) {
  for (const item of items) {
    if (item.item) {
      walk(item.item, item.name);
      continue;
    }
    const tags = (item.name.match(/\(([^)]*)\)\s*$/) || [, ''])[1].match(/R\d+/g) || [];
    for (const rule of tags) {
      if (!coverage.has(rule)) coverage.set(rule, []);
      coverage.get(rule).push(`${folder} / ${item.name}`);
    }
  }
}
walk(JSON.parse(fs.readFileSync(file, 'utf8')).item, '');

let covered = 0;
for (let i = 1; i <= RULES; i++) {
  const tests = coverage.get(`R${i}`) || [];
  if (tests.length) covered++;
  console.log(`R${i}`.padEnd(4), tests.length ? `${tests.length} test(s)` : '-- NOT COVERED --');
  tests.forEach((t) => console.log('      ', t));
}
console.log(`\n${covered}/${RULES} rules covered (${Math.round((covered / RULES) * 100)}%)`);
