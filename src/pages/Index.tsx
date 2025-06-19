
import React from 'react';
import { useAuth } from '../contexts/SupabaseAuthContext';
import SubscriptionLanding from '../components/SubscriptionLanding';

const Index = () => {
  const { isAuthenticated } = useAuth();
  
  // Show subscription landing for non-authenticated users
  if (!isAuthenticated) {
    return <SubscriptionLanding />;
  }
  
  // Authenticated users will be handled by the DashboardRouter in App.tsx
  return null;
};

export default Index;
