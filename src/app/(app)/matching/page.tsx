import { createClient } from "@/lib/supabase/server";
import { requireProfile, LEADERSHIP_ROLES } from "@/lib/auth";
import type { SpecialtyKind } from "@/lib/supabase/types";
import { TagAssignment } from "./tag-assignment";
import { AvailabilityGrid } from "./availability-grid";
import { MatchReview } from "./match-review";
import Link from "next/link";

interface MatchRow {
  id: string;
  provider_id: string;
  student_id: string;
  day_of_week: number;
  period: number;
  status: "proposed" | "approved" | "rejected";
  specialty: { name: string } | null;
  provider: { full_name: string } | null;
  student: { full_name: string } | null;
}

export default async function MatchingPage({
  searchParams,
}: {
  searchParams: Promise<{ kind?: string; target?: string }>;
}) {
  await requireProfile(LEADERSHIP_ROLES);
  const supabase = await createClient();
  const { kind: kindParam, target: targetParam } = await searchParams;
  const kind: SpecialtyKind = kindParam === "subject" ? "subject" : "treatment";

  const [
    { data: specialties },
    { data: providerLinks },
    { data: studentNeeds },
    { data: matches },
    { data: studentCandidates },
  ] = await Promise.all([
    supabase.from("specialties").select("id, name").eq("kind", kind).order("name"),
    supabase
      .from("provider_specialties")
      .select("provider_id, specialty_id, providers!inner(full_name), specialties!inner(name, kind)")
      .eq("specialties.kind", kind),
    supabase
      .from("student_needs")
      .select("student_id, specialty_id, student_candidates!inner(full_name), specialties!inner(name, kind)")
      .eq("specialties.kind", kind),
    supabase
      .from("matches")
      .select(
        "id, provider_id, student_id, day_of_week, period, status, specialty:specialties(name), provider:providers(full_name), student:student_candidates(full_name)"
      )
      .eq("kind", kind)
      .order("day_of_week"),
    supabase.from("student_candidates").select("id, full_name").order("full_name"),
  ]);

  // providers scoped to this kind only (a therapist and a subject-teacher list stay fully separate)
  const { data: providersForKind } = await supabase
    .from("provider_specialties")
    .select("provider_id, providers!inner(id, full_name), specialties!inner(kind)")
    .eq("specialties.kind", kind);

  const uniqueProviders = Array.from(
    new Map(
      (providersForKind ?? []).map((p) => [
        p.provider_id,
        { id: p.provider_id, full_name: (p.providers as unknown as { full_name: string }).full_name },
      ])
    ).values()
  );

  const providerRows = (providerLinks ?? []).map((l) => ({
    provider_id: l.provider_id,
    full_name: (l.providers as unknown as { full_name: string }).full_name,
    specialty_id: l.specialty_id,
    specialty_name: (l.specialties as unknown as { name: string }).name,
  }));

  const studentNeedRows = (studentNeeds ?? []).map((n) => ({
    student_id: n.student_id,
    full_name: (n.student_candidates as unknown as { full_name: string }).full_name,
    specialty_id: n.specialty_id,
    specialty_name: (n.specialties as unknown as { name: string }).name,
  }));

  const availabilityTargets = [
    ...uniqueProviders.map((p) => ({ kind: "provider" as const, id: p.id, label: p.full_name })),
    ...(studentCandidates ?? []).map((s) => ({ kind: "student_candidate" as const, id: s.id, label: s.full_name })),
  ];
  const [defaultTargetKind, defaultTargetId] = (targetParam ?? "").includes(":")
    ? targetParam!.split(":")
    : [availabilityTargets[0]?.kind, availabilityTargets[0]?.id];

  const activeTarget = availabilityTargets.find((t) => t.kind === defaultTargetKind && t.id === defaultTargetId);

  const availSlots = activeTarget
    ? activeTarget.kind === "provider"
      ? (await supabase.from("provider_availability_slots").select("id, day_of_week, period").eq("provider_id", activeTarget.id)).data
      : (await supabase.from("student_candidate_availability_slots").select("id, day_of_week, period").eq("student_id", activeTarget.id)).data
    : [];

  const matchRows = (matches as unknown as MatchRow[] | null) ?? [];
  const proposed = matchRows.filter((m) => m.status === "proposed");
  const approved = matchRows.filter((m) => m.status === "approved");
  const studentsById = Object.fromEntries((studentCandidates ?? []).map((s) => [s.id, s.full_name]));

  const matchLabels: Record<string, { label: string; status: "proposed" | "approved" }> = {};
  if (activeTarget) {
    for (const m of matchRows) {
      if (m.status === "rejected") continue;
      const isForTarget =
        (activeTarget.kind === "provider" && m.provider_id === activeTarget.id) ||
        (activeTarget.kind === "student_candidate" && m.student_id === activeTarget.id);
      if (!isForTarget) continue;

      const partnerName = activeTarget.kind === "provider" ? m.student?.full_name : m.provider?.full_name;
      matchLabels[`${m.day_of_week}-${m.period}`] = {
        label: `${partnerName ?? ""} · ${m.specialty?.name ?? ""}`,
        status: m.status,
      };
    }
  }

  const specialtyGroups = (specialties ?? []).map((s) => ({
    specialty: s,
    providers: providerRows.filter((p) => p.specialty_id === s.id),
  }));

  const tabs: { key: SpecialtyKind; label: string }[] = [
    { key: "treatment", label: "טיפול רגשי" },
    { key: "subject", label: "לימוד פרטני במקצוע הוראה" },
  ];

  return (
    <div>
      <h1 className="text-2xl font-serif font-bold text-mocha-800 mb-4">שיבוצים</h1>

      <div className="mb-6 flex gap-2">
        {tabs.map((t) => (
          <Link
            key={t.key}
            href={`/matching?kind=${t.key}`}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium ${
              kind === t.key ? "bg-clay-600 text-white" : "bg-white text-mocha-600 border border-coffee-300"
            }`}
          >
            {t.label}
          </Link>
        ))}
      </div>

      <div className="space-y-8">
        <TagAssignment kind={kind} specialties={specialties ?? []} providerRows={providerRows} studentNeedRows={studentNeedRows} />

        <section>
          <h2 className="text-sm font-semibold text-mocha-500 mb-2">זמינות שבועית</h2>

          {specialtyGroups.map(
            (g) =>
              g.providers.length > 0 && (
                <div key={g.specialty.id} className="mb-2">
                  <div className="text-xs font-semibold text-mocha-400 mb-1">{g.specialty.name}</div>
                  <div className="flex flex-wrap gap-1">
                    {g.providers.map((p) => (
                      <Link
                        key={p.provider_id}
                        href={`/matching?kind=${kind}&target=provider:${p.provider_id}`}
                        className={`text-xs px-2 py-1 rounded-full border ${
                          activeTarget?.id === p.provider_id && activeTarget?.kind === "provider"
                            ? "bg-mocha-600 text-white border-mocha-600"
                            : "bg-white text-mocha-600 border-coffee-300 hover:border-clay-300"
                        }`}
                      >
                        {p.full_name}
                      </Link>
                    ))}
                  </div>
                </div>
              )
          )}

          <div className="mb-3 mt-3">
            <div className="text-xs font-semibold text-mocha-400 mb-1">תלמידים</div>
            <div className="flex flex-wrap gap-1">
              {(studentCandidates ?? []).map((s) => (
                <Link
                  key={s.id}
                  href={`/matching?kind=${kind}&target=student_candidate:${s.id}`}
                  className={`text-xs px-2 py-1 rounded-full border ${
                    activeTarget?.id === s.id && activeTarget?.kind === "student_candidate"
                      ? "bg-mocha-600 text-white border-mocha-600"
                      : "bg-white text-mocha-600 border-coffee-300 hover:border-clay-300"
                  }`}
                >
                  {s.full_name}
                </Link>
              ))}
              {(studentCandidates ?? []).length === 0 && <p className="text-mocha-300 text-sm">אין עדיין תלמידים.</p>}
            </div>
          </div>

          {activeTarget && (
            <AvailabilityGrid
              target={activeTarget.kind}
              targetId={activeTarget.id}
              initialSlots={availSlots ?? []}
              matchLabels={matchLabels}
            />
          )}
        </section>

        <section>
          <h2 className="text-sm font-semibold text-mocha-500 mb-2">שיבוץ אוטומטי</h2>
          <MatchReview kind={kind} proposed={proposed} approved={approved} studentsById={studentsById} />
        </section>
      </div>
    </div>
  );
}
