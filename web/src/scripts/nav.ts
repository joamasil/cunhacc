import { motion, settled } from './motion';
import { SEARCH_EVENT, suggestions } from './pizza-hunts';

/*
 * The bottom bar persists across Barba transitions, so this module is
 * initialised once and exposes helpers (syncNav, setActiveThumb, closeNav)
 * that the slider and transitions call to keep it in step with the page.
 */

let nav: HTMLElement | null = null;
let main: HTMLElement | null = null;
let toggle: HTMLButtonElement | null = null;
let menu: HTMLElement | null = null;
let strip: HTMLElement | null = null;
let projectsToggle: HTMLButtonElement | null = null;
let search: HTMLFormElement | null = null;
let searchInput: HTMLInputElement | null = null;
let suggestionList: HTMLElement | null = null;
let running: Animation[] = [];
let ghosts: HTMLElement[] = [];
let generation = 0;

const isOpen = () => menu?.getAttribute('data-open') === 'true';
const isProjectsOpen = () => nav?.dataset.projectsOpen === 'true';
const isSearching = () => nav?.dataset.searching === 'true';
const thumbItems = () => Array.from(strip?.querySelectorAll<HTMLElement>('[data-thumb-item]') ?? []);
const links = () => Array.from(menu?.querySelectorAll<HTMLElement>('[data-nav-link]') ?? []);
const normalizePath = (path: string) => path.replace(/\/$/, '') || '/';
const stripShown = () => !!strip && getComputedStyle(strip).display !== 'none';
const searchShown = () => !!search && getComputedStyle(search).display !== 'none';
// The open/close choreography is desktop only; the mobile panel just switches
const animatesBar = () => window.matchMedia('(min-width: 1024px)').matches;

function applyOpen(open: boolean): void {
  nav?.setAttribute('data-open', String(open));
  menu?.setAttribute('data-open', String(open));
  toggle?.setAttribute('aria-expanded', String(open));
}

/**
 * Width animations would reflow the bar (and re-center it) every frame, so
 * while animating, the two pills are pinned absolutely at their final spots.
 */
function pinLayout(): void {
  if (!nav || !main || !strip) return;
  const navRect = nav.getBoundingClientRect();
  const pills = [main, strip].map((pill) => [pill, pill.getBoundingClientRect()] as const);
  nav.style.width = `${navRect.width}px`;
  nav.style.height = `${navRect.height}px`;
  pills.forEach(([pill, rect]) =>
    Object.assign(pill.style, {
      position: 'absolute',
      top: `${rect.top - navRect.top}px`,
      left: `${rect.left - navRect.left}px`,
      height: `${rect.height}px`,
    }),
  );
}

function releaseLayout(): void {
  nav?.style.removeProperty('width');
  nav?.style.removeProperty('height');
  [main, strip].forEach((pill) => {
    pill?.style.removeProperty('position');
    pill?.style.removeProperty('top');
    pill?.style.removeProperty('left');
    pill?.style.removeProperty('height');
  });
}

function clearMotion(): void {
  running.forEach((animation) => animation.cancel());
  running = [];
  ghosts.forEach((ghost) => ghost.remove());
  ghosts = [];
  releaseLayout();
}

/**
 * Desktop choreography (FLIP): the Menu pill grows into the link row and the
 * links fade in. With the strip shown (work pages), the active thumbnail also
 * slides to the right end and the others fade out where they stood. Closing
 * plays it backwards.
 */
