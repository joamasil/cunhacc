# Portfolio Site — Design Spec

Date: 2026-09-14

## Summary

A personal portfolio site built with Astro, content-managed via Sanity,
featuring a home page with a project carousel that opens projects in a
shareable overlay popup, plus About and Fun (misc list) pages. Page-level
navigation uses Barba.js for transitions; Lenis provides smooth scrolling
throughout.

## Goals

- Home page: project carousel; clicking a project opens its detail as an
  overlay popup (not a full page navigation) with a shareable, deep-linkable
  URL.
- About page: bio/info.
- Fun page: a simple CMS-managed list of miscellaneous items.
- Smooth-scroll feel (Lenis) and animated page transitions (Barba.js)
  between Home/About/Fun.
- Content managed in Sanity, editable without a redeploy of code.
- Strong baseline on performance, SEO, and accessibility audits.

## Non-goals

- No live draft-preview of unpublished Sanity content (publish-and-rebuild
  is sufficient for this site).
- No automated test suite in the initial build (visual/animation-driven
  site verified manually in-browser).
- No framework component islands (React/Vue/Svelte) — all interactivity is
  hand-written vanilla TypeScript.

## Architecture & Repo Structure

- One repository, two independently-deployable sibling folders, linked via
  lightweight npm workspaces (no monorepo build tooling like Turborepo/Nx —
  unnecessary at this scale):
  - `web/` — the Astro site.
  - `studio/` — the Sanity Studio app.
- `web/` runs Astro in fully static output mode (`output: 'static'`). All
  routes are pre-rendered at build time from content fetched via GROQ
  queries against Sanity.
- `studio/` deploys independently to Sanity's free hosting
  (`<project>.sanity.studio`) via `sanity deploy`. It is not embedded into
  the Astro site.
- Package manager: npm.

### Branching & deployment

- `main` branch → production Netlify site (the live portfolio URL).
- `preview` branch → staging Netlify site (a `*.netlify.app` URL).
- Code workflow: changes land on `preview` first, get reviewed on the
  staging URL, then are merged to `main` for production.
- Content workflow: Sanity's publish webhook triggers a rebuild of the
  **staging site only**. Once new content has been reviewed on staging, a
  production rebuild is triggered manually (a "Trigger deploy" click in
  Netlify, or via merging `preview` → `main`, which also rebuilds
  production against the latest published content). This avoids needing
  two Sanity datasets — both sites always build from the same published
  content, just at different, deliberately-chosen times.

## Interactivity Approach

No React/Vue/Svelte islands are used. All interactive behavior is
hand-written vanilla TypeScript modules, each exposing an explicit
`init()` that the app controls the lifecycle of:

- `lenis.ts` — smooth scroll
- `barba.ts` — page transition orchestration
- `carousel.ts` — home page project carousel
- `project-popup.ts` — project detail overlay
- `nav.ts` — navigation/menu behavior

This is deliberate: Barba replaces page DOM via fetch-and-swap, and
Astro's automatic island hydration does not reliably re-fire against
content swapped in that way. Since Lenis and Barba are vanilla-JS-first
tools anyway, keeping all interactivity vanilla avoids fighting Astro's
hydration model — every module's `init()` re-runs both on initial page
load and from Barba's `afterEnter` hook, so no behavior depends on when or
whether Astro decides to hydrate something.

### Barba.js — page transitions

- Wraps navigation between Home, About, and Fun only.
- Performs enter/exit transition animations using CSS transitions / the
  Web Animations API (no GSAP in the initial build; can be added later if
  the animation needs outgrow WAAPI).
- Configured to skip (via a `data-barba-prevent` attribute) links that
  open the project popup, since those are handled separately.

### Lenis — smooth scroll

