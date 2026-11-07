# Roadmap & Backlog

First snapshot 2026-10-31; updated 2026-11-07 after the security merge (`main`/`dev` at `f61bfe3`).
Sources: the codebase, `docs/foundations/`, `docs/reviews/2026-10-19-spec-gap-review.md`.

| Doc | What it answers |
|---|---|
| [01-branches-and-pending.md](01-branches-and-pending.md) | What was merged, what is still open from that work |
| [02-enhancements.md](02-enhancements.md) | Fixes and improvements to things that already exist (security, quality, ops, UX) |
| [03-features-next.md](03-features-next.md) | New features for the current release (v1.0) |
| [04-future.md](04-future.md) | v1.1 and later: add-ons, integrations, platform moves |

## Top 5 right now
1. **Supply real keys to test/prod and rotate the committed ones** (S12). The backend now refuses
   to start without a valid 32-byte `ENCRYPTION_KEY`, and the test/prod overlay placeholders are
   not valid, so those pods won't start until a secret manager feeds them. The local-overlay key in
   `infra/k8s/base/secrets.yaml` is in git history; never reuse it outside local.
2. **Make the CI security stage pass.** `make scan-src` (now in the Jenkinsfile) fails on the keys
   above plus ~40 Dockerfile/k8s findings (no `USER`, no `securityContext`, writable root
   filesystem). See 02 §1.
3. **Fix the frontend image (S19):** `frontend/Dockerfile` never copies `nginx.conf`, so in
   Kubernetes there is no `/api` proxy, the actuator block is not active, and the bundle calls
   `http://localhost:8080`. The forwarded-scheme fix (S16) only takes effect once this is fixed.
4. **Deploy settings for the new security code:** `JWT_SECRET`, `SPRING_DATASOURCE_PASSWORD`,
   `ENCRYPTION_KEY`, `APP_CORS_ALLOWED_ORIGINS` per environment. Users sign in once after the
   release.
5. **Spec blockers before v1.0 build-out:** test-ID numbering, permission matrix and grading scheme
   (spec-gap review §2). See 03 §0.

## How to keep this current
Tick items off in place (`[x]`) with the commit. When a decision changes, record it in
`docs/foundations/architecture.md` "Key decisions" too.