async function animateBar(open: boolean): Promise<void> {
  if (!main || !strip) return;
  const run = ++generation;
  const { fast, base, slow, easeOut } = motion();
  const items = stripShown() ? thumbItems() : [];
  const active = items.find((item) => item.dataset.active === 'true');
  const others = items.filter((item) => item !== active);

  // The search pill (Pizza hunts) makes way for the open menu
  if (open && search && searchShown()) {
    const out = search.animate([{ opacity: 1 }, { opacity: 0 }], { duration: fast, easing: 'ease-out', fill: 'forwards' });
    running.push(out);
    await settled([out]);
    if (run !== generation) return;
  }

  if (!open) {
    const out = links().map((link) =>
      link.animate([{ opacity: 1 }, { opacity: 0 }], { duration: fast, easing: 'ease-out', fill: 'forwards' }),
    );
    running.push(...out);
    await settled(out);
    if (run !== generation) return; // a newer toggle took over
  }

  const first = {
    main: main.getBoundingClientRect(),
    strip: strip.getBoundingClientRect(),
    items: new Map(items.map((item) => [item, item.getBoundingClientRect()])),
  };

  clearMotion();
  applyOpen(open);

  const last = {
    main: main.getBoundingClientRect(),
    strip: strip.getBoundingClientRect(),
    active: active?.getBoundingClientRect(),
  };
  pinLayout();
  const timing: KeyframeAnimationOptions = { duration: slow, easing: easeOut };
  const mainDx = first.main.left - last.main.left;
  const stripDx = first.strip.left - last.strip.left;

  running.push(
    main.animate(
      [
        { transform: `translateX(${mainDx}px)`, width: `${first.main.width}px` },
        { transform: 'none', width: `${last.main.width}px` },
      ],
      timing,
    ),
    strip.animate(
      [
        { transform: `translateX(${stripDx}px)`, width: `${first.strip.width}px` },
        { transform: 'none', width: `${last.strip.width}px` },
      ],
      timing,
    ),
  );

  if (active && last.active) {
    // Relative to the strip, which is sliding too
    const dx = first.items.get(active)!.left - last.active.left - stripDx;
    running.push(active.animate([{ transform: `translateX(${dx}px)` }, { transform: 'none' }], timing));
  }

  if (open) {
    // The real thumbnails are gone from the layout; fade out fixed-position
    // copies at their old spots, underneath the growing menu pill.
    others.forEach((item) => {
      const rect = first.items.get(item)!;
      const ghost = item.cloneNode(true) as HTMLElement;
      ghost.setAttribute('aria-hidden', 'true');
      Object.assign(ghost.style, {
        position: 'fixed',
        top: `${rect.top}px`,
        left: `${rect.left}px`,
        width: `${rect.width}px`,
        height: `${rect.height}px`,
        margin: '0',
        listStyle: 'none',
        pointerEvents: 'none',
        zIndex: 'calc(var(--z-nav) - 1)',
      });
      document.body.append(ghost);
      ghosts.push(ghost);
      running.push(ghost.animate([{ opacity: 1 }, { opacity: 0 }], { duration: base, easing: easeOut, fill: 'forwards' }));
    });

    links().forEach((link, index) => {
      running.push(
        link.animate([{ opacity: 0, transform: 'translateY(4px)' }, { opacity: 1, transform: 'none' }], {
          duration: base,
          delay: fast + index * 40,
          easing: easeOut,
          fill: 'backwards',
        }),
      );
    });
  } else {
    // Back in the layout: hold them at their final screen spot (cancelling
    // the strip's slide) while they fade back in.
    others.forEach((item) => {
      running.push(
        item.animate(
          [
            { transform: `translateX(${-stripDx}px)`, opacity: 0 },
            { opacity: 0, offset: 0.25 },
            { transform: 'none', opacity: 1 },
          ],
          timing,
        ),
      );
    });
    if (toggle) running.push(toggle.animate([{ opacity: 0 }, { opacity: 1 }], { duration: base, easing: easeOut }));
    if (search && searchShown()) {
      running.push(search.animate([{ opacity: 0 }, { opacity: 1 }], { duration: base, delay: fast, easing: easeOut, fill: 'backwards' }));
    }
  }

  await settled(running);
  if (run !== generation) return;
  ghosts.forEach((ghost) => ghost.remove());
  ghosts = [];
  releaseLayout();
}

function applyProjectsOpen(open: boolean): void {
  nav?.setAttribute('data-projects-open', String(open));
  projectsToggle?.setAttribute('aria-expanded', String(open));
}

/** clip-path that crops `outer` down to the `inner` rectangle. */
function clipTo(inner: DOMRect, outer: DOMRect, radius: string): string {
  return `inset(${inner.top - outer.top}px ${outer.right - inner.right}px ${outer.bottom - inner.bottom}px ${inner.left - outer.left}px round ${radius})`;
}

