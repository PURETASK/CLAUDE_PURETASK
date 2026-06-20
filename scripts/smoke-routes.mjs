#!/usr/bin/env node
/**
 * HTTP smoke test for public routes and integration endpoints (no auth).
 * Usage: node scripts/smoke-routes.mjs [baseUrl]
 */
const base = process.argv[2] ?? 'http://localhost:3000';

const cases = [
  { name: 'Home', path: '/', expect: [200] },
  { name: 'Sign in', path: '/auth/sign-in', expect: [200] },
  { name: 'Pricing', path: '/pricing', expect: [200] },
  { name: 'Coverage', path: '/coverage', expect: [200] },
  { name: 'App (unauth redirect)', path: '/app', expect: [307, 302] },
  {
    name: 'Stripe Connect webhook (no config)',
    path: '/api/webhooks/stripe-connect',
    method: 'POST',
    body: '{}',
    expect: [503, 400],
  },
  {
    name: 'Checkr webhook (no config)',
    path: '/api/webhooks/checkr',
    method: 'POST',
    body: '{}',
    expect: [503, 400],
  },
  { name: 'Cron auto-approve (no auth)', path: '/api/cron/auto-approve', expect: [401] },
];

const results = [];

for (const c of cases) {
  const url = `${base}${c.path}`;
  try {
    const res = await fetch(url, {
      method: c.method ?? 'GET',
      headers: c.body ? { 'Content-Type': 'application/json' } : undefined,
      body: c.body,
      redirect: 'manual',
    });
    const ok = c.expect.includes(res.status);
    results.push({ name: c.name, status: res.status, ok, path: c.path });
  } catch (err) {
    results.push({ name: c.name, status: 'ERR', ok: false, path: c.path, error: String(err) });
  }
}

let failed = 0;
console.log(`\nSmoke test: ${base}\n`);
for (const r of results) {
  const mark = r.ok ? 'PASS' : 'FAIL';
  if (!r.ok) failed++;
  console.log(`  ${mark}  ${r.name}  ${r.path}  → ${r.status}${r.error ? ` (${r.error})` : ''}`);
}
console.log(`\n${results.length - failed}/${results.length} passed\n`);
process.exit(failed > 0 ? 1 : 0);
