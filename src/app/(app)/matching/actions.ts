"use server";

import { createClient } from "@/lib/supabase/server";
import { requireProfile, LEADERSHIP_ROLES } from "@/lib/auth";
import { runMatching, type MatchingResult } from "@/lib/matching";
import type { SpecialtyKind } from "@/lib/supabase/types";
import { revalidatePath } from "next/cache";

export async function addSpecialty(formData: FormData) {
  await requireProfile(LEADERSHIP_ROLES);
  const supabase = await createClient();

  const name = String(formData.get("name") ?? "").trim();
  const kind = String(formData.get("kind") ?? "") as SpecialtyKind;
  if (!name || !kind) return;

  await supabase.from("specialties").insert({ name, kind });
  revalidatePath("/matching");
}

export async function addProvider(formData: FormData) {
  await requireProfile(LEADERSHIP_ROLES);
  const supabase = await createClient();

  const fullName = String(formData.get("full_name") ?? "").trim();
  const specialtyId = String(formData.get("specialty_id") ?? "");
  if (!fullName || !specialtyId) return;

  const { data: existing } = await supabase
    .from("providers")
    .select("id")
    .ilike("full_name", fullName)
    .maybeSingle();

  let providerId = existing?.id as string | undefined;
  if (!providerId) {
    const { data: created, error } = await supabase.from("providers").insert({ full_name: fullName }).select().single();
    if (error || !created) return;
    providerId = created.id;
  }

  await supabase.from("provider_specialties").upsert(
    { provider_id: providerId, specialty_id: specialtyId },
    { onConflict: "provider_id,specialty_id", ignoreDuplicates: true }
  );

  revalidatePath("/matching");
}

export async function removeProviderSpecialty(formData: FormData) {
  await requireProfile(LEADERSHIP_ROLES);
  const supabase = await createClient();

  const providerId = String(formData.get("provider_id") ?? "");
  const specialtyId = String(formData.get("specialty_id") ?? "");
  if (!providerId || !specialtyId) return;

  await supabase.from("provider_specialties").delete().eq("provider_id", providerId).eq("specialty_id", specialtyId);
  revalidatePath("/matching");
}

export async function addStudentCandidate(formData: FormData) {
  await requireProfile(LEADERSHIP_ROLES);
  const supabase = await createClient();

  const fullName = String(formData.get("full_name") ?? "").trim();
  const specialtyId = String(formData.get("specialty_id") ?? "");
  if (!fullName || !specialtyId) return;

  const { data: existing } = await supabase
    .from("student_candidates")
    .select("id")
    .ilike("full_name", fullName)
    .maybeSingle();

  let studentId = existing?.id as string | undefined;
  if (!studentId) {
    const { data: created, error } = await supabase.from("student_candidates").insert({ full_name: fullName }).select().single();
    if (error || !created) return;
    studentId = created.id;
  }

  await supabase
    .from("student_needs")
    .upsert({ student_id: studentId, specialty_id: specialtyId }, { onConflict: "student_id,specialty_id", ignoreDuplicates: true });

  revalidatePath("/matching");
}

export async function removeStudentNeed(formData: FormData) {
  await requireProfile(LEADERSHIP_ROLES);
  const supabase = await createClient();

  const studentId = String(formData.get("student_id") ?? "");
  const specialtyId = String(formData.get("specialty_id") ?? "");
  if (!studentId || !specialtyId) return;

  await supabase.from("student_needs").delete().eq("student_id", studentId).eq("specialty_id", specialtyId);
  revalidatePath("/matching");
}

type RunResult = (MatchingResult & { kind: SpecialtyKind }) | null;

export async function runMatchingAction(_prev: RunResult, formData: FormData): Promise<RunResult> {
  await requireProfile(LEADERSHIP_ROLES);
  const kind = String(formData.get("kind") ?? "") as SpecialtyKind;
  const result = await runMatching(kind);
  revalidatePath("/matching");
  return { ...result, kind };
}

export async function reviewMatch(formData: FormData) {
  await requireProfile(LEADERSHIP_ROLES);
  const supabase = await createClient();

  const id = String(formData.get("id") ?? "");
  const decision = String(formData.get("decision") ?? "") as "approved" | "rejected";
  if (!id || !decision) return;

  await supabase.from("matches").update({ status: decision }).eq("id", id);
  revalidatePath("/matching");
}
