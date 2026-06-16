import { createClient } from "@supabase/supabase-js";
import { supabaseUrl } from "@/lib/config";

/**
 * Service-role client — SERVER ONLY. Bypasses RLS, so use sparingly
 * (seeding, admin-approved content changes). Never import into client code.
 */
export function createAdminClient() {
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";
  return createClient(supabaseUrl, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
