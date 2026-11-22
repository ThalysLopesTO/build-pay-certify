import { describe, expect, test } from 'bun:test';
import {
  addCatalogPicks,
  addCustomItem,
  cleanQuantity,
  sameItems,
  takeoffLine,
  takeoffText,
  type TakeoffItemDraft,
} from '../src/utils/takeoffItems';

const stud = { id: 'cat-stud', name: '2x4 SPF Stud', spec_size: '8 ft', unit: 'pcs', category_name: 'Lumber', sku: 'LUM-248' };
const drywall = { id: 'cat-dw', name: 'Drywall 1/2"', spec_size: '4x8', unit: 'sheet', category_name: 'Drywall' };

describe('material takeoff list', () => {
  test('adds several catalog items with their quantities', () => {
    const list = addCatalogPicks([], [{ item: stud, quantity: 50 }, { item: drywall, quantity: 20 }]);
    expect(list.map(i => [i.name, i.quantity, i.unit])).toEqual([
      ['2x4 SPF Stud', 50, 'pcs'],
      ['Drywall 1/2"', 20, 'sheet'],
    ]);
    expect(list[0]).toMatchObject({ catalog_item_id: 'cat-stud', sku: 'LUM-248', spec_size: '8 ft', category_name: 'Lumber' });
    expect(new Set(list.map(i => i.id)).size).toBe(2);
  });

  test('picking an item already on the list adds to its quantity', () => {
    const first = addCatalogPicks([], [{ item: stud, quantity: 50 }]);
    const again = addCatalogPicks(first, [{ item: stud, quantity: 10 }]);
    expect(again).toHaveLength(1);
    expect(again[0].quantity).toBe(60);
    expect(again[0].id).toBe(first[0].id);
    expect(first[0].quantity).toBe(50); // original list not changed
  });

  test('custom items have no catalog link and need a name', () => {
    const list = addCustomItem([], { name: '  Special anchor bolts ', unit: 'box', quantity: 3 });
    expect(list[0]).toMatchObject({ name: 'Special anchor bolts', unit: 'box', quantity: 3, catalog_item_id: null });
    expect(addCustomItem(list, { name: '   ', unit: 'pcs', quantity: 1 })).toHaveLength(1);
  });

  test('quantities are never negative and keep 2 decimals', () => {
    expect(cleanQuantity(-5)).toBe(0);
    expect(cleanQuantity('abc')).toBe(0);
    expect(cleanQuantity('12.345')).toBe(12.35);
    expect(cleanQuantity(7)).toBe(7);
  });

  test('text export lists materials then notes', () => {
    const list = addCatalogPicks([], [{ item: stud, quantity: 50 }]);
    list[0].notes = 'deliver first';
    const text = takeoffText('11 Brock Av', list, 'Delivery needed by Friday');
    expect(text).toContain('Material Takeoff - 11 Brock Av');
    expect(text).toContain('1. 2x4 SPF Stud (8 ft) — 50 pcs — deliver first');
    expect(text).toContain('NOTES\nDelivery needed by Friday');
    expect(takeoffLine({ name: 'Screws', spec_size: null, quantity: 2.5, unit: 'box', notes: null })).toBe('Screws — 2.5 box');
  });

  test('detects changes to the list', () => {
    const list: TakeoffItemDraft[] = addCatalogPicks([], [{ item: stud, quantity: 50 }]);
    expect(sameItems(list, list.map(i => ({ ...i })))).toBe(true);
    expect(sameItems(list, [{ ...list[0], quantity: 51 }])).toBe(false);
    expect(sameItems(list, [])).toBe(false);
  });
});
