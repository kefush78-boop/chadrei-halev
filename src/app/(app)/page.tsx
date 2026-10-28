import { createClient } from "@/lib/supabase/server";
import { requireProfile, LEADERSHIP_ROLES } from "@/lib/auth";
import Link from "next/link";
import Image from "next/image";

export default async function DashboardPage() {
  const profile = await requireProfile();
  const supabase = await createClient();
  const isLeadership = LEADERSHIP_ROLES.includes(profile.role);

  const [{ data: rooms }, { data: openVisits }, { data: pendingHours }] = await Promise.all([
    supabase.from("room_status").select("status, room:rooms(name, kind)"),
    supabase.from("visits").select("id, status").in("status", ["open", "follow_up"]),
    isLeadership
      ? supabase.from("mentor_hours").select("id").eq("confirmation_status", "pending")
      : Promise.resolve({ data: [] as { id: string }[] }),
  ]);

  const freeCount = rooms?.filter((r) => r.status === "free").length ?? 0;
  const occupiedCount = rooms?.filter((r) => r.status === "occupied").length ?? 0;

  const cards = [
    { href: "/rooms", label: "חדרים פנויים", value: `${freeCount} / ${(rooms?.length ?? 0)}` },
    { href: "/visits", label: "כניסות פתוחות למעקב", value: String(openVisits?.length ?? 0) },
  ];

  if (isLeadership) {
    cards.push({
      href: "/social",
      label: "שעות מלווים ממתינות לאישור",
      value: String(pendingHours?.length ?? 0),
    });
  }

  return (
    <div>
      <h1 className="text-2xl font-serif font-bold text-mocha-800 mb-4">שלום, {profile.full_name}</h1>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {cards.map((c) => (
          <Link
            key={c.href}
            href={c.href}
            className="bg-white rounded-xl shadow-sm border border-coffee-200 p-5 hover:shadow-md transition"
          >
            <div className="text-sm text-mocha-400">{c.label}</div>
            <div className="text-3xl font-bold text-clay-700 mt-1">{c.value}</div>
          </Link>
        ))}
      </div>

      <div className="mt-6 flex flex-col sm:flex-row gap-2 text-sm text-mocha-400">
        {occupiedCount > 0 && <span>{occupiedCount} חדרים תפוסים כרגע.</span>}
      </div>

      <div className="mt-8">
        <h2 className="text-sm font-semibold text-mocha-500 mb-2">המרחב שלנו</h2>
        <div className="grid grid-cols-3 gap-2">
          {["/photos/center-3.jpg", "/photos/center-1.jpg", "/photos/center-2.jpg"].map((src) => (
            <div key={src} className="relative aspect-square rounded-xl overflow-hidden border border-coffee-200">
              <Image src={src} alt="חדרי הלב" fill className="object-cover" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
