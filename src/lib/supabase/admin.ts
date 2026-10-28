import "server-only";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";

// שימוש רק בפעולות admin (server actions) - אף פעם לא בקומפוננטת לקוח.
export function createAdminClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}
