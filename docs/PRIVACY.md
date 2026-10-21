# Privacy (DPDP) workflows

Notice and consent, data-principal requests and retention, per college. Design: `docs/superpowers/specs/2026-10-19-dpdp-privacy-workflows-design.md`.

## What it does

| Area | Who | Where |
|---|---|---|
| Notice versions and per-purpose consent (append-only ledger) | Students and teachers answer; college admin publishes notices | Consent modal on first login and after each new notice; **My Privacy**; admin **Privacy → Privacy notice** |
| Requests: access, correction, erasure, grievance | Students and teachers raise; college admin reviews and resolves | **My Privacy**; admin **Privacy → Requests** |
| Retention: anonymise deactivated accounts after N days | College admin sets the policy; a nightly job runs it | Admin **Privacy → Retention** |
| Audit trail of every privacy action | College admin reads | Admin **Privacy → Audit log** |

## Erasure means anonymise

Name, email, username, phone, date of birth, address and parent contact details are replaced or cleared and the account is disabled. Marks, attendance and results stay, linked by user id and roll number. Nothing is hard-deleted.

## Configuration

| Property (env var) | Default | Meaning |
|---|---|---|
| `app.privacy.response-days` (`APP_PRIVACY_RESPONSE_DAYS`) | `30` | Days from submission to a request's due date. Confirm the legal figure with counsel. |
| `app.privacy.retention-dry-run` (`APP_PRIVACY_RETENTION_DRY_RUN`) | `true` | The nightly job only counts. Set `false` to let it anonymise. |
| `app.privacy.retention-cron` (`APP_PRIVACY_RETENTION_CRON`) | `0 30 2 * * *` | When the nightly job runs. |

Retention policies ship **disabled** with a placeholder of 1825 days. A college must enable and tune its own.

## Turning retention on safely

1. Admin → Privacy → Retention: set the period agreed with counsel and tick **Enabled**.
2. Use **Preview (dry run)** and read the count and the run history.
3. Only then set `APP_PRIVACY_RETENTION_DRY_RUN=false` and restart. Run the backend as a single replica for this job: it has no distributed lock.

## Adding a module's data to the workflows

Implement `com.edgepoint.privacy.contributor.PersonalDataContributor` as a Spring `@Component`:

```java
@Component
public class FeesDataContributor implements PersonalDataContributor {
    public String section() { return "fees"; }
    public Map<String, Object> export(Integer userId) { /* the user's fee data, no secrets */ }
    public Set<String> correctableFields() { return Set.of(); }
    public void correct(Integer userId, Map<String, String> fields) { }
    public void anonymise(Integer userId) { /* clear direct identifiers, keep the record; safe to call twice */ }
}
```

It is picked up automatically for access exports, corrections and erasure.

## Known limitations

- An access token issued before an erasure stays valid until it expires; the JWT filter does not check `is_active`.
- The nightly job is not cluster-safe.
- `HOD` and `SUPERADMIN` have no privacy pages in this release; a `SUPERADMIN` can read the admin API for one college with `?collegeId=`.
- Guardian consent for minors and breach notification are not built.
- The retention reference date for a deactivated account is `COALESCE(deleted_at, updated_at, created_at)`; there is no explicit deactivation timestamp.
- Frontend `npm run build` and `npm run lint` already fail on the baseline (TypeScript errors and lint problems unrelated to this feature); this feature did not change the counts.
- The end-to-end UI walkthrough was not performed: the dev setup has no way to seed a college admin or a student.
- First-access seeding of the default purposes can race once for a brand-new college (two simultaneous first requests).
- Go-live precondition for retention: run a single replica, or add a lock, before setting `app.privacy.retention-dry-run=false`.
- Request review, resolve and cancel take a pessimistic row lock, so concurrent admins are serialised; the second sees the new status and is refused.
- `PARENT_NOTIFICATIONS` consent is recorded and withdrawable but not yet enforced by the notification dispatcher (follow-up).
- A manual retention run with `dryRun=false` from the admin UI ignores the global `app.privacy.retention-dry-run` switch; only the nightly job honours it. The policy must be enabled and the UI asks for confirmation.
- Free text that remains after erasure (`Mark.remarks`, `AttendanceRecord.remarks`, `DataRequestEvent.note`, `resolutionNote`) is entered by staff and is retained.
- The access export omits consent history.
- Erasure also scrubs the generic audit log: `audit_log.changes` for the user's `User`/`StudentProfile` rows and `actor_username` on rows they performed. New audit rows never store the values of personal fields (shown as `[redacted]`), and `DataRequest` is not captured by the generic audit at all.
