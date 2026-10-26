import { initClock } from './clock';
import { initLenis } from './lenis';
import { initNav } from './nav';
import { initProjectPanel } from './project-panel';
import { initTransitions } from './transitions';
import { initWorkSlider } from './work-slider';

/** Per-page behavior — runs on load and for each page Barba swaps in. */
function initPage(container: ParentNode): void {
  initWorkSlider(container);
  initProjectPanel(container);
  initClock(container);
}

function init(): void {
  initLenis();
  initNav();
  initPage(document);
  initTransitions(initPage);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
