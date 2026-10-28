"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { ScheduleSlot } from "@/lib/supabase/types";

const DAYS = ["ראשון", "שני", "שלישי", "רביעי", "חמישי", "שישי"];
const PERIODS = [1, 2, 3, 4, 5, 6, 7, 8];

export function ScheduleGrid({
  userId,
  initialSlots,
  canEdit,
}: {
  userId: string;
  initialSlots: ScheduleSlot[];
  canEdit: boolean;
}) {
  const [slots, setSlots] = useState<ScheduleSlot[]>(initialSlots);
  const [editing, setEditing] = useState<{ day: number; period: number } | null>(null);
  const [draft, setDraft] = useState("");

  useEffect(() => {
    setSlots(initialSlots);
  }, [initialSlots]);

  function slotAt(day: number, period: number) {
    return slots.find((s) => s.day_of_week === day && s.period === period);
  }

  function openEditor(day: number, period: number) {
    if (!canEdit) return;
    setDraft(slotAt(day, period)?.subject ?? "");
    setEditing({ day, period });
  }

  async function save() {
    if (!editing) return;
    const supabase = createClient();
    const existing = slotAt(editing.day, editing.period);
    const subject = draft.trim();

    if (!subject) {
      if (existing) {
        await supabase.from("schedule_slots").delete().eq("id", existing.id);
        setSlots((prev) => prev.filter((s) => s.id !== existing.id));
      }
      setEditing(null);
      return;
    }

    if (existing) {
      await supabase.from("schedule_slots").update({ subject }).eq("id", existing.id);
      setSlots((prev) => prev.map((s) => (s.id === existing.id ? { ...s, subject } : s)));
    } else {
      const { data } = await supabase
        .from("schedule_slots")
        .insert({ user_id: userId, day_of_week: editing.day, period: editing.period, subject })
        .select()
        .single();
      if (data) setSlots((prev) => [...prev, data as ScheduleSlot]);
    }
    setEditing(null);
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full border-separate border-spacing-1">
        <thead>
          <tr>
            <th className="text-xs text-mocha-300 w-10"></th>
            {DAYS.map((d) => (
              <th key={d} className="text-xs font-medium text-mocha-400 pb-1">
                {d}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {PERIODS.map((period) => (
            <tr key={period}>
              <td className="text-xs text-mocha-300 text-center">{period}</td>
              {DAYS.map((_, dayIdx) => {
                const day = dayIdx; // 0=Sunday
                const slot = slotAt(day, period);
                const isEditing = editing?.day === day && editing?.period === period;
                return (
                  <td key={day}>
                    {isEditing ? (
                      <input
                        autoFocus
                        value={draft}
                        onChange={(e) => setDraft(e.target.value)}
                        onBlur={save}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") save();
                          if (e.key === "Escape") setEditing(null);
                        }}
                        className="w-24 rounded-md border border-clay-300 px-1.5 py-1 text-xs"
                      />
                    ) : (
                      <button
                        onClick={() => openEditor(day, period)}
                        disabled={!canEdit}
                        className={`w-24 h-9 rounded-md text-xs px-1 truncate ${
                          slot
                            ? "bg-clay-100 text-clay-800"
                            : "bg-coffee-100 text-coffee-300"
                        } ${canEdit ? "hover:bg-clay-200 cursor-pointer" : "cursor-default"}`}
                        title={slot?.subject}
                      >
                        {slot?.subject ?? (canEdit ? "+" : "")}
                      </button>
                    )}
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
