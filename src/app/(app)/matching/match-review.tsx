"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { runMatchingAction, reviewMatch } from "./actions";
import type { SpecialtyKind } from "@/lib/supabase/types";

const DAYS = ["ראשון", "שני", "שלישי", "רביעי", "חמישי", "שישי", "שבת"];

interface MatchRow {
  id: string;
  day_of_week: number;
  period: number;
  status: "proposed" | "approved" | "rejected";
  specialty: { name: string } | null;
  provider: { full_name: string } | null;
  student: { full_name: string } | null;
}

export function MatchReview({
  kind,
  proposed,
  approved,
  studentsById,
}: {
  kind: SpecialtyKind;
  proposed: MatchRow[];
  approved: MatchRow[];
  studentsById: Record<string, string>;
}) {
  const [state, formAction, pending] = useActionState(runMatchingAction, null);
  const router = useRouter();

  useEffect(() => {
    if (state) router.refresh();
  }, [state, router]);

  return (
    <div className="space-y-6">
      <form action={formAction}>
        <input type="hidden" name="kind" value={kind} />
        <button
          disabled={pending}
          className="rounded-lg bg-mocha-700 text-white text-sm font-medium px-4 py-2 hover:bg-mocha-800 disabled:opacity-50"
        >
          {pending ? "משבצת..." : "הרצת שיבוץ אוטומטי"}
        </button>
        {state && (
          <span className="text-xs text-mocha-500 mr-3">
            שובצו {state.matchedCount}.
            {state.unmatchedStudentIds.length > 0 &&
              ` לא נמצא שיבוץ ל: ${state.unmatchedStudentIds.map((id) => studentsById[id] ?? id).join(", ")}.`}
          </span>
        )}
      </form>

      <section>
        <h3 className="text-sm font-semibold text-mocha-500 mb-2">הצעות ממתינות לאישור</h3>
        <div className="space-y-2">
          {proposed.map((m) => (
            <div key={m.id} className="bg-white rounded-xl border border-coffee-200 p-3 flex flex-wrap justify-between items-center gap-2">
              <div className="text-sm">
                <span className="font-medium">{m.provider?.full_name}</span> ↔{" "}
                <span className="font-medium">{m.student?.full_name}</span>
                {m.specialty ? ` · ${m.specialty.name}` : ""}
                <div className="text-xs text-mocha-400">
                  {DAYS[m.day_of_week]}, שיעור {m.period}
                </div>
              </div>
              <form action={reviewMatch} className="flex gap-2">
                <input type="hidden" name="id" value={m.id} />
                <button name="decision" value="approved" className="text-xs px-2 py-1 rounded-lg border border-sage-300 text-sage-700 hover:bg-sage-50">
                  אישור
                </button>
                <button name="decision" value="rejected" className="text-xs px-2 py-1 rounded-lg border border-clay-300 text-clay-700 hover:bg-clay-50">
                  דחייה
                </button>
              </form>
            </div>
          ))}
          {proposed.length === 0 && <p className="text-mocha-300 text-sm">אין הצעות ממתינות כרגע.</p>}
        </div>
      </section>

      <section>
        <h3 className="text-sm font-semibold text-mocha-500 mb-2">שיבוצים מאושרים</h3>
        <div className="space-y-2">
          {approved.map((m) => (
            <div key={m.id} className="bg-white rounded-xl border border-sage-200 p-3 text-sm">
              <span className="font-medium">{m.provider?.full_name}</span> ↔{" "}
              <span className="font-medium">{m.student?.full_name}</span>
              {m.specialty ? ` · ${m.specialty.name}` : ""}
              <div className="text-xs text-mocha-400">
                {DAYS[m.day_of_week]}, שיעור {m.period}
              </div>
            </div>
          ))}
          {approved.length === 0 && <p className="text-mocha-300 text-sm">אין עדיין שיבוצים מאושרים.</p>}
        </div>
      </section>
    </div>
  );
}
