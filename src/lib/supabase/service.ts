import { createClient } from '@supabase/supabase-js'

// Service client bypasses RLS — use only in API routes for trusted operations.
// Never expose to the browser.
export function createServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}
