import React, { useState } from 'react';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Building2, Check, ChevronsUpDown, Loader2 } from 'lucide-react';
import { activateCompany } from '@/lib/auth/companySelection';
import { toast } from '@/hooks/use-toast';

interface CompanySwitcherProps {
  variant?: 'desktop' | 'mobile';
}

// Shown only to users who belong to more than one company: lets them jump
// between workspaces without logging out (full reload on switch).
const CompanySwitcher = ({ variant = 'desktop' }: CompanySwitcherProps) => {
  const { user } = useAuth();
  const [switchingId, setSwitchingId] = useState<string | null>(null);

  const memberships = user?.memberships || [];
  if (!user?.companyId || memberships.length < 2) return null;

  const handleSwitch = async (companyId: string, role: string) => {
    if (companyId === user.companyId || switchingId) return;
    setSwitchingId(companyId);
    try {
      await activateCompany(companyId, role);
      // activateCompany navigates away on success
    } catch (error: any) {
      setSwitchingId(null);
      toast({
        title: 'Could not switch company',
        description: error.message || 'Please try again.',
        variant: 'destructive',
      });
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className={variant === 'mobile' ? 'h-8 px-2 max-w-[130px]' : 'max-w-[220px]'}
        >
          <Building2 className="h-4 w-4 mr-1.5 shrink-0" />
          <span className="truncate">{user.companyName || 'Company'}</span>
          <ChevronsUpDown className="h-3.5 w-3.5 ml-1.5 shrink-0 opacity-60" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        <DropdownMenuLabel>Switch company</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {memberships.map((m) => (
          <DropdownMenuItem
            key={m.companyId}
            onClick={() => handleSwitch(m.companyId, m.role)}
            className="cursor-pointer"
          >
            <div className="flex items-center justify-between w-full gap-2">
              <div className="min-w-0">
                <p className="truncate font-medium">{m.companyName || 'Company'}</p>
                <p className="text-xs text-muted-foreground capitalize">{m.role.replace('_', ' ')}</p>
              </div>
              {switchingId === m.companyId ? (
                <Loader2 className="h-4 w-4 animate-spin shrink-0" />
              ) : m.companyId === user.companyId ? (
                <Check className="h-4 w-4 text-emerald-500 shrink-0" />
              ) : null}
            </div>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default CompanySwitcher;
