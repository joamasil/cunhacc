# Work Slider & Project Page — Design

Date: 2026-10-26
Supersedes: the "Project popup — shareable overlay" and "Barba.js — page
transitions" sections of `2026-09-14-portfolio-site-design.md`.

## Intent

The homepage *is* the portfolio: a full-screen slider of projects, one at a
time. Expanding a project opens its own page (`/work/<slug>`), but it must
feel like a popup opening over the slider, not a page load. Barba.js does the
route change; the animation hides it.

Desktop only for now (≥ 1024px, the existing `--bp-desktop` breakpoint in
`tokens.css`). Mobile gets a working-but-unpolished fallback; its design comes
later.

## Figma references

File `AYuoW9l0ZcDy4JcpKEr9sj`, page "🌐 Composition":

- `178:41890` — Home/Work, menu closed (slider + info card + thumbnail strip)
- `174:15765` — Home/Work, menu open
- `209:41543` — Menu open, hover on a link
- `174:15630` — Popup (expanded project page)

Pull exact sizes, radii, translucency and spacing from these via the Figma
MCP during implementation.

## Goals

1. Homepage slider with cross-fading slides, keyboard + swipe navigation,
   looping.
2. Menu open/close animation on the bottom bar that cooperates with the
   thumbnail strip.
3. Real project pages at `/work/<slug>`, reached via Barba with a
   card-grows-into-panel transition, and back again in reverse.
4. Switching between projects while one is open swaps content inside a
   persistent white panel.
5. Everything styled from the design tokens; reusable, easy-to-edit
   components.

## Non-goals (for now)

- Mobile layout/interaction design (no "All projects" dropdown yet).
- Final project content model (media types, ratios, credit blocks). The user
  will specify this later; build a minimal base that is easy to extend.
- Sanity integration — keep using fixtures through `lib/content.ts`.
- Remembering slider position across navigation. Returning home may restart
  the slider at the first project.

## Anti-goals

- Anything that reads as a page reload: white flashes, layout jumps, scroll
  jumps, the bottom bar re-rendering/blinking during Barba transitions.
- Hard-coded colors, font sizes or spacing that duplicate tokens.
- Escape closing the project page (the user explicitly does not want this).

## Behavior

### Homepage slider (`/`)

- Each slide is one project: its cover asset (image or video) fills the
  viewport (`object-fit: cover`). Video autoplays muted, looped, inline.
- An **info card** sits top-right: project name, industry, tags, and a round
  expand button. Translucent background with backdrop blur, as in Figma.
- Changing slide = **cross-fade** of the asset; the info card's text updates
  to the new project.
- Navigation: **left/right arrow keys**, **horizontal swipe / trackpad drag**,
  and **clicking a thumbnail**. No on-screen arrow buttons. Wraps around
  (last → first and first → last).
- Active thumbnail marked with the pink corner bracket from Figma.

### Bottom bar: menu + thumbnail strip

- The bar is the existing `Nav` "Menu" pill followed by the thumbnail strip
  (one thumbnail per project, in `order`).
- **Menu opens:** the active thumbnail slides to the right end of the bar;
  the other thumbnails fade to opacity 0 *in place*; the nav links
  (Work / About / Figma / Pizza hunts / Contact) appear on top of that space.
  High-polish, eased motion. Closing reverses it.
- While the menu is open the remaining thumbnail tracks the current slide.
- **Hover on a nav link:** the other links dim (Figma `209:41543`).
- The bar lives **outside** the Barba container so it persists, without
  re-rendering, across home ↔ project transitions. The thumbnail strip is
  shown on `/` and `/work/*`, hidden on other pages.

### Project page (`/work/<slug>`)

- Layout per Figma `174:15630`: a large white panel inset from the viewport
  edges; background behind it is light grey; left column is the project's
  media (scrolling); right column is title, industry, synopsis, tags,
  and info rows (credits etc.); round × close button top-right. The bottom
  bar stays visible over it.
- Content is a minimal base for now (see "Content model").
- It is a real, pre-rendered Astro page: direct links and refreshes render it
  already open, without animation.

### Transitions (Barba.js)

**Expand (home → project):** clicking the info card's expand button
navigates to `/work/<slug>` via Barba. The info card grows from its
top-right position/size to the panel's position/size while its background
goes from translucent to solid white; the page behind goes to the grey
background. Once the panel is at full size, the panel's content fades in.

**Close (project → home):** only via the × button (and the browser back
button — see below). Reverse: content fades out, the panel shrinks back into
the info card's position and translucency, the slider is visible behind.
The slider may start at the first project; if the closed project is easy to
land on (e.g. via a query param or Barba's trigger data) that's a bonus,
not a requirement.

**Project → project:** clicking a thumbnail while on a project page
navigates to that project. The white panel stays put; only its content
fades out and the new content fades in.

**Browser back/forward:** play the matching transition (close, or
project → project content swap), never a hard cut. *(Claude's call.)*

**Other pages (About, Pizza hunts):** a simple default Barba transition
(fade). Barba must sync per-page state that lives outside the container —
`<body>` class (`theme-blue` on About), `<title>`/meta, and the nav's
`aria-current` — since Barba only swaps `[data-barba="container"]`.

**Reduced motion:** with `prefers-reduced-motion`, transitions become
instant or short opacity fades; no growing/sliding.

### Scroll

Lenis stays global. Inside the project panel, the panel itself (or its
columns) scrolls; the page behind does not. Lenis must be resynced/pointed at
the right scroller after each transition.

## Content model (base)

Extend `Project` in `web/src/lib/types.ts` minimally:

- `industry: string`
- `cover`: image **or** video (a discriminated union such as
  `{ type: 'image', ...SanityImage } | { type: 'video', url, poster, alt }`)
- `thumbnail: SanityImage` (bottom strip)
- keep `title`, `slug`, `description` (synopsis), `tags`, `order`, `gallery`
- `infoBlocks: { title: string; rows: { label: string; value: string }[] }[]`
  — generic so "Credits", "Client", etc. are just data.

Update the fixtures with 4–6 placeholder projects so the slider, looping and
strip can be exercised. Anything beyond this waits for the user's spec.

## Styling & code constraints (user requirement)

- Use the tokens in `web/src/styles/tokens.css` for every color, font size,
  line height, letter spacing and spacing value. If Figma uses a value the
  tokens don't have (e.g. the card's translucent fill, radii, motion
  durations/easings), **add a named token** rather than inlining it.
- Add motion tokens (durations, easings) so the feel can be tuned in one
  place.
- Small, reusable Astro components (e.g. `ProjectInfoCard`, `ProjectMedia`,
  `ThumbStrip`, `Tag`, `InfoBlock`) with scoped styles; follow the existing
  BEM-ish class naming and `data-*` hooks used in `Nav.astro` / `nav.ts`.
- Vanilla TypeScript modules with an `init()` that main.ts calls on load and
  after each Barba transition (existing pattern). Animations via the Web
  Animations API / CSS; adding GSAP is acceptable if WAAPI can't reach the
  quality bar — builder's call, say so if you do.
- Replace the leftover `.project-popup` rules in `global.css`.

## Left to the builder

- Exact easing curves and durations (start from something like 600–800ms
  expo/quart out for the grow, ~300ms for fades) — expose as tokens.
- Swipe threshold and wheel handling details.
- How the grow animation is measured (FLIP on the card vs. a clip-path on
  the panel), as long as it reads as the card becoming the panel.
- Whether project → project uses a Barba transition rule keyed on namespace
  or a custom `from`/`to` route rule.
