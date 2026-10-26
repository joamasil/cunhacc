import barba from '@barba/core';
import type { ITransitionData } from '@barba/core/dist/core/src/src/defs';
import { closeNav, syncNav, transitionStrip } from './nav';
import { fade, motion, settled } from './motion';
import { setInitialSlide } from './work-slider';

/*
 * Page transitions. Barba only swaps [data-barba="container"], so the nav,
 * <head> styles and <body> class are synced here by hand.
 *
 * - home → project ("expand"): the info card grows into the white panel,
 *   then the panel content fades in.
 * - project → home ("collapse"): the reverse.
 * - project → project ("swap"): the panel stays; only its content cross-fades.
 * - anything else: a plain fade.
 */

type PageInit = (container: HTMLElement) => void;

const parser = new DOMParser();
const prefetched = new Set<string>();

const css = (name: string) => getComputedStyle(document.documentElement).getPropertyValue(name).trim();

/** Copies stylesheets the next page needs (Astro emits them per page) into <head>. */
async function syncHead(doc: Document): Promise<void> {
  const loads: Promise<unknown>[] = [];

  doc.head.querySelectorAll<HTMLLinkElement>('link[rel="stylesheet"]').forEach((link) => {
    const href = link.getAttribute('href');
    if (!href || document.head.querySelector(`link[rel="stylesheet"][href="${CSS.escape(href)}"]`)) return;
    const clone = link.cloneNode() as HTMLLinkElement;
    loads.push(
      new Promise((resolve) => {
        clone.addEventListener('load', resolve, { once: true });
        clone.addEventListener('error', resolve, { once: true });
      }),
    );
    document.head.append(clone);
  });

  const existing = new Set(Array.from(document.head.querySelectorAll('style'), (style) => style.dataset.viteDevId ?? style.textContent));
  doc.head.querySelectorAll('style').forEach((style) => {
    const key = style.dataset.viteDevId ?? style.textContent;
    if (existing.has(key)) return;
    document.head.append(style.cloneNode(true));
  });

  await Promise.all(loads);
}

function slugOf(path: string | undefined): string | null {
  const match = path?.match(/^\/work\/([^/]+)/);
  return match ? match[1] : null;
}

function clipInset(inner: DOMRect, outer: DOMRect, radius: string): string {
  return `inset(${inner.top - outer.top}px ${outer.right - inner.right}px ${outer.bottom - inner.bottom}px ${inner.left - outer.left}px round ${radius})`;
}

const q = <T extends Element = HTMLElement>(root: ParentNode, selector: string) => root.querySelector<T>(selector);
/** What fades in/out when the panel opens or closes: the content and the pinned close button. */
const panelInner = (root: ParentNode) => Array.from(root.querySelectorAll<HTMLElement>('[data-panel-content], [data-panel-close]'));

async function expand({ current, next }: ITransitionData): Promise<void> {
  const card = q(current.container, '[data-info-card]');
  const slider = q(current.container, '[data-work-slider]');
  const panel = q(next.container, '[data-panel]');
  const inner = panelInner(next.container);
  if (!card || !panel) return;

  const { fast, base, slow, easeInOut } = motion();
  const radius = getComputedStyle(panel).borderTopLeftRadius;
  const from = clipInset(card.getBoundingClientRect(), panel.getBoundingClientRect(), radius);

  inner.forEach((element) => (element.style.opacity = '0'));
  panel.style.backdropFilter = `blur(${css('--surface-glass-blur')})`;

  const grow = panel.animate(
    [
      { clipPath: from, backgroundColor: css('--surface-glass') },
      { clipPath: `inset(0px 0px 0px 0px round ${radius})`, backgroundColor: css('--surface-solid') },
    ],
    { duration: slow, easing: easeInOut },
  );
  const out = [...fade([card], 1, 0, { duration: fast }), ...(slider ? fade([slider], 1, 0, { duration: slow }) : [])];

  await settled([grow, ...out]);
  panel.style.backdropFilter = '';
  inner.forEach((element) => (element.style.opacity = ''));
  await settled(fade(inner, 0, 1, { duration: base }));
}

