# Progress — security fixes (branch `fix/security-hardening`, from `dev`)

Goal: close the code-side items in [roadmap 02 §1](../roadmap/02-enhancements.md).

Done (each with tests, backend suite green):
- S15 login enumeration — generic message, dummy bcrypt check for unknown users.
- S17 401 entry point — anonymous calls get 401 with the standard error body.
- S16 forwarded headers — `server.forward-headers-strategy: native`; nginx passes the outer scheme.
- S13 encryption key — no default, fail fast on a missing or wrong-length key. No key value is
  committed: locally it comes from pass via secrun, tests generate a random one.

Related branch: `chore/local-secrets-pass` (pass/secrun docs, `make doctor` accepting secrun
keys). Merge it before or with this one; both edit `infra/docker/.env.example`.

Not in this branch: S12 (rotate keys, outside the repo), S14 (container hardening), S19 (frontend
image ignores `nginx.conf`), S8/S9/S18.

Next action: owner adds `ENCRYPTION_KEY` to the pass entry, then merge both branches into `dev`.
