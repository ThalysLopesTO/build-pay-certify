
import React from 'react';
import { Navigate } from 'react-router-dom';

// This component is no longer needed as HomePage.tsx handles the entry point
// Redirecting to home for any direct access
const Index = () => {
  return <Navigate to="/" replace />;
};

export default Index;