- Initialized once globally over `<body>`, persisting across Barba page
  transitions (re-synced, not destroyed/recreated, since it operates above
  the level of any single page's content).
- Disabled/degraded gracefully when the user has `prefers-reduced-motion`
  set.

### Project popup — shareable overlay

- Not a Barba view. It is a self-contained overlay component layered over
  the Home page.
- **Opening**: clicking a project card prevents default navigation, calls
  `history.pushState` to `/work/<slug>`, and plays the popup's open
  animation using that project's data — already inlined in the Home page's
  HTML as a `<script type="application/json">` payload per project, so
  opening requires no network fetch.
- **Closing**: reverses the above — `pushState` back to `/`, plays the
  close animation.
- Browser back/forward (`popstate`) opens/closes the popup to match.
- **Direct/shared links**: `/work/<slug>` is also a real, independently
  pre-rendered Astro page — same Home layout and carousel, but with that
  project's popup already open in the server-rendered HTML. This makes
  shared links work (and be crawlable) even without JS; client-side JS
  then treats it as an already-open popup rather than replaying the open
  animation.
- Accessibility: implemented as a proper modal — `aria-modal`, focus
  trapped while open, focus returned to the triggering element on close,
  closable via Escape, heading structure kept semantic.
- Guards against a stale/invalid slug (e.g., a shared link to a since-removed
  project) by falling back to the closed/home state rather than erroring.

## Sanity Content Model

Schemas live in `studio/schemaTypes/`:

- **`project`** (document): `title`, `slug`, `coverImage` (required `alt`),
  `gallery` (array of images/video, each with required `alt`/caption
  where applicable), `description` (portable text), `year`,
  `role`/`credits` (text), `tags` (array of strings/references),
  `externalLink` (optional url), `order` (number — manual carousel
  sorting).
- **`funItem`** (document): `title`, `description`, `link`/`media`,
  `date`, `type` (tag/category) — a simple CMS-managed list.
- **`about`** (singleton document): bio (portable text), portrait image
  (required `alt`), CV/resume link, social links.
- **`siteSettings`** (singleton document): nav labels, default SEO/OG
  image & description, social links — avoids hardcoding meta defaults
  across pages.

All images require alt text at the schema level (not just by convention),
since this feeds directly into accessibility and SEO.

Data is fetched at Astro build time via `@sanity/client` + GROQ. There is
no runtime/browser-side call to Sanity.

## Build Phasing

To let front-end work start immediately without waiting on Studio setup:

1. Build the Astro site first against static fixture data shaped exactly
   like the schemas above (same field names/shapes), covering Home
   carousel, project popup, About, and Fun pages end-to-end.
2. Set up Sanity Studio and schemas (can happen in parallel or after step 1).
3. Replace the fixture data layer with real `@sanity/client` GROQ queries,
   as a final, mostly mechanical swap — the shape doesn't change, only the
   source.

## Performance, SEO & Accessibility

### Performance

- Images served through Sanity's image CDN with explicit width/height
  (avoids CLS), responsive `srcset`/`sizes`, automatic modern format
  negotiation (webp/avif), lazy-loading below the fold. Cover/hero images
  (likely LCP elements) load with high priority, not lazily.
- Gallery video: muted, `playsinline`, poster image, lazy-loaded — never
  autoplaying full-resolution video on page load.
- If custom fonts are used: self-hosted, `font-display: swap`, critical
  font preloaded. System fonts sidestep this entirely.
- JS payload stays minimal by construction (static Astro output, no
  framework runtime); Barba/Lenis load as deferred modules so they never
  block first paint.
- `prefers-reduced-motion` is respected across Lenis, Barba transitions,
  and the popup's animation.

### SEO

- Every route (Home, About, Fun, each `/work/<slug>`) gets a unique
  `<title>`, meta description, canonical URL, and Open Graph/Twitter card
  tags (project pages use the project's cover image) — important since
  project links are meant to be shared.
- `@astrojs/sitemap` for an auto-generated sitemap, plus `robots.txt`.
- Basic JSON-LD (Person schema on About, CreativeWork schema on projects).
- All routes are genuinely server-rendered per-URL (static output), so
  crawlers see full content regardless of client-side Barba/JS routing.

### Accessibility

- Required `alt` text enforced at the Sanity schema level for all images.
- Project popup behaves as a proper modal (see above).
- Color contrast and focus-visible states verified once real visual
  design is applied.

## Error Handling

- Build-time failures (missing required Sanity fields, broken image
  references) fail the build loudly rather than shipping broken pages.
- Runtime: the popup module falls back to closed/home state on an
  invalid/stale project slug instead of throwing.

## Testing

- No automated test suite in the initial build. This is a visual,
  animation-driven site where correctness is largely experiential;
  verification is manual, in a real browser, covering carousel, popup
  open/close (including direct-link and back/forward behavior), Barba
  transitions, and Lenis scroll feel across desktop and mobile widths.
- Automated coverage (e.g., Playwright smoke tests for routing/popup
  state) can be added later as a follow-up, not part of this initial
  build.

## Open Items For Follow-up (not blocking this spec)

- Actual visual design — user has references/Figma to share separately;
  this spec covers structure/architecture, not final visuals.
- Whether GSAP gets added later if CSS/WAAPI transitions prove
  insufficient for desired animation complexity.
