import { useAuth } from '@/contexts/SupabaseAuthContext';

/** 7 Star Family company id — a few features are exclusive to them. */
export const SEVEN_STARS_COMPANY_ID = '2e1d103d-d0c3-4ede-92d1-7be02c9d0246';

/** Menu/tab ids that only 7 Star Family may see. */
export const SEVEN_STARS_ONLY_TABS = new Set(['site-inspections', 'weekly-schedule']);

/**
 * True when the active company is 7 Star Family.
 * Used to gate their exclusive menu items and pages.
 */
export const useIsSevenStars = (): boolean => {
  const { user } = useAuth();
  return user?.companyId === SEVEN_STARS_COMPANY_ID;
};

/**
 * Filter that drops 7 Star-only entries from a sidebar section for every other
 * company. Shared by the admin, foreman and management sidebars.
 */
export const useSevenStarsGate = () => {
  const isSevenStars = useIsSevenStars();
  return <T extends { id?: string }>(items: T[]): T[] =>
    items.filter(i => !i.id || !SEVEN_STARS_ONLY_TABS.has(i.id) || isSevenStars);
};
