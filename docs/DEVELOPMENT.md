# Development

Like `OPERATIONS.md` used to be, this was a frozen copy-paste of four other docs (each marked
with a `<!-- Source: -->` comment) that drifted out of sync with the standalone originals —
most visibly, it still described a Liquibase-based migration system that was never actually
implemented, well after the standalone `DatabaseMigration.md` was corrected to describe the
real Flyway setup. Fixed the same way `OPERATIONS.md` was: removed the duplication instead of
re-syncing it.

| Topic | Doc |
|---|---|
| Coding standards, API design conventions, testing/migration guidelines | [Developer-Guide.md](Developer-Guide.md) |
| Backend package layout, config files, baseline schema vs. Flyway | [ProjectStructure.md](ProjectStructure.md) |
| Flyway migrations: what's there, how to write a new one | [DatabaseMigration.md](DatabaseMigration.md) |
| Frontend architecture/implementation notes | [FRONTEND_IMPLEMENTATION_SUMMARY.md](FRONTEND_IMPLEMENTATION_SUMMARY.md) |

See also [devsetup.md](devsetup.md) for the quick local compose commands and
[docs/foundations/architecture.md](foundations/architecture.md) for the system-level picture.
