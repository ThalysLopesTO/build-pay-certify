import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useCreateClient } from '@/hooks/useClients';
import { getActiveCompanyId } from '@/lib/auth/activeCompany';

interface Client {
  id: string;
  client_name: string;
  client_company?: string;
  client_email: string;
  client_phone?: string;
  client_address?: string;
}

interface QuickClientModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onClientCreated: (client: Client) => void;
}

const QuickClientModal: React.FC<QuickClientModalProps> = ({
  open,
  onOpenChange,
  onClientCreated,
}) => {
  const [formData, setFormData] = useState({
    client_name: '',
    client_company: '',
    client_email: '',
    client_phone: '',
    client_address: '',
  });

  const createClient = useCreateClient();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.client_name || !formData.client_email) {
      return;
    }

    try {
      const activeCompanyId = await getActiveCompanyId();

      const newClient = await createClient.mutateAsync({
        ...formData,
        company_id: activeCompanyId!,
      });
      onClientCreated(newClient as Client);
      setFormData({
        client_name: '',
        client_company: '',
        client_email: '',
        client_phone: '',
        client_address: '',
      });
    } catch (error) {
      console.error('Failed to create client:', error);
    }
  };

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Quick Add Client</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="quick_client_name">Client Name *</Label>
              <Input
                id="quick_client_name"
                value={formData.client_name}
                onChange={(e) => handleChange('client_name', e.target.value)}
                placeholder="John Doe"
                required
              />
            </div>
            <div>
              <Label htmlFor="quick_client_email">Email *</Label>
              <Input
                id="quick_client_email"
                type="email"
                value={formData.client_email}
                onChange={(e) => handleChange('client_email', e.target.value)}
                placeholder="john@example.com"
                required
              />
            </div>
            <div>
              <Label htmlFor="quick_client_company">Company</Label>
              <Input
                id="quick_client_company"
                value={formData.client_company}
                onChange={(e) => handleChange('client_company', e.target.value)}
                placeholder="Company Name"
              />
            </div>
            <div>
              <Label htmlFor="quick_client_phone">Phone</Label>
              <Input
                id="quick_client_phone"
                type="tel"
                value={formData.client_phone}
                onChange={(e) => handleChange('client_phone', e.target.value)}
                placeholder="(555) 123-4567"
              />
            </div>
          </div>
          <div>
            <Label htmlFor="quick_client_address">Address</Label>
            <Textarea
              id="quick_client_address"
              value={formData.client_address}
              onChange={(e) => handleChange('client_address', e.target.value)}
              placeholder="123 Main St, City, Province, Postal Code"
              rows={2}
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={createClient.isPending}>
              {createClient.isPending ? 'Creating...' : 'Create Client'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default QuickClientModal;
