"use server";

import { createClient } from "@/lib/supabase/server";
import { requireProfile, LEADERSHIP_ROLES } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export async function addTreatmentRecord(formData: FormData) {
  const profile = await requireProfile(LEADERSHIP_ROLES);
  const supabase = await createClient();

  const student_id = String(formData.get("student_id") ?? "");
  const next_step = String(formData.get("next_step") ?? "").trim() || null;

  if (!student_id) return;

  await supabase.from("treatment_records").insert({
    student_id,
    handled_by: profile.id,
    next_step,
    status: "open",
  });

  revalidatePath("/treatment");
}

export async function updateTreatmentStatus(formData: FormData) {
  await requireProfile(LEADERSHIP_ROLES);
  const supabase = await createClient();
  const id = String(formData.get("record_id") ?? "");
  const status = String(formData.get("status") ?? "") as "open" | "follow_up" | "closed";
  if (!id || !status) return;

  await supabase.from("treatment_records").update({ status }).eq("id", id);
  revalidatePath("/treatment");
}
