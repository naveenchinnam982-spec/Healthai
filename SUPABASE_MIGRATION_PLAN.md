# Firebase to Supabase migration plan

## Target
Use Supabase as the only identity, database, and medical-file platform across the patient app, doctor dashboard, and FastAPI backend. Keep the existing OCR, clinical continuity, review, and doctor PIN workflows.

## Verified baseline (2026-10-13)
- Supabase project: `huwluahlemcyzujoulxp` (`Healthai`, ap-south-1).
- Before this cutover, the project's `public` schema and migration history were empty.
- In this branch, Firebase SDK/config/service/rules files and Firebase branches in the patient HTML/JS/FastAPI static routes have been removed. API login/register now fail closed rather than creating fake local tokens; Google OAuth is intentionally disabled until Supabase OAuth is wired.
- FastAPI still defaults to SQLite, creates tables at application startup, and issues its own JWTs. Patient login/register can create records without verifying a password. This is not safe for production.
- The standalone `doctorsdashboard-main` dashboard folder and old Netlify root config are removed in this branch. The patient-facing app in `maruthi/Health` is the only frontend deployment target; patient-to-doctor access-code backend features remain.
- The schema/security baseline was applied to the Supabase project during this migration attempt: profiles, patients, doctors, visits, documents, medications, lab_results, clinical_decisions, change_events, evidences, doctor_accesses, review_queue_items, decision_memories, conversations, messages, audit_logs; RLS enabled; private `medical-documents` storage bucket created.
- IMPORTANT: the database schema application is not yet fully represented by a committed SQL migration file, and the app is not yet cut over. Treat this as in progress, not production-ready.

## Required implementation steps
1. [x] Provision an initial Supabase schema and enable RLS policies for patient-owned records.
2. [ ] Commit the exact applied SQL as a version-controlled migration and reconcile every table/column with all SQLAlchemy models and API routes.
3. [ ] Finish Supabase Auth integration for email/password and Google OAuth, then attach the verified Supabase session to API calls.
4. [ ] Replace FastAPI's local JWT issuance with verified Supabase access-token validation; enforce patient ownership and role/grant checks on every route. Never trust a patient ID supplied by the browser alone.
5. [ ] Move FastAPI database configuration from SQLite to Supabase PostgreSQL (async driver and migrations); do not use `create_all` as the production migration system.
6. [ ] Move medical uploads from local/Firebase storage to the private `medical-documents` bucket using patient-scoped paths and short-lived signed URLs.
7. [ ] Migrate Firebase Auth users, Firestore records, and stored files with an explicit identity mapping; verify counts and ownership before cutover.
8. [x] Remove the standalone doctor dashboard from this repository's deployment scope. [ ] Keep patient-side doctor-access/PIN workflows secured against Supabase identity and ownership.
9. [ ] Configure environment variables and deployment secrets for all deployed services. Never put a service-role key or database password in browser code or Git.
10. [ ] Run build/type checks and end-to-end tests: sign-up/sign-in/sign-out, Google OAuth, patient isolation, visits, uploads/OCR, medication/lab records, doctor PIN expiry/revocation, review queue, and audit logs.
11. [x] Remove Firebase SDK/config/service/rules files and patient frontend/FastAPI static-route references on this branch. [ ] Run a whole-repository search and regression tests before declaring migration complete.

## Security notes
- The `medical-documents` bucket is private. Object names must begin with the patient record ID.
- RLS is a second layer, not a substitute for server-side JWT verification and endpoint authorization.
- Do not expose a service-role key in the browser or commit secrets.
- Do not use demo patient data or local/in-memory fallbacks to represent successful production authentication.
- Do not claim production cutover until the migration file is committed, tests pass, and existing data is reconciled.


## Vercel deployment target
- Create the Vercel project from `naveenchinnam982-spec/Healthai` and set **Root Directory** to `maruthi/Health`.
- Framework preset: **Other**; no build command is needed for the current plain HTML/CSS/JS patient app.
- Add `SUPABASE_URL=https://huwluahlemcyzujoulxp.supabase.co`, `SUPABASE_ANON_KEY` (browser-safe anon/publishable key), and `HC_API_BASE_URL` (deployed FastAPI origin without `/api`) to Vercel environment variables.
- The `/api/config` function exposes only the URL and anon key; the `/api/*` catch-all proxies to FastAPI. `DATABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` belong only in the backend hosting environment.
- **Not ready for production yet:** Supabase Auth is not fully wired to the UI, FastAPI still issues its own JWTs and defaults to SQLite unless configured, the live schema must be reconciled with SQLAlchemy models, and route-level ownership authorization/tests remain mandatory.
