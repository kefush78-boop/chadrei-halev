"use server";

import { createClient } from "@/lib/supabase/server";
import { requireProfile, LEADERSHIP_ROLES } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export async function logMentorHours(formData: FormData) {
  const profile = await requireProfile(["mentor"]);
  const supabase = await createClient();

  const hours = Number(formData.get("hours") ?? 0);
  const activity_description = String(formData.get("activity_description") ?? "").trim() || null;
  const date = String(formData.get("date") ?? "") || new Date().toISOString().slice(0, 10);

  if (!hours || hours <= 0) return;

  await supabase.from("mentor_hours").insert({
    mentor_id: profile.id,
    hours,
    activity_description,
    date,
    confirmation_status: "pending",
  });

  revalidatePath("/social");
}

export async function reviewMentorHours(formData: FormData) {
  const profile = await requireProfile(LEADERSHIP_ROLES);
  const supabase = await createClient();

  const id = String(formData.get("id") ?? "");
  const decision = String(formData.get("decision") ?? "") as "approved" | "rejected";
  if (!id || !decision) return;

  await supabase
    .from("mentor_hours")
    .update({ confirmation_status: decision, confirmed_by: profile.id })
    .eq("id", id);

  revalidatePath("/social");
}

export async function submitFeedback(formData: FormData) {
  const profile = await requireProfile(["student"]);
  const supabase = await createClient();

  const mentor_id = String(formData.get("mentor_id") ?? "") || null;
  const feeling_rating = Number(formData.get("feeling_rating") ?? 0) || null;
  const comments = String(formData.get("comments") ?? "").trim() || null;

  await supabase.from("student_feedback").insert({
    student_id: profile.id,
    mentor_id,
    feeling_rating,
    comments,
  });

  revalidatePath("/social");
}