/**
 * Mobile: the Menu and "All projects" panels each replace the bar while open.
 * Opening one slides the other pill off its side of the screen, then the pill
 * grows into the panel (a clip-path reveal, so nothing reflows) and its
 * contents fade in. Closing plays it backwards.
 */
async function switchPanel(
  apply: (open: boolean) => void,
  pill: HTMLElement | null,
  other: HTMLElement | null,
  side: -1 | 1,
  open: boolean,
): Promise<void> {
  const run = ++generation;
  const { fast, base, slow, easeOut, easeInOut } = motion();
  const offscreen = (element: HTMLElement) => {
    const rect = element.getBoundingClientRect();
    return side < 0 ? -rect.right : window.innerWidth - rect.left;
  };
  const shown = (element: HTMLElement | null): element is HTMLElement =>
    !!element && getComputedStyle(element).display !== 'none';
  const contents = Array.from(pill?.children ?? []);
  const radius = pill ? getComputedStyle(pill).borderTopLeftRadius : '0px';

  if (open) {
    if (shown(other)) {
      const out = other.animate([{ transform: 'none' }, { transform: `translateX(${offscreen(other)}px)` }], {
        duration: fast,
        easing: 'ease-in',
        fill: 'forwards',
      });
      running.push(out);
      await settled([out]);
      if (run !== generation) return;
    }

    const closed = pill?.getBoundingClientRect();
    clearMotion();
    apply(true);
    if (!pill || !closed) return;
    const opened = pill.getBoundingClientRect();
    running.push(
      pill.animate([{ clipPath: clipTo(closed, opened, radius) }, { clipPath: `inset(0px round ${radius})` }], {
        duration: slow,
        easing: easeOut,
      }),
      ...contents.map((element) =>
        element.animate([{ opacity: 0 }, { opacity: 1 }], { duration: base, delay: fast, easing: easeOut, fill: 'backwards' }),
      ),
    );
    return;
  }

  if (pill) {
    // Measure the closed pill without painting it, then shrink into it
    const opened = pill.getBoundingClientRect();
    apply(false);
    const closed = pill.getBoundingClientRect();
    apply(true);

    const fadeOut = contents.map((element) =>
      element.animate([{ opacity: 1 }, { opacity: 0 }], { duration: fast, easing: 'ease-out', fill: 'forwards' }),
    );
    const shrink = pill.animate(
      [{ clipPath: `inset(0px round ${radius})` }, { clipPath: clipTo(closed, opened, radius) }],
      { duration: base, easing: easeInOut, fill: 'forwards' },
    );
    running.push(...fadeOut, shrink);
    await settled([shrink]);
    if (run !== generation) return;
  }

  clearMotion();
  apply(false);
  if (pill) {
    // The closed pill's label fades back in where the panel shrank to
    running.push(...contents.map((element) => element.animate([{ opacity: 0 }, { opacity: 1 }], { duration: fast, easing: 'ease-out' })));
  }
  if (shown(other)) {
    running.push(
      other.animate([{ transform: `translateX(${offscreen(other)}px)` }, { transform: 'none' }], {
        duration: slow,
        easing: easeOut,
      }),
    );
  }
}

export function setNavOpen(open: boolean): Promise<void> {
  if (!nav || isOpen() === open) return Promise.resolve();
  if (!animatesBar()) {
    // The search pill sits left of Menu, so it leaves to the left
    const searching = nav.dataset.search === 'true';
    return switchPanel(applyOpen, main, searching ? search : strip, searching ? -1 : 1, open);
  }
  return animateBar(open);
}

/** Mobile "All projects" dropdown (its toggle is hidden on desktop). */
export function setProjectsOpen(open: boolean): Promise<void> {
  if (!nav || isProjectsOpen() === open) return Promise.resolve();
  return switchPanel(applyProjectsOpen, strip, main, -1, open);
}

export async function closeNav(): Promise<void> {
  searchInput?.blur();
  await Promise.all([setNavOpen(false), setProjectsOpen(false), setSearching(false)]);
}

