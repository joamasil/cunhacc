/** Renders a live "HH:MM:SS (GMT+N)" clock into every [data-clock][data-time-zone] element. */
export function initClock(root: ParentNode = document): void {
  const clocks = root.querySelectorAll<HTMLElement>('[data-clock][data-time-zone]');
  if (clocks.length === 0) return;

  const formatters = new Map<string, { time: Intl.DateTimeFormat; zone: Intl.DateTimeFormat }>();
  const formattersFor = (timeZone: string) => {
    let f = formatters.get(timeZone);
    if (!f) {
      f = {
        time: new Intl.DateTimeFormat('en-GB', {
          timeZone,
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hourCycle: 'h23',
        }),
        zone: new Intl.DateTimeFormat('en-GB', { timeZone, timeZoneName: 'shortOffset' }),
      };
      formatters.set(timeZone, f);
    }
    return f;
  };

  const tick = () => {
    const now = new Date();
    clocks.forEach((el) => {
      const { time, zone } = formattersFor(el.dataset.timeZone!);
      const offset = zone.formatToParts(now).find((p) => p.type === 'timeZoneName')?.value ?? '';
      el.textContent = `${time.format(now)} (${offset})`;
    });
  };

  tick();
  window.setInterval(tick, 1000);
}
