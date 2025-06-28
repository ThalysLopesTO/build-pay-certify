
import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/SupabaseAuthContext';

interface LicenseDetailsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const LicenseDetailsModal: React.FC<LicenseDetailsModalProps> = ({
  open,
  onOpenChange
}) => {
  const { user } = useAuth();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>License Details</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-gray-600">Company Name</label>
            <p className="text-gray-900 mt-1">{user?.companyName || 'Not available'}</p>
          </div>
          
          <div>
            <label className="text-sm font-medium text-gray-600">Plan Type</label>
            <div className="mt-1">
              <Badge variant="outline">Free Plan</Badge>
            </div>
          </div>
          
          <div>
            <label className="text-sm font-medium text-gray-600">Status</label>
            <div className="mt-1">
              <Badge className="bg-green-500">🟢 Active</Badge>
            </div>
          </div>
          
          <div>
            <label className="text-sm font-medium text-gray-600">License Expiration</label>
            <p className="text-gray-900 mt-1">Not set</p>
          </div>
          
          <div>
            <label className="text-sm font-medium text-gray-600">Company ID</label>
            <p className="text-gray-500 text-sm mt-1 font-mono">{user?.companyId || 'Not available'}</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default LicenseDetailsModal;
