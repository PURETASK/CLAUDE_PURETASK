#!/usr/bin/env node
/**
 * Prints which integrations are configured (reads .env.local then process env).
 * Does not print secret values.
 */
import { existsSync, readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');

function loadEnvFile(filename) {
  const path = resolve(root, filename);
  if (!existsSync(path)) return;
  const lines = readFileSync(path, 'utf8').split('\n');
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (key && process.env[key] === undefined) {
      process.env[key] = value;
    }
  }
}

loadEnvFile('.env');
loadEnvFile('.env.local');

const checks = [
  {
    label: 'Supabase URL',
    required: true,
    ok: Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL),
  },
  {
    label: 'Supabase anon key',
    required: true,
    ok: Boolean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY),
  },
  {
    label: 'Supabase service role',
    required: true,
    ok: Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY),
  },
  {
    label: 'Site URL',
    required: true,
    ok: Boolean(process.env.NEXT_PUBLIC_SITE_URL),
  },
  { label: 'Stripe secret', required: false, v1: true, ok: Boolean(process.env.STRIPE_SECRET_KEY) },
  {
    label: 'Stripe publishable',
    required: false,
    v1: false,
    ok: Boolean(process.env.STRIPE_PUBLISHABLE_KEY),
  },
  {
    label: 'Stripe Connect webhook secret',
    required: false,
    v1: true,
    ok: Boolean(process.env.STRIPE_CONNECT_WEBHOOK_SECRET),
  },
  {
    label: 'Stripe Identity webhook secret',
    required: false,
    v1: true,
    ok: Boolean(process.env.STRIPE_IDENTITY_WEBHOOK_SECRET),
  },
  { label: 'Checkr API', required: false, v1: true, ok: Boolean(process.env.CHECKR_API_KEY) },
  {
    label: 'Checkr webhook secret',
    required: false,
    v1: true,
    ok: Boolean(process.env.CHECKR_WEBHOOK_SECRET),
  },
  {
    label: 'Tax encryption key (64 hex)',
    required: false,
    v1: true,
    ok: /^[0-9a-f]{64}$/i.test(process.env.TAX_ENCRYPTION_KEY ?? ''),
  },
  { label: 'Cron secret', required: false, v1: true, ok: Boolean(process.env.CRON_SECRET) },
  {
    label: 'Google Maps',
    required: false,
    v1: false,
    ok: Boolean(process.env.GOOGLE_MAPS_API_KEY),
  },
  { label: 'Resend', required: false, v1: false, ok: Boolean(process.env.RESEND_API_KEY) },
  {
    label: 'Web Push (VAPID)',
    required: false,
    v1: false,
    ok: Boolean(
      process.env.VAPID_PRIVATE_KEY &&
      process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY &&
      process.env.VAPID_EMAIL,
    ),
  },
  {
    label: 'Twilio SMS',
    required: false,
    v1: false,
    ok: Boolean(
      process.env.TWILIO_ACCOUNT_SID &&
      process.env.TWILIO_AUTH_TOKEN &&
      process.env.TWILIO_FROM_PHONE,
    ),
  },
];

console.log('\nPureTask integration status\n');
console.log(
  'Env files: .env.local' + (existsSync(resolve(root, '.env.local')) ? ' ✓' : ' (missing)'),
);
console.log('');

let bootOk = true;
let v1Ok = true;

for (const c of checks) {
  const status = c.ok ? 'ON ' : 'off';
  const tags = [];
  if (c.required) tags.push('boot');
  if (c.v1) tags.push('v1-e2e');
  const tagStr = tags.length ? ` [${tags.join(', ')}]` : '';
  console.log(`  ${status.padEnd(4)} ${c.label}${tagStr}`);
  if (c.required && !c.ok) bootOk = false;
  if (c.v1 && !c.ok) v1Ok = false;
}

console.log('');
if (!bootOk) {
  console.log('Cannot run the app until required Supabase / site URL vars are set.');
  console.log('Run: pnpm setup:env  then edit .env.local');
  process.exit(1);
}

if (!v1Ok) {
  console.log(
    'App can run for dev; V1 staging E2E needs more secrets (see docs/secrets-when-ready.md).',
  );
} else {
  console.log('All V1 E2E integrations appear configured.');
}

console.log('');
process.exit(0);
