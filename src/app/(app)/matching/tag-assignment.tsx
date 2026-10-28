import { addSpecialty, addProvider, removeProviderSpecialty, addStudentCandidate, removeStudentNeed } from "./actions";
import type { SpecialtyKind } from "@/lib/supabase/types";

interface SpecialtyRow {
  id: string;
  name: string;
}

interface ProviderRow {
  provider_id: string;
  full_name: string;
  specialty_id: string;
  specialty_name: string;
}

interface StudentNeedRow {
  student_id: string;
  full_name: string;
  specialty_id: string;
  specialty_name: string;
}

export function TagAssignment({
  kind,
  specialties,
  providerRows,
  studentNeedRows,
}: {
  kind: SpecialtyKind;
  specialties: SpecialtyRow[];
  providerRows: ProviderRow[];
  studentNeedRows: StudentNeedRow[];
}) {
  const kindLabel = kind === "treatment" ? "תחום טיפול" : "מקצוע";
  const providerLabel = kind === "treatment" ? "מטפלים" : "מורים למקצוע";

  return (
    <div className="space-y-6">
      <form action={addSpecialty} className="bg-white rounded-xl border border-coffee-200 p-4 flex flex-wrap gap-2 items-center">
        <input type="hidden" name="kind" value={kind} />
        <input
          name="name"
          placeholder={`הוספת ${kindLabel} חדש/ה (למשל CBT)`}
          required
          className="rounded-lg border border-coffee-300 px-2 py-1.5 text-sm"
        />
        <button className="rounded-lg bg-mocha-600 text-white text-xs font-medium px-3 py-1.5 hover:bg-mocha-700">
          הוספת {kindLabel}
        </button>
      </form>

      <section>
        <h3 className="text-sm font-semibold text-mocha-500 mb-2">{providerLabel}</h3>
        {specialties.length === 0 ? (
          <p className="text-mocha-300 text-sm">קודם הוסיפי {kindLabel} למעלה.</p>
        ) : (
          <>
            <form action={addProvider} className="bg-white rounded-xl border border-coffee-200 p-4 flex flex-wrap gap-2 items-center mb-3">
              <input
                name="full_name"
                placeholder="שם המטפל/ת או המורה"
                required
                className="rounded-lg border border-coffee-300 px-2 py-1.5 text-sm"
              />
              <select name="specialty_id" required className="rounded-lg border border-coffee-300 px-2 py-1.5 text-sm">
                <option value="">{kindLabel}...</option>
                {specialties.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
              <button className="rounded-lg bg-clay-600 text-white text-xs font-medium px-3 py-1.5 hover:bg-clay-700">
                הוספה
              </button>
            </form>
            <div className="space-y-1">
              {providerRows.map((r) => (
                <div key={`${r.provider_id}-${r.specialty_id}`} className="bg-white rounded-lg border border-coffee-200 px-3 py-2 text-sm flex justify-between items-center">
                  <span>
                    <span className="font-medium">{r.full_name}</span> — {r.specialty_name}
                  </span>
                  <form action={removeProviderSpecialty}>
                    <input type="hidden" name="provider_id" value={r.provider_id} />
                    <input type="hidden" name="specialty_id" value={r.specialty_id} />
                    <button className="text-xs text-clay-600 hover:text-clay-800">הסרה</button>
                  </form>
                </div>
              ))}
              {providerRows.length === 0 && <p className="text-mocha-300 text-sm">עדיין לא הוזנו {providerLabel}.</p>}
            </div>
          </>
        )}
      </section>

      <section>
        <h3 className="text-sm font-semibold text-mocha-500 mb-2">תלמידים הזקוקים לעזרה</h3>
        {specialties.length === 0 ? (
          <p className="text-mocha-300 text-sm">קודם הוסיפי {kindLabel} למעלה.</p>
        ) : (
          <>
            <form action={addStudentCandidate} className="bg-white rounded-xl border border-coffee-200 p-4 flex flex-wrap gap-2 items-center mb-3">
              <input
                name="full_name"
                placeholder="שם התלמיד/ה"
                required
                className="rounded-lg border border-coffee-300 px-2 py-1.5 text-sm"
              />
              <select name="specialty_id" required className="rounded-lg border border-coffee-300 px-2 py-1.5 text-sm">
                <option value="">זקוק/ה ל{kindLabel}...</option>
                {specialties.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
              <button className="rounded-lg bg-clay-600 text-white text-xs font-medium px-3 py-1.5 hover:bg-clay-700">
                הוספה
              </button>
            </form>
            <div className="space-y-1">
              {studentNeedRows.map((r) => (
                <div key={`${r.student_id}-${r.specialty_id}`} className="bg-white rounded-lg border border-coffee-200 px-3 py-2 text-sm flex justify-between items-center">
                  <span>
                    <span className="font-medium">{r.full_name}</span> — זקוק/ה ל{r.specialty_name}
                  </span>
                  <form action={removeStudentNeed}>
                    <input type="hidden" name="student_id" value={r.student_id} />
                    <input type="hidden" name="specialty_id" value={r.specialty_id} />
                    <button className="text-xs text-clay-600 hover:text-clay-800">הסרה</button>
                  </form>
                </div>
              ))}
              {studentNeedRows.length === 0 && <p className="text-mocha-300 text-sm">עדיין לא סומנו צרכים.</p>}
            </div>
          </>
        )}
      </section>
    </div>
  );
}
