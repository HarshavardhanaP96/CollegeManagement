# Progress — security fixes (branch `fix/security-hardening`, from `dev`)

Goal: close the code-side items in [roadmap 02 §1](../roadmap/02-enhancements.md).

Done (each with tests, backend suite green):
- S15 login enumeration — generic message, dummy bcrypt check for unknown users.
- S17 401 entry point — anonymous calls get 401 with the standard error body.
- S16 forwarded headers — `server.forward-headers-strategy: native`; nginx passes the outer scheme.

Waiting on a decision:
- S13 remove the `ENCRYPTION_KEY` fallback. Code and tests are written but not committed: the
  local gitleaks hook flags the fake test key and the dev key in `.env.example`, and silencing it
  with `.gitleaksignore` needs the owner's OK. Options: (A) no key literals at all — the test
  profile generates a random key, `make setup` writes a random one into `.env`; (B) commit with
  `.gitleaksignore` entries. The work is saved as patches outside the repo (session scratchpad,
  `s13/`); redo it from this note if those are gone.

Not in this branch: S12 (rotate keys, outside the repo), S14 (container hardening), S19 (frontend
image ignores `nginx.conf`), S8/S9/S18.

Next action: apply the S13 option the owner picks, run the full suite, commit.
