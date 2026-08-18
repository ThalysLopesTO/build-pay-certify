import { useAuth } from '@/contexts/SupabaseAuthContext';

/** 7 Star Family company id — the Final Site Inspection Report is exclusive to them. */
export const SEVEN_STARS_COMPANY_ID = '2e1d103d-d0c3-4ede-92d1-7be02c9d0246';

/**
 * True when the active company is 7 Star Family.
 * Used to gate the Site Inspections menu item and page.
 */
export const useIsSevenStars = (): boolean => {
  const { user } = useAuth();
  return user?.companyId === SEVEN_STARS_COMPANY_ID;
};
