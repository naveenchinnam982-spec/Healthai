# HealthContinuum AI

Patient-facing healthcare continuity app for medical-record organization, document upload/OCR, medication and lab timelines, clinical change explanations, and patient-controlled doctor review PINs.

## Current deployment target

- **Frontend:** `maruthi/Health` — plain HTML/CSS/JavaScript patient dashboard.
- **Hosting:** Vercel, with the project Root Directory set to `maruthi/Health`.
- **Database/storage:** Supabase project `huwluahlemcyzujoulxp`.
- **API:** FastAPI under `maruthi/Health/backend`, deployed separately; Vercel's `/api/*` functions proxy to it.
- The standalone `doctorsdashboard-main` folder and old root Netlify config have been removed from this branch. Patient-side doctor review/PIN workflows in the backend remain.

## Vercel setup

Follow [VERCEL_DEPLOYMENT.md](VERCEL_DEPLOYMENT.md). Configure:
- `SUPABASE_URL=https://huwluahlemcyzujoulxp.supabase.co`
- `SUPABASE_ANON_KEY` — browser-safe anon/publishable key only
- `HC_API_BASE_URL` — deployed FastAPI origin without a trailing `/api`

## FastAPI setup

```bash
cd maruthi/Health/backend
pip install -r requirements.txt
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000
```

For production, set `DATABASE_URL` to the Supabase PostgreSQL connection string using `postgresql+asyncpg://...`, and set `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `ALLOWED_ORIGINS`, and any required server-only secrets in the backend host's environment. Never put a database password or Supabase service-role key in frontend code or commit either secret.

## Migration status — work in progress

The initial Supabase tables, row-level security policies, and private medical-document bucket have been provisioned. This branch removes Firebase frontend/config assets and prepares the patient app for Vercel, but it is **not production-ready yet**:
- Supabase Auth still needs to be connected to the email/password and Google sign-in UI.
- FastAPI currently issues its own JWTs; token verification and patient ownership/doctor-grant authorization must be completed.
- The live Supabase schema needs a committed SQL migration and reconciliation with SQLAlchemy models.
- Upload/OCR, patient isolation, medication/lab records, AI companion, and doctor PIN flows must pass end-to-end tests before production deployment.

See [SUPABASE_MIGRATION_PLAN.md](SUPABASE_MIGRATION_PLAN.md) for the checklist.
