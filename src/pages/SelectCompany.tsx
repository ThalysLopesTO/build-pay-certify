import React, { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Building2, ChevronRight, Loader2, LogOut } from 'lucide-react';
import { activateCompany, dashboardPathForRole } from '@/lib/auth/companySelection';
import { toast } from '@/hooks/use-toast';

const roleLabel = (role: string) => {
  switch (role) {
    case 'admin':
      return 'Admin';
    case 'management':
      return 'Management';
    case 'foreman':
      return 'Foreman';
    case 'employee':
      return 'Employee';
    default:
      return role;
  }
};

const SelectCompany = () => {
  const { user, loading, logout, needsCompanySelection } = useAuth();
  const [selectingId, setSelectingId] = useState<string | null>(null);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950">
        <Loader2 className="h-8 w-8 animate-spin text-white" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/admin-login" replace />;
  }

  const memberships = user.memberships || [];

  // Direct visits when no selection is pending: go to the active dashboard
  if (!needsCompanySelection && (user.companyId || memberships.length === 0)) {
    return <Navigate to={dashboardPathForRole(user.role)} replace />;
  }

  const handleSignOut = async () => {
    try {
      await logout();
    } finally {
      // Hard redirect — the auth listener doesn't clear state on SIGNED_OUT,
      // so a full navigation is what reliably leaves this page (same pattern
      // as UserProfileMenu).
      window.location.replace('/admin-login');
    }
  };

  const handleSelect = async (companyId: string, role: string) => {
    if (selectingId) return;
    setSelectingId(companyId);
    try {
      await activateCompany(companyId, role);
      // activateCompany performs a full navigation on success
    } catch (error: any) {
      setSelectingId(null);
      toast({
        title: 'Could not open company',
        description: error.message || 'Please try again.',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center space-y-2">
          <div className="mx-auto w-12 h-12 rounded-xl bg-emerald-500/15 flex items-center justify-center">
            <Building2 className="h-6 w-6 text-emerald-400" />
          </div>
          <h1 className="text-2xl font-bold text-white">Choose a company</h1>
          <p className="text-sm text-slate-400">
            Your account belongs to {memberships.length} companies. Select which one you want to work in.
          </p>
        </div>

        <div className="space-y-3">
          {memberships.map((m) => (
            <Card
              key={m.companyId}
              role="button"
              tabIndex={0}
              onClick={() => handleSelect(m.companyId, m.role)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') handleSelect(m.companyId, m.role);
              }}
              className="cursor-pointer border-slate-800 bg-slate-900 hover:bg-slate-800 hover:border-emerald-500/50 transition-colors"
            >
              <CardContent className="flex items-center justify-between gap-3 p-4">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-lg bg-slate-800 flex items-center justify-center shrink-0">
                    <Building2 className="h-5 w-5 text-slate-300" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-white truncate">
                      {m.companyName || 'Company'}
                    </p>
                    <Badge variant="secondary" className="mt-1 text-xs">
                      {roleLabel(m.role)}
                    </Badge>
                  </div>
                </div>
                {selectingId === m.companyId ? (
                  <Loader2 className="h-5 w-5 animate-spin text-emerald-400 shrink-0" />
                ) : (
                  <ChevronRight className="h-5 w-5 text-slate-500 shrink-0" />
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="text-center">
          <Button
            variant="ghost"
            className="text-slate-400 hover:text-white"
            onClick={handleSignOut}
          >
            <LogOut className="h-4 w-4 mr-2" />
            Sign out
          </Button>
        </div>
      </div>
    </div>
  );
};

export default SelectCompany;
