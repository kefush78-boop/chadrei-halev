"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { requireProfile } from "@/lib/auth";
import type { UserRole } from "@/lib/supabase/types";
import { revalidatePath } from "next/cache";

export async function createUser(formData: FormData) {
  await requireProfile(["admin"]);

  const full_name = String(formData.get("full_name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const role = String(formData.get("role") ?? "") as UserRole;
  const grade_class = String(formData.get("grade_class") ?? "").trim() || null;
  const phone = String(formData.get("phone") ?? "").trim() || null;

  if (!full_name || !email || !password || !role) return;

  const admin = createAdminClient();
  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });

  if (error || !data.user) {
    revalidatePath("/admin/users");
    return;
  }

  await admin.from("profiles").insert({
    id: data.user.id,
    full_name,
    role,
    grade_class,
    phone,
  });

  revalidatePath("/admin/users");
}

export async function updateUserRole(formData: FormData) {
  await requireProfile(["admin"]);
  const supabase = await createClient();

  const id = String(formData.get("id") ?? "");
  const role = String(formData.get("role") ?? "") as UserRole;
  if (!id || !role) return;

  await supabase.from("profiles").update({ role }).eq("id", id);
  revalidatePath("/admin/users");
}
