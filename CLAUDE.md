# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project overview

Angular 21 frontend (`developteca-web`) for Developteca, a public dev blog: public article browsing, comments/ratings for registered users, an admin dashboard, and a newsletter. Standalone components, Angular Signals, zoneless change detection, lazy-loaded routes. Consumes the `developteca-api` Spring Boot backend (sibling repo, see `../../api/developteca-api/CLAUDE.md`).

## Commands

```bash
# Run dev server
ng serve

# Build
ng build

# Run unit tests
ng test

# Generate a component/guard/service without spec files
ng generate component <path> --skip-tests
ng generate guard <path> --skip-tests
```

## Architecture

- **Standalone components only** — no NgModules.
- **Angular Signals** for component/service state, not RxJS `BehaviorSubject`.
- **Zoneless change detection** — `app.config.ts` must use `provideZonelessChangeDetection()`. Using `provideZoneChangeDetection()` instead throws `NG0908` at runtime (Angular 21 scaffolds new projects without `zone.js` by default).
- **Lazy loading** — routes use `loadComponent`, not eagerly imported components.
- **Folder structure**:
  - `core/` — `services/`, `guards/`, `interceptors/`, `models/`
  - `shared/components/` — reusable components (e.g. `article-card`)
  - `features/public|auth|admin/` — page-level components grouped by area

## Design tokens

`src/styles.scss` defines the whole palette, radius scale and shadow scale as **CSS custom properties on `:root`** — deliberately not SCSS variables. Custom properties inherit through the DOM, so every component uses them with zero imports; SCSS variables would need a `@use` line in each `.scss` and one omission silently reintroduces hardcoded values. They're also runtime, so a future dark mode is just redefining the tokens under `@media (prefers-color-scheme: dark)`.

**No component `.scss` should contain a raw hex color, a literal `border-radius` size, or a `box-shadow` value.** Use `var(--color-*)`, `var(--radius-*)`, `var(--shadow-*)`. Spacing (`padding`, `gap`, `margin`) is deliberately *not* tokenized — it legitimately varies per component and forcing a scale there adds noise without consistency gains.

This was retrofitted after two generations of components had drifted apart: the earlier ones (`article-card`, `home`, `article-list`) used indigo-500 `#6366f1` and slate-900 `#0f172a`, while later ones used indigo-600 `#4f46e5` and slate-800 `#1e293b` — so the navbar and the pagination buttons were visibly different indigos. Radii had the same problem in two notations (`0.5rem` and `8px` are the same 8px). Everything is consolidated now; verify with `grep -rn "#[0-9a-fA-F]\{3,6\}" src/ --include=*.scss`, which should match only `styles.scss`.

## Angular 21 naming gotcha

The CLI no longer appends a `.component` suffix to filenames or class names. `home.component.ts` / `HomeComponent` is now `home.ts` / `Home`. Applies to every generated artifact (components, guards, services, etc.) — don't manually add the old-style suffix when writing reference code.

## Backend integration

- API base: `http://localhost:8080/api/v1`.
- All backend responses are wrapped in an `ApiResponse` envelope (`success`, `message`, `data`, `timestamp`, `errors`).
- Auth is JWT bearer. `authInterceptor` (`core/interceptors/auth.interceptor.ts`) attaches the token — it only works if registered in `app.config.ts` via `provideHttpClient(withInterceptors([authInterceptor]))`. Forgetting this causes silent 401s on protected endpoints with no compile error.
- `AuthService` holds the current user as a signal, persisted to `localStorage`.
- Article endpoints: `GET /articles` (paginated, public), `GET /articles/{slug}` (public), `POST/PUT/DELETE /articles*` (auth), `GET /articles/stats/dashboard` (auth, admin dashboard metrics — already implemented backend-side).

## Working methodology (important — read before writing code here)

The user is learning Angular hands-on and is intermediate level. Claude acts as an **instructor/guide**: explain the concept, give reference code, and let the user implement it themselves in their own editor. Work through one phase ("sesión") at a time — the user implements, compiles/tests, and confirms before moving to the next phase. Don't bundle multiple phases into one response or skip ahead.

**Before resuming work after any gap in the conversation, verify the actual files on disk** (find/read) rather than trusting this document's "done" status below — previously instructed changes (a whole login page, a guard, a navbar) were narrated as complete but never actually saved to disk before a migration, and the gap wasn't caught until files were checked directly.

## Implementation status (source of truth: verified on disk 2026-09-17)

