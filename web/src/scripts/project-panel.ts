import Lenis from 'lenis';

/*
 * The project panel scrolls inside itself (the page behind it doesn't), so it
 * gets its own Lenis instance on the panel scroller.
 */

let panelLenis: Lenis | null = null;

export function initProjectPanel(root: ParentNode = document): void {
  panelLenis?.destroy();
  panelLenis = null;

  const scroller = root.querySelector<HTMLElement>('[data-panel-scroller]');
  const content = scroller?.firstElementChild as HTMLElement | null;
  if (!scroller || !content) return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  panelLenis = new Lenis({ wrapper: scroller, content, autoRaf: true });
}
