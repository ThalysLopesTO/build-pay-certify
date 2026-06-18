import type { TFunction } from 'i18next';

/**
 * Translate a sidebar item by its stable `id`, falling back to the original
 * English `title` when no translation exists. English is never overridden
 * (the `menu` namespace only ships pt/es), so English wording stays exact.
 */
export const menuTitle = (t: TFunction, id: string | undefined, fallback: string): string =>
  id ? t(`menu.${id}`, { defaultValue: fallback }) : fallback;

const sectionSlug = (label: string) => label.toLowerCase().replace(/[^a-z0-9]+/g, '');

/** Translate a collapsible section label, falling back to the English label. */
export const sectionTitle = (t: TFunction, label: string): string =>
  t(`menuSection.${sectionSlug(label)}`, { defaultValue: label });
