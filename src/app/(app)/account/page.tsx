"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function AccountPage() {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [status, setStatus] = useState<{ error?: string; success?: boolean }>({});
  const [pending, setPending] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus({});

    if (password.length < 6) {
      setStatus({ error: "הסיסמה חייבת להיות באורך 6 תווים לפחות" });
      return;
    }
    if (password !== confirm) {
      setStatus({ error: "הסיסמאות לא תואמות" });
      return;
    }

    setPending(true);
    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({ password });
    setPending(false);

    if (error) {
      setStatus({ error: "שגיאה בעדכון הסיסמה, נסי שוב" });
      return;
    }
    setStatus({ success: true });
    setPassword("");
    setConfirm("");
  }

  return (
    <div>
      <h1 className="text-2xl font-serif font-bold text-mocha-800 mb-4">שינוי סיסמה</h1>

      <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-coffee-200 p-6 max-w-sm space-y-4">
        <div>
          <label className="block text-sm font-medium text-mocha-700 mb-1">סיסמה חדשה</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="w-full rounded-lg border border-coffee-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-clay-400"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-mocha-700 mb-1">אימות סיסמה</label>
          <input
            type="password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            required
            className="w-full rounded-lg border border-coffee-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-clay-400"
          />
        </div>

        {status.error && <p className="text-sm text-clay-700">{status.error}</p>}
        {status.success && <p className="text-sm text-sage-700">הסיסמה עודכנה בהצלחה!</p>}

        <button
          disabled={pending}
          className="w-full rounded-lg bg-clay-600 text-white py-2.5 font-medium hover:bg-clay-700 transition disabled:opacity-50"
        >
          {pending ? "מעדכנת..." : "עדכון סיסמה"}
        </button>
      </form>
    </div>
  );
}
