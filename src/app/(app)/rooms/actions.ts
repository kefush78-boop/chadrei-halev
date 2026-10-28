"use server";

import { createClient } from "@/lib/supabase/server";
import { requireProfile } from "@/lib/auth";
import type { RoomKind } from "@/lib/supabase/types";
import { revalidatePath } from "next/cache";

export async function createRoom(formData: FormData) {
  await requireProfile(["admin"]);
  const supabase = await createClient();

  const name = String(formData.get("name") ?? "").trim();
  const kind = String(formData.get("kind") ?? "") as RoomKind;
  if (!name || !kind) return;

  const { data: room } = await supabase.from("rooms").insert({ name, kind }).select().single();
  if (room) {
    await supabase.from("room_status").insert({ room_id: room.id, status: "free" });
  }

  revalidatePath("/rooms");
}
