import { useState } from 'react';
import { Building2, Mail, Phone, MapPin, Edit, Trash2, ExternalLink, Copy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Client, useDeleteClient } from '@/hooks/useClients';
import { ClientFormModal } from './ClientFormModal';
import { ClientPortalLinkDialog } from './ClientPortalLinkDialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface ClientCardProps {
  client: Client;
}

export function ClientCard({ client }: ClientCardProps) {
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isPortalLinkOpen, setIsPortalLinkOpen] = useState(false);
  const deleteClient = useDeleteClient();
  
  const isDeleting = deleteClient.isPending;

  const handleDelete = async () => {
    try {
      await deleteClient.mutateAsync(client.id);
      setIsDeleteOpen(false);
    } catch (error) {
      console.error('Failed to delete client:', error);
    }
  };

  const handleDeleteDialogChange = (open: boolean) => {
    if (!open && !isDeleting) {
      setIsDeleteOpen(false);
    }
  };

  return (
    <>
      <div className="bg-card border rounded-lg p-6 hover:shadow-md transition-shadow">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <h3 className="font-semibold text-lg">{client.client_name}</h3>
            {client.client_company && (
              <div className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
                <Building2 className="w-3 h-3" />
                {client.client_company}
              </div>
            )}
          </div>
          <div className="flex gap-1">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsEditOpen(true)}
            >
              <Edit className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsDeleteOpen(true)}
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Contact Info */}
        <div className="space-y-2 mb-4">
          <div className="flex items-center gap-2 text-sm">
            <Mail className="w-4 h-4 text-muted-foreground" />
            <span className="text-muted-foreground">{client.client_email}</span>
          </div>
          {client.client_phone && (
            <div className="flex items-center gap-2 text-sm">
              <Phone className="w-4 h-4 text-muted-foreground" />
              <span className="text-muted-foreground">{client.client_phone}</span>
            </div>
          )}
          {client.client_address && (
            <div className="flex items-center gap-2 text-sm">
              <MapPin className="w-4 h-4 text-muted-foreground" />
              <span className="text-muted-foreground">{client.client_address}</span>
            </div>
          )}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-2 mb-4 pt-4 border-t">
          <div>
            <p className="text-xs text-muted-foreground">Quotes</p>
            <p className="font-semibold">{client.total_quotes}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Invoices</p>
            <p className="font-semibold">{client.total_invoices}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Revenue</p>
            <p className="font-semibold">${client.total_revenue.toFixed(0)}</p>
          </div>
        </div>

        {/* Actions */}
        <Button
          variant="outline"
          className="w-full"
          onClick={() => setIsPortalLinkOpen(true)}
        >
          <ExternalLink className="w-4 h-4 mr-2" />
          Client Portal
        </Button>
      </div>

      <ClientFormModal
        isOpen={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        client={client}
      />

      <ClientPortalLinkDialog
        isOpen={isPortalLinkOpen}
        onClose={() => setIsPortalLinkOpen(false)}
        client={client}
      />

      <AlertDialog open={isDeleteOpen} onOpenChange={handleDeleteDialogChange}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Client</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete {client.client_name}? This action cannot be undone.
              All quotes and invoices will remain but will no longer be linked to this client.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={isDeleting}>
              {isDeleting ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
