import { initClock } from './clock';
import { initLenis } from './lenis';
import { initNav } from './nav';

function init(): void {
  initLenis();
  initNav();
  initClock();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
