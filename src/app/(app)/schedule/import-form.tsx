"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { importScheduleFromExcel } from "./actions";

type ImportResult = { error?: string; success?: boolean; count?: number } | null;

async function action(_prev: ImportResult, formData: FormData): Promise<ImportResult> {
  return importScheduleFromExcel(formData);
}

export function ImportScheduleForm({ userId }: { userId: string }) {
  const [state, formAction, pending] = useActionState<ImportResult, FormData>(action, null);
  const router = useRouter();

  useEffect(() => {
    if (state?.success) router.refresh();
  }, [state, router]);

  return (
    <form action={formAction} className="mb-4 flex flex-wrap items-center gap-2">
      <input type="hidden" name="user_id" value={userId} />
      <input
        type="file"
        name="file"
        accept=".xlsx,.xls"
        required
        className="text-xs file:ml-2 file:rounded-lg file:border-0 file:bg-coffee-200 file:px-3 file:py-1.5 file:text-mocha-700 file:text-xs"
      />
      <button
        disabled={pending}
        className="rounded-lg bg-mocha-600 text-white text-xs font-medium px-3 py-1.5 hover:bg-mocha-700 disabled:opacity-50"
      >
        {pending ? "מייבא..." : "ייבוא ממשוב (אקסל)"}
      </button>
      {state?.error && <span className="text-xs text-clay-700">{state.error}</span>}
      {state?.success && <span className="text-xs text-sage-700">יובאו {state.count} שיעורים בהצלחה</span>}
    </form>
  );
}
