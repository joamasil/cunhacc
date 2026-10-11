# Portfolio Site Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the portfolio site described in the spec — Astro front-end with a Home project carousel + shareable popup, About and Fun pages, Barba.js transitions, Lenis smooth scroll — first against fixture data, then wired to a real Sanity Studio + content, deployed to Netlify with a staging/production split.

**Architecture:** Two sibling packages in an npm-workspaces monorepo: `web/` (Astro, static output) and `studio/` (Sanity Studio, deployed independently). All interactivity in `web/` is hand-written vanilla TypeScript modules with explicit `init()` lifecycles (no framework islands), so behavior doesn't depend on Astro's hydration timing and re-runs cleanly after Barba swaps page content. A `lib/content.ts` data-access layer sits between pages and their data source; it starts backed by static fixtures and later swaps internals to real Sanity GROQ queries without changing any call site.

**Tech Stack:** Astro (static output), TypeScript (strict), Barba.js, Lenis, Sanity + `@sanity/client` + `@sanity/image-url`, `@astrojs/sitemap`, Netlify.

**Spec:** `docs/superpowers/specs/2026-09-14-portfolio-site-design.md`

## Global Constraints

- Package manager: npm (not pnpm/yarn).
- `web/` runs Astro in fully static output mode (`output: 'static'`); no SSR adapter.
- No React/Vue/Svelte component islands — all interactivity is vanilla TypeScript modules with an explicit `init()`.
- Barba.js handles transitions between Home/About/Fun only; the project popup is never a Barba view and uses `data-barba-prevent` to opt its links out of Barba's click interception.
- Lenis is initialized once globally and persists across Barba transitions (resynced via `resize()`, never destroyed/recreated on navigation).
- Every image requires `alt` text, enforced at the Sanity schema level once Studio exists.
- All animated/transitioning behavior (Lenis, Barba transitions, popup open/close) must degrade to near-instant when `prefers-reduced-motion: reduce` is set.
- No automated test framework in this build. Each task is verified by (a) `npx astro check` passing with no type errors, and (b) a concrete manual check in a running dev server (`npm run dev`), as specified per task.
- Branches: `main` → production Netlify site; `preview` → staging Netlify site. Sanity's publish webhook rebuilds staging only; production rebuilds on manual trigger or merge to `main`.

---

## File Structure Overview

```
cunhacc/
  package.json                     # root workspaces
  netlify.toml
  web/
    astro.config.mjs
    tsconfig.json
    package.json
    public/robots.txt
    src/
      layouts/BaseLayout.astro
      components/
        Seo.astro
        JsonLd.astro
        Nav.astro
        ProjectCarousel.astro
        ProjectPopup.astro
      pages/
        index.astro
        about.astro
        fun.astro
        work/[slug].astro
      lib/
        types.ts
        content.ts
        sanity.ts                  # added in Task 14
        sanityImage.ts              # added in Task 14
        fixtures/
          projects.ts
          about.ts
          funItems.ts
          siteSettings.ts
      scripts/
        main.ts
        lenis.ts
        nav.ts
        carousel.ts
        project-popup.ts
        barba.ts
      styles/
        global.css
  studio/
    package.json
    sanity.config.ts
    schemaTypes/
      index.ts
      project.ts
      funItem.ts
      about.ts
      siteSettings.ts
```

---

### Task 1: Monorepo & Astro Scaffold

**Files:**
- Create: `package.json` (root)
- Create: `.gitignore` (modify if exists)
- Create: `web/` via Astro scaffold command (package.json, astro.config.mjs, tsconfig.json, src/pages/index.astro placeholder, etc.)

**Interfaces:**
- Produces: a working `web/` Astro project runnable via `npm run dev`/`npm run build` from the repo root through workspaces.

- [ ] **Step 1: Scaffold the Astro project**

```bash
npm create astro@latest web -- --template minimal --typescript strict --no-install --no-git --yes
```

- [ ] **Step 2: Create the root workspace package.json**

```json
{
  "name": "cunhacc",
  "private": true,
  "workspaces": ["web", "studio"]
}
```

- [ ] **Step 3: Update `.gitignore`**

Add (if not already present):

```
node_modules/
dist/
.astro/
.env
.env.*
!.env.example
```

- [ ] **Step 4: Set the site URL in `web/astro.config.mjs`**

```js
import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://example.com',
});
```

- [ ] **Step 5: Install dependencies and verify**

```bash
npm install
cd web && npm run dev
```

Expected: dev server starts on `http://localhost:4321` and shows the default Astro minimal template page with no console errors. Stop the server, then run:

```bash
npm run build
```

Expected: build succeeds with no errors.

- [ ] **Step 6: Commit**

```bash
git add package.json .gitignore web
git commit -m "chore: scaffold Astro app in web/ workspace"
```

---

### Task 2: Shared Types & Fixture Content Layer

**Files:**
- Create: `web/src/lib/types.ts`
- Create: `web/src/lib/fixtures/projects.ts`
- Create: `web/src/lib/fixtures/about.ts`
- Create: `web/src/lib/fixtures/funItems.ts`
- Create: `web/src/lib/fixtures/siteSettings.ts`
- Create: `web/src/lib/content.ts`

**Interfaces:**
- Produces: `Project`, `FunItem`, `About`, `SiteSettings`, `SanityImage` types; `getProjects()`, `getProjectBySlug(slug)`, `getFunItems()`, `getAbout()`, `getSiteSettings()` async functions, all exported from `web/src/lib/content.ts`.
- Consumes: nothing (first data-layer task).

- [ ] **Step 1: Write `web/src/lib/types.ts`**

```ts
export interface SanityImage {
  url: string;
  alt: string;
  width: number;
  height: number;
}

export interface Project {
  slug: string;
  title: string;
  coverImage: SanityImage;
  gallery: SanityImage[];
  description: string;
  year: number;
  role: string;
  tags: string[];
  externalLink?: string;
  order: number;
}

export interface FunItem {
  title: string;
  description: string;
  link?: string;
  date: string;
  type: string;
}

export interface SocialLink {
  label: string;
  url: string;
}

export interface About {
  bio: string;
  portrait: SanityImage;
  resumeUrl?: string;
  socialLinks: SocialLink[];
}

export interface SiteSettings {
  navLabels: { home: string; about: string; fun: string };
  defaultSeo: { title: string; description: string; ogImage: SanityImage };
  socialLinks: SocialLink[];
}
```

- [ ] **Step 2: Write `web/src/lib/fixtures/projects.ts`**

```ts
import type { Project } from '../types';

export const projects: Project[] = [
  {
    slug: 'first-project',
    title: 'First Project',
    coverImage: {
      url: 'https://placehold.co/1200x800',
      alt: 'Cover image for First Project',
      width: 1200,
      height: 800,
    },
    gallery: [],
    description: 'A short description of the first project.',
    year: 2024,
    role: 'Design & Development',
    tags: ['branding', 'web'],
    order: 0,
  },
  {
    slug: 'second-project',
    title: 'Second Project',
    coverImage: {
      url: 'https://placehold.co/1200x800',
      alt: 'Cover image for Second Project',
      width: 1200,
      height: 800,
    },
    gallery: [],
    description: 'A short description of the second project.',
    year: 2023,
    role: 'Art Direction',
    tags: ['identity'],
    order: 1,
  },
];
```

