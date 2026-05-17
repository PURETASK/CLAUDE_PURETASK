/** Minimal env so `src/lib/env.ts` loads during unit tests (matches CI placeholders). */
const defaults: Record<string, string> = {
  NEXT_PUBLIC_SUPABASE_URL: 'https://placeholder.supabase.co',
  NEXT_PUBLIC_SUPABASE_ANON_KEY: 'test-anon-key',
  SUPABASE_SERVICE_ROLE_KEY: 'test-service-role-key',
  NEXT_PUBLIC_SITE_URL: 'http://localhost:3000',
};

for (const [key, value] of Object.entries(defaults)) {
  if (!process.env[key]) {
    process.env[key] = value;
  }
}