/** Marks the project at `index` as current in the strip. */
export function setActiveThumb(index: number): void {
  thumbItems().forEach((item, itemIndex) => {
    const active = itemIndex === index;
    const wasActive = item.dataset.active === 'true';
    item.dataset.active = String(active);
    const link = item.querySelector('[data-thumb]');
    if (active) link?.setAttribute('aria-current', 'true');
    else link?.removeAttribute('aria-current');
    // While the menu is open only the active thumbnail shows; ease the swap.
    if (active && !wasActive && isOpen()) {
      item.animate([{ opacity: 0 }, { opacity: 1 }], { duration: motion().fast, easing: 'ease-out' });
    }
  });
}

const isWorkPath = (path: string) => {
  const normalized = normalizePath(path);
  return normalized === '/' || normalized.startsWith('/work/');
};

const isSearchPath = (path: string) => normalizePath(path) === '/pizza-hunts';

/** Rebuilds the mobile panel's suggestion buttons for the current query */
function renderSuggestions(value: string): void {
  if (!suggestionList) return;
  suggestionList.replaceChildren(
    ...suggestions(value).map((text) => {
      const item = document.createElement('li');
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'site-nav__suggestion';
      button.textContent = text;
      button.dataset.suggestion = text;
      item.append(button);
      return item;
    }),
  );
}

/** Tells the page the query changed and flags the pill as Filled (Figma state) */
function emitSearch(): void {
  const value = searchInput?.value ?? '';
  search?.setAttribute('data-filled', String(value.trim() !== ''));
  renderSuggestions(value);
  document.dispatchEvent(new CustomEvent(SEARCH_EVENT, { detail: value }));
}

function applySearching(open: boolean): void {
  nav?.setAttribute('data-searching', String(open));
}

/**
 * Mobile search panel (Figma 207:38918): while typing, the search pill grows
 * into a panel of suggestions and the Menu pill slides off to the right.
 * Desktop just outlines the field, so it has no panel.
 */
function setSearching(open: boolean): Promise<void> {
  if (!nav || isSearching() === open || (open && animatesBar())) return Promise.resolve();
  return switchPanel(applySearching, search, main, 1, open);
}

function clearSearch(): void {
  if (!searchInput?.value) return;
  searchInput.value = '';
  emitSearch();
}

/**
 * Shows/hides the project strip (Work pages) and the search pill (Pizza hunts)
 * for the page at `path`. The bar is centered, so either one re-centers the
 * Menu pill; slide it there (FLIP) and fade the pills instead of letting them jump.
 */
export async function transitionStrip(path: string): Promise<void> {
  if (!nav || !main || !strip) return;
  const show = isWorkPath(path);
  const showSearch = isSearchPath(path);
  if (nav.dataset.strip === String(show) && nav.dataset.search === String(showSearch)) return;
  const run = ++generation;
  const { fast, slow, easeOut } = motion();

  const leaving = [...(!show && stripShown() ? [strip] : []), ...(!showSearch && search && searchShown() ? [search] : [])];
  if (leaving.length) {
    const out = leaving.map((pill) => pill.animate([{ opacity: 1 }, { opacity: 0 }], { duration: fast, easing: 'ease-out', fill: 'forwards' }));
    running.push(...out);
    await settled(out);
    if (run !== generation) return;
  }

  const hadSearch = nav.dataset.search === 'true';
  const first = main.getBoundingClientRect();
  clearMotion();
  nav.setAttribute('data-strip', String(show));
  nav.setAttribute('data-search', String(showSearch));
  if (!showSearch) clearSearch();
  const last = main.getBoundingClientRect();
  const dx = first.left - last.left;

  const timing: KeyframeAnimationOptions = { duration: slow, easing: easeOut };
  if (showSearch && !hadSearch && search && searchShown()) {
    running.push(search.animate([{ opacity: 0 }, { opacity: 1 }], timing));
  }
  if (!dx) return;

  running.push(main.animate([{ transform: `translateX(${dx}px)` }, { transform: 'none' }], timing));
  if (show && stripShown()) {
    // Slides out from behind the Menu pill
    running.push(
      strip.animate(
        [
          { transform: `translateX(${dx - (strip.getBoundingClientRect().left - last.left)}px)`, opacity: 0 },
          { transform: 'none', opacity: 1 },
        ],
        timing,
      ),
    );
  }
}

