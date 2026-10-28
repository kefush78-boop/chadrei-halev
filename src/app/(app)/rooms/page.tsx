import { createClient } from "@/lib/supabase/server";
import { requireProfile } from "@/lib/auth";
import { RoomsBoard, type RoomRow } from "./rooms-board";
import { createRoom } from "./actions";

export default async function RoomsPage() {
  const profile = await requireProfile();
  const supabase = await createClient();

  const { data: rooms } = await supabase
    .from("rooms")
    .select("id, name, kind, room_status(status, occupied_note, updated_at, updated_by)")
    .order("kind", { ascending: false })
    .order("name");

  return (
    <div>
      <h1 className="text-2xl font-serif font-bold text-mocha-800 mb-4">מצב חדרים</h1>

      {profile.role === "admin" && (
        <form action={createRoom} className="bg-white rounded-xl border border-coffee-200 p-4 mb-6 flex flex-wrap gap-3">
          <input name="name" placeholder="שם החדר" required className="rounded-lg border border-coffee-300 px-2 py-2 text-sm" />
          <select name="kind" required className="rounded-lg border border-coffee-300 px-2 py-2 text-sm">
            <option value="private">חדר פרטני</option>
            <option value="central">חדר מרכזי</option>
          </select>
          <button className="rounded-lg bg-clay-600 text-white text-sm font-medium px-4 py-2 hover:bg-clay-700">
            הוספת חדר
          </button>
        </form>
      )}

      <RoomsBoard
        initialRooms={(rooms ?? []) as unknown as RoomRow[]}
        canEdit={profile.role !== "student"}
        isAdmin={profile.role === "admin"}
      />
    </div>
  );
}
