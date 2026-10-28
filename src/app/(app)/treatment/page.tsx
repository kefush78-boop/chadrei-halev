import { createClient } from "@/lib/supabase/server";
import { requireProfile, LEADERSHIP_ROLES } from "@/lib/auth";
import { addTreatmentRecord, updateTreatmentStatus } from "./actions";

const STATUS_LABEL: Record<string, string> = {
  open: "פתוח",
  follow_up: "בהמשך מעקב",
  closed: "סגור",
};

interface RecordJoined {
  id: string;
  date: string;
  status: "open" | "follow_up" | "closed";
  next_step: string | null;
  student: { full_name: string; grade_class: string | null } | null;
  handled_by_profile: { full_name: string } | null;
}

export default async function TreatmentPage() {
  await requireProfile(LEADERSHIP_ROLES);
  const supabase = await createClient();

  const [{ data: students }, { data: records }] = await Promise.all([
    supabase.from("profiles").select("id, full_name").eq("role", "student").order("full_name"),
    supabase
      .from("treatment_records")
      .select(
        "id, date, status, next_step, student:profiles!treatment_records_student_id_fkey(full_name, grade_class), handled_by_profile:profiles!treatment_records_handled_by_fkey(full_name)"
      )
      .order("date", { ascending: false })
      .limit(100),
  ]);

  const recordsJoined = (records as unknown as RecordJoined[] | null) ?? [];

  return (
    <div>
      <h1 className="text-2xl font-serif font-bold text-mocha-800 mb-1">מעקב טיפול רגשי</h1>
      <p className="text-sm text-mocha-400 mb-4">
        גישה מוגבלת להנהלה, מנהלת המרכז ורכזת מעורבות חברתית בלבד. מטעמי סודיות מקצועית לא נאסף כאן תוכן הפגישות — רק יעד למפגש הבא.
      </p>

      <form action={addTreatmentRecord} className="bg-white rounded-xl border border-coffee-200 p-4 mb-6 space-y-3">
        <select name="student_id" required className="w-full rounded-lg border border-coffee-300 px-2 py-2 text-sm">
          <option value="">תלמיד/ה...</option>
          {students?.map((s) => (
            <option key={s.id} value={s.id}>
              {s.full_name}
            </option>
          ))}
        </select>
        <input name="next_step" placeholder="יעד למפגש הבא" className="w-full rounded-lg border border-coffee-300 px-2 py-2 text-sm" />
        <button className="rounded-lg bg-clay-600 text-white text-sm font-medium py-2 px-4 hover:bg-clay-700">
          הוספת רשומה
        </button>
      </form>

      <div className="space-y-3">
        {recordsJoined.map((r) => (
          <div key={r.id} className="bg-white rounded-xl border border-coffee-200 p-4">
            <div className="flex flex-wrap justify-between items-start gap-2">
              <div>
                <div className="font-medium">
                  {r.student?.full_name}
                  {r.student?.grade_class ? ` (${r.student.grade_class})` : ""}
                </div>
                <div className="text-xs text-mocha-300">
                  {new Date(r.date).toLocaleDateString("he-IL")} · טופל ע"י {r.handled_by_profile?.full_name}
                </div>
              </div>
              <span className="text-xs px-2 py-1 rounded-full bg-coffee-100 text-mocha-600">{STATUS_LABEL[r.status]}</span>
            </div>
            {r.next_step && <p className="text-sm mt-2 text-clay-700">יעד למפגש הבא: {r.next_step}</p>}
            {r.status !== "closed" && (
              <form action={updateTreatmentStatus} className="mt-2 flex gap-2">
                <input type="hidden" name="record_id" value={r.id} />
                {r.status === "open" && (
                  <button name="status" value="follow_up" className="text-xs px-2 py-1 rounded-lg border border-blue-200 text-blue-700 hover:bg-blue-50">
                    להמשך מעקב
                  </button>
                )}
                <button name="status" value="closed" className="text-xs px-2 py-1 rounded-lg border border-coffee-300 text-mocha-600 hover:bg-coffee-100">
                  סגירה
                </button>
              </form>
            )}
          </div>
        ))}
        {recordsJoined.length === 0 && <p className="text-mocha-300 text-sm">אין עדיין רשומות.</p>}
      </div>
    </div>
  );
}
