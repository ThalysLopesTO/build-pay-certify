import { useCallback, useState } from 'react';
import { Client, useDeleteClient } from '@/hooks/useClients';
import { ClientMobileCard } from './ClientMobileCard';
import { ClientFormModal } from './ClientFormModal';
import { ClientPortalLinkDialog } from './ClientPortalLinkDialog';
import { Card, CardContent } from '@/components/ui/card';
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

interface ClientsMobileListProps {
  clients: Client[];
  isLoading: boolean;
}

/**
 * Owns single instances of all per-client modals so individual cards stay
 * cheap to render. See ClientsTable.tsx for the same pattern (freeze fix).
 */
export function ClientsMobileList({ clients, isLoading }: ClientsMobileListProps) {
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [portalClient, setPortalClient] = useState<Client | null>(null);
  const [deletingClient, setDeletingClient] = useState<Client | null>(null);

  const deleteClient = useDeleteClient();
  const isDeleting = deleteClient.isPending;

  const handleEdit = useCallback((c: Client) => setEditingClient(c), []);
  const handlePortal = useCallback((c: Client) => setPortalClient(c), []);
  const handleAskDelete = useCallback((c: Client) => setDeletingClient(c), []);

  const handleConfirmDelete = async () => {
    if (!deletingClient) return;
    try {
      await deleteClient.mutateAsync(deletingClient.id);
      setDeletingClient(null);
    } catch (error) {
      console.error('Failed to delete client:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i}>
            <CardContent className="p-4">
              <div className="animate-pulse space-y-3">
                <div className="h-5 bg-muted rounded w-3/4" />
                <div className="h-4 bg-muted rounded w-1/2" />
                <div className="h-4 bg-muted rounded w-2/3" />
                <div className="flex justify-between pt-3 border-t">
                  <div className="h-4 bg-muted rounded w-24" />
                  <div className="h-4 bg-muted rounded w-16" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (clients.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">No clients found</p>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-3">
        {clients.map((client) => (
          <ClientMobileCard
            key={client.id}
            client={client}
            onEdit={handleEdit}
            onPortal={handlePortal}
            onDelete={handleAskDelete}
          />
        ))}
      </div>

      <ClientFormModal
        isOpen={!!editingClient}
        onClose={() => setEditingClient(null)}
        client={editingClient || undefined}
      />

      {portalClient && (
        <ClientPortalLinkDialog
          isOpen={!!portalClient}
          onClose={() => setPortalClient(null)}
          client={portalClient}
        />
      )}

      <AlertDialog
        open={!!deletingClient}
        onOpenChange={(open) => {
          if (!open && !isDeleting) setDeletingClient(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Client</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete {deletingClient?.client_name}? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmDelete} disabled={isDeleting}>
              {isDeleting ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
