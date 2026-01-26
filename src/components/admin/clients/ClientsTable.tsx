import { useState } from 'react';
import { Building2, Mail, Phone, MoreVertical, Edit, Trash2, ExternalLink } from 'lucide-react';
import { Client, useDeleteClient } from '@/hooks/useClients';
import { ClientFormModal } from './ClientFormModal';
import { ClientPortalLinkDialog } from './ClientPortalLinkDialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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
import { Button } from '@/components/ui/button';

interface ClientsTableProps {
  clients: Client[];
}

export function ClientsTable({ clients }: ClientsTableProps) {
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [deletingClient, setDeletingClient] = useState<Client | null>(null);
  const [portalClient, setPortalClient] = useState<Client | null>(null);
  const deleteClient = useDeleteClient();
  
  const isDeleting = deleteClient.isPending;

  const handleDelete = async () => {
    if (deletingClient) {
      try {
        await deleteClient.mutateAsync(deletingClient.id);
        setDeletingClient(null);
      } catch (error) {
        console.error('Failed to delete client:', error);
      }
    }
  };

  const handleDeleteDialogChange = (open: boolean) => {
    if (!open && !isDeleting) {
      setDeletingClient(null);
    }
  };

  return (
    <>
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Company</TableHead>
              <TableHead>Contact</TableHead>
              <TableHead className="text-right">Stats</TableHead>
              <TableHead className="w-[70px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {clients.map((client) => (
              <TableRow key={client.id}>
                <TableCell className="font-medium">
                  {client.client_name}
                </TableCell>
                <TableCell>
                  {client.client_company ? (
                    <div className="flex items-center gap-2">
                      <Building2 className="w-4 h-4 text-muted-foreground" />
                      <span>{client.client_company}</span>
                    </div>
                  ) : (
                    <span className="text-muted-foreground">—</span>
                  )}
                </TableCell>
                <TableCell>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-sm">
                      <Mail className="w-3 h-3 text-muted-foreground" />
                      <span>{client.client_email}</span>
                    </div>
                    {client.client_phone && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Phone className="w-3 h-3" />
                        <span>{client.client_phone}</span>
                      </div>
                    )}
                  </div>
                </TableCell>
                <TableCell className="text-right">
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-end gap-3">
                      <span className="text-muted-foreground">Q: {client.total_quotes}</span>
                      <span className="text-muted-foreground">I: {client.total_invoices}</span>
                    </div>
                    <div className="font-semibold">
                      ${client.total_revenue.toFixed(0)}
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreVertical className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => {
                        setEditingClient(client);
                        setIsEditModalOpen(true);
                      }}>
                        <Edit className="w-4 h-4 mr-2" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setPortalClient(client)}>
                        <ExternalLink className="w-4 h-4 mr-2" />
                        Client Portal
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => setDeletingClient(client)}
                        className="text-destructive"
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <ClientFormModal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setTimeout(() => setEditingClient(null), 200);
        }}
        client={editingClient || undefined}
      />

      {portalClient && (
        <ClientPortalLinkDialog
          isOpen={!!portalClient}
          onClose={() => setPortalClient(null)}
          client={portalClient}
        />
      )}

      <AlertDialog open={!!deletingClient} onOpenChange={handleDeleteDialogChange}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Client</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete {deletingClient?.client_name}? This action cannot be undone.
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
