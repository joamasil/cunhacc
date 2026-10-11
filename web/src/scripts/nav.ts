export function initNav(root: ParentNode = document): void {
  const nav = root.querySelector<HTMLElement>('[data-nav]');
  const toggle = root.querySelector<HTMLButtonElement>('[data-nav-toggle]');
  const menu = root.querySelector<HTMLElement>('[data-nav-menu]');
  if (!nav || !toggle || !menu) return;

  const isOpen = () => menu.getAttribute('data-open') === 'true';

  const setOpen = (open: boolean) => {
    nav.setAttribute('data-open', String(open));
    menu.setAttribute('data-open', String(open));
    toggle.setAttribute('aria-expanded', String(open));
  };

  toggle.addEventListener('click', () => {
    const open = !isOpen();
    setOpen(open);
    // On desktop the toggle is hidden while open, so move focus into the menu.
    if (open) menu.querySelector<HTMLElement>('a, button')?.focus();
  });

  document.addEventListener('keydown', (event) => {
    if (event.key !== 'Escape' || !isOpen()) return;
    setOpen(false);
    toggle.focus();
  });

  document.addEventListener('click', (event) => {
    if (isOpen() && !nav.contains(event.target as Node)) setOpen(false);
  });
}
