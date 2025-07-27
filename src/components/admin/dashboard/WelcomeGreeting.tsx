
import React from 'react';
import { useAuth } from '@/contexts/SupabaseAuthContext';

const WelcomeGreeting = () => {
  const { user } = useAuth();

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const getFirstName = () => {
    if (user?.firstName) return user.firstName;
    if (user?.email) {
      const emailName = user.email.split('@')[0];
      return emailName.charAt(0).toUpperCase() + emailName.slice(1);
    }
    return 'there';
  };

  return (
    <div className="mb-2">
      <p className="text-xl font-medium text-gray-900">
        👋 {getGreeting()}, {getFirstName()}! Here's an overview of your company.
      </p>
    </div>
  );
};

export default WelcomeGreeting;
