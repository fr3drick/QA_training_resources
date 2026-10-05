#!/usr/bin/env node
// Turns a JMeter HTML report into a pass/fail result for a pipeline.
//
// Usage:
//   node check-thresholds.js <report-dir> [--p95=1000] [--error-pct=1] [--label=<sampler>:<p95>]...
//
// Reads <report-dir>/statistics.json (written by `jmeter -n ... -e -o <report-dir>`),
// prints a table, and exits 1 if any threshold is broken.
//   --p95        95th percentile limit in ms, applied to every sampler (default 1000)
//   --error-pct  overall error-rate limit in percent (default 1)
//   --label      a per-sampler p95 override, e.g. --label="GET /products/search:2000"

const fs = require('fs');
const path = require('path');

const [reportDir, ...flags] = process.argv.slice(2);
if (!reportDir) {
  console.error('Usage: node check-thresholds.js <report-dir> [--p95=ms] [--error-pct=n] [--label=name:ms]');
  process.exit(2);
}

let p95Limit = 1000;
let errorPctLimit = 1;
const labelLimits = {};
for (const flag of flags) {
  const [key, value] = flag.replace(/^--/, '').split(/=(.*)/s);
  if (key === 'p95') p95Limit = Number(value);
  else if (key === 'error-pct') errorPctLimit = Number(value);
  else if (key === 'label') {
    const i = value.lastIndexOf(':');
    labelLimits[value.slice(0, i)] = Number(value.slice(i + 1));
  } else {
    console.error(`Unknown option: ${flag}`);
    process.exit(2);
  }
}

const stats = JSON.parse(fs.readFileSync(path.join(reportDir, 'statistics.json'), 'utf8'));
const failures = [];
const rows = [];

for (const [label, s] of Object.entries(stats)) {
  if (label === 'Total') continue;
  // Transaction controllers ("TX ...") are summaries of the samplers inside them.
  const limit = labelLimits[label] ?? (label.startsWith('TX ') ? null : p95Limit);
  const p95 = s.pct2ResTime;
  const ok = limit === null || p95 <= limit;
  if (!ok) failures.push(`${label}: p95 ${p95.toFixed(0)} ms > ${limit} ms`);
  rows.push({
    label,
    samples: s.sampleCount,
    'error %': s.errorPct.toFixed(2),
    'avg ms': s.meanResTime.toFixed(0),
    'p95 ms': p95.toFixed(0),
    'limit ms': limit ?? '-',
    result: ok ? 'PASS' : 'FAIL',
  });
}

const total = stats.Total;
const errorOk = total.errorPct <= errorPctLimit;
if (!errorOk) failures.push(`Overall error rate ${total.errorPct.toFixed(2)}% > ${errorPctLimit}%`);

console.table(rows);
console.log(
  `Overall: ${total.sampleCount} samples, ${total.errorPct.toFixed(2)}% errors ` +
    `(limit ${errorPctLimit}%), ${total.throughput.toFixed(1)} req/s`,
);

if (failures.length) {
  console.error('\nPerformance thresholds FAILED:');
  failures.forEach((f) => console.error(`  - ${f}`));
  process.exit(1);
}
console.log('\nAll performance thresholds passed.');