### Done — Bloque A: publishing from the web (admin area)
Until this, the backend's full article CRUD had no UI — publishing was Insomnia-only.
- `ArticleService` gained `listForManagement`, `getForEdit`, `create`, `update`, `delete`, `uploadImage`, `deleteImage`; models gained `ArticleCreateRequest` (`status` optional, backend defaults `DRAFT`) and `ArticleUpdateRequest` (`status` required — mirrors the backend's `@NotNull`).
- `uploadImage` sends `FormData` **without** a `Content-Type` header on purpose: the browser must generate the multipart boundary itself. Setting the header manually yields a 400 even with a valid file.
- `features/admin/article-manage` (`/admin/articulos`) — table of all statuses via `GET /articles/manage`, status filter, native `confirm()` before delete (deletion also removes image files server-side).
- `features/admin/article-editor` — one component for `/admin/articulos/nuevo` and `/admin/articulos/editar/:id`; mode is decided by the presence of `:id` (`route.snapshot`, since you never navigate editor→editor). After **create** it redirects to `/editar/:id` rather than the list, because image upload needs a persisted `articleId`. Uses `[ngValue]` for `categoryId` so the model keeps a `number`, not `"1"`.
- `features/admin/article-image-manager` — rendered **outside** the editor's `<form>` (nested forms are invalid HTML; the inner submit would trigger the outer save). Validates type/size client-side for UX; the backend remains the real gate. Uploading is **additive** — a new image never replaces an old one; each card has its own delete.
- Navbar admin link is labeled "Gestionar" to avoid two "Artículos" entries.
- Added `--color-success` / `--color-success-surface` tokens for the status badges.
- Pending nicety: no button to mark an *existing* image as featured (backend has no endpoint for it) — delete and re-upload for now.

### Done — Sprint 4 (Comments & Ratings)
- `core/models/comment.model.ts` (`Comment` with recursive `replies`, `CommentCreateRequest`, `CommentStatus`) and `core/models/rating.model.ts` (`RatingResponse` with nullable `myRating`) — both reuse `Author` from `article.model.ts`
- `core/services/comment.service.ts` and `core/services/rating.service.ts` — unlike `ArticleService`/`StatsService`, these take `articleId` per method because the endpoints are nested under an article (`/articles/{articleId}/comments`)
- `shared/components/comment-item` — **recursive component**: renders its own selector for nested replies via `imports: [forwardRef(() => CommentItem)]` (a plain `imports: [CommentItem]` fails with "used before its declaration"). It's presentational only: emits `replyRequested`/`deleteRequested` and re-emits children's events upward, so all HTTP lives in the container.
- `shared/components/comment-section` — container: loads the tree, hosts the new-comment form (`ngModel`), tracks `replyingTo`, handles create/delete. After a create or delete it **reloads the whole list** rather than mutating the signal locally — the backend builds the nesting, so replicating that client-side would duplicate logic.
- `shared/components/article-rating` — star selector. Takes both `articleId` and `initialAverage`: `/ratings/me` requires auth, so anonymous visitors fall back to the average already present on the article payload.
- All three wired into `features/public/article-detail`; the duplicate `★ averageRating` span was removed from the article `.meta` row since the rating component now owns that display (and keeps it live after voting).
- **Inline admin moderation**: `comment-section` passes `includeRejected: authService.isAdmin()` to `CommentService.list()`, so admins see hidden comments greyed out with an "Oculto" badge and a Restaurar/Ocultar toggle. `comment-item` emits `moderateRequested` with just the comment — the container derives the target status from `comment.status`, keeping the item component free of moderation state logic.
- `core/services/category.service.ts` + `categories` signal in `article-list`: the category `<select>` is now populated from `GET /api/v1/categories` instead of hardcoded slugs.

### Done — Sprint 3 complete
- **Sesión/Fase 1** — Project setup (`ng new developteca-web --routing --style=scss --ssr=false`)
- **Fase 2-3** — HTTP services + models: `AuthService`, `ArticleService`, `StatsService`, `authInterceptor` (registered via `provideHttpClient(withInterceptors([authInterceptor]))` in `app.config.ts`)
- `app.config.ts` — `provideZonelessChangeDetection()` (fixed from the zone-based scaffold default)
- **Fase 4 — Login** (`features/auth/login`) — rebuilt from scratch after being lost in the pre-migration environment
- **`core/guards/auth-guard.ts`** — `CanActivateFn`, checks `isAuthenticated() && isAdmin()`, redirects to `/login`
- **Navbar** (`shared/components/navbar`), wired into `app.html`/`app.ts` (scaffold placeholder removed)
- **`app.routes.ts`** — `''` (Home), `articulos`, `articulos/:slug`, `login`, `admin/dashboard` (guarded), wildcard → home
- **Fase 5** — Home page (`features/public/home`)
- **Fase 6** — Article list (`features/public/article-list`): pagination, 400ms debounced search, category filter (hardcoded slugs)
- **Article detail** (`features/public/article-detail`) — reads `:slug` via `ActivatedRoute.paramMap`, renders content as plain text (`pre-wrap`, no `innerHTML`)
- **Fase 8 — Admin dashboard** (`features/admin/dashboard`), backed by `StatsService` / `GET /articles/stats/dashboard`
- `shared/components/article-card`
- Full navigation manually tested: Home → Artículos → Detalle, and Login → Dashboard (admin)

### Fixed along the way
- `core/models/dashboard-stats.model.ts` had typos not matching the backend DTO (`draftArticle`/`archivedArticle` missing the `s`, `totsalViews` misspelled) — silently would have rendered `undefined`. Corrected to match `DashboardStatsResponse.java` exactly (`draftArticles`, `archivedArticles`, `totalViews`).

### Not started
- Sprint 5 — Newsletter (double opt-in, mass send)
- Sprint 6 — Super Admin user management, extended stats, formal testing, deploy
- Fase 10 — Formal manual end-to-end test pass
- "Artículos destacados" on Home has no real criterion yet (same query as "últimos")

## Related docs

- Backend: `../../api/developteca-api/CLAUDE.md`
- Full migration narrative (older session detail — cross-check against this file's Implementation status before trusting any "completado" claim): `../../CONTEXTO DEL PROYECTO — DEVELOPTE.txt`
