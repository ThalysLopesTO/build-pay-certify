export interface PlanFeatures {
  billsExpenses: boolean;
  materialRequests: boolean;
  personalSupport: boolean;
  customSupport: boolean;
}

export interface SubscriptionPlan {
  id: 'start' | 'builder' | 'builder_pro';
  name: string;
  displayName: string;
  price: number;
  priceDisplay: string;
  employeeLimit: number;
  stripePriceId: string;
  features: PlanFeatures;
  featureList: string[];
  badge?: string;
  popular?: boolean;
}

export const SUBSCRIPTION_PLANS: Record<string, SubscriptionPlan> = {
  start: {
    id: 'start',
    name: 'Start',
    displayName: 'StackBuild Start',
    price: 49.90,
    priceDisplay: '$49.90 CAD',
    employeeLimit: 5,
    stripePriceId: 'price_1SO2mKEuB2J4BS43soKlnGl1',
    features: {
      billsExpenses: false,
      materialRequests: false,
      personalSupport: false,
      customSupport: false,
    },
    featureList: [
      '5 Employee accounts (excl. admin)',
      'Payroll & Invoice System',
      'Certificate & Safety Tracking',
      'Time Tracking & Timesheets',
      'Project & Jobsite Control',
      'Daily Reports & Analytics',
      'Quote Generation',
      'Mobile App Access',
    ],
  },
  builder: {
    id: 'builder',
    name: 'Builder',
    displayName: 'StackBuild Builder',
    price: 89.90,
    priceDisplay: '$89.90 CAD',
    employeeLimit: 10,
    stripePriceId: 'price_1SO2nyEuB2J4BS43c9eFgZKj',
    features: {
      billsExpenses: true,
      materialRequests: true,
      personalSupport: true,
      customSupport: false,
    },
    featureList: [
      '10 Employee accounts (excl. admin)',
      'All Start plan features',
      '✅ Bills & Expenses Management',
      '✅ Material Request System',
      '✅ Personal Support 24hrs',
    ],
    badge: 'POPULAR',
    popular: true,
  },
  builder_pro: {
    id: 'builder_pro',
    name: 'Builder Pro',
    displayName: 'StackBuild Builder Pro',
    price: 129.90,
    priceDisplay: '$129.90 CAD',
    employeeLimit: 80,
    stripePriceId: 'price_1SO2ocEuB2J4BS43BYcRT2Zs',
    features: {
      billsExpenses: true,
      materialRequests: true,
      personalSupport: true,
      customSupport: true,
    },
    featureList: [
      '80 Employee accounts (excl. admin)',
      'All Builder plan features',
      '✅ Custom Support 24hrs',
      '✅ Priority feature requests',
      '✅ Advanced reporting',
    ],
  },
};

// Helper to get plan by Stripe Price ID
export const getPlanByPriceId = (priceId: string): SubscriptionPlan | null => {
  return Object.values(SUBSCRIPTION_PLANS).find(
    plan => plan.stripePriceId === priceId
  ) || null;
};

// Helper to get plan by amount (in cents) for webhook
export const getPlanByAmount = (amount: number): SubscriptionPlan | null => {
  const plans: Record<number, SubscriptionPlan> = {
    4990: SUBSCRIPTION_PLANS.start,
    8990: SUBSCRIPTION_PLANS.builder,
    12990: SUBSCRIPTION_PLANS.builder_pro,
  };
  return plans[amount] || null;
};