- [ ] **Step 3: Write `web/src/lib/fixtures/about.ts`**

```ts
import type { About } from '../types';

export const about: About = {
  bio: "<p>Hi, I'm Joana — a designer/developer building things on the internet.</p>",
  portrait: {
    url: 'https://placehold.co/800x1000',
    alt: 'Portrait photo',
    width: 800,
    height: 1000,
  },
  resumeUrl: undefined,
  socialLinks: [
    { label: 'Instagram', url: 'https://instagram.com' },
    { label: 'Email', url: 'mailto:hello@example.com' },
  ],
};
```

- [ ] **Step 4: Write `web/src/lib/fixtures/funItems.ts`**

```ts
import type { FunItem } from '../types';

export const funItems: FunItem[] = [
  {
    title: 'Weeknight playlist',
    description: 'A playlist I keep coming back to while working.',
    link: 'https://example.com/playlist',
    date: '2026-01-15',
    type: 'music',
  },
  {
    title: 'Small experiment',
    description: 'A tiny generative sketch made one weekend.',
    date: '2025-11-02',
    type: 'experiment',
  },
];
```

- [ ] **Step 5: Write `web/src/lib/fixtures/siteSettings.ts`**

```ts
import type { SiteSettings } from '../types';

export const siteSettings: SiteSettings = {
  navLabels: { home: 'Work', about: 'About', fun: 'Fun' },
  defaultSeo: {
    title: 'Joana Cunha — Portfolio',
    description: 'Design & development portfolio.',
    ogImage: {
      url: 'https://placehold.co/1200x630',
      alt: 'Site preview image',
      width: 1200,
      height: 630,
    },
  },
  socialLinks: [{ label: 'Instagram', url: 'https://instagram.com' }],
};
```

- [ ] **Step 6: Write `web/src/lib/content.ts`**

```ts
import type { About, FunItem, Project, SiteSettings } from './types';
import { projects } from './fixtures/projects';
import { about } from './fixtures/about';
import { funItems } from './fixtures/funItems';
import { siteSettings } from './fixtures/siteSettings';

export async function getProjects(): Promise<Project[]> {
  return [...projects].sort((a, b) => a.order - b.order);
}

export async function getProjectBySlug(slug: string): Promise<Project | null> {
  const all = await getProjects();
  return all.find((project) => project.slug === slug) ?? null;
}

export async function getFunItems(): Promise<FunItem[]> {
  return funItems;
}

export async function getAbout(): Promise<About> {
  return about;
}

export async function getSiteSettings(): Promise<SiteSettings> {
  return siteSettings;
}
```

- [ ] **Step 7: Verify with the type checker**

```bash
cd web && npx astro check
```

Expected: no type errors.

- [ ] **Step 8: Commit**

```bash
git add web/src/lib
git commit -m "feat: add shared content types and fixture-backed content layer"
```

---

### Task 3: Base Layout, SEO Component, Global Styles, Stub Pages

**Files:**
- Create: `web/src/layouts/BaseLayout.astro`
- Create: `web/src/components/Seo.astro`
- Create: `web/src/styles/global.css`
- Modify: `web/src/pages/index.astro` (replace scaffold default)
- Create: `web/src/pages/about.astro` (stub)
- Create: `web/src/pages/fun.astro` (stub)

**Interfaces:**
- Produces: `BaseLayout.astro` accepting `{ title, description, canonicalPath, ogImage?, bodyClass? }`, rendering a `nav` slot and a default slot inside a Barba wrapper/container (`[data-barba="wrapper"]` / `[data-barba="container"]`).
- Consumes: nothing yet (pages pass static strings; real data wired in later tasks).

- [ ] **Step 1: Write `web/src/styles/global.css`**

```css
:root {
  color-scheme: light dark;
}

* {
  box-sizing: border-box;
}

body {
  margin: 0;
  font-family: system-ui, sans-serif;
}

.project-popup {
  position: fixed;
  inset: 0;
  overflow-y: auto;
  background: canvas;
  padding: 2rem;
}

.project-popup[hidden] {
  display: none;
}

body.popup-open {
  overflow: hidden;
}

@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

- [ ] **Step 2: Write `web/src/components/Seo.astro`**

```astro
---
interface Props {
  title: string;
  description: string;
  canonicalPath: string;
  ogImage?: string;
}
const { title, description, canonicalPath, ogImage } = Astro.props;
const canonicalUrl = new URL(canonicalPath, Astro.site);
---
<title>{title}</title>
<meta name="description" content={description} />
<link rel="canonical" href={canonicalUrl} />
<meta property="og:title" content={title} />
<meta property="og:description" content={description} />
<meta property="og:url" content={canonicalUrl} />
{ogImage && <meta property="og:image" content={ogImage} />}
<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:title" content={title} />
<meta name="twitter:description" content={description} />
{ogImage && <meta name="twitter:image" content={ogImage} />}
```

- [ ] **Step 3: Write `web/src/layouts/BaseLayout.astro`**

```astro
---
import Seo from '../components/Seo.astro';
import '../styles/global.css';

