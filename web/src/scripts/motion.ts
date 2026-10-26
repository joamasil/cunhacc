/**
 * Motion tokens from tokens.css, read at call time so JS animations use the
 * same durations/easings as CSS (and collapse under prefers-reduced-motion).
 */
export interface Motion {
  fast: number;
  base: number;
  slow: number;
  easeOut: string;
  easeInOut: string;
  /** Home slider autoplay interval (not shortened for reduced motion). */
  slide: number;
}

const ms = (value: string): number => {
  const trimmed = value.trim();
  const number = parseFloat(trimmed);
  if (Number.isNaN(number)) return 0;
  return trimmed.endsWith('ms') ? number : number * 1000;
};

export function motion(): Motion {
  const style = getComputedStyle(document.documentElement);
  const read = (name: string) => style.getPropertyValue(name);
  return {
    fast: ms(read('--motion-fast')),
    base: ms(read('--motion-base')),
    slow: ms(read('--motion-slow')),
    easeOut: read('--ease-out').trim() || 'ease-out',
    easeInOut: read('--ease-in-out').trim() || 'ease-in-out',
    slide: ms(read('--slide-duration')),
  };
}

/** Resolves when every animation has finished; cancelled ones resolve too. */
export function settled(animations: Animation[]): Promise<void> {
  return Promise.all(animations.map((animation) => animation.finished.catch(() => undefined))).then(() => undefined);
}

export function fade(
  elements: Element[],
  from: number,
  to: number,
  options: KeyframeAnimationOptions = {},
): Animation[] {
  const { base, easeOut } = motion();
  return elements.map((element) =>
    element.animate([{ opacity: from }, { opacity: to }], { duration: base, easing: easeOut, fill: 'both', ...options }),
  );
}
