import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Client, useCreateClient, useUpdateClient } from '@/hooks/useClients';
import { useAuth } from '@/contexts/SupabaseAuthContext';

interface ClientFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  client?: Client;
}

export function ClientFormModal({ isOpen, onClose, client }: ClientFormModalProps) {
  const { user } = useAuth();
  const createClient = useCreateClient();
  const updateClient = useUpdateClient();
  const [formData, setFormData] = useState({
    client_name: '',
    client_company: '',
    client_email: '',
    client_phone: '',
    client_address: '',
  });

  useEffect(() => {
    if (client) {
      setFormData({
        client_name: client.client_name,
        client_company: client.client_company || '',
        client_email: client.client_email,
        client_phone: client.client_phone || '',
        client_address: client.client_address || '',
      });
    } else {
      setFormData({
        client_name: '',
        client_company: '',
        client_email: '',
        client_phone: '',
        client_address: '',
      });
    }
  }, [client, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (client) {
      await updateClient.mutateAsync({
        id: client.id,
        ...formData,
      });
    } else {
      if (!user?.companyId) return;
      await createClient.mutateAsync({
        company_id: user.companyId,
        ...formData,
      });
    }

    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{client ? 'Edit Client' : 'New Client'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="client_name">Client Name *</Label>
              <Input
                id="client_name"
                value={formData.client_name}
                onChange={(e) => setFormData({ ...formData, client_name: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="client_company">Company</Label>
              <Input
                id="client_company"
                value={formData.client_company}
                onChange={(e) => setFormData({ ...formData, client_company: e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="client_email">Email *</Label>
            <Input
              id="client_email"
              type="email"
              value={formData.client_email}
              onChange={(e) => setFormData({ ...formData, client_email: e.target.value })}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="client_phone">Phone</Label>
            <Input
              id="client_phone"
              value={formData.client_phone}
              onChange={(e) => setFormData({ ...formData, client_phone: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="client_address">Address</Label>
            <Input
              id="client_address"
              value={formData.client_address}
              onChange={(e) => setFormData({ ...formData, client_address: e.target.value })}
            />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit">
              {client ? 'Update Client' : 'Create Client'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
