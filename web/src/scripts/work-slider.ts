import { motion } from './motion';
import { setActiveThumb } from './nav';

/*
 * Home slider: one project at a time, cross-faded (CSS, see index.astro).
 * It autoplays every --slide-duration, shown by the timer stroke on the
 * active thumbnail. Arrow keys, horizontal swipe/trackpad and the nav
 * thumbnails move it too (and restart the timer); it loops.
 */

const SWIPE_THRESHOLD = 50; // px of horizontal drag before a swipe counts
const WHEEL_THRESHOLD = 30; // accumulated horizontal wheel delta per step
const WHEEL_LOCK = 700; // ms between wheel-triggered steps (trackpad inertia)

let cleanup: (() => void) | null = null;
let initialSlug: string | null = null;

/** Start the next slider on this project (used when closing a project page). */
export function setInitialSlide(slug: string): void {
  initialSlug = slug;
}

export function initWorkSlider(root: ParentNode = document): void {
  cleanup?.();
  cleanup = null;

  const slider = root.querySelector<HTMLElement>('[data-work-slider]');
  if (!slider) return;

  const slides = Array.from(slider.querySelectorAll<HTMLElement>('[data-slide]'));
  const infoItems = Array.from(root.querySelectorAll<HTMLElement>('[data-info-item]'));
  const count = slides.length;
  if (count === 0) return;

  const requested = initialSlug ? slides.findIndex((slide) => slide.dataset.slug === initialSlug) : -1;
  initialSlug = null;
  let index = requested >= 0 ? requested : Math.max(0, slides.findIndex((slide) => slide.dataset.active === 'true'));

  const render = (instant = false) => {
    const animated = [...slides, ...infoItems];
    if (instant) animated.forEach((element) => (element.style.transition = 'none'));

    slides.forEach((slide, slideIndex) => {
      const active = slideIndex === index;
      slide.dataset.active = String(active);
      slide.setAttribute('aria-hidden', String(!active));
      slide.querySelectorAll<HTMLVideoElement>('[data-media-video]').forEach((video) => {
        if (active) void video.play().catch(() => undefined);
        else video.pause();
      });
    });

    infoItems.forEach((item, itemIndex) => {
      const active = itemIndex === index;
      item.dataset.active = String(active);
      if (active) item.removeAttribute('aria-hidden');
      else item.setAttribute('aria-hidden', 'true');
      const expand = item.querySelector<HTMLElement>('[data-expand]');
      if (active) expand?.removeAttribute('tabindex');
      else expand?.setAttribute('tabindex', '-1');
    });

    setActiveThumb(index);
    startTimer();

    if (instant) {
      void slider.offsetWidth; // commit the un-transitioned state
      animated.forEach((element) => (element.style.transition = ''));
    }
  };

  // The timer animation on the active thumbnail drives autoplay: when it
  // finishes, the next slide comes in.
  let timer: Animation | null = null;
  const startTimer = () => {
    timer?.cancel();
    timer = null;
    const { slide } = motion();
    const stroke = document.querySelector<SVGElement>('[data-thumb-item][data-active="true"] [data-thumb-timer]');
    if (!stroke || slide <= 0 || count < 2) return;
    const current = stroke.animate([{ strokeDashoffset: 1 }, { strokeDashoffset: 0 }], {
      duration: slide,
      easing: 'linear',
      fill: 'both',
    });
    timer = current;
    current.finished.then(
      () => {
        if (timer === current) go(index + 1);
      },
      () => undefined,
    );
    if (document.hidden) current.pause();
  };

  const go = (next: number) => {
    const wrapped = ((next % count) + count) % count;
    if (wrapped === index) return;
    index = wrapped;
    render();
  };

  const onKeydown = (event: KeyboardEvent) => {
    if (event.defaultPrevented || event.metaKey || event.ctrlKey || event.altKey) return;
    if (event.key === 'ArrowRight') go(index + 1);
    else if (event.key === 'ArrowLeft') go(index - 1);
  };

  let pointerStart: { x: number; y: number } | null = null;
  const onVisibilityChange = () => {
    if (document.hidden) timer?.pause();
    else timer?.play();
  };

  const onPointerDown = (event: PointerEvent) => {
    if (event.button !== 0) return;
    pointerStart = { x: event.clientX, y: event.clientY };
  };
  const onPointerUp = (event: PointerEvent) => {
    if (!pointerStart) return;
    const dx = event.clientX - pointerStart.x;
    const dy = event.clientY - pointerStart.y;
    pointerStart = null;
    if (Math.abs(dx) < SWIPE_THRESHOLD || Math.abs(dx) < Math.abs(dy)) return;
    go(dx < 0 ? index + 1 : index - 1);
  };
  const onPointerCancel = () => (pointerStart = null);

  let wheelDelta = 0;
  let wheelLockedUntil = 0;
  const onWheel = (event: WheelEvent) => {
    if (Math.abs(event.deltaX) <= Math.abs(event.deltaY)) return;
    event.preventDefault();
    const now = performance.now();
    if (now < wheelLockedUntil) return;
    wheelDelta += event.deltaX;
    if (Math.abs(wheelDelta) < WHEEL_THRESHOLD) return;
    go(wheelDelta > 0 ? index + 1 : index - 1);
    wheelDelta = 0;
    wheelLockedUntil = now + WHEEL_LOCK;
  };

  // Thumbnails are links to project pages; on the slider they just switch slides.
  const onThumbClick = (event: MouseEvent) => {
    const thumb = (event.target as Element | null)?.closest<HTMLElement>('[data-thumb]');
    if (!thumb || event.metaKey || event.ctrlKey || event.shiftKey) return;
    event.preventDefault();
    go(Number(thumb.dataset.index));
  };

  document.addEventListener('keydown', onKeydown);
  document.addEventListener('click', onThumbClick);
  slider.addEventListener('pointerdown', onPointerDown);
  window.addEventListener('pointerup', onPointerUp);
  window.addEventListener('pointercancel', onPointerCancel);
  window.addEventListener('wheel', onWheel, { passive: false });
  document.addEventListener('visibilitychange', onVisibilityChange);

  render(true);

  cleanup = () => {
    document.removeEventListener('keydown', onKeydown);
    document.removeEventListener('click', onThumbClick);
    slider.removeEventListener('pointerdown', onPointerDown);
    window.removeEventListener('pointerup', onPointerUp);
    window.removeEventListener('pointercancel', onPointerCancel);
    window.removeEventListener('wheel', onWheel);
    document.removeEventListener('visibilitychange', onVisibilityChange);
    timer?.cancel();
    timer = null;
  };
}

/** Stops listening (the slider's page is leaving). */
export function destroyWorkSlider(): void {
  cleanup?.();
  cleanup = null;
}
