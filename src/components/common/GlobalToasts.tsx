import React from 'react';
import { useRealtimeStatus } from '@/hooks/useRealtimeStatus';

// This component handles global toasts and is included in the App
export const GlobalToasts: React.FC = () => {
  useRealtimeStatus(); // Reactivated with stable provider
  
  return null; // No UI - just side effects
};