"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { RoomKind, RoomState } from "@/lib/supabase/types";

export interface RoomRow {
  id: string;
  name: string;
  kind: RoomKind;
  room_status: { status: RoomState; occupied_note: string | null; updated_at: string; updated_by: string | null }[] | null;
}

interface RoomView {
  id: string;
  name: string;
  kind: RoomKind;
  status: RoomState;
}

function toView(rows: RoomRow[]): RoomView[] {
  return rows.map((r) => ({
    id: r.id,
    name: r.name,
    kind: r.kind,
    status: r.room_status?.[0]?.status ?? "free",
  }));
}

export function RoomsBoard({
  initialRooms,
  canEdit,
  isAdmin,
}: {
  initialRooms: RoomRow[];
  canEdit: boolean;
  isAdmin: boolean;
}) {
  const [rooms, setRooms] = useState<RoomView[]>(() => toView(initialRooms));
  const [pending, setPending] = useState<string | null>(null);
  const [renaming, setRenaming] = useState<string | null>(null);
  const [draftName, setDraftName] = useState("");
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [errorRoomId, setErrorRoomId] = useState<string | null>(null);

  useEffect(() => {
    setRooms(toView(initialRooms));
  }, [initialRooms]);

  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel("room_status_changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "room_status" },
        (payload) => {
          const row = payload.new as { room_id: string; status: RoomState };
          setRooms((prev) =>
            prev.map((r) => (r.id === row.room_id ? { ...r, status: row.status } : r))
          );
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  async function toggle(room: RoomView) {
    if (!canEdit) return;
    setPending(room.id);
    const supabase = createClient();
    const nextStatus: RoomState = room.status === "free" ? "occupied" : "free";
    setRooms((prev) => prev.map((r) => (r.id === room.id ? { ...r, status: nextStatus } : r)));
    await supabase
      .from("room_status")
      .update({ status: nextStatus, updated_at: new Date().toISOString() })
      .eq("room_id", room.id);
    setPending(null);
  }

  function startRename(room: RoomView) {
    setDraftName(room.name);
    setRenaming(room.id);
  }

  async function saveRename() {
    if (!renaming) return;
    const name = draftName.trim();
    const roomId = renaming;
    setRenaming(null);
    if (!name) return;

    setRooms((prev) => prev.map((r) => (r.id === roomId ? { ...r, name } : r)));
    const supabase = createClient();
    await supabase.from("rooms").update({ name }).eq("id", roomId);
  }

  async function confirmDeleteRoom(room: RoomView) {
    const supabase = createClient();
    const { error } = await supabase.from("rooms").delete().eq("id", room.id);
    setConfirmDelete(null);
    if (error) {
      setErrorRoomId(room.id);
      return;
    }
    setRooms((prev) => prev.filter((r) => r.id !== room.id));
  }

  const central = rooms.filter((r) => r.kind === "central");
  const priv = rooms.filter((r) => r.kind === "private");

  const cardProps = {
    canEdit,
    isAdmin,
    renaming,
    draftName,
    setDraftName,
    confirmDelete,
    setConfirmDelete,
    errorRoomId,
    onToggle: toggle,
    onStartRename: startRename,
    onSaveRename: saveRename,
    onConfirmDelete: confirmDeleteRoom,
  };

  return (
    <div className="space-y-6">
      {central.length > 0 && (
        <section>
          <h2 className="text-sm font-semibold text-mocha-500 mb-2">חדר מרכזי</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {central.map((r) => (
              <RoomCard key={r.id} room={r} pending={pending === r.id} {...cardProps} />
            ))}
          </div>
        </section>
      )}
      <section>
        <h2 className="text-sm font-semibold text-mocha-500 mb-2">חדרים פרטניים</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          {priv.map((r) => (
            <RoomCard key={r.id} room={r} pending={pending === r.id} {...cardProps} />
          ))}
        </div>
        {priv.length === 0 && <p className="text-mocha-300 text-sm">טרם הוגדרו חדרים פרטניים.</p>}
      </section>
    </div>
  );
}

function RoomCard({
  room,
  canEdit,
  isAdmin,
  pending,
  renaming,
  draftName,
  setDraftName,
  confirmDelete,
  setConfirmDelete,
  errorRoomId,
  onToggle,
  onStartRename,
  onSaveRename,
  onConfirmDelete,
}: {
  room: RoomView;
  canEdit: boolean;
  isAdmin: boolean;
  pending: boolean;
  renaming: string | null;
  draftName: string;
  setDraftName: (v: string) => void;
  confirmDelete: string | null;
  setConfirmDelete: (id: string | null) => void;
  errorRoomId: string | null;
  onToggle: (room: RoomView) => void;
  onStartRename: (room: RoomView) => void;
  onSaveRename: () => void;
  onConfirmDelete: (room: RoomView) => void;
}) {
  const free = room.status === "free";
  const isRenaming = renaming === room.id;
  const isConfirmingDelete = confirmDelete === room.id;

  return (
    <div
      className={`rounded-xl border p-4 transition ${
        free ? "bg-sage-50 border-sage-200" : "bg-clay-50 border-clay-200"
      } ${pending ? "opacity-60" : ""}`}
    >
      {isConfirmingDelete ? (
        <div className="text-sm">
          <div className="font-medium text-mocha-800 mb-2">למחוק את "{room.name}"?</div>
          <div className="flex gap-2">
            <button
              onClick={() => onConfirmDelete(room)}
              className="px-2 py-1 rounded-lg bg-clay-600 text-white text-xs hover:bg-clay-700"
            >
              כן, למחוק
            </button>
            <button
              onClick={() => setConfirmDelete(null)}
              className="px-2 py-1 rounded-lg border border-coffee-300 text-mocha-600 text-xs hover:bg-white"
            >
              ביטול
            </button>
          </div>
        </div>
      ) : (
        <div className="flex items-start justify-between gap-2">
          {isRenaming ? (
            <input
              autoFocus
              value={draftName}
              onChange={(e) => setDraftName(e.target.value)}
              onBlur={onSaveRename}
              onKeyDown={(e) => {
                if (e.key === "Enter") onSaveRename();
              }}
              className="font-medium text-mocha-800 bg-white rounded-md border border-coffee-300 px-1.5 py-0.5 text-sm w-full"
            />
          ) : (
            <button
              disabled={!canEdit || pending}
              onClick={() => onToggle(room)}
              className={`text-right flex-1 ${canEdit ? "cursor-pointer" : "cursor-default"}`}
            >
              <div className="font-medium text-mocha-800">{room.name}</div>
              <div className={`text-sm mt-1 font-semibold ${free ? "text-sage-700" : "text-clay-700"}`}>
                {free ? "פנוי" : "תפוס"}
              </div>
            </button>
          )}

          {isAdmin && !isRenaming && (
            <div className="flex gap-1 shrink-0">
              <button
                onClick={() => onStartRename(room)}
                title="שינוי שם"
                className="w-6 h-6 flex items-center justify-center rounded text-mocha-400 hover:bg-white/60 hover:text-mocha-700 text-sm"
              >
                ✎
              </button>
              <button
                onClick={() => setConfirmDelete(room.id)}
                title="מחיקת חדר"
                className="w-6 h-6 flex items-center justify-center rounded text-clay-500 hover:bg-white/60 hover:text-clay-700 text-sm"
              >
                🗑
              </button>
            </div>
          )}
        </div>
      )}

      {errorRoomId === room.id && (
        <p className="text-xs text-clay-700 mt-2">
          לא ניתן למחוק - יש כניסות או שיעורים ששייכים לחדר הזה.
        </p>
      )}
    </div>
  );
}