async function collapse({ current, next }: ITransitionData): Promise<void> {
  const panel = q(current.container, '[data-panel]');
  const inner = panelInner(current.container);
  const card = q(next.container, '[data-info-card]');
  const slider = q(next.container, '[data-work-slider]');
  if (!panel || !card) return;

  const { fast, base, slow, easeInOut } = motion();
  card.style.opacity = '0';
  if (slider) slider.style.opacity = '0';

  await settled(fade(inner, 1, 0, { duration: fast }));

  const radius = getComputedStyle(panel).borderTopLeftRadius;
  const to = clipInset(card.getBoundingClientRect(), panel.getBoundingClientRect(), radius);
  panel.style.backdropFilter = `blur(${css('--surface-glass-blur')})`;

  const shrink = panel.animate(
    [
      { clipPath: `inset(0px 0px 0px 0px round ${radius})`, backgroundColor: css('--surface-solid') },
      { clipPath: to, backgroundColor: css('--surface-glass') },
    ],
    { duration: slow, easing: easeInOut, fill: 'forwards' },
  );
  const reveal = slider ? fade([slider], 0, 1, { duration: slow }) : [];

  await settled([shrink]);
  card.style.opacity = '';
  panel.style.visibility = 'hidden';
  await settled([...fade([card], 0, 1, { duration: base }), ...reveal]);
  if (slider) slider.style.opacity = '';
  [card, slider].forEach((element) => element?.getAnimations().forEach((animation) => animation.cancel()));
}

async function swap({ current, next }: ITransitionData): Promise<void> {
  const oldContent = q(current.container, '[data-panel-content]');
  const newPanel = q(next.container, '[data-panel]');
  const newContent = q(next.container, '[data-panel-content]');
  if (!newPanel || !newContent) return;

  const { base } = motion();
  newPanel.style.visibility = 'hidden';
  newContent.style.opacity = '0';

  if (oldContent) await settled(fade([oldContent], 1, 0, { duration: base }));

  current.container.style.visibility = 'hidden';
  newPanel.style.visibility = '';
  newContent.style.opacity = '';
  await settled(fade([newContent], 0, 1, { duration: base }));
}

export function initTransitions(initPage: PageInit): void {
  if (!document.querySelector('[data-barba="wrapper"]')) return;

  barba.hooks.before((data) => {
    const nextPath = data?.next.url.path;
    void closeNav().then(() => (nextPath ? transitionStrip(nextPath) : undefined));
    const slug = slugOf(data?.current.url.path);
    if (slug) setInitialSlide(slug);
  });

  barba.hooks.beforeEnter(async (data) => {
    if (!data) return;
    const doc = parser.parseFromString(data.next.html, 'text/html');
    await syncHead(doc);
    document.body.className = doc.body.className;
    syncNav(data.next.url.path ?? location.pathname);
    initPage(data.next.container);
  });

  barba.hooks.after(() => {
    window.scrollTo(0, 0);
  });

  barba.init({
    preventRunning: true,
    // On the slider, thumbnails switch slides instead of navigating.
    prevent: ({ el }) => el.hasAttribute('data-thumb') && !!document.querySelector('[data-work-slider]'),
    transitions: [
      {
        name: 'fade',
        async leave({ current }) {
          await settled(fade([current.container], 1, 0, { duration: motion().base }));
        },
        async enter({ next }) {
          await settled(fade([next.container], 0, 1, { duration: motion().base }));
        },
      },
      { name: 'expand', from: { namespace: ['home'] }, to: { namespace: ['project'] }, sync: true, enter: expand },
      { name: 'collapse', from: { namespace: ['project'] }, to: { namespace: ['home'] }, sync: true, enter: collapse },
      { name: 'swap', from: { namespace: ['project'] }, to: { namespace: ['project'] }, sync: true, enter: swap },
    ],
  });

  // Warm the cache on hover so the expand animation starts immediately.
  document.addEventListener('pointerover', (event) => {
    const link = (event.target as Element | null)?.closest<HTMLAnchorElement>('a[data-expand], a[data-thumb]');
    if (!link || prefetched.has(link.href)) return;
    prefetched.add(link.href);
    barba.prefetch(link.href);
  });
}
