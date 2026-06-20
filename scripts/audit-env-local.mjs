#!/usr/bin/env node
import { existsSync, readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const path = resolve(root, '.env.local');

const keys = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  'SUPABASE_SERVICE_ROLE_KEY',
  'NEXT_PUBLIC_SITE_URL',
  'STRIPE_SECRET_KEY',
  'STRIPE_PUBLISHABLE_KEY',
  'STRIPE_CONNECT_WEBHOOK_SECRET',
  'STRIPE_IDENTITY_WEBHOOK_SECRET',
  'CHECKR_API_KEY',
  'CHECKR_WEBHOOK_SECRET',
  'TAX_ENCRYPTION_KEY',
  'CRON_SECRET',
  'GOOGLE_MAPS_API_KEY',
  'RESEND_API_KEY',
  'RESEND_FROM_EMAIL',
];

if (!existsSync(path)) {
  console.log('.env.local: missing');
  process.exit(1);
}

const env = {};
for (const line of readFileSync(path, 'utf8').split(/\r?\n/)) {
  const t = line.trim();
  if (!t || t.startsWith('#')) continue;
  const i = t.indexOf('=');
  if (i < 0) continue;
  let v = t.slice(i + 1).trim();
  if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
    v = v.slice(1, -1);
  }
  env[t.slice(0, i).trim()] = v;
}

for (const k of keys) {
  const v = env[k] ?? '';
  let status = 'EMPTY';
  if (v) {
    if (k === 'TAX_ENCRYPTION_KEY' && !/^[0-9a-f]{64}$/i.test(v))
      status = 'SET but invalid (need 64 hex chars)';
    else if (v.length < 8) status = 'SET but very short (typo?)';
    else status = `SET (${v.length} chars)`;
  }
  console.log(`${k}: ${status}`);
}
