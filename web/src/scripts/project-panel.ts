import Lenis from 'lenis';

/*
 * The project panel scrolls inside itself (the page behind it doesn't): the
 * gallery and info columns each get their own Lenis instance. On narrow
 * screens the columns stack and the whole panel content scrolls as one.
 */

let panelLenis: Lenis[] = [];
let videoObserver: IntersectionObserver | null = null;

/*
 * Gallery videos play while on screen and pause when scrolled away. Played
 * from here rather than via `autoplay`, which browsers skip for markup Barba
 * swaps in.
 */
function initVideos(root: ParentNode): void {
  videoObserver?.disconnect();
  videoObserver = null;

  const videos = Array.from(root.querySelectorAll<HTMLVideoElement>('[data-panel] [data-media-video]'));
  if (videos.length === 0) return;

  videoObserver = new IntersectionObserver((entries) => {
    entries.forEach(({ target, isIntersecting }) => {
      const video = target as HTMLVideoElement;
      if (isIntersecting) {
        video.muted = true; // autoplay policy: only muted videos may start without a gesture
        void video.play().catch(() => undefined);
      } else {
        video.pause();
      }
    });
  });
  videos.forEach((video) => videoObserver?.observe(video));
}

/** "Read more +" reveals the rest of the description, then goes away. */
function initReadMore(root: ParentNode): void {
  const toggle = root.querySelector<HTMLButtonElement>('[data-read-more]');
  const more = toggle && root.querySelector<HTMLElement>(`#${toggle.getAttribute('aria-controls')}`);
  if (!toggle || !more) return;

  toggle.addEventListener('click', () => {
    more.hidden = false;
    toggle.remove();
    // The column's own box doesn't change size, so Lenis won't notice the taller content by itself
    panelLenis.forEach((lenis) => lenis.resize());
  });
}

export function initProjectPanel(root: ParentNode = document): void {
  initReadMore(root);
  initVideos(root);

  panelLenis.forEach((lenis) => lenis.destroy());
  panelLenis = [];

  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const stacked = window.matchMedia('(max-width: 1023px)').matches;
  const scrollers = stacked
    ? Array.from(root.querySelectorAll<HTMLElement>('[data-panel-content]'))
    : Array.from(root.querySelectorAll<HTMLElement>('[data-panel-scroll]'));

  // Each scroller is its own content: its scrollHeight already covers all its children
  panelLenis = scrollers.map((scroller) => new Lenis({ wrapper: scroller, content: scroller, autoRaf: true }));
}
