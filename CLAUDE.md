@AGENTS.md

# Project notes: "חדרי הלב" (Chadrei HaLev)

## Who and how
- Owner: Rakefet Cohen, runs the "חדרי הלב" student-support center at Rigler High School, Netanya. Not a developer.
- Talk to her in Hebrew, simply, one step at a time. She works from a home PC and a school-office PC (this repo syncs via a private GitHub repo).
- Sync words: "תעלי" = commit + push; "תורידי" = `git pull`. Always pull before starting work, push when she finishes.

## Stack
- Next.js 16 (read AGENTS.md: APIs differ from older versions; `proxy.ts` replaces middleware), React 19, Tailwind v4, TypeScript.
- Supabase (Postgres + Auth + RLS). Hebrew RTL UI. Palette tokens (clay / mocha / coffee / sage) live in `src/app/globals.css`.
- Production: https://chadrei-halev.vercel.app (Vercel, team "chadrei-halev"). Env vars are already set in the Vercel project.

## Secrets (never commit, never paste into files)
- `.env.local` is git-ignored. Needs `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` (publishable key), `SUPABASE_SERVICE_ROLE_KEY` (secret key). Rakefet copies them from the Supabase dashboard (Project Settings → API Keys).
- Deploying needs a Vercel token that she creates and gives you (not stored anywhere): `npx vercel --prod --token=<token> --yes`.

## Database
- SQL migrations in `supabase/migrations/` are run MANUALLY by Rakefet in the Supabase SQL Editor. After adding one, give her the SQL to paste and confirm "Success".
- Supabase free tier pauses a project after ~7 days of inactivity. A daily cron (`vercel.json` → `/api/keepalive`) is meant to prevent that. If login fails with "wrong password" or scripts fail with "fetch failed", first check whether the project is paused and have her click "Resume project".
- First admin account is hers (kefush78@gmail.com). Users are created from the "ניהול משתמשים" page. She can change her own password at `/account`.

## Design decisions to keep
- Treatment tracking intentionally stores NO session content, only a "goal for next meeting" (professional confidentiality).
- The matching feature (`/matching`) uses lightweight name-only lists (`providers`, `student_candidates`), not login accounts. Providers are separated by specialty kind (treatment vs. subject tutoring).

## Testing lessons
- The built-in browser pane keeps cookies and may already be logged in as Rakefet's real account. Do not click destructive buttons on real data. Create throwaway test users with the service-role key, test, then delete them (and any rows they created).
- Windows: python is not installed; use Node for scripts. Hebrew path folder is the parent of this repo, so run npm/node from inside this folder.
