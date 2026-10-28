"use server";

import { createClient } from "@/lib/supabase/server";
import { requireProfile } from "@/lib/auth";
import { parseMashovSchedule } from "@/lib/mashov-import";
import { revalidatePath } from "next/cache";

export async function importScheduleFromExcel(formData: FormData) {
  const profile = await requireProfile();
  const userId = String(formData.get("user_id") ?? "");
  const file = formData.get("file") as File | null;

  if (!userId || !file || file.size === 0) {
    return { error: "יש לבחור קובץ" };
  }
  if (profile.role !== "admin" && userId !== profile.id) {
    return { error: "אין הרשאה לייבא מערכת שעות למשתמש/ת אחר/ת" };
  }

  let slots;
  try {
    const buffer = await file.arrayBuffer();
    slots = await parseMashovSchedule(buffer);
  } catch (err) {
    return { error: err instanceof Error ? err.message : "שגיאה בקריאת הקובץ" };
  }

  if (slots.length === 0) {
    return { error: "לא נמצאו שיעורים בקובץ" };
  }

  const supabase = await createClient();
  await supabase.from("schedule_slots").delete().eq("user_id", userId);
  const { error } = await supabase
    .from("schedule_slots")
    .insert(slots.map((s) => ({ ...s, user_id: userId })));

  if (error) {
    return { error: "שגיאה בשמירת מערכת השעות" };
  }

  revalidatePath("/schedule");
  return { success: true, count: slots.length };
}
