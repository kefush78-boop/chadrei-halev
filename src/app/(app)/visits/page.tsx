import { createClient } from "@/lib/supabase/server";
import { requireProfile, STAFF_ROLES } from "@/lib/auth";
import { openVisit, updateVisitStatus } from "./actions";

const STATUS_LABEL: Record<string, string> = {
  open: "פתוח",
  follow_up: "בהמשך מעקב",
  closed: "סגור",
};

export default async function VisitsPage() {
  await requireProfile(STAFF_ROLES);
  const supabase = await createClient();

  const [{ data: visits }, { data: students }, { data: rooms }] = await Promise.all([
    supabase
      .from("visits")
      .select("id, entry_time, exit_time, reason_short, status, student:profiles!visits_student_id_fkey(full_name, grade_class), room:rooms(name)")
      .order("entry_time", { ascending: false })
      .limit(100),
    supabase.from("profiles").select("id, full_name").eq("role", "student").order("full_name"),
    supabase.from("rooms").select("id, name").order("name"),
  ]);

  return (
    <div>
      <h1 className="text-2xl font-serif font-bold text-mocha-800 mb-4">יומן כניסות למרכז</h1>

      <form action={openVisit} className="bg-white rounded-xl border border-coffee-200 p-4 mb-6 grid grid-cols-1 sm:grid-cols-4 gap-3">
        <select name="student_id" required className="rounded-lg border border-coffee-300 px-2 py-2 text-sm">
          <option value="">תלמיד/ה...</option>
          {students?.map((s) => (
            <option key={s.id} value={s.id}>
              {s.full_name}
            </option>
          ))}
        </select>
        <select name="room_id" className="rounded-lg border border-coffee-300 px-2 py-2 text-sm">
          <option value="">חדר (אופציונלי)</option>
          {rooms?.map((r) => (
            <option key={r.id} value={r.id}>
              {r.name}
            </option>
          ))}
        </select>
        <input
          name="reason_short"
          placeholder="סיבה קצרה"
          className="rounded-lg border border-coffee-300 px-2 py-2 text-sm sm:col-span-1"
        />
        <button className="rounded-lg bg-clay-600 text-white text-sm font-medium py-2 hover:bg-clay-700">
          פתיחת פנייה
        </button>
      </form>

      <div className="space-y-2">
        {(visits as unknown as VisitJoined[] | null)?.map((v) => (
          <VisitRow key={v.id} visit={v} />
        ))}
        {visits?.length === 0 && <p className="text-mocha-300 text-sm">אין עדיין רשומות.</p>}
      </div>
    </div>
  );
}

interface VisitJoined {
  id: string;
  entry_time: string;
  status: "open" | "follow_up" | "closed";
  reason_short: string | null;
  student: { full_name: string; grade_class: string | null } | null;
  room: { name: string } | null;
}

function VisitRow({ visit }: { visit: VisitJoined }) {
  const statusColor =
    visit.status === "open"
      ? "bg-amber-100 text-amber-800"
      : visit.status === "follow_up"
      ? "bg-blue-100 text-blue-800"
      : "bg-coffee-100 text-mocha-600";

  return (
    <div className="bg-white rounded-xl border border-coffee-200 p-3 flex flex-wrap items-center justify-between gap-2">
      <div className="text-sm">
        <div className="font-medium">
          {visit.student?.full_name}
          {visit.student?.grade_class ? ` (${visit.student.grade_class})` : ""}
        </div>
        <div className="text-mocha-400 text-xs">
          {new Date(visit.entry_time).toLocaleString("he-IL")}
          {visit.room ? ` · ${visit.room.name}` : ""}
          {visit.reason_short ? ` · ${visit.reason_short}` : ""}
        </div>
      </div>
      <div className="flex items-center gap-2">
        <span className={`text-xs px-2 py-1 rounded-full ${statusColor}`}>{STATUS_LABEL[visit.status]}</span>
        {visit.status !== "closed" && (
          <form action={updateVisitStatus} className="flex gap-1">
            <input type="hidden" name="visit_id" value={visit.id} />
            {visit.status === "open" && (
              <button name="status" value="follow_up" className="text-xs px-2 py-1 rounded-lg border border-blue-200 text-blue-700 hover:bg-blue-50">
                לסמן להמשך מעקב
              </button>
            )}
            <button name="status" value="closed" className="text-xs px-2 py-1 rounded-lg border border-coffee-300 text-mocha-600 hover:bg-coffee-100">
              סגירה
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
