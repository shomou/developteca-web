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

**Typography:** the whole site is monospace by design — JetBrains Mono, self-hosted via `@fontsource/jetbrains-mono` (weights 400/400i/500/600/700 listed in `angular.json` `styles`, not fetched from Google). `--font-mono`, `--font-body` and `--font-heading` are tokens; today body and heading both resolve to mono. If long-form prose ever feels tiring, point `--font-body` at a sans stack — one line, no component changes. `html { font-size: 15px }` compensates for mono's wider glyphs. `button, input, select, textarea { font-family: inherit }` is required: form controls never inherit the page font on their own.

**Markdown rendering (`shared/pipes/markdown.pipe.ts`):** `marked` + `marked-highlight` + `highlight.js/lib/core` with only the languages the blog uses registered (the full `highlight.js` import is ~1MB). **`plaintext` must stay registered** — it's the fallback for fences with no language or an unknown one; without it `hljs.highlight` throws `Unknown language: "plaintext"`, the pipe throws, and the entire article body renders blank with no on-screen error (this happened). The pipe returns a plain `string` and relies on Angular's `[innerHTML]` sanitizer — do not `bypassSecurityTrustHtml`; the sanitizer keeps `class` attributes so highlighting survives. Rendered-content styles live in the **global** `.markdown-body` block in `styles.scss`, because injected HTML lacks Angular's `_ngcontent` attributes and component-scoped styles can't reach it.

**Code blocks are dark on a light page, by design.** `pre` takes `--color-code-bg` (`#0f172a`, the same slate-900 the hero gradient starts from, so it reads as brand rather than generic black). **No highlight.js theme file is loaded** — the syntax palette is a set of `--code-*` tokens in `styles.scss` mapped to `.hljs-*` scopes under `.markdown-body pre`. This was a deliberate move away from `github-dark.css`: every token was checked against `--color-code-bg` at ≥ 6.9:1 (AA needs 4.5), the colors come from the same Tailwind families as the rest of the tokens, and — the practical win — palette changes hot-reload instead of needing an `ng serve` restart for `angular.json`. If a language's tokens ever look wrong, add its `.hljs-*` scope to the mapping rather than reintroducing a theme file. Inline `code` in prose stays light (`--color-surface-sunken`) on purpose; dark pills inside light paragraphs read as heavy.

**Tables** share the same dark header (`--color-code-bg` / `--color-code-text`) so they sit in the same visual family as code blocks, with zebra rows and a rounded, bordered container. They use `border-collapse: separate; border-spacing: 0` rather than `collapse` — `border-radius` is silently ignored on a collapsed table, so the rounded corners only work this way, with cell borders drawn per-side (`border-top` on `td`, `border-left` on `th + th` / `td + td`).

**Verifying `.markdown-body` styles without the app:** `ng serve` can't be used from a second port (backend CORS allows only 4200/3000) and local-file previews are static snapshots. The workaround that works: `ng build`, then generate an HTML page that inlines `dist/.../styles.css` and a `marked`-rendered sample, and serve it with `python3 -m http.server` on a spare port.

**PeopleCode has a custom grammar** (`shared/pipes/peoplecode.language.ts`, registered in the pipe as `peoplecode`, aliases `pcode`/`peoplesoft`) — highlight.js doesn't ship one. It's `case_insensitive` with `$pattern: /[A-Za-z_][\w-]*/` so hyphenated keywords (`End-If`, `When-Other`) match as one token. **A word may appear in only one keyword list**: with case-insensitivity, `string` (type) and `String()` (function) are the same token and the wrong list wins silently — this is why `String`/`Date`/`Time` are absent from `BUILT_INS` and `Value`/`Repeat`/`Throw` live in a single list each. When adding words, check for cross-list collisions first. Covers `&vars`, `%SystemVars`, `Record.X`-style definition references (`symbol`), `/* */`, `<* *>`, `/+ +/` and `REM ...;` comments, `""`-escaped strings, and `Function`/`Method`/`Class` names. Test grammar changes outside Angular with `node --experimental-strip-types` (Node 24 runs the `.ts` directly).

**`angular.json` edits are not hot-reloaded.** Adding a stylesheet to `styles` (theme, fonts) only takes effect after restarting `ng serve` — the symptom is code blocks with correct `hljs-*` classes but no colors, or the font silently not loading. Installing new npm packages while `ng serve` runs also leaves Vite with a stale dep cache (`504 Outdated Optimize Dep`); a restart fixes both.

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
- **A6 — Markdown:** article `content` is Markdown, rendered in `article-detail` via `[innerHTML]="content | markdown"` and previewable in the editor ("Vista previa" toggle, same pipe). The backend strips Markdown syntax when building the card `excerpt` (`MarkdownUtil.toPlainText`). Authoring note: don't start the body with a `## <title>` heading — the page already renders `article.title` as the `<h1>`, so it shows twice.

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
