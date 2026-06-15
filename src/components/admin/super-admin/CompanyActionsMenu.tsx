import React from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { MoreVertical, Key, Edit, Trash2, CreditCard, Ban } from 'lucide-react';

interface Company {
  id: string;
  name: string;
  status: string;
  admin_user_id?: string;
}

interface CompanyActionsMenuProps {
  company: Company;
  onEdit: (company: Company) => void;
  onRevoke: (company: Company) => void;
  onResetPassword: (company: Company) => void;
  onManageSubscription?: (company: Company) => void;
  onDelete?: (company: Company) => void;
  isProcessing: boolean;
}

export const CompanyActionsMenu: React.FC<CompanyActionsMenuProps> = ({
  company,
  onEdit,
  onRevoke,
  onResetPassword,
  onManageSubscription,
  onDelete,
  isProcessing,
}) => {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          disabled={isProcessing}
          className="h-8 w-8 p-0"
        >
          <MoreVertical className="h-4 w-4" />
          <span className="sr-only">Open menu</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-52 bg-background border-border shadow-lg z-50">
        {onManageSubscription && (
          <DropdownMenuItem
            onClick={() => onManageSubscription(company)}
            className="cursor-pointer"
          >
            <CreditCard className="h-4 w-4 mr-2" />
            Manage Membership
          </DropdownMenuItem>
        )}
        <DropdownMenuItem
          onClick={() => onResetPassword(company)}
          disabled={!company.admin_user_id}
          className="cursor-pointer"
        >
          <Key className="h-4 w-4 mr-2" />
          Reset Admin Password
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => onEdit(company)}
          className="cursor-pointer"
        >
          <Edit className="h-4 w-4 mr-2" />
          Edit Company
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={() => onRevoke(company)}
          className="cursor-pointer text-amber-600 focus:text-amber-600"
        >
          <Ban className="h-4 w-4 mr-2" />
          Revoke Access
        </DropdownMenuItem>
        {onDelete && (
          <DropdownMenuItem
            onClick={() => onDelete(company)}
            className="cursor-pointer text-red-600 focus:text-red-600"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Delete Permanently
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
