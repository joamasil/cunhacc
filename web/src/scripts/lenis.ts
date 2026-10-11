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
