import Image from "next/image";
import { signIn } from "./actions";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  return (
    <div
      dir="rtl"
      className="min-h-screen flex items-center justify-center px-4 py-8"
      style={{
        background: "linear-gradient(160deg, var(--color-coffee-100), var(--color-coffee-50) 55%, var(--color-sage-50))",
      }}
    >
      <div className="w-full max-w-3xl bg-white rounded-2xl shadow-xl shadow-mocha-900/10 border border-coffee-200/60 overflow-hidden flex flex-col sm:flex-row-reverse">
        <div className="hidden sm:block sm:w-1/2 relative min-h-[420px]">
          <Image src="/photos/center-3.jpg" alt="חדרי הלב" fill className="object-cover" priority />
        </div>

        <div className="w-full sm:w-1/2 p-8">
          <div className="flex justify-center mb-2">
            <Image src="/logo-lockup.png" alt="חדרי הלב" width={586} height={443} className="w-40 h-auto" priority />
          </div>
          <p className="text-center text-sm font-serif text-mocha-400 mb-6 tracking-wide">תיכון ריגלר, נתניה</p>

          {error && (
            <div className="mb-4 rounded-lg bg-clay-50 text-clay-700 text-sm px-3 py-2 text-center">
              {error}
            </div>
          )}

          <form action={signIn} className="flex flex-col gap-4">
            <div>
              <label className="block text-sm font-medium text-mocha-700 mb-1">אימייל</label>
              <input
                type="email"
                name="email"
                required
                className="w-full rounded-lg border border-coffee-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-clay-400 focus:border-clay-400"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-mocha-700 mb-1">סיסמה</label>
              <input
                type="password"
                name="password"
                required
                className="w-full rounded-lg border border-coffee-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-clay-400 focus:border-clay-400"
              />
            </div>
            <button
              type="submit"
              className="mt-2 w-full rounded-lg bg-clay-600 text-white py-2.5 font-medium hover:bg-clay-700 transition shadow-sm"
            >
              כניסה
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
