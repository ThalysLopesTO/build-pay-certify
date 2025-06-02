
import React, { createContext, useContext, useState, useEffect } from 'react';

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'foreman' | 'payroll' | 'employee';
  hourlyRate: number;
  trade: string;
  position: string;
  certificates: Certificate[];
}

export interface Certificate {
  id: string;
  name: string;
  expiryDate: string;
  fileUrl?: string;
  status: 'valid' | 'expiring' | 'expired';
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Mock users data
const mockUsers: User[] = [
  {
    id: '1',
    name: 'John Smith',
    email: 'admin@construction.com',
    role: 'admin',
    hourlyRate: 35,
    trade: 'General',
    position: 'Site Manager',
    certificates: [
      { id: '1', name: 'WHMIS', expiryDate: '2024-12-31', status: 'valid' },
      { id: '2', name: '4 Steps', expiryDate: '2024-08-15', status: 'expiring' },
      { id: '3', name: 'Working at Heights', expiryDate: '2024-10-20', status: 'valid' },
    ]
  },
  {
    id: '2',
    name: 'Mike Johnson',
    email: 'mike@construction.com',
    role: 'employee',
    hourlyRate: 28,
    trade: 'Electrical',
    position: 'Electrician',
    certificates: [
      { id: '4', name: 'WHMIS', expiryDate: '2024-12-31', status: 'valid' },
      { id: '5', name: '5 Steps', expiryDate: '2024-07-01', status: 'expired' },
      { id: '6', name: 'Union Membership', expiryDate: '2025-03-15', status: 'valid' },
    ]
  },
  {
    id: '3',
    name: 'Sarah Williams',
    email: 'sarah@construction.com',
    role: 'foreman',
    hourlyRate: 32,
    trade: 'Carpentry',
    position: 'Lead Carpenter',
    certificates: [
      { id: '7', name: 'WHMIS', expiryDate: '2024-12-31', status: 'valid' },
      { id: '8', name: 'Supervisor Certificate', expiryDate: '2024-09-30', status: 'valid' },
      { id: '9', name: 'Working at Heights', expiryDate: '2024-11-15', status: 'valid' },
    ]
  }
];

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const savedUser = localStorage.getItem('currentUser');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    // Mock authentication
    const foundUser = mockUsers.find(u => u.email === email);
    if (foundUser && password === 'password123') {
      setUser(foundUser);
      localStorage.setItem('currentUser', JSON.stringify(foundUser));
      return true;
    }
    return false;
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('currentUser');
  };

  return (
    <AuthContext.Provider value={{
      user,
      login,
      logout,
      isAuthenticated: !!user
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
