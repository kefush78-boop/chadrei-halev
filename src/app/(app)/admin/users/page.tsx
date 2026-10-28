import { createClient } from "@/lib/supabase/server";
import { requireProfile, ROLE_LABELS } from "@/lib/auth";
import type { UserRole } from "@/lib/supabase/types";
import { createUser, updateUserRole } from "./actions";

const ROLES: UserRole[] = ["admin", "management", "social_coordinator", "teacher", "mentor", "student"];

export default async function AdminUsersPage() {
  await requireProfile(["admin"]);
  const supabase = await createClient();
  const { data: users } = await supabase.from("profiles").select("*").order("role").order("full_name");

  return (
    <div>
      <h1 className="text-2xl font-serif font-bold text-mocha-800 mb-4">ניהול משתמשים</h1>

      <form action={createUser} className="bg-white rounded-xl border border-coffee-200 p-4 mb-6 grid grid-cols-1 sm:grid-cols-3 gap-3">
        <input name="full_name" placeholder="שם מלא" required className="rounded-lg border border-coffee-300 px-2 py-2 text-sm" />
        <input name="email" type="email" placeholder="אימייל" required className="rounded-lg border border-coffee-300 px-2 py-2 text-sm" />
        <input name="password" type="text" placeholder="סיסמה זמנית" required className="rounded-lg border border-coffee-300 px-2 py-2 text-sm" />
        <select name="role" required className="rounded-lg border border-coffee-300 px-2 py-2 text-sm">
          <option value="">תפקיד...</option>
          {ROLES.map((r) => (
            <option key={r} value={r}>
              {ROLE_LABELS[r]}
            </option>
          ))}
        </select>
        <input name="grade_class" placeholder="כיתה (לתלמידים/מלווים)" className="rounded-lg border border-coffee-300 px-2 py-2 text-sm" />
        <input name="phone" placeholder="טלפון (אופציונלי)" className="rounded-lg border border-coffee-300 px-2 py-2 text-sm" />
        <button className="rounded-lg bg-clay-600 text-white text-sm font-medium py-2 sm:col-span-3 hover:bg-clay-700">
          יצירת משתמש
        </button>
      </form>

      <div className="space-y-2">
        {users?.map((u) => (
          <div key={u.id} className="bg-white rounded-xl border border-coffee-200 p-3 flex flex-wrap items-center justify-between gap-2">
            <div className="text-sm">
              <span className="font-medium">{u.full_name}</span>
              {u.grade_class ? ` (${u.grade_class})` : ""}
            </div>
            <form action={updateUserRole} className="flex items-center gap-2">
              <input type="hidden" name="id" value={u.id} />
              <select name="role" defaultValue={u.role} className="rounded-lg border border-coffee-300 px-2 py-1 text-xs">
                {ROLES.map((r) => (
                  <option key={r} value={r}>
                    {ROLE_LABELS[r]}
                  </option>
                ))}
              </select>
              <button className="text-xs px-2 py-1 rounded-lg border border-coffee-300 hover:bg-coffee-100">עדכון</button>
            </form>
          </div>
        ))}
      </div>
    </div>
  );
}
