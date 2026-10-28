import { createClient } from "@/lib/supabase/server";
import type { SpecialtyKind } from "@/lib/supabase/types";

export interface MatchingResult {
  matchedCount: number;
  unmatchedStudentIds: string[];
}

export async function runMatching(kind: SpecialtyKind): Promise<MatchingResult> {
  const supabase = await createClient();

  const [{ data: needs }, { data: providerSpecs }, { data: studentAvailability }, { data: providerAvailability }] =
    await Promise.all([
      supabase.from("student_needs").select("student_id, specialty_id, specialties!inner(kind)").eq("specialties.kind", kind),
      supabase.from("provider_specialties").select("provider_id, specialty_id, specialties!inner(kind)").eq("specialties.kind", kind),
      supabase.from("student_candidate_availability_slots").select("student_id, day_of_week, period"),
      supabase.from("provider_availability_slots").select("provider_id, day_of_week, period"),
    ]);

  await supabase.from("matches").delete().eq("kind", kind).eq("status", "proposed");

  const studentSlotsByStudent = new Map<string, Set<string>>();
  for (const a of studentAvailability ?? []) {
    const key = `${a.day_of_week}-${a.period}`;
    if (!studentSlotsByStudent.has(a.student_id)) studentSlotsByStudent.set(a.student_id, new Set());
    studentSlotsByStudent.get(a.student_id)!.add(key);
  }

  const providerSlotsByProvider = new Map<string, Set<string>>();
  for (const a of providerAvailability ?? []) {
    const key = `${a.day_of_week}-${a.period}`;
    if (!providerSlotsByProvider.has(a.provider_id)) providerSlotsByProvider.set(a.provider_id, new Set());
    providerSlotsByProvider.get(a.provider_id)!.add(key);
  }

  const providersBySpecialty = new Map<string, string[]>();
  for (const t of providerSpecs ?? []) {
    if (!providersBySpecialty.has(t.specialty_id)) providersBySpecialty.set(t.specialty_id, []);
    providersBySpecialty.get(t.specialty_id)!.push(t.provider_id);
  }

  const usedByProvider = new Map<string, Set<string>>();
  const usedByStudent = new Map<string, Set<string>>();

  const newMatches: {
    kind: SpecialtyKind;
    specialty_id: string;
    provider_id: string;
    student_id: string;
    day_of_week: number;
    period: number;
  }[] = [];

  const unmatchedStudentIds: string[] = [];

  const orderedNeeds = [...(needs ?? [])].sort((a, b) => a.student_id.localeCompare(b.student_id));

  for (const need of orderedNeeds) {
    const candidateProviders = providersBySpecialty.get(need.specialty_id) ?? [];
    const studentSlots = studentSlotsByStudent.get(need.student_id) ?? new Set<string>();
    const studentUsed = usedByStudent.get(need.student_id) ?? new Set<string>();

    let matched = false;
    for (const providerId of candidateProviders) {
      const providerSlots = providerSlotsByProvider.get(providerId) ?? new Set<string>();
      const providerUsed = usedByProvider.get(providerId) ?? new Set<string>();

      // כל השעות שחופפות בין המורה/מטפל לתלמיד/ה הזו (לא רק הראשונה שנמצאת)
      const overlapSlots = [...studentSlots].filter(
        (slot) => providerSlots.has(slot) && !studentUsed.has(slot) && !providerUsed.has(slot)
      );
      if (overlapSlots.length === 0) continue;

      for (const slot of overlapSlots) {
        const [day, period] = slot.split("-").map(Number);
        newMatches.push({
          kind,
          specialty_id: need.specialty_id,
          provider_id: providerId,
          student_id: need.student_id,
          day_of_week: day,
          period,
        });

        if (!usedByProvider.has(providerId)) usedByProvider.set(providerId, new Set());
        usedByProvider.get(providerId)!.add(slot);
        if (!usedByStudent.has(need.student_id)) usedByStudent.set(need.student_id, new Set());
        usedByStudent.get(need.student_id)!.add(slot);
      }

      matched = true;
      break;
    }

    if (!matched && !unmatchedStudentIds.includes(need.student_id)) {
      unmatchedStudentIds.push(need.student_id);
    }
  }

  if (newMatches.length > 0) {
    await supabase.from("matches").insert(newMatches);
  }

  return { matchedCount: newMatches.length, unmatchedStudentIds };
}
