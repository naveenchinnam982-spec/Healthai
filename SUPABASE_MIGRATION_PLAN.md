# Firebase to Supabase migration plan

## Current architecture

- `maruthi/Health` is the patient-facing static app and currently loads Firebase Auth, Firestore, and Storage from `index.html` and calls `firebase-config.js` / `firebase-service.js` from `api.js`.
- `doctorsdashboard-main` is a Vite/React doctor dashboard with an existing Supabase client.
- `maruthi/Health/backend` is a FastAPI application with SQLAlchemy models and API routes for patient records, visits, documents, medications, labs, decisions, doctor access, and clinical review.

The supplied Supabase project is active, but the `public` schema currently has no tables and no migrations. The current code also contains local/demo authentication fallbacks that can report a successful login without verifying credentials. Those must not be retained in a production authentication cutover.

## Safe implementation order

1. **Schema first:** create reviewed, version-controlled PostgreSQL migrations matching the existing SQLAlchemy models and their relationships. Include constraints and indexes; do not invent a second unrelated schema.
2. **Patient ownership and access:** define and test authorization for each patient-owned record, doctor grants, PIN expiry/revocation, audit events, and document review. Enable RLS where tables are exposed through the Supabase Data API. Do not expose medical records until policies have been tested with different patient and doctor identities.
3. **Auth:** migrate the patient UI to Supabase Auth. Remove fake `local-token-*`, `fb-token-*`, and `google-token-*` success responses. Use real Supabase sessions and validate JWTs server-side before accepting patient API requests. Configure Google OAuth redirect URLs in Supabase separately.
4. **API compatibility:** preserve the existing FastAPI API contract during the first cutover so document OCR, conflict detection, clinical review, and doctor access workflows are not accidentally removed. Replace direct Firestore reads/writes with authenticated API calls only after route authorization is verified.
5. **Private file storage:** use a private Supabase Storage bucket for medical documents, with per-patient policies and short-lived signed URLs. Never make patient files public.
6. **Data migration:** export Firebase Auth users and Firestore data, map identities deliberately, migrate records and files, and validate counts, ownership, and referential integrity before cutover. Existing Firebase user IDs must not be assumed to match Supabase user IDs.
7. **Environment and deployment:** configure `SUPABASE_URL`, the publishable key for browser use, and server-only Postgres/JWT credentials through deployment secrets. Never commit service-role/database passwords or expose a service-role key to the browser. Update the doctor dashboard's environment naming consistently.
8. **Verification:** test sign-up, sign-in, sign-out, Google OAuth, unauthorized patient-ID access, visits, document upload/OCR/review, medications, labs, doctor PIN generation/verification/expiry/revocation, and doctor dashboard login. Keep a rollback plan before production cutover.
9. **Cleanup:** remove Firebase SDKs, configuration, services, rules, and endpoints only after parity tests pass and data migration is confirmed.

## Current blockers before switching production traffic

- Supabase `public` schema is empty; there is no migration history.
- The FastAPI backend must be checked for Supabase JWT validation and patient ownership enforcement before Supabase Auth tokens are trusted.
- Existing Firebase data and accounts have not been migrated or reconciled with Supabase Auth identities.
- The Supabase security advisor flagged `public.rls_auto_enable()` as executable by public/authenticated roles while defined as `SECURITY DEFINER`; review its grants and implementation before exposing patient data.

This document records the migration sequence and current blockers. It does not claim the Firebase integration has already been replaced or that production data has been migrated.
