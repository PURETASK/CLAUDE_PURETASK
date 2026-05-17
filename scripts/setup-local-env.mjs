#!/usr/bin/env node
/**
 * Copies .env.example → .env.local if .env.local does not exist.
 * Edit .env.local with your Supabase keys to start the app.
 */
import { copyFileSync, existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const example = resolve(root, '.env.example');
const target = resolve(root, '.env.local');

if (existsSync(target)) {
  console.log('.env.local already exists — no changes made.');
  console.log('See docs/secrets-when-ready.md for what to fill in.');
  process.exit(0);
}

if (!existsSync(example)) {
  console.error('Missing .env.example');
  process.exit(1);
}

copyFileSync(example, target);
console.log('Created .env.local from .env.example');
console.log('');
console.log('Next: set these in .env.local (Supabase → Project Settings → API):');
console.log('  NEXT_PUBLIC_SUPABASE_URL');
console.log('  NEXT_PUBLIC_SUPABASE_ANON_KEY');
console.log('  SUPABASE_SERVICE_ROLE_KEY');
console.log('  NEXT_PUBLIC_SITE_URL=http://localhost:3000');
console.log('');
console.log('Then: pnpm dev');
console.log('Docs: docs/secrets-when-ready.md');
