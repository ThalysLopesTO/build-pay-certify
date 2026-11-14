// Sorting and search helpers for employee pickers.

export interface NamedEmployee {
  first_name?: string | null;
  last_name?: string | null;
  position?: string | null;
}

export const employeeFullName = (e: NamedEmployee) =>
  `${e.first_name ?? ''} ${e.last_name ?? ''}`.trim() || 'Unknown';

// Lowercase and strip accents, so "conceicao" finds "Conceição".
export const normalizeForSearch = (text: string) =>
  text.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();

export const sortEmployeesByName = <T extends NamedEmployee>(list: T[]): T[] =>
  [...list].sort((a, b) =>
    employeeFullName(a).localeCompare(employeeFullName(b), undefined, { sensitivity: 'base' }),
  );

// Every typed word must appear in the name or the position, in any order.
export const matchesEmployeeSearch = (e: NamedEmployee, query: string) => {
  const words = normalizeForSearch(query).split(/\s+/).filter(Boolean);
  if (words.length === 0) return true;
  const haystack = normalizeForSearch(`${employeeFullName(e)} ${e.position ?? ''}`);
  return words.every(word => haystack.includes(word));
};
