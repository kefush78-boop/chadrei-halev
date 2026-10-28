import Link from "next/link";
import Image from "next/image";
import type { Profile } from "@/lib/supabase/types";
import { ROLE_LABELS, LEADERSHIP_ROLES, STAFF_ROLES } from "@/lib/auth";
import { signOut } from "@/app/login/actions";

export function Nav({ profile }: { profile: Profile }) {
  const isLeadership = LEADERSHIP_ROLES.includes(profile.role);
  const isStaff = STAFF_ROLES.includes(profile.role);

  const links: { href: string; label: string }[] = [
    { href: "/", label: "דשבורד" },
    { href: "/rooms", label: "חדרים" },
    { href: "/schedule", label: "מערכת שעות" },
  ];

  if (isStaff) links.push({ href: "/visits", label: "יומן כניסות" });
  if (isLeadership) links.push({ href: "/treatment", label: "טיפולים רגשיים" });
  if (isLeadership) links.push({ href: "/matching", label: "שיבוצים" });
  links.push({ href: "/social", label: "מעורבות חברתית" });
  if (profile.role === "admin") links.push({ href: "/admin/users", label: "ניהול משתמשים" });
  links.push({ href: "/account", label: "שינוי סיסמה" });

  return (
    <header className="bg-mocha-800 text-coffee-50 border-b border-mocha-900/40 shadow-sm">
      <div className="max-w-5xl mx-auto px-4 py-3 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <span className="w-9 h-9 rounded-full overflow-hidden shrink-0 ring-2 ring-coffee-200/30">
            <Image src="/logo-icon.png" alt="" width={36} height={36} className="w-full h-full object-cover" />
          </span>
          <span className="font-serif font-bold text-lg tracking-wide">חדרי הלב</span>
          <span className="text-coffee-200 text-xs hidden sm:inline">
            {ROLE_LABELS[profile.role]} · {profile.full_name}
          </span>
        </div>
        <nav className="flex flex-wrap items-center gap-1">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="px-3 py-1.5 rounded-lg text-sm text-coffee-100 hover:bg-mocha-700 hover:text-white transition"
            >
              {l.label}
            </Link>
          ))}
          <form action={signOut}>
            <button className="px-3 py-1.5 rounded-lg text-sm bg-clay-700 hover:bg-clay-600 text-white transition">
              יציאה
            </button>
          </form>
        </nav>
      </div>
    </header>
  );
}
