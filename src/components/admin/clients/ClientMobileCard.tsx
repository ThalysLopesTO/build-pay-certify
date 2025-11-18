import { useState } from 'react';
import { Building2, Mail, Phone, MoreVertical, Edit, Trash2, ExternalLink } from 'lucide-react';
import { Client, useDeleteClient } from '@/hooks/useClients';
import { ClientFormModal } from './ClientFormModal';
import { ClientPortalLinkDialog } from './ClientPortalLinkDialog';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
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

interface ClientMobileCardProps {
  client: Client;
}

export function ClientMobileCard({ client }: ClientMobileCardProps) {
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isPortalLinkOpen, setIsPortalLinkOpen] = useState(false);
  const deleteClient = useDeleteClient();

  const handleDelete = () => {
    deleteClient.mutate(client.id);
    setIsDeleteOpen(false);
  };

  return (
    <>
      <Card>
        <CardContent className="p-4">
          {/* Header with Name and Actions */}
          <div className="flex items-start justify-between mb-3">
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-base truncate">{client.client_name}</h3>
              {client.client_company && (
                <div className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
                  <Building2 className="w-3 h-3 flex-shrink-0" />
                  <span className="truncate">{client.client_company}</span>
                </div>
              )}
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="flex-shrink-0">
                  <MoreVertical className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setIsEditOpen(true)}>
                  <Edit className="w-4 h-4 mr-2" />
                  Edit
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setIsPortalLinkOpen(true)}>
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Client Portal
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => setIsDeleteOpen(true)}
                  className="text-destructive"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Contact Info */}
          <div className="space-y-2 mb-3">
            <div className="flex items-center gap-2 text-sm">
              <Mail className="w-3 h-3 text-muted-foreground flex-shrink-0" />
              <span className="text-muted-foreground truncate">{client.client_email}</span>
            </div>
            {client.client_phone && (
              <div className="flex items-center gap-2 text-sm">
                <Phone className="w-3 h-3 text-muted-foreground flex-shrink-0" />
                <span className="text-muted-foreground">{client.client_phone}</span>
              </div>
            )}
          </div>

          {/* Stats */}
          <div className="flex items-center justify-between pt-3 border-t text-sm">
            <div className="flex items-center gap-4">
              <div>
                <span className="text-muted-foreground">Q: </span>
                <span className="font-semibold">{client.total_quotes}</span>
              </div>
              <div>
                <span className="text-muted-foreground">I: </span>
                <span className="font-semibold">{client.total_invoices}</span>
              </div>
            </div>
            <div className="font-semibold">
              ${client.total_revenue.toFixed(0)}
            </div>
          </div>
        </CardContent>
      </Card>

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

      <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Client</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete {client.client_name}? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
