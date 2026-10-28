import { createClient } from "@/lib/supabase/server";
import { requireProfile } from "@/lib/auth";
import { ScheduleGrid } from "./schedule-grid";
import { ImportScheduleForm } from "./import-form";
import Link from "next/link";

export default async function SchedulePage({
  searchParams,
}: {
  searchParams: Promise<{ user?: string }>;
}) {
  const profile = await requireProfile();
  const supabase = await createClient();
  const { user: userParam } = await searchParams;

  const targetUserId = profile.role === "admin" && userParam ? userParam : profile.id;
  const canEdit = profile.role === "admin" || targetUserId === profile.id;

  const [{ data: slots }, { data: allUsers }, { data: targetProfile }] = await Promise.all([
    supabase.from("schedule_slots").select("*").eq("user_id", targetUserId),
    profile.role === "admin"
      ? supabase.from("profiles").select("id, full_name, role").order("full_name")
      : Promise.resolve({ data: null }),
    targetUserId === profile.id
      ? Promise.resolve({ data: profile })
      : supabase.from("profiles").select("*").eq("id", targetUserId).single(),
  ]);

  return (
    <div>
      <h1 className="text-2xl font-serif font-bold text-mocha-800 mb-4">
        מערכת שעות{targetProfile ? ` — ${targetProfile.full_name}` : ""}
      </h1>

      {allUsers && (
        <div className="mb-4 flex flex-wrap gap-1">
          {allUsers.map((u) => (
            <Link
              key={u.id}
              href={`/schedule?user=${u.id}`}
              className={`text-xs px-2 py-1 rounded-full border ${
                u.id === targetUserId
                  ? "bg-clay-600 text-white border-clay-600"
                  : "bg-white text-mocha-600 border-coffee-300 hover:border-clay-300"
              }`}
            >
              {u.full_name}
            </Link>
          ))}
        </div>
      )}

      {canEdit && <ImportScheduleForm userId={targetUserId} />}

      <ScheduleGrid userId={targetUserId} initialSlots={slots ?? []} canEdit={canEdit} />
    </div>
  );
}
