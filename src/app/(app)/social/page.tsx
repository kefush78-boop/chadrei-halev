import { createClient } from "@/lib/supabase/server";
import { requireProfile, LEADERSHIP_ROLES } from "@/lib/auth";
import { logMentorHours, reviewMentorHours, submitFeedback } from "./actions";

const APPROVAL_LABEL: Record<string, string> = {
  pending: "ממתין לאישור",
  approved: "אושר",
  rejected: "נדחה",
};

const FEELING_EMOJI = ["😞", "😕", "😐", "🙂", "😄"];

export default async function SocialPage() {
  const profile = await requireProfile();
  const supabase = await createClient();
  const isLeadership = LEADERSHIP_ROLES.includes(profile.role);

  if (profile.role === "mentor") {
    const { data: myHours } = await supabase
      .from("mentor_hours")
      .select("id, date, hours, activity_description, confirmation_status")
      .eq("mentor_id", profile.id)
      .order("date", { ascending: false });

    return (
      <div>
        <h1 className="text-2xl font-serif font-bold text-mocha-800 mb-4">מעורבות חברתית — שעות התנדבות</h1>
        <form action={logMentorHours} className="bg-white rounded-xl border border-coffee-200 p-4 mb-6 grid grid-cols-1 sm:grid-cols-4 gap-3">
          <input type="date" name="date" className="rounded-lg border border-coffee-300 px-2 py-2 text-sm" />
          <input type="number" step="0.5" min="0" name="hours" placeholder="שעות" required className="rounded-lg border border-coffee-300 px-2 py-2 text-sm" />
          <input name="activity_description" placeholder="תיאור הפעילות" className="rounded-lg border border-coffee-300 px-2 py-2 text-sm sm:col-span-2" />
          <button className="rounded-lg bg-clay-600 text-white text-sm font-medium py-2 sm:col-span-4 hover:bg-clay-700">
            דיווח שעות
          </button>
        </form>

        <div className="space-y-2">
          {myHours?.map((h) => (
            <div key={h.id} className="bg-white rounded-xl border border-coffee-200 p-3 flex justify-between items-center">
              <div className="text-sm">
                <span className="font-medium">{h.hours} שעות</span>
                {h.activity_description ? ` · ${h.activity_description}` : ""}
                <div className="text-xs text-mocha-300">{new Date(h.date).toLocaleDateString("he-IL")}</div>
              </div>
              <span className="text-xs px-2 py-1 rounded-full bg-coffee-100 text-mocha-600">
                {APPROVAL_LABEL[h.confirmation_status]}
              </span>
            </div>
          ))}
          {myHours?.length === 0 && <p className="text-mocha-300 text-sm">עדיין לא דיווחת שעות.</p>}
        </div>
      </div>
    );
  }

  if (profile.role === "student") {
    const { data: mentors } = await supabase.from("profiles").select("id, full_name").eq("role", "mentor").order("full_name");
    const { data: myFeedback } = await supabase
      .from("student_feedback")
      .select("id, date, feeling_rating, comments")
      .eq("student_id", profile.id)
      .order("date", { ascending: false });

    return (
      <div>
        <h1 className="text-2xl font-serif font-bold text-mocha-800 mb-4">איך הרגשת בלמידה הפרטנית?</h1>
        <form action={submitFeedback} className="bg-white rounded-xl border border-coffee-200 p-4 mb-6 space-y-3">
          <select name="mentor_id" className="w-full rounded-lg border border-coffee-300 px-2 py-2 text-sm">
            <option value="">המלווה/ת שלי...</option>
            {mentors?.map((m) => (
              <option key={m.id} value={m.id}>
                {m.full_name}
              </option>
            ))}
          </select>
          <div className="flex justify-center gap-3 text-2xl">
            {FEELING_EMOJI.map((emoji, i) => (
              <label key={i} className="cursor-pointer">
                <input type="radio" name="feeling_rating" value={i + 1} required className="sr-only peer" />
                <span className="peer-checked:scale-125 inline-block transition">{emoji}</span>
              </label>
            ))}
          </div>
          <textarea name="comments" placeholder="רוצה לספר עוד?" rows={2} className="w-full rounded-lg border border-coffee-300 px-2 py-2 text-sm" />
          <button className="w-full rounded-lg bg-clay-600 text-white text-sm font-medium py-2 hover:bg-clay-700">
            שליחה
          </button>
        </form>

        <div className="space-y-2">
          {myFeedback?.map((f) => (
            <div key={f.id} className="bg-white rounded-xl border border-coffee-200 p-3 text-sm">
              <span className="text-xl">{f.feeling_rating ? FEELING_EMOJI[f.feeling_rating - 1] : ""}</span>
              {f.comments ? ` · ${f.comments}` : ""}
              <div className="text-xs text-mocha-300">{new Date(f.date).toLocaleDateString("he-IL")}</div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (isLeadership) {
    const [{ data: pending }, { data: feedback }] = await Promise.all([
      supabase
        .from("mentor_hours")
        .select("id, date, hours, activity_description, mentor:profiles!mentor_hours_mentor_id_fkey(full_name)")
        .eq("confirmation_status", "pending")
        .order("date"),
      supabase
        .from("student_feedback")
        .select("id, date, feeling_rating, comments, student:profiles!student_feedback_student_id_fkey(full_name), mentor:profiles!student_feedback_mentor_id_fkey(full_name)")
        .order("date", { ascending: false })
        .limit(50),
    ]);

    interface PendingHours {
      id: string;
      date: string;
      hours: number;
      activity_description: string | null;
      mentor: { full_name: string } | null;
    }
    interface FeedbackRow {
      id: string;
      date: string;
      feeling_rating: number | null;
      comments: string | null;
      student: { full_name: string } | null;
      mentor: { full_name: string } | null;
    }

    const pendingRows = (pending as unknown as PendingHours[] | null) ?? [];
    const feedbackRows = (feedback as unknown as FeedbackRow[] | null) ?? [];

    return (
      <div>
        <h1 className="text-2xl font-serif font-bold text-mocha-800 mb-4">מעורבות חברתית — מבט הנהלה</h1>

        <section className="mb-8">
          <h2 className="text-sm font-semibold text-mocha-500 mb-2">שעות ממתינות לאישור</h2>
          <div className="space-y-2">
            {pendingRows.map((h) => (
              <div key={h.id} className="bg-white rounded-xl border border-coffee-200 p-3 flex flex-wrap justify-between items-center gap-2">
                <div className="text-sm">
                  <span className="font-medium">{h.mentor?.full_name}</span> · {h.hours} שעות
                  {h.activity_description ? ` · ${h.activity_description}` : ""}
                  <div className="text-xs text-mocha-300">{new Date(h.date).toLocaleDateString("he-IL")}</div>
                </div>
                <form action={reviewMentorHours} className="flex gap-2">
                  <input type="hidden" name="id" value={h.id} />
                  <button name="decision" value="approved" className="text-xs px-2 py-1 rounded-lg border border-green-200 text-green-700 hover:bg-green-50">
                    אישור
                  </button>
                  <button name="decision" value="rejected" className="text-xs px-2 py-1 rounded-lg border border-red-200 text-red-700 hover:bg-red-50">
                    דחייה
                  </button>
                </form>
              </div>
            ))}
            {pendingRows.length === 0 && <p className="text-mocha-300 text-sm">אין שעות ממתינות.</p>}
          </div>
        </section>

        <section>
          <h2 className="text-sm font-semibold text-mocha-500 mb-2">משוב תלמידי ט</h2>
          <div className="space-y-2">
            {feedbackRows.map((f) => (
              <div key={f.id} className="bg-white rounded-xl border border-coffee-200 p-3 text-sm">
                <span className="text-xl">{f.feeling_rating ? FEELING_EMOJI[f.feeling_rating - 1] : ""}</span>{" "}
                <span className="font-medium">{f.student?.full_name}</span>
                {f.mentor ? ` · עם ${f.mentor.full_name}` : ""}
                {f.comments ? ` · ${f.comments}` : ""}
                <div className="text-xs text-mocha-300">{new Date(f.date).toLocaleDateString("he-IL")}</div>
              </div>
            ))}
            {feedbackRows.length === 0 && <p className="text-mocha-300 text-sm">אין עדיין משוב.</p>}
          </div>
        </section>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-serif font-bold text-mocha-800 mb-2">מעורבות חברתית</h1>
      <p className="text-mocha-400 text-sm">מסך זה מיועד למלווי יב, תלמידי ט והנהלה.</p>
    </div>
  );
}
