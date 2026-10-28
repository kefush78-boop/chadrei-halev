"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

const DAYS = ["ראשון", "שני", "שלישי", "רביעי", "חמישי", "שישי"];
const PERIODS = [1, 2, 3, 4, 5, 6, 7, 8];

interface Slot {
  id: string;
  day_of_week: number;
  period: number;
}

export interface MatchLabel {
  label: string;
  status: "proposed" | "approved";
}

export function AvailabilityGrid({
  target,
  targetId,
  initialSlots,
  matchLabels,
}: {
  target: "student_candidate" | "provider";
  targetId: string;
  initialSlots: Slot[];
  matchLabels?: Record<string, MatchLabel>;
}) {
  const [slots, setSlots] = useState<Slot[]>(initialSlots);

  useEffect(() => setSlots(initialSlots), [initialSlots]);

  const table = target === "provider" ? "provider_availability_slots" : "student_candidate_availability_slots";
  const idColumn = target === "provider" ? "provider_id" : "student_id";

  function isAvailable(day: number, period: number) {
    return slots.some((s) => s.day_of_week === day && s.period === period);
  }

  async function toggle(day: number, period: number) {
    const supabase = createClient();
    const existing = slots.find((s) => s.day_of_week === day && s.period === period);
    if (existing) {
      setSlots((prev) => prev.filter((s) => s.id !== existing.id));
      await supabase.from(table).delete().eq("id", existing.id);
    } else {
      const { data } = await supabase
        .from(table)
        .insert({ [idColumn]: targetId, day_of_week: day, period })
        .select()
        .single();
      if (data) setSlots((prev) => [...prev, data as Slot]);
    }
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full border-separate border-spacing-1">
        <thead>
          <tr>
            <th className="text-xs text-mocha-300 w-10"></th>
            {DAYS.map((d) => (
              <th key={d} className="text-xs font-medium text-mocha-500 pb-1">
                {d}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {PERIODS.map((period) => (
            <tr key={period}>
              <td className="text-xs text-mocha-300 text-center">{period}</td>
              {DAYS.map((_, day) => {
                const available = isAvailable(day, period);
                const match = matchLabels?.[`${day}-${period}`];
                return (
                  <td key={day}>
                    <button
                      onClick={() => toggle(day, period)}
                      title={match ? match.label : undefined}
                      className={`w-16 h-8 rounded-md text-[10px] leading-tight px-1 transition ${
                        match
                          ? match.status === "approved"
                            ? "bg-clay-200 text-clay-800 hover:bg-clay-300"
                            : "bg-coffee-200 text-mocha-700 hover:bg-coffee-300 border border-dashed border-mocha-300"
                          : available
                          ? "bg-sage-200 text-sage-800 hover:bg-sage-300"
                          : "bg-coffee-100 text-mocha-300 hover:bg-coffee-200"
                      }`}
                    >
                      {match ? match.label : available ? "פנוי/ה" : ""}
                    </button>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
