import React from 'react';
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter } from "react-router-dom";

// Create a simple test component to isolate the issue
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: true,
      staleTime: 60 * 1000,
      gcTime: 5 * 60 * 1000,
    },
  },
});

// Simple test component that doesn't use any auth
const SimpleTest = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-4">App is Loading</h1>
        <p className="text-muted-foreground">Testing basic functionality...</p>
      </div>
    </div>
  );
};

// Minimal app to test if the issue is in the providers
const App: React.FC = () => {
  console.log('🚀 Minimal App component rendering');
  
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <SimpleTest />
      </BrowserRouter>
    </QueryClientProvider>
  );
};

export default App;