interface Props {
  title: string;
  description: string;
  canonicalPath: string;
  ogImage?: string;
  bodyClass?: string;
}
const { title, description, canonicalPath, ogImage, bodyClass } = Astro.props;
const namespace = canonicalPath === '/' ? 'home' : canonicalPath.replace(/\//g, '-').replace(/^-/, '');
---
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <Seo title={title} description={description} canonicalPath={canonicalPath} ogImage={ogImage} />
  </head>
  <body class={bodyClass}>
    <div data-barba="wrapper">
      <slot name="nav" />
      <main data-barba="container" data-barba-namespace={namespace}>
        <slot />
      </main>
    </div>
    <script type="module" src="/src/scripts/main.ts"></script>
  </body>
</html>
```

- [ ] **Step 4: Replace `web/src/pages/index.astro`**

```astro
---
import BaseLayout from '../layouts/BaseLayout.astro';
---
<BaseLayout title="Joana Cunha — Portfolio" description="Design & development portfolio." canonicalPath="/">
  <h1>Home (coming soon)</h1>
</BaseLayout>
```

- [ ] **Step 5: Create `web/src/pages/about.astro`**

```astro
---
import BaseLayout from '../layouts/BaseLayout.astro';
---
<BaseLayout title="About — Joana Cunha" description="About Joana Cunha." canonicalPath="/about">
  <h1>About (coming soon)</h1>
</BaseLayout>
```

- [ ] **Step 6: Create `web/src/pages/fun.astro`**

```astro
---
import BaseLayout from '../layouts/BaseLayout.astro';
---
<BaseLayout title="Fun — Joana Cunha" description="Fun things." canonicalPath="/fun">
  <h1>Fun (coming soon)</h1>
</BaseLayout>
```

- [ ] **Step 7: Verify**

```bash
cd web && npx astro check && npm run dev
```

Manually visit `http://localhost:4321/`, `/about`, `/fun` — each renders its heading, has a `<title>` tag matching the page, and view-source shows the canonical `<link>` and OG meta tags.

- [ ] **Step 8: Commit**

```bash
git add web/src/layouts web/src/components/Seo.astro web/src/styles web/src/pages
git commit -m "feat: add base layout, SEO component, and stub pages"
```

---

### Task 4: Nav Component + Script Entry Point

**Files:**
- Create: `web/src/components/Nav.astro`
- Create: `web/src/scripts/nav.ts`
- Create: `web/src/scripts/main.ts`
- Modify: `web/src/pages/index.astro`, `web/src/pages/about.astro`, `web/src/pages/fun.astro` (add `<Nav slot="nav" />`)

**Interfaces:**
- Produces: `initNav(root?: ParentNode): void` from `scripts/nav.ts`; `main.ts` as the single script entry loaded by `BaseLayout.astro`.
- Consumes: `BaseLayout.astro`'s `nav` slot (Task 3).

- [ ] **Step 1: Write `web/src/components/Nav.astro`**

```astro
---
interface Props {
  navLabels: { home: string; about: string; fun: string };
}
const { navLabels } = Astro.props;
---
<nav class="site-nav">
  <a href="/">{navLabels.home}</a>
  <button type="button" data-nav-toggle aria-expanded="false" aria-controls="nav-menu">Menu</button>
  <ul id="nav-menu" data-nav-menu data-open="false">
    <li><a href="/about">{navLabels.about}</a></li>
    <li><a href="/fun">{navLabels.fun}</a></li>
  </ul>
</nav>
```

- [ ] **Step 2: Write `web/src/scripts/nav.ts`**

```ts
export function initNav(root: ParentNode = document): void {
  const toggle = root.querySelector<HTMLButtonElement>('[data-nav-toggle]');
  const menu = root.querySelector<HTMLElement>('[data-nav-menu]');
  if (!toggle || !menu) return;

  toggle.addEventListener('click', () => {
    const isOpen = menu.getAttribute('data-open') === 'true';
    menu.setAttribute('data-open', String(!isOpen));
    toggle.setAttribute('aria-expanded', String(!isOpen));
  });
}
```

- [ ] **Step 3: Write `web/src/scripts/main.ts`**

```ts
import { initNav } from './nav';

function init(): void {
  initNav();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
```

- [ ] **Step 4: Wire `Nav` into each page**

In `web/src/pages/index.astro`, `about.astro`, `fun.astro`, import `Nav` from `'../components/Nav.astro'` and add inside `BaseLayout`:

```astro
<Nav slot="nav" navLabels={{ home: 'Work', about: 'About', fun: 'Fun' }} />
```

- [ ] **Step 5: Verify**

```bash
cd web && npx astro check && npm run dev
```

Manually: on any page, click "Menu" — `data-open` toggles between `"false"`/`"true"` on the `<ul>` and `aria-expanded` toggles on the button (check via browser dev tools). Click the nav links and confirm normal navigation between `/`, `/about`, `/fun` still works.

- [ ] **Step 6: Commit**

```bash
git add web/src/components/Nav.astro web/src/scripts web/src/pages
git commit -m "feat: add nav component and script entry point"
```

---

### Task 5: Lenis Smooth Scroll

**Files:**
- Modify: `web/package.json` (add `lenis` dependency)
- Create: `web/src/scripts/lenis.ts`
- Modify: `web/src/scripts/main.ts`

**Interfaces:**
- Produces: `initLenis(): Lenis | null`, `getLenisInstance(): Lenis | null`, `resizeLenis(): void` from `scripts/lenis.ts`.
- Consumes: nothing new.

- [ ] **Step 1: Install Lenis**

```bash
cd web && npm install lenis
```

- [ ] **Step 2: Write `web/src/scripts/lenis.ts`**

```ts
import Lenis from 'lenis';

let lenisInstance: Lenis | null = null;

export function initLenis(): Lenis | null {
  if (typeof window === 'undefined') return null;

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (prefersReducedMotion) return null;

  lenisInstance?.destroy();
  lenisInstance = new Lenis({ autoRaf: true });

  return lenisInstance;
}

export function getLenisInstance(): Lenis | null {
  return lenisInstance;
}

export function resizeLenis(): void {
  lenisInstance?.resize();
}
```

- [ ] **Step 3: Wire into `web/src/scripts/main.ts`**

```ts
import { initLenis } from './lenis';
import { initNav } from './nav';

function init(): void {
  initLenis();
  initNav();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
```

- [ ] **Step 4: Verify**

```bash
cd web && npx astro check && npm run dev
```

Manually: on any page tall enough to scroll (temporarily add `<div style="height: 2000px"></div>` to a stub page if needed, then remove it), scrolling feels smoothed/eased rather than native-jumpy. In browser dev tools, emulate "prefers-reduced-motion: reduce" and confirm scroll becomes native (no smoothing) — `initLenis()` should return `null` in that mode (check via a temporary `console.log`, then remove it).

- [ ] **Step 5: Commit**

```bash
git add web/package.json web/package-lock.json web/src/scripts
git commit -m "feat: integrate Lenis smooth scroll"
```

---

### Task 6: Home Page Project Carousel

**Files:**
- Create: `web/src/components/ProjectCarousel.astro`
- Create: `web/src/scripts/carousel.ts`
- Modify: `web/src/pages/index.astro`
- Modify: `web/src/scripts/main.ts`

**Interfaces:**
- Produces: `initCarousel(root?: ParentNode): void` from `scripts/carousel.ts`; `ProjectCarousel.astro` accepting `{ projects: Project[] }`, rendering project cards with `data-project-link`/`data-slug`/`data-barba-prevent` and a `#projects-data` JSON payload consumed by Task 7's popup script.
- Consumes: `getProjects()` from `lib/content.ts` (Task 2); `Project` type (Task 2).

- [ ] **Step 1: Write `web/src/components/ProjectCarousel.astro`**

```astro
---
import type { Project } from '../lib/types';

interface Props {
  projects: Project[];
}
const { projects } = Astro.props;
---
<div data-carousel class="project-carousel">
  <div data-carousel-track class="project-carousel__track">
    {projects.map((project) => (
      <a
        href={`/work/${project.slug}`}
        class="project-card"
        data-carousel-card
        data-project-link
        data-slug={project.slug}
        data-barba-prevent
      >
        <img
          src={project.coverImage.url}
          alt={project.coverImage.alt}
          width={project.coverImage.width}
          height={project.coverImage.height}
          loading={project.order === 0 ? 'eager' : 'lazy'}
        />
        <span>{project.title}</span>
      </a>
    ))}
  </div>
  <button type="button" data-carousel-prev aria-label="Previous project">‹</button>
  <button type="button" data-carousel-next aria-label="Next project">›</button>
</div>
<script type="application/json" id="projects-data" set:html={JSON.stringify(projects)} />
```

- [ ] **Step 2: Write `web/src/scripts/carousel.ts`**

```ts
export function initCarousel(root: ParentNode = document): void {
  const carousel = root.querySelector<HTMLElement>('[data-carousel]');
  if (!carousel) return;

  const track = carousel.querySelector<HTMLElement>('[data-carousel-track]');
  const prevButton = carousel.querySelector<HTMLButtonElement>('[data-carousel-prev]');
  const nextButton = carousel.querySelector<HTMLButtonElement>('[data-carousel-next]');
  if (!track || !prevButton || !nextButton) return;

  const scrollByCard = (direction: 1 | -1) => {
    const card = track.querySelector<HTMLElement>('[data-carousel-card]');
    const cardWidth = card ? card.getBoundingClientRect().width : track.clientWidth;
    track.scrollBy({ left: cardWidth * direction, behavior: 'smooth' });
  };

  prevButton.addEventListener('click', () => scrollByCard(-1));
  nextButton.addEventListener('click', () => scrollByCard(1));
}
```

- [ ] **Step 3: Update `web/src/pages/index.astro`**

```astro
---
import BaseLayout from '../layouts/BaseLayout.astro';
import Nav from '../components/Nav.astro';
import ProjectCarousel from '../components/ProjectCarousel.astro';
import { getProjects, getSiteSettings } from '../lib/content';

const projects = await getProjects();
const siteSettings = await getSiteSettings();
---
<BaseLayout
  title={siteSettings.defaultSeo.title}
  description={siteSettings.defaultSeo.description}
  canonicalPath="/"
>
  <Nav slot="nav" navLabels={siteSettings.navLabels} />
  <ProjectCarousel projects={projects} />
</BaseLayout>
```

- [ ] **Step 4: Wire into `web/src/scripts/main.ts`**

```ts
import { initLenis } from './lenis';
import { initNav } from './nav';
import { initCarousel } from './carousel';

function init(): void {
  initLenis();
  initNav();
  initCarousel();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
```

- [ ] **Step 5: Verify**

```bash
cd web && npx astro check && npm run dev
```

Manually visit `/`: both fixture projects render as cards with cover images and titles; clicking the prev/next buttons scrolls the track by one card width; view-source shows a `#projects-data` script tag containing a JSON array of the two projects.

- [ ] **Step 6: Commit**

```bash
git add web/src/components/ProjectCarousel.astro web/src/scripts web/src/pages/index.astro
git commit -m "feat: add home page project carousel"
```

---

### Task 7: Project Popup Overlay

**Files:**
- Create: `web/src/components/ProjectPopup.astro`
- Create: `web/src/scripts/project-popup.ts`
- Modify: `web/src/pages/index.astro`
- Modify: `web/src/scripts/main.ts`

**Interfaces:**
- Produces: `initProjectPopup(root?: ParentNode): void` from `scripts/project-popup.ts`; `ProjectPopup.astro` accepting `{ initialProject?: Project }`.
- Consumes: `#projects-data` JSON payload and `[data-project-link]` elements rendered by `ProjectCarousel.astro` (Task 6); `Project` type (Task 2).

- [ ] **Step 1: Write `web/src/components/ProjectPopup.astro`**

```astro
---
import type { Project } from '../lib/types';

interface Props {
  initialProject?: Project;
}
const { initialProject } = Astro.props;
---
<div
  id="project-popup"
  class="project-popup"
  role="dialog"
  aria-modal="true"
  aria-labelledby="project-popup-title"
  tabindex="-1"
  hidden={!initialProject}
>
  <button type="button" data-popup-close aria-label="Close project">Close</button>
  <h2 id="project-popup-title" data-popup-title>{initialProject?.title}</h2>
  <div data-popup-body>
    {initialProject && (
      <>
        <img
          src={initialProject.coverImage.url}
          alt={initialProject.coverImage.alt}
          width={initialProject.coverImage.width}
          height={initialProject.coverImage.height}
        />
        <p set:html={initialProject.description} />
      </>
    )}
  </div>
</div>
```

- [ ] **Step 2: Write `web/src/scripts/project-popup.ts`**

```ts
import type { Project } from '../lib/types';

let projects: Project[] = [];
let popupEl: HTMLElement | null = null;
let lastFocusedElement: HTMLElement | null = null;

function loadProjectsData(root: ParentNode): Project[] {
  const dataScript = root.querySelector<HTMLScriptElement>('#projects-data');
  if (!dataScript) return [];
  try {
    return JSON.parse(dataScript.textContent ?? '[]') as Project[];
  } catch {
    return [];
  }
}

function renderProjectIntoPopup(project: Project): void {
  if (!popupEl) return;
  const titleEl = popupEl.querySelector<HTMLElement>('[data-popup-title]');
  const bodyEl = popupEl.querySelector<HTMLElement>('[data-popup-body]');
  if (titleEl) titleEl.textContent = project.title;
  if (bodyEl) {
    bodyEl.innerHTML = `
      <img src="${project.coverImage.url}" alt="${project.coverImage.alt}" width="${project.coverImage.width}" height="${project.coverImage.height}" />
      <p>${project.description}</p>
    `;
  }
}

export function openProjectPopup(slug: string, options: { pushHistory: boolean } = { pushHistory: true }): void {
  const project = projects.find((p) => p.slug === slug);
  if (!project || !popupEl) {
    closeProjectPopup({ pushHistory: false });
    return;
  }

  lastFocusedElement = document.activeElement as HTMLElement | null;
  renderProjectIntoPopup(project);
  popupEl.hidden = false;
  popupEl.focus();
  document.body.classList.add('popup-open');

  if (options.pushHistory) {
    history.pushState({ projectSlug: slug }, '', `/work/${slug}`);
  }
}

export function closeProjectPopup(options: { pushHistory: boolean } = { pushHistory: true }): void {
  if (!popupEl) return;
  popupEl.hidden = true;
  document.body.classList.remove('popup-open');

  if (options.pushHistory) {
    history.pushState({}, '', '/');
  }

  lastFocusedElement?.focus();
}

function handleKeydown(event: KeyboardEvent): void {
  if (event.key === 'Escape' && popupEl && !popupEl.hidden) {
    closeProjectPopup();
  }
}

function handlePopState(): void {
  const match = window.location.pathname.match(/^\/work\/([^/]+)\/?$/);
  if (match) {
    openProjectPopup(match[1], { pushHistory: false });
  } else {
    closeProjectPopup({ pushHistory: false });
  }
}

export function initProjectPopup(root: ParentNode = document): void {
  projects = loadProjectsData(root);
  popupEl = root.querySelector<HTMLElement>('#project-popup');
  if (!popupEl) return;

  root.querySelectorAll<HTMLAnchorElement>('[data-project-link]').forEach((link) => {
    link.addEventListener('click', (event) => {
      event.preventDefault();
      const slug = link.dataset.slug;
      if (slug) openProjectPopup(slug);
    });
  });

  root.querySelectorAll<HTMLButtonElement>('[data-popup-close]').forEach((button) => {
    button.addEventListener('click', () => closeProjectPopup());
  });

  document.addEventListener('keydown', handleKeydown);
  window.addEventListener('popstate', handlePopState);

  const initialMatch = window.location.pathname.match(/^\/work\/([^/]+)\/?$/);
  if (initialMatch && popupEl.hidden) {
    openProjectPopup(initialMatch[1], { pushHistory: false });
  }
}
```

- [ ] **Step 3: Update `web/src/pages/index.astro`** to render the popup

```astro
---
import BaseLayout from '../layouts/BaseLayout.astro';
import Nav from '../components/Nav.astro';
import ProjectCarousel from '../components/ProjectCarousel.astro';
import ProjectPopup from '../components/ProjectPopup.astro';
import { getProjects, getSiteSettings } from '../lib/content';

const projects = await getProjects();
const siteSettings = await getSiteSettings();
---
<BaseLayout
  title={siteSettings.defaultSeo.title}
  description={siteSettings.defaultSeo.description}
  canonicalPath="/"
>
  <Nav slot="nav" navLabels={siteSettings.navLabels} />
  <ProjectCarousel projects={projects} />
  <ProjectPopup />
</BaseLayout>
```

- [ ] **Step 4: Wire into `web/src/scripts/main.ts`**

```ts
import { initLenis } from './lenis';
import { initNav } from './nav';
import { initCarousel } from './carousel';
import { initProjectPopup } from './project-popup';

function init(): void {
  initLenis();
  initNav();
  initCarousel();
  initProjectPopup();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
```

- [ ] **Step 5: Verify**

```bash
cd web && npx astro check && npm run dev
```

Manually on `/`: click a project card — the popup opens showing that project's title/description/image, the URL updates to `/work/<slug>` without a full page reload, and focus moves into the popup. Press Escape — popup closes, URL returns to `/`, focus returns to the card. Click a card, then use the browser's back button — popup closes and URL returns to `/`; forward button reopens it.

- [ ] **Step 6: Commit**

```bash
git add web/src/components/ProjectPopup.astro web/src/scripts/project-popup.ts web/src/scripts/main.ts web/src/pages/index.astro
git commit -m "feat: add shareable project popup overlay"
```

---

### Task 8: `/work/[slug]` Dynamic Route (Server-Rendered Open State)

**Files:**
- Create: `web/src/pages/work/[slug].astro`

**Interfaces:**
- Produces: a statically-generated page per project at `/work/<slug>`.
- Consumes: `getProjects()`, `getProjectBySlug()`, `getSiteSettings()` (Task 2); `ProjectCarousel.astro` (Task 6); `ProjectPopup.astro` (Task 7).

- [ ] **Step 1: Write `web/src/pages/work/[slug].astro`**

```astro
---
import BaseLayout from '../../layouts/BaseLayout.astro';
import Nav from '../../components/Nav.astro';
import ProjectCarousel from '../../components/ProjectCarousel.astro';
import ProjectPopup from '../../components/ProjectPopup.astro';
import { getProjects, getProjectBySlug, getSiteSettings } from '../../lib/content';

export async function getStaticPaths() {
  const projects = await getProjects();
  return projects.map((project) => ({ params: { slug: project.slug } }));
}

const { slug } = Astro.params;
const [projects, project, siteSettings] = await Promise.all([
  getProjects(),
  getProjectBySlug(slug!),
  getSiteSettings(),
]);
---
<BaseLayout
  title={project ? `${project.title} — ${siteSettings.defaultSeo.title}` : siteSettings.defaultSeo.title}
  description={project?.description ?? siteSettings.defaultSeo.description}
  canonicalPath={`/work/${slug}`}
  ogImage={project?.coverImage.url}
>
  <Nav slot="nav" navLabels={siteSettings.navLabels} />
  <ProjectCarousel projects={projects} />
  <ProjectPopup initialProject={project ?? undefined} />
</BaseLayout>
```

- [ ] **Step 2: Verify**

```bash
cd web && npx astro check && npm run build
```

Expected: build succeeds and emits `dist/work/first-project/index.html` and `dist/work/second-project/index.html`. Then:

```bash
npm run preview
```

Visit `/work/first-project` directly — the popup is already open on page load (no click needed), showing "First Project"'s content, and the carousel is visible underneath. View-source confirms the project's title/description appear in the raw HTML (not only injected by JS). Click Close — popup closes and URL changes to `/`.

- [ ] **Step 3: Commit**

```bash
git add web/src/pages/work
git commit -m "feat: add shareable /work/[slug] route with server-rendered popup state"
```

---

### Task 9: Barba.js Page Transitions

**Files:**
- Modify: `web/package.json` (add `@barba/core` dependency)
- Create: `web/src/scripts/barba.ts`
- Modify: `web/src/scripts/main.ts`

**Interfaces:**
- Produces: `initBarba(): void` from `scripts/barba.ts`.
- Consumes: `initNav`, `initCarousel`, `initProjectPopup`, `resizeLenis` (Tasks 4, 5, 6, 7) — called from Barba's `after` hook, scoped to the newly-swapped container.

- [ ] **Step 1: Install Barba**

```bash
cd web && npm install @barba/core
```

- [ ] **Step 2: Write `web/src/scripts/barba.ts`**

```ts
import barba from '@barba/core';
import { initNav } from './nav';
import { initCarousel } from './carousel';
import { initProjectPopup } from './project-popup';
import { resizeLenis } from './lenis';

function prefersReducedMotion(): boolean {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

export function initBarba(): void {
  if (typeof window === 'undefined') return;

  barba.init({
    preventRunning: true,
    prevent: ({ el }) => el.hasAttribute('data-barba-prevent'),
    transitions: [
      {
        name: 'default-transition',
        leave(data) {
          const duration = prefersReducedMotion() ? 0 : 300;
          return data.current.container.animate(
            [{ opacity: 1 }, { opacity: 0 }],
            { duration, easing: 'ease' }
          ).finished;
        },
        enter(data) {
          const duration = prefersReducedMotion() ? 0 : 300;
          return data.next.container.animate(
            [{ opacity: 0 }, { opacity: 1 }],
            { duration, easing: 'ease' }
          ).finished;
        },
      },
    ],
  });

  barba.hooks.after((data) => {
    const container = data?.next?.container;
    if (!container) return;
    initNav(container);
    initCarousel(container);
    initProjectPopup(container);
    resizeLenis();
  });
}
```

- [ ] **Step 3: Wire into `web/src/scripts/main.ts`**

```ts
import { initLenis } from './lenis';
import { initNav } from './nav';
import { initCarousel } from './carousel';
import { initProjectPopup } from './project-popup';
import { initBarba } from './barba';

function init(): void {
  initLenis();
  initNav();
  initCarousel();
  initProjectPopup();
  initBarba();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
```

- [ ] **Step 4: Verify**

```bash
cd web && npx astro check && npm run dev
```

Manually: from `/`, click the "About" nav link — content fades out/in instead of a hard reload, URL becomes `/about`, and the nav menu toggle still works afterward (confirms `initNav` re-ran on the swapped container). Navigate `/` → `/fun` → `/` the same way. Then click a project card from `/` — confirm it still opens the popup via `pushState` (not intercepted/broken by Barba), because of `data-barba-prevent`. Emulate `prefers-reduced-motion: reduce` in dev tools and confirm page transitions become instant.

- [ ] **Step 5: Commit**

```bash
git add web/package.json web/package-lock.json web/src/scripts
git commit -m "feat: add Barba.js page transitions for Home/About/Fun"
```

---

### Task 10: About Page Real Content

**Files:**
- Modify: `web/src/pages/about.astro`
- Modify: `web/src/styles/global.css` (minor: fun-list/about article styles optional, skip if not needed)

**Interfaces:**
- Consumes: `getAbout()`, `getSiteSettings()` (Task 2).

- [ ] **Step 1: Rewrite `web/src/pages/about.astro`**

```astro
---
import BaseLayout from '../layouts/BaseLayout.astro';
import Nav from '../components/Nav.astro';
import { getAbout, getSiteSettings } from '../lib/content';

const about = await getAbout();
const siteSettings = await getSiteSettings();
---
<BaseLayout
  title={`About — ${siteSettings.defaultSeo.title}`}
  description={siteSettings.defaultSeo.description}
  canonicalPath="/about"
>
  <Nav slot="nav" navLabels={siteSettings.navLabels} />
  <article>
    <img
      src={about.portrait.url}
      alt={about.portrait.alt}
      width={about.portrait.width}
      height={about.portrait.height}
    />
    <div set:html={about.bio} />
    <ul>
      {about.socialLinks.map((link) => (
        <li><a href={link.url}>{link.label}</a></li>
      ))}
    </ul>
  </article>
</BaseLayout>
```

- [ ] **Step 2: Verify**

```bash
cd web && npx astro check && npm run dev
```

Visit `/about`: portrait image, bio paragraph, and both social links render.

- [ ] **Step 3: Commit**

```bash
git add web/src/pages/about.astro
git commit -m "feat: wire real content into About page"
```

---

### Task 11: Fun Page Real Content

**Files:**
- Modify: `web/src/pages/fun.astro`

**Interfaces:**
- Consumes: `getFunItems()`, `getSiteSettings()` (Task 2).

- [ ] **Step 1: Rewrite `web/src/pages/fun.astro`**

```astro
---
import BaseLayout from '../layouts/BaseLayout.astro';
import Nav from '../components/Nav.astro';
import { getFunItems, getSiteSettings } from '../lib/content';

const funItems = await getFunItems();
const siteSettings = await getSiteSettings();
---
<BaseLayout
  title={`Fun — ${siteSettings.defaultSeo.title}`}
  description={siteSettings.defaultSeo.description}
  canonicalPath="/fun"
>
  <Nav slot="nav" navLabels={siteSettings.navLabels} />
  <ul class="fun-list">
    {funItems.map((item) => (
      <li>
        <h2>{item.link ? <a href={item.link}>{item.title}</a> : item.title}</h2>
        <p>{item.description}</p>
        <time datetime={item.date}>{item.date}</time>
      </li>
    ))}
  </ul>
</BaseLayout>
```

- [ ] **Step 2: Verify**

```bash
cd web && npx astro check && npm run dev
```

Visit `/fun`: both fixture items render with title (linked for the item that has a `link`), description, and date.

- [ ] **Step 3: Commit**

```bash
git add web/src/pages/fun.astro
git commit -m "feat: wire real content into Fun page"
```

---

### Task 12: SEO Extras — Sitemap, robots.txt, JSON-LD

**Files:**
- Modify: `web/package.json` (add `@astrojs/sitemap`)
- Modify: `web/astro.config.mjs`
- Create: `web/public/robots.txt`
- Create: `web/src/components/JsonLd.astro`
- Modify: `web/src/pages/about.astro`
- Modify: `web/src/pages/work/[slug].astro`

**Interfaces:**
- Produces: `JsonLd.astro` accepting `{ data: Record<string, unknown> }`.
- Consumes: `Astro.site` (Task 1 config), `project`/`about` data already loaded in Tasks 8 and 10.

- [ ] **Step 1: Install the sitemap integration**

```bash
cd web && npm install @astrojs/sitemap
```

- [ ] **Step 2: Update `web/astro.config.mjs`**

```js
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://example.com',
  integrations: [sitemap()],
});
```

- [ ] **Step 3: Create `web/public/robots.txt`**

```
User-agent: *
Allow: /

Sitemap: https://example.com/sitemap-index.xml
```

- [ ] **Step 4: Write `web/src/components/JsonLd.astro`**

```astro
---
interface Props {
  data: Record<string, unknown>;
}
const { data } = Astro.props;
---
<script type="application/ld+json" set:html={JSON.stringify(data)} />
```

- [ ] **Step 5: Add Person JSON-LD to `web/src/pages/about.astro`**

Add the import and a usage inside `BaseLayout`, after the existing `<article>`:

```astro
import JsonLd from '../components/JsonLd.astro';
```

```astro
<JsonLd data={{
  '@context': 'https://schema.org',
  '@type': 'Person',
  name: 'Joana Cunha',
  url: Astro.site?.toString(),
}} />
```

- [ ] **Step 6: Add CreativeWork JSON-LD to `web/src/pages/work/[slug].astro`**

Add the import and, after `<ProjectPopup ... />`:

```astro
import JsonLd from '../../components/JsonLd.astro';
```

```astro
{project && (
  <JsonLd data={{
    '@context': 'https://schema.org',
    '@type': 'CreativeWork',
    name: project.title,
    image: project.coverImage.url,
    dateCreated: String(project.year),
  }} />
)}
```

- [ ] **Step 7: Verify**

```bash
cd web && npx astro check && npm run build && npm run preview
```

Expected: `dist/sitemap-index.xml` and `dist/sitemap-0.xml` exist and list all routes including both `/work/<slug>` pages. Visit `/about` and `/work/first-project` and view-source to confirm a `<script type="application/ld+json">` tag with the expected JSON is present on each. Visit `/robots.txt` and confirm it's served.

- [ ] **Step 8: Commit**

```bash
git add web/package.json web/package-lock.json web/astro.config.mjs web/public/robots.txt web/src/components/JsonLd.astro web/src/pages/about.astro web/src/pages/work/[slug].astro
git commit -m "feat: add sitemap, robots.txt, and JSON-LD structured data"
```

---

### Task 13: Sanity Studio Scaffold & Schemas

**Prerequisite:** a Sanity.io account and project. If one doesn't exist yet, create it at sanity.io/manage before starting this task (free tier is sufficient), and note the generated **Project ID**.

**Files:**
- Create: `studio/package.json`
- Create: `studio/sanity.config.ts`
- Create: `studio/schemaTypes/project.ts`
- Create: `studio/schemaTypes/funItem.ts`
- Create: `studio/schemaTypes/about.ts`
- Create: `studio/schemaTypes/siteSettings.ts`
- Create: `studio/schemaTypes/index.ts`
- Create: `studio/.env.example`

**Interfaces:**
- Produces: a runnable Sanity Studio whose `project`/`funItem`/`about`/`siteSettings` schemas mirror the field names/shapes of the `Project`/`FunItem`/`About`/`SiteSettings` TypeScript types from `web/src/lib/types.ts` (Task 2), so Task 14 can map between them directly.

- [ ] **Step 1: Write `studio/package.json`**

```json
{
  "name": "studio",
  "private": true,
  "version": "0.0.0",
  "scripts": {
    "dev": "sanity dev",
    "build": "sanity build",
    "deploy": "sanity deploy"
  },
  "dependencies": {
    "sanity": "^3.62.0",
    "@sanity/vision": "^3.62.0",
    "react": "^18.3.0",
    "react-dom": "^18.3.0",
    "styled-components": "^6.1.0"
  }
}
```

- [ ] **Step 2: Write `studio/schemaTypes/project.ts`**

```ts
import { defineField, defineType } from 'sanity';

export default defineType({
  name: 'project',
  title: 'Project',
  type: 'document',
  fields: [
    defineField({ name: 'title', type: 'string', validation: (rule) => rule.required() }),
    defineField({
      name: 'slug',
      type: 'slug',
      options: { source: 'title' },
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'coverImage',
      type: 'image',
      validation: (rule) => rule.required(),
      fields: [defineField({ name: 'alt', type: 'string', validation: (rule) => rule.required() })],
    }),
    defineField({
      name: 'gallery',
      type: 'array',
      of: [
        {
          type: 'image',
          fields: [defineField({ name: 'alt', type: 'string', validation: (rule) => rule.required() })],
        },
      ],
    }),
    defineField({ name: 'description', type: 'array', of: [{ type: 'block' }] }),
    defineField({ name: 'year', type: 'number' }),
    defineField({ name: 'role', type: 'string' }),
    defineField({ name: 'tags', type: 'array', of: [{ type: 'string' }] }),
    defineField({ name: 'externalLink', type: 'url' }),
    defineField({ name: 'order', type: 'number', initialValue: 0 }),
  ],
});
```

- [ ] **Step 3: Write `studio/schemaTypes/funItem.ts`**

```ts
import { defineField, defineType } from 'sanity';

export default defineType({
  name: 'funItem',
  title: 'Fun Item',
  type: 'document',
  fields: [
    defineField({ name: 'title', type: 'string', validation: (rule) => rule.required() }),
    defineField({ name: 'description', type: 'text' }),
    defineField({ name: 'link', type: 'url' }),
    defineField({ name: 'date', type: 'date', validation: (rule) => rule.required() }),
    defineField({ name: 'type', type: 'string' }),
  ],
});
```

- [ ] **Step 4: Write `studio/schemaTypes/about.ts`**

```ts
import { defineField, defineType } from 'sanity';

export default defineType({
  name: 'about',
  title: 'About',
  type: 'document',
  fields: [
    defineField({ name: 'bio', type: 'array', of: [{ type: 'block' }] }),
    defineField({
      name: 'portrait',
      type: 'image',
      validation: (rule) => rule.required(),
      fields: [defineField({ name: 'alt', type: 'string', validation: (rule) => rule.required() })],
    }),
    defineField({ name: 'resumeUrl', type: 'url' }),
    defineField({
      name: 'socialLinks',
      type: 'array',
      of: [
        {
          type: 'object',
          fields: [
            defineField({ name: 'label', type: 'string', validation: (rule) => rule.required() }),
            defineField({ name: 'url', type: 'url', validation: (rule) => rule.required() }),
          ],
        },
      ],
    }),
  ],
});
```

- [ ] **Step 5: Write `studio/schemaTypes/siteSettings.ts`**

```ts
import { defineField, defineType } from 'sanity';

export default defineType({
  name: 'siteSettings',
  title: 'Site Settings',
  type: 'document',
  fields: [
    defineField({
      name: 'navLabels',
      type: 'object',
      fields: [
        defineField({ name: 'home', type: 'string', validation: (rule) => rule.required() }),
        defineField({ name: 'about', type: 'string', validation: (rule) => rule.required() }),
        defineField({ name: 'fun', type: 'string', validation: (rule) => rule.required() }),
      ],
    }),
    defineField({
      name: 'defaultSeo',
      type: 'object',
      fields: [
        defineField({ name: 'title', type: 'string', validation: (rule) => rule.required() }),
        defineField({ name: 'description', type: 'text', validation: (rule) => rule.required() }),
        defineField({
          name: 'ogImage',
          type: 'image',
          fields: [defineField({ name: 'alt', type: 'string', validation: (rule) => rule.required() })],
        }),
      ],
    }),
    defineField({
      name: 'socialLinks',
      type: 'array',
      of: [
        {
          type: 'object',
          fields: [
            defineField({ name: 'label', type: 'string', validation: (rule) => rule.required() }),
            defineField({ name: 'url', type: 'url', validation: (rule) => rule.required() }),
          ],
        },
      ],
    }),
  ],
});
```

- [ ] **Step 6: Write `studio/schemaTypes/index.ts`**

```ts
import project from './project';
import funItem from './funItem';
import about from './about';
import siteSettings from './siteSettings';

export const schemaTypes = [project, funItem, about, siteSettings];
```

- [ ] **Step 7: Write `studio/sanity.config.ts`**

```ts
import { defineConfig } from 'sanity';
import { structureTool } from 'sanity/structure';
import { visionTool } from '@sanity/vision';
import { schemaTypes } from './schemaTypes';

export default defineConfig({
  name: 'default',
  title: 'Portfolio Studio',
  projectId: process.env.SANITY_STUDIO_PROJECT_ID ?? '',
  dataset: process.env.SANITY_STUDIO_DATASET ?? 'production',
  plugins: [structureTool(), visionTool()],
  schema: { types: schemaTypes },
});
```

- [ ] **Step 8: Write `studio/.env.example`**

```
SANITY_STUDIO_PROJECT_ID=your-project-id
SANITY_STUDIO_DATASET=production
```

Create a real `studio/.env` (gitignored) locally with the actual project ID before running Studio.

- [ ] **Step 9: Install and verify**

```bash
cd studio && npm install && npm run dev
```

Expected: Studio starts (default `http://localhost:3333`), shows "Project", "Fun Item", "About", "Site Settings" document types in the left panel, and lets you create a document of each type, filling in the fields defined above, without schema errors.

- [ ] **Step 10: Commit**

```bash
git add studio package.json
git commit -m "feat: scaffold Sanity Studio with project/funItem/about/siteSettings schemas"
```

---

### Task 14: Wire Real Sanity Content Into `web/`

**Prerequisite:** Task 13 complete, with at least one real `project`, the `about` singleton, the `siteSettings` singleton, and (optionally) a `funItem` published in Sanity Studio, so there's real data to query against.

**Files:**
- Modify: `web/package.json` (add `@sanity/client`, `@sanity/image-url`)
- Create: `web/src/lib/sanity.ts`
- Create: `web/src/lib/sanityImage.ts`
- Modify: `web/src/lib/content.ts`
- Create: `web/.env.example`

**Interfaces:**
- Produces: `sanityClient` from `lib/sanity.ts`; `mapSanityImage(image, width?): SanityImage` from `lib/sanityImage.ts`.
- Consumes/Replaces: the fixture-backed bodies of `getProjects`, `getProjectBySlug`, `getFunItems`, `getAbout`, `getSiteSettings` in `lib/content.ts` (Task 2) — signatures stay identical, so no page (Tasks 6–11) needs to change.

- [ ] **Step 1: Install Sanity client packages**

```bash
cd web && npm install @sanity/client @sanity/image-url
```

- [ ] **Step 2: Write `web/.env.example`**

```
SANITY_PROJECT_ID=your-project-id
SANITY_DATASET=production
```

Create a real `web/.env` (gitignored) locally with the actual project ID before building against Sanity.

- [ ] **Step 3: Write `web/src/lib/sanity.ts`**

```ts
import { createClient } from '@sanity/client';

export const sanityClient = createClient({
  projectId: import.meta.env.SANITY_PROJECT_ID,
  dataset: import.meta.env.SANITY_DATASET ?? 'production',
  apiVersion: '2026-01-01',
  useCdn: true,
});
```

- [ ] **Step 4: Write `web/src/lib/sanityImage.ts`**

```ts
import imageUrlBuilder from '@sanity/image-url';
import { sanityClient } from './sanity';
import type { SanityImage } from './types';

const builder = imageUrlBuilder(sanityClient);

interface SanityImageSource {
  asset: { _ref: string };
  alt: string;
}

export function mapSanityImage(image: SanityImageSource, width = 1200): SanityImage {
  const url = builder.image(image).width(width).auto('format').url();
  return { url, alt: image.alt, width, height: Math.round(width * 0.75) };
}
```

- [ ] **Step 5: Rewrite `web/src/lib/content.ts`**

```ts
import { sanityClient } from './sanity';
import { mapSanityImage } from './sanityImage';
import type { About, FunItem, Project, SiteSettings } from './types';

interface RawProject {
  slug: string;
  title: string;
  coverImage: { asset: { _ref: string }; alt: string };
  gallery: { asset: { _ref: string }; alt: string }[];
  description: string;
  year: number;
  role: string;
  tags: string[];
  externalLink?: string;
  order: number;
}

export async function getProjects(): Promise<Project[]> {
  const data = await sanityClient.fetch<RawProject[]>(`*[_type == "project"] | order(order asc){
    "slug": slug.current,
    title,
    coverImage,
    gallery,
    "description": pt::text(description),
    year,
    role,
    tags,
    externalLink,
    order
  }`);

  return data.map((item) => ({
    ...item,
    coverImage: mapSanityImage(item.coverImage),
    gallery: (item.gallery ?? []).map((image) => mapSanityImage(image)),
  }));
}

export async function getProjectBySlug(slug: string): Promise<Project | null> {
  const all = await getProjects();
  return all.find((project) => project.slug === slug) ?? null;
}

export async function getFunItems(): Promise<FunItem[]> {
  return sanityClient.fetch<FunItem[]>(`*[_type == "funItem"] | order(date desc){
    title, description, link, date, type
  }`);
}

interface RawAbout {
  bio: string;
  portrait: { asset: { _ref: string }; alt: string };
  resumeUrl?: string;
  socialLinks: { label: string; url: string }[];
}

export async function getAbout(): Promise<About> {
  const data = await sanityClient.fetch<RawAbout>(`*[_type == "about"][0]{
    "bio": pt::text(bio), portrait, resumeUrl, socialLinks
  }`);

  return { ...data, portrait: mapSanityImage(data.portrait) };
}

interface RawSiteSettings {
  navLabels: { home: string; about: string; fun: string };
  defaultSeo: {
    title: string;
    description: string;
    ogImage: { asset: { _ref: string }; alt: string };
  };
  socialLinks: { label: string; url: string }[];
}

export async function getSiteSettings(): Promise<SiteSettings> {
  const data = await sanityClient.fetch<RawSiteSettings>(`*[_type == "siteSettings"][0]{
    navLabels, defaultSeo, socialLinks
  }`);

  return {
    ...data,
    defaultSeo: { ...data.defaultSeo, ogImage: mapSanityImage(data.defaultSeo.ogImage) },
  };
}
```

- [ ] **Step 6: Verify**

```bash
cd web && npx astro check && npm run build
```

Expected: build succeeds and pulls real content — `npm run preview`, then visit `/`, `/about`, `/fun`, and `/work/<a real slug from Studio>` and confirm the content shown matches what was entered in Sanity Studio (not the old fixtures).

- [ ] **Step 7: Delete the now-unused fixtures**

```bash
rm -r web/src/lib/fixtures
```

Re-run `npx astro check` to confirm nothing still imports them.

- [ ] **Step 8: Commit**

```bash
git add web/package.json web/package-lock.json web/src/lib
git add -u web/src/lib/fixtures
git commit -m "feat: replace fixture content with real Sanity queries"
```

---

### Task 15: Netlify Deployment Config & Docs

**Files:**
- Create: `netlify.toml` (repo root)
- Modify: `README.md` (create if it doesn't exist)

**Interfaces:**
- Consumes: nothing code-level; this task is deployment configuration and operational documentation only.

- [ ] **Step 1: Write `netlify.toml`**

```toml
[build]
  base = "web"
  command = "npm run build"
  publish = "web/dist"

[build.environment]
  NODE_VERSION = "20"
```

- [ ] **Step 2: Write/extend `README.md`**

```markdown
# Portfolio Site

## Local development

```bash
npm install
cd web && npm run dev      # Astro site at http://localhost:4321
cd studio && npm run dev   # Sanity Studio at http://localhost:3333
```

## Environment variables

`web/.env` (see `web/.env.example`):
- `SANITY_PROJECT_ID`
- `SANITY_DATASET`

`studio/.env` (see `studio/.env.example`):
- `SANITY_STUDIO_PROJECT_ID`
- `SANITY_STUDIO_DATASET`

## Deployment

- **Production**: Netlify site tracking the `main` branch, using the root `netlify.toml` (base directory `web/`).
- **Staging**: a second Netlify site tracking the `preview` branch, same build settings.
- Set `SANITY_PROJECT_ID` / `SANITY_DATASET` as environment variables on both Netlify sites.

## Content publish workflow

1. Publish a change in Sanity Studio.
2. A Sanity webhook (configured at sanity.io/manage → API → Webhooks, POSTing to the **staging** site's Netlify build hook on document publish) rebuilds the staging site automatically.
3. Review the change on the staging URL.
4. When ready, trigger a production rebuild manually — either click "Trigger deploy" on the production Netlify site, or merge `preview` into `main` (also rebuilds production against the latest published content).

## Sanity Studio deploy

```bash
cd studio && npm run deploy
```

Deploys Studio to `<project>.sanity.studio`, independent of the Netlify site.
```

- [ ] **Step 3: Verify**

Manually confirm `netlify.toml` is valid TOML (no syntax errors) by eye, and that the `README.md` steps match the actual scripts in `web/package.json` and `studio/package.json`.

- [ ] **Step 4: Commit**

```bash
git add netlify.toml README.md
git commit -m "docs: add Netlify deployment config and operational docs"
```

---

## Plan Self-Review Notes

- **Spec coverage:** Home carousel (Task 6), shareable popup (Tasks 7–8), About (Task 10), Fun (Task 11), Barba transitions (Task 9) with `data-barba-prevent` on popup links, Lenis persisting across transitions (Task 5 + Task 9's `resizeLenis`), Sanity content model (Task 13) matching `lib/types.ts` (Task 2), phased fixtures-then-Sanity build (Tasks 2–12 vs. 13–14), performance/SEO/accessibility (alt text required in schema, sitemap/robots/JSON-LD in Task 12, `prefers-reduced-motion` handling in Tasks 5 and 9, focus-trap/aria-modal popup in Task 7), staging/production branch workflow (Task 15) are all covered.
- **Type consistency:** `Project`, `FunItem`, `About`, `SiteSettings`, `SanityImage` (Task 2) are used with identical field names across fixtures (Task 2), carousel/popup components (Tasks 6–8), and the real Sanity mapping (Task 14). `initNav`/`initCarousel`/`initProjectPopup` all accept the same `root: ParentNode = document` signature so Barba's `after` hook (Task 9) can call them uniformly.
- **No placeholders:** every step has complete, runnable code; no "TBD"/"add later" steps remain.
