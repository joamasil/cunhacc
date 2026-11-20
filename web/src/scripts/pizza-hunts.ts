/*
 * Pizza hunts list: one row open at a time, sortable columns, and filtering
 * from the search field in the bottom nav. The nav persists across Barba
 * transitions, so it reports queries through a document event (see nav.ts)
 * and this module points at whichever list is currently on the page.
 */

export const SEARCH_EVENT = 'pizza-search';

type SortKey = 'name' | 'city' | 'country';
type Direction = 'asc' | 'desc';

let list: HTMLElement | null = null;
let listening = false;

const rowsOf = (root: ParentNode) => Array.from(root.querySelectorAll<HTMLElement>('[data-pizza-row]'));
const collator = new Intl.Collator(undefined, { sensitivity: 'base' });
/** Case- and accent-insensitive ("bæst", "Napoli", "napoli") */
const fold = (text: string) => text.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase();

function setOpen(row: HTMLElement, open: boolean): void {
  row.dataset.open = String(open);
  const toggle = row.querySelector<HTMLButtonElement>('[data-pizza-toggle]');
  const details = row.querySelector<HTMLElement>('[data-pizza-details]');
  const name = row.dataset.name ?? '';
  toggle?.setAttribute('aria-expanded', String(open));
  toggle?.setAttribute('aria-label', `${name}: ${open ? 'hide' : 'show'} details`);
  if (details) details.inert = !open;
}

function toggleRow(root: HTMLElement, row: HTMLElement): void {
  const open = row.dataset.open !== 'true';
  rowsOf(root).forEach((other) => {
    if (other !== row && other.dataset.open === 'true') setOpen(other, false);
  });
  setOpen(row, open);
}

function filter(root: HTMLElement, query: string): void {
  const needle = fold(query.trim());
  let shown = 0;
  rowsOf(root).forEach((row) => {
    const haystack = fold(`${row.dataset.name} ${row.dataset.city} ${row.dataset.country}`);
    const match = !needle || haystack.includes(needle);
    row.hidden = !match;
    if (match) shown += 1;
    else if (row.dataset.open === 'true') setOpen(row, false);
  });

  const empty = root.querySelector<HTMLElement>('[data-pizza-empty]');
  if (empty) empty.hidden = shown > 0;
  const status = root.querySelector<HTMLElement>('[data-pizza-status]');
  if (status) status.textContent = needle ? `${shown} ${shown === 1 ? 'pizzeria' : 'pizzerias'} found` : '';
}

function sort(root: HTMLElement, key: SortKey, direction: Direction): void {
  const rowsList = root.querySelector<HTMLElement>('[data-pizza-rows]');
  if (!rowsList) return;
  const sign = direction === 'asc' ? 1 : -1;
  const sorted = rowsOf(root).sort(
    (a, b) =>
      sign * collator.compare(a.dataset[key] ?? '', b.dataset[key] ?? '') ||
      // Ties keep their original (CMS) order
      Number(a.dataset.index) - Number(b.dataset.index),
  );
  rowsList.append(...sorted);

  root.querySelectorAll<HTMLButtonElement>('[data-sort]').forEach((button) => {
    const active = button.dataset.sort === key;
    button.setAttribute('aria-pressed', String(active));
    if (active) button.dataset.direction = direction;
    else delete button.dataset.direction;
    const state = button.querySelector('[data-sort-state]');
    if (state) state.textContent = active ? (direction === 'asc' ? ', sorted A to Z' : ', sorted Z to A') : '';
  });
}

/**
 * Up to `limit` distinct pizzerias, cities and countries matching `query`,
 * those starting with it first. Feeds the mobile search panel.
 */
export function suggestions(query: string, limit = 5): string[] {
  const needle = fold(query.trim());
  if (!needle || !list?.isConnected) return [];
  const values = new Map<string, string>();
  rowsOf(list).forEach((row) => {
    [row.dataset.country, row.dataset.city, row.dataset.name].forEach((value) => {
      if (value && !values.has(fold(value))) values.set(fold(value), value);
    });
  });
  const matches = [...values].filter(([folded]) => folded.includes(needle));
  const starts = matches.filter(([folded]) => folded.startsWith(needle));
  const rest = matches.filter(([folded]) => !folded.startsWith(needle));
  return [...starts, ...rest].slice(0, limit).map(([, value]) => value);
}

export function initPizzaHunts(root: ParentNode = document): void {
  const page = root.querySelector<HTMLElement>('[data-pizza-hunts]');
  list = page;
  // Barba's first-load hook can run this again for the same page
  if (!page || page.dataset.ready) return;
  page.dataset.ready = 'true';

  page.querySelectorAll<HTMLButtonElement>('[data-sort]').forEach((button) => {
    button.addEventListener('click', () => {
      const key = button.dataset.sort as SortKey;
      // First click sorts A–Z, then each click flips it
      const direction: Direction = button.dataset.direction === 'asc' ? 'desc' : 'asc';
      sort(page, key, direction);
    });
  });

  // The whole row opens it, except clicks on its links
  page.addEventListener('click', (event) => {
    const target = event.target as Element | null;
    const row = target?.closest<HTMLElement>('[data-pizza-row]');
    // Rows without details have no toggle and don't open
    if (!row || row.dataset.expandable !== 'true' || target?.closest('a')) return;
    // Selecting text in the details shouldn't close the row
    if (!target?.closest('[data-pizza-toggle]') && window.getSelection()?.toString()) return;
    toggleRow(page, row);
  });

  if (!listening) {
    listening = true;
    document.addEventListener(SEARCH_EVENT, (event) => {
      if (list?.isConnected) filter(list, (event as CustomEvent<string>).detail);
    });
  }
}
