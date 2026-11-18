/**
 * Keeps the footer's copyright year current. The site is static, so the
 * year baked in at build time would go stale until the next deploy.
 */
export function initYear(container: ParentNode): void {
  const year = String(new Date().getFullYear());
  container.querySelectorAll<HTMLElement>('[data-year]').forEach((element) => {
    element.textContent = year;
  });
}
