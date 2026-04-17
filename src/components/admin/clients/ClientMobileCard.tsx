import { Building2, Mail, Phone, MoreVertical, Edit, Trash2, ExternalLink } from 'lucide-react';
import { Client } from '@/hooks/useClients';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface ClientMobileCardProps {
  client: Client;
  onEdit: (client: Client) => void;
  onPortal: (client: Client) => void;
  onDelete: (client: Client) => void;
}

/**
 * Pure presentational card. Does NOT own any modals — those live in the
 * parent list to avoid mounting N copies of useCreateClient/useUpdateClient.
 */
export function ClientMobileCard({ client, onEdit, onPortal, onDelete }: ClientMobileCardProps) {
  return (
    <Card className="shadow-sm">
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1 min-w-0 pr-2">
            <h3 className="font-semibold text-base truncate">{client.client_name}</h3>
            {client.client_company && (
              <div className="flex items-center gap-1.5 text-sm text-muted-foreground mt-1">
                <Building2 className="w-3.5 h-3.5 flex-shrink-0" />
                <span className="truncate">{client.client_company}</span>
              </div>
            )}
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="flex-shrink-0 h-9 w-9">
                <MoreVertical className="w-5 h-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onEdit(client)}>
                <Edit className="w-4 h-4 mr-2" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onPortal(client)}>
                <ExternalLink className="w-4 h-4 mr-2" />
                Client Portal
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onDelete(client)} className="text-destructive">
                <Trash2 className="w-4 h-4 mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

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
          <div className="font-semibold">${client.total_revenue.toFixed(0)}</div>
        </div>
      </CardContent>
    </Card>
  );
}
