"use server";

import { createClient } from "@/lib/supabase/server";
import { requireProfile } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export async function openVisit(formData: FormData) {
  const profile = await requireProfile();
  const supabase = await createClient();

  const student_id = String(formData.get("student_id") ?? "");
  const room_id = String(formData.get("room_id") ?? "") || null;
  const reason_short = String(formData.get("reason_short") ?? "").trim() || null;

  if (!student_id) return;

  await supabase.from("visits").insert({
    student_id,
    room_id,
    reason_short,
    reported_by: profile.id,
    status: "open",
  });

  revalidatePath("/visits");
}

export async function updateVisitStatus(formData: FormData) {
  const supabase = await createClient();
  const visitId = String(formData.get("visit_id") ?? "");
  const status = String(formData.get("status") ?? "") as "open" | "follow_up" | "closed";
  if (!visitId || !status) return;

  const update: { status: string; exit_time?: string } = { status };
  if (status === "closed") update.exit_time = new Date().toISOString();

  await supabase.from("visits").update(update).eq("id", visitId);
  revalidatePath("/visits");
}
