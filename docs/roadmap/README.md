# Roadmap & Backlog

First snapshot 2026-10-31; updated 2026-11-01 after the roadmap merge (`main`/`dev` at `1ec51ce`).
Sources: the codebase, `docs/foundations/`, `docs/reviews/2026-10-19-spec-gap-review.md`.

| Doc | What it answers |
|---|---|
| [01-branches-and-pending.md](01-branches-and-pending.md) | What was merged, what is still open from that work |
| [02-enhancements.md](02-enhancements.md) | Fixes and improvements to things that already exist (security, quality, ops, UX) |
| [03-features-next.md](03-features-next.md) | New features for the current release (v1.0) |
| [04-future.md](04-future.md) | v1.1 and later: add-ons, integrations, platform moves |

## Top 5 right now
1. **Rotate the committed AES `encryption-key` values** in `infra/k8s/base/secrets.yaml` and the
   test/prod overlay secrets. They are in git history on GitHub; move them to a secret manager.
2. **Make the CI security stage pass.** `make scan-src` (now in the Jenkinsfile) fails on the keys
   above plus ~40 Dockerfile/k8s findings (no `USER`, no `securityContext`, writable root
   filesystem). See 02 §1.
3. **Deploy settings for the new security code:** `JWT_SECRET`, `SPRING_DATASOURCE_PASSWORD`,
   `APP_CORS_ALLOWED_ORIGINS` per environment, and forwarded headers behind the proxy (per-IP login
   limit and HSTS depend on it). Users sign in once after the release.
4. **Remaining auth gaps:** `ENCRYPTION_KEY` still has a hard-coded fallback, `/auth/login` reveals
   whether an account exists, anonymous requests get 403 instead of 401. See 02 §1.
5. **Spec blockers before v1.0 build-out:** test-ID numbering, permission matrix and grading scheme
   (spec-gap review §2). See 03 §0.

## How to keep this current
Tick items off in place (`[x]`) with the commit. When a decision changes, record it in
`docs/foundations/architecture.md` "Key decisions" too.