/** Re-syncs persistent nav state with the page at `path` after a Barba transition. */
export function syncNav(path: string): void {
  if (!nav) return;
  const normalized = normalizePath(path);
  if (nav.dataset.strip !== String(isWorkPath(path)) || nav.dataset.search !== String(isSearchPath(path))) {
    void transitionStrip(path);
  }

  menu?.querySelectorAll<HTMLAnchorElement>('a[data-nav-link]').forEach((link) => {
    const url = new URL(link.href, location.href);
    const linkPath = normalizePath(url.pathname);
    // Project pages belong to Work
    const current =
      url.origin === location.origin && (linkPath === normalized || (linkPath === '/' && normalized.startsWith('/work/')));
    if (current) link.setAttribute('aria-current', 'page');
    else link.removeAttribute('aria-current');
  });

  if (normalized.startsWith('/work/')) {
    const slug = normalized.slice('/work/'.length);
    const index = thumbItems().findIndex((item) => item.querySelector<HTMLElement>('[data-thumb]')?.dataset.slug === slug);
    if (index >= 0) setActiveThumb(index);
  }
}

export function initNav(root: ParentNode = document): void {
  nav = root.querySelector<HTMLElement>('[data-nav]');
  main = root.querySelector<HTMLElement>('[data-nav-main]');
  toggle = root.querySelector<HTMLButtonElement>('[data-nav-toggle]');
  menu = root.querySelector<HTMLElement>('[data-nav-menu]');
  strip = root.querySelector<HTMLElement>('[data-nav-strip]');
  projectsToggle = root.querySelector<HTMLButtonElement>('[data-projects-toggle]');
  search = root.querySelector<HTMLFormElement>('[data-nav-search]');
  searchInput = root.querySelector<HTMLInputElement>('[data-nav-search-input]');
  if (!nav || !toggle || !menu) return;

  // Pizza hunts filters as you type; Enter just closes the keyboard
  searchInput?.addEventListener('input', emitSearch);
  searchInput?.addEventListener('focus', () => void setSearching(true));
  // Close the panel once focus has left the search entirely
  search?.addEventListener('focusout', () => {
    requestAnimationFrame(() => {
      if (!search?.contains(document.activeElement)) void setSearching(false);
    });
  });
  // Suggestions: keep focus in the field while tapping, then fill it in and close
  suggestionList = root.querySelector<HTMLElement>('[data-nav-suggestions]');
  suggestionList?.addEventListener('pointerdown', (event) => {
    if ((event.target as Element | null)?.closest('[data-suggestion]')) event.preventDefault();
  });
  suggestionList?.addEventListener('click', (event) => {
    const button = (event.target as Element | null)?.closest<HTMLElement>('[data-suggestion]');
    if (!button || !searchInput) return;
    searchInput.value = button.dataset.suggestion ?? '';
    emitSearch();
    searchInput.blur();
  });
  // The × (Filled state) clears and goes back to typing
  root.querySelector('[data-nav-search-clear]')?.addEventListener('click', () => {
    clearSearch();
    searchInput?.focus();
  });
  search?.addEventListener('submit', (event) => {
    event.preventDefault();
    searchInput?.blur();
  });

  projectsToggle?.addEventListener('click', () => void setProjectsOpen(!isProjectsOpen()));

  // On the slider a thumbnail just switches slides, so close the dropdown to show it
  strip?.addEventListener('click', (event) => {
    if ((event.target as Element | null)?.closest('[data-thumb]')) void setProjectsOpen(false);
  });

  toggle.addEventListener('click', () => {
    const open = !isOpen();
    void setNavOpen(open);
    // On desktop the toggle is hidden while open, so move focus into the menu.
    if (open) menu?.querySelector<HTMLElement>('a, button')?.focus();
  });

  document.addEventListener('keydown', (event) => {
    if (event.key !== 'Escape') return;
    if (event.target === searchInput) {
      clearSearch();
      return;
    }
    if (isOpen()) {
      void setNavOpen(false);
      toggle?.focus();
    } else if (isProjectsOpen()) {
      void setProjectsOpen(false);
      projectsToggle?.focus();
    }
  });

  document.addEventListener('click', (event) => {
    if (nav?.contains(event.target as Node)) return;
    if (isOpen()) void setNavOpen(false);
    if (isProjectsOpen()) void setProjectsOpen(false);
  });
}
