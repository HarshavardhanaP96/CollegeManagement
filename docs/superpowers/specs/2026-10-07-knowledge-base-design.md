# Knowledge Base — Design Spec

Date: 2026-10-07

## Purpose

Give every user of the CollegeManagement application (across all roles and all
college tenants) a self-serve, in-app knowledge base explaining **how to use
the application** — not academic/syllabus content. Today the only self-serve
surface is `SupportController`, which just forwards a contact form to Discord
with nothing persisted or searchable. This feature adds a real, searchable
help-article library that reduces the volume of those support submissions.

## Scope

- In scope: browsing/searching articles, categories, draft→publish workflow,
  "was this helpful?" feedback, role-targeted visibility of articles.
- Out of scope: per-college/tenant content variation, authoring by any role
  other than superadmin, rich media uploads (images/video) in article bodies
  (first version is markdown/plain text), replacing or touching
  `SupportController` (left as-is; KB and Support remain separate, parallel
  features).

## Roles

- **Author/publisher:** `SUPERADMIN` only. Collegeadmin, hod, teacher, student,
  edgepoint are all read-only consumers.
- **Readers:** every authenticated user, regardless of role or college tenant,
  sees the same global article set (filtered by the article's
  `visibleRoles`, if set).

## Data model

Global (non-tenant: no `college_id` on any table — content applies to every
college in the system). New Flyway migration
`V4__add_knowledgebase_schema.sql`.

### `kb_categories`
| column | type | notes |
|---|---|---|
| id | bigint PK | |
| name | varchar | e.g. "Getting Started", "Attendance", "Exams", "Billing" |
| slug | varchar unique | URL-friendly identifier |
| display_order | int | controls ordering in the category list |

### `kb_articles`
| column | type | notes |
|---|---|---|
| id | bigint PK | |
| category_id | bigint FK → kb_categories | |
| title | varchar | |
| slug | varchar unique | |
| body | text | markdown |
| status | varchar | `DRAFT` \| `PUBLISHED` \| `ARCHIVED` |
| visible_roles | varchar (comma-separated role codes), nullable | NULL/empty = visible to all roles |
| created_by | int FK → users | |
| published_at | timestamp, nullable | set when status transitions to PUBLISHED |
| helpful_count | int default 0 | denormalized counter, updated on feedback |
| unhelpful_count | int default 0 | denormalized counter, updated on feedback |
| + audit columns | from `AuditableEntity` | created_at/updated_at etc., existing convention |

### `kb_article_feedback`
| column | type | notes |
|---|---|---|
| id | bigint PK | |
| article_id | bigint FK → kb_articles | |
| user_id | int FK → users | |
| is_helpful | boolean | |
| unique constraint | (article_id, user_id) | re-voting updates the existing row rather than inserting a duplicate |

## Backend module layout

New top-level module `com.edgepoint.knowledgebase`, mirroring the existing
`notification` module's package shape:

```
knowledgebase/
  domain/      KbCategory, KbArticle, KbArticleFeedback (+ ArticleStatus enum)
  dto/         KbCategoryDto/Request, KbArticleDto/Request, KbFeedbackRequest
  repository/  KbCategoryRepository, KbArticleRepository, KbArticleFeedbackRepository
  service/     KnowledgeBaseService (reader queries + visibility filtering),
               KnowledgeBaseAdminService (CRUD + status transitions)
  controller/  KnowledgeBaseController (public/reader), KnowledgeBaseAdminController (superadmin)
```

## API

Reader endpoints, `/knowledgebase`, any authenticated user:
- `GET /knowledgebase/categories` — list categories.
- `GET /knowledgebase/articles?category=&q=` — list/search published articles
  visible to the caller's role.
- `GET /knowledgebase/articles/{slug}` — article detail.
- `POST /knowledgebase/articles/{id}/feedback` — upsert the caller's
  helpful/unhelpful vote.

Admin endpoints, `/knowledgebase/admin`, `@PreAuthorize("hasRole('SUPERADMIN')")`:
- `POST /categories`, `PUT /categories/{id}`, `DELETE /categories/{id}`
- `POST /articles`, `PUT /articles/{id}` (includes status transitions
  draft→published→archived), `DELETE /articles/{id}`
- `GET /articles/{id}/feedback-summary` — aggregate helpful/unhelpful counts

## Frontend

- `frontend/src/api/knowledgebase.ts` — client functions, same shape as
  `support.ts` / `notificationConfig.ts`.
- Reader UI: `frontend/src/pages/knowledgebase/` (new top-level section, not
  nested under a role folder since the page is identical for every role) —
  category list → article list with search → article detail with
  helpful/not-helpful buttons.
- Mounted at a single shared route `/knowledgebase` in
  `frontend/src/routes/index.tsx`, guarded only by "is authenticated" (no
  specific role required).
- Author UI: `frontend/src/pages/superadmin/KnowledgeBaseListPage.tsx`
  (manage categories + articles, draft/publish/archive toggle) and
  `KnowledgeBaseEditorPage.tsx` (create/edit article), following the existing
  superadmin page conventions.

## Error handling

- Non-superadmin hitting `/knowledgebase/admin/*` → 403, handled by Spring
  Security's existing `@PreAuthorize` convention (same as other admin-only
  controllers).
- Reader requesting an article outside their role's visibility, or a
  draft/archived article → 404 (not 403, to avoid leaking the existence of
  restricted content).
- Duplicate feedback vote → upsert (update existing row), not an error.

## Testing

- Backend unit tests (`KnowledgeBaseService`): role-based visibility
  filtering, status filtering (readers never see draft/archived), feedback
  upsert-not-duplicate behavior.
- Backend controller tests: 403 on admin endpoints for non-superadmin roles;
  200 + correct filtering on reader endpoints across a couple of role/article
  combinations.
- Frontend component tests: article list search/filter, helpful/unhelpful
  button toggling and re-vote behavior.

## Rollout

- Single Flyway migration adds the three tables; no backfill needed, no
  feature flag — an empty KB simply renders "no articles yet" on the reader
  page.
- After deploy, superadmin manually authors the first batch of articles
  (e.g. Getting Started, Attendance, Exams, Billing categories as seeded in
  the design above — actual seed content is out of scope for this spec).
