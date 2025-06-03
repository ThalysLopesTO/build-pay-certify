
import React from 'react';
import { useAuth } from '../contexts/SupabaseAuthContext';
import { Button } from '@/components/ui/button';
import { LogOut, User, HardHat } from 'lucide-react';

const Header = () => {
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    await logout();
  };

  return (
    <header className="bg-slate-900 text-white border-b-4 border-orange-600 w-full">
      <div className="px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <HardHat className="h-8 w-8 text-orange-600" />
            <div>
              <h1 className="text-xl font-bold">Construction Payroll Manager</h1>
              <p className="text-sm text-slate-300">Safety First • Quality Work • Fair Pay</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="text-right">
              <p className="font-medium">{user?.email}</p>
              <p className="text-sm text-slate-300 capitalize">{user?.role} • {user?.trade}</p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleLogout}
              className="border-slate-600 text-slate-300 hover:bg-slate-800"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
