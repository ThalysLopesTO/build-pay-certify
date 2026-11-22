// Helpers for the material takeoff list (pure, no React / Supabase).

export interface TakeoffItemDraft {
  /** Row id (kept stable so saving updates instead of recreating). */
  id: string;
  catalog_item_id: string | null;
  name: string;
  sku: string | null;
  spec_size: string | null;
  unit: string;
  category_name: string | null;
  quantity: number;
  notes: string | null;
}

export interface CatalogPick {
  id: string;
  name: string;
  sku?: string | null;
  spec_size?: string | null;
  unit: string;
  category_name?: string | null;
}

const newId = () =>
  typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
        const r = (Math.random() * 16) | 0;
        return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16);
      });

/**
 * Add picked catalog items to the list. A material that is already on the
 * list gets the new quantity added to it instead of a second line.
 */
export const addCatalogPicks = (
  items: TakeoffItemDraft[],
  picks: Array<{ item: CatalogPick; quantity: number }>,
): TakeoffItemDraft[] => {
  const next = items.map(i => ({ ...i }));
  for (const { item, quantity } of picks) {
    const qty = cleanQuantity(quantity);
    const existing = next.find(i => i.catalog_item_id === item.id);
    if (existing) {
      existing.quantity = cleanQuantity(existing.quantity + qty);
      continue;
    }
    next.push({
      id: newId(),
      catalog_item_id: item.id,
      name: item.name,
      sku: item.sku || null,
      spec_size: item.spec_size || null,
      unit: item.unit || 'pcs',
      category_name: item.category_name || null,
      quantity: qty,
      notes: null,
    });
  }
  return next;
};

export const addCustomItem = (
  items: TakeoffItemDraft[],
  custom: { name: string; unit: string; quantity: number },
): TakeoffItemDraft[] => {
  const name = custom.name.trim();
  if (!name) return items;
  return [
    ...items,
    {
      id: newId(),
      catalog_item_id: null,
      name,
      sku: null,
      spec_size: null,
      unit: custom.unit.trim() || 'pcs',
      category_name: null,
      quantity: cleanQuantity(custom.quantity),
      notes: null,
    },
  ];
};

/** Quantities are never negative and keep at most 2 decimals. */
export const cleanQuantity = (value: number | string): number => {
  const n = typeof value === 'string' ? parseFloat(value) : value;
  if (!Number.isFinite(n) || n < 0) return 0;
  return Math.round(n * 100) / 100;
};

export const formatQuantity = (n: number) =>
  Number.isInteger(n) ? String(n) : n.toFixed(2).replace(/0$/, '');

/** "2x4 SPF (8 ft) — 50 pcs" */
export const takeoffLine = (i: Pick<TakeoffItemDraft, 'name' | 'spec_size' | 'quantity' | 'unit' | 'notes'>) => {
  const size = i.spec_size ? ` (${i.spec_size})` : '';
  const note = i.notes?.trim() ? ` — ${i.notes.trim()}` : '';
  return `${i.name}${size} — ${formatQuantity(i.quantity)} ${i.unit}${note}`;
};

/** Plain-text version of the whole takeoff, for the .txt export. */
export const takeoffText = (
  jobsiteName: string,
  items: TakeoffItemDraft[],
  notes: string,
  dates?: { created?: string; updated?: string },
) => {
  const lines = [`Material Takeoff - ${jobsiteName}`];
  if (dates?.created) lines.push(`Created: ${dates.created}`);
  if (dates?.updated) lines.push(`Last Updated: ${dates.updated}`);
  lines.push('');
  if (items.length > 0) {
    lines.push(`MATERIALS (${items.length})`);
    items.forEach((i, n) => lines.push(`${n + 1}. ${takeoffLine(i)}`));
    lines.push('');
  }
  if (notes.trim()) {
    lines.push('NOTES');
    lines.push(notes.trim());
  }
  return lines.join('\n');
};

/** True when two lists would save the same rows (order included). */
export const sameItems = (a: TakeoffItemDraft[], b: TakeoffItemDraft[]) =>
  a.length === b.length &&
  a.every((x, i) => {
    const y = b[i];
    return (
      x.id === y.id &&
      x.name === y.name &&
      x.unit === y.unit &&
      x.quantity === y.quantity &&
      (x.notes || '') === (y.notes || '')
    );
  });
