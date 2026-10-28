import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

// נקרא ע"י Vercel Cron כדי למנוע מ-Supabase להירדם אחרי 7 ימים ללא שימוש (ראו vercel.json)
export async function GET() {
  const supabase = createAdminClient();
  const { error } = await supabase.from("rooms").select("id").limit(1);

  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true, checkedAt: new Date().toISOString() });
}
