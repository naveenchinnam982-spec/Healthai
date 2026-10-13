# Vercel deployment — patient dashboard only

This repository is not deployed yet. Deploy the patient-facing static app only; do not use the removed `doctorsdashboard-main` folder or the old Netlify configuration.

## Vercel project settings
1. Import `naveenchinnam982-spec/Healthai` from GitHub.
2. Set **Root Directory** to `maruthi/Health`.
3. Framework preset: **Other**.
4. Build command: leave empty (the current patient app is plain HTML/CSS/JS).
5. Output directory: leave empty/default so Vercel serves the root directory's static files.
6. Add these environment variables for Preview and Production:
   - `SUPABASE_URL=https://huwluahlemcyzujoulxp.supabase.co`
   - `SUPABASE_ANON_KEY=<your Supabase anon/publishable key>`
   - `HC_API_BASE_URL=<your deployed FastAPI origin, with no trailing /api>`

## Backend settings
The patient app's `/api/*` calls are proxied to FastAPI. The FastAPI service must be deployed separately and configured with:
- `DATABASE_URL=postgresql+asyncpg://...` from Supabase's Connect panel
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` only if server-side code truly needs it; never expose or commit it
- `ALLOWED_ORIGINS` containing the Vercel production and preview origins that should be allowed

## Before production
- Complete Supabase Auth in the patient UI (email/password and Google OAuth).
- Validate Supabase access tokens in FastAPI and enforce patient ownership / doctor-grant permissions on every patient-data endpoint.
- Reconcile the live Supabase tables with SQLAlchemy models and commit the exact SQL migration.
- Verify document upload/OCR, visits, medications, labs, AI companion, doctor PIN expiry/revocation, and patient isolation.
- Do not deploy production until these checks pass. The current branch is migration work in progress.
