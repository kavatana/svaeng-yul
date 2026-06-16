import { createBrowserClient } from "@supabase/ssr";
import { supabaseAnonKey, supabaseUrl } from "@/lib/config";

/** Browser Supabase client (LIVE mode only). */
export function createClient() {
  return createBrowserClient(supabaseUrl, supabaseAnonKey);
}
