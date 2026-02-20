import { kv } from '@vercel/kv';

// Vercel KV automatically uses environment variables when deployed
// On Vercel: Just create a KV database in your project dashboard and link it
// For local dev: Create KV database and add credentials to .env.local (optional)

export function getKVClient() {
  // Vercel KV automatically reads from environment variables:
  // - KV_REST_API_URL (auto-set when KV database is linked on Vercel)
  // - KV_REST_API_TOKEN (auto-set when KV database is linked on Vercel)
  
  // When deployed on Vercel with a linked KV database, these are automatically configured
  // No manual setup needed in production!
  
  return kv;
}

