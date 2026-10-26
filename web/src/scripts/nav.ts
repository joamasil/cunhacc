import { motion, settled } from './motion';

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
let running: Animation[] = [];
let ghosts: HTMLElement[] = [];
let generation = 0;

const isOpen = () => menu?.getAttribute('data-open') === 'true';
const thumbItems = () => Array.from(strip?.querySelectorAll<HTMLElement>('[data-thumb-item]') ?? []);
const links = () => Array.from(menu?.querySelectorAll<HTMLElement>('[data-nav-link]') ?? []);
const normalizePath = (path: string) => path.replace(/\/$/, '') || '/';
const stripShown = () => !!strip && getComputedStyle(strip).display !== 'none';

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
 * Desktop strip choreography (FLIP): the Menu pill grows into the link row
 * over the strip, the active thumbnail slides to the right end, and the other
 * thumbnails fade out where they stood. Closing plays it backwards.
 */
async function animateBar(open: boolean): Promise<void> {
  if (!main || !strip) return;
  const run = ++generation;
  const { fast, base, slow, easeOut } = motion();
  const items = thumbItems();
  const active = items.find((item) => item.dataset.active === 'true');
  const others = items.filter((item) => item !== active);

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
  }

  await settled(running);
  if (run !== generation) return;
  ghosts.forEach((ghost) => ghost.remove());
  ghosts = [];
  releaseLayout();
}

export function setNavOpen(open: boolean): Promise<void> {
  if (!nav || isOpen() === open) return Promise.resolve();
  if (!stripShown()) {
    generation++;
    clearMotion();
    applyOpen(open);
    return Promise.resolve();
  }
  return animateBar(open);
}

export function closeNav(): Promise<void> {
  return setNavOpen(false);
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

/**
 * Shows/hides the project strip for the page at `path`. The bar is centered,
 * so toggling the strip re-centers the Menu pill; slide it there (FLIP) and
 * fade the strip instead of letting it jump.
 */
export async function transitionStrip(path: string): Promise<void> {
  if (!nav || !main || !strip) return;
  const show = isWorkPath(path);
  if (nav.dataset.strip === String(show)) return;
  const run = ++generation;
  const { fast, slow, easeOut } = motion();

  if (!show && stripShown()) {
    const out = strip.animate([{ opacity: 1 }, { opacity: 0 }], { duration: fast, easing: 'ease-out', fill: 'forwards' });
    running.push(out);
    await settled([out]);
    if (run !== generation) return;
  }

  const first = main.getBoundingClientRect();
  clearMotion();
  nav.setAttribute('data-strip', String(show));
  const last = main.getBoundingClientRect();
  const dx = first.left - last.left;
  if (!dx) return;

  const timing: KeyframeAnimationOptions = { duration: slow, easing: easeOut };
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
  if (nav.dataset.strip !== String(isWorkPath(path))) void transitionStrip(path);

  menu?.querySelectorAll<HTMLAnchorElement>('a[data-nav-link]').forEach((link) => {
    const url = new URL(link.href, location.href);
    const current = url.origin === location.origin && normalizePath(url.pathname) === normalized;
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
  if (!nav || !toggle || !menu) return;

  toggle.addEventListener('click', () => {
    const open = !isOpen();
    void setNavOpen(open);
    // On desktop the toggle is hidden while open, so move focus into the menu.
    if (open) menu?.querySelector<HTMLElement>('a, button')?.focus();
  });

  document.addEventListener('keydown', (event) => {
    if (event.key !== 'Escape' || !isOpen()) return;
    void setNavOpen(false);
    toggle?.focus();
  });

  document.addEventListener('click', (event) => {
    if (isOpen() && !nav?.contains(event.target as Node)) void setNavOpen(false);
  });
}
