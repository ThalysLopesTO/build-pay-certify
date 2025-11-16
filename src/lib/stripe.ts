import { loadStripe } from '@stripe/stripe-js';

// Load Stripe with publishable key from environment
export const stripePromise = loadStripe(
  import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || ''
);
