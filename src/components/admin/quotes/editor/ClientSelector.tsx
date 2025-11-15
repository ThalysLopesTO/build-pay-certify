import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useClients } from '@/hooks/useClients';
import { Check, ChevronsUpDown, UserPlus, Building2, Mail, Phone, MapPin } from 'lucide-react';
import { cn } from '@/lib/utils';
import QuickClientModal from './QuickClientModal';

interface Client {
  id: string;
  client_name: string;
  client_company?: string;
  client_email: string;
  client_phone?: string;
  client_address?: string;
}

interface ClientSelectorProps {
  selectedClientId?: string;
  onClientSelect: (client: Client) => void;
  disabled?: boolean;
}

const ClientSelector: React.FC<ClientSelectorProps> = ({
  selectedClientId,
  onClientSelect,
  disabled = false,
}) => {
  const [open, setOpen] = useState(false);
  const [showQuickAdd, setShowQuickAdd] = useState(false);
  const { data: clients = [], isLoading } = useClients();

  const selectedClient = clients.find((c) => c.id === selectedClientId);

  const handleClientCreated = (newClient: Client) => {
    onClientSelect(newClient);
    setShowQuickAdd(false);
  };

  if (selectedClient) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-foreground mb-3">Selected Client</h3>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium text-foreground">{selectedClient.client_name}</span>
                  {selectedClient.client_company && (
                    <span className="text-muted-foreground">• {selectedClient.client_company}</span>
                  )}
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">{selectedClient.client_email}</span>
                </div>
                {selectedClient.client_phone && (
                  <div className="flex items-center gap-2 text-sm">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">{selectedClient.client_phone}</span>
                  </div>
                )}
                {selectedClient.client_address && (
                  <div className="flex items-center gap-2 text-sm">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">{selectedClient.client_address}</span>
                  </div>
                )}
              </div>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setOpen(true)}
              disabled={disabled}
            >
              Change Client
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-2">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between"
            disabled={disabled}
          >
            {isLoading ? "Loading clients..." : "Select a client..."}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[500px] p-0" align="start">
          <Command>
            <CommandInput placeholder="Search clients..." />
            <CommandList>
              <CommandEmpty>No clients found.</CommandEmpty>
              <CommandGroup>
                {clients.map((client) => (
                  <CommandItem
                    key={client.id}
                    value={`${client.client_name} ${client.client_company || ''} ${client.client_email}`}
                    onSelect={() => {
                      onClientSelect(client);
                      setOpen(false);
                    }}
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        selectedClientId === client.id ? "opacity-100" : "opacity-0"
                      )}
                    />
                    <div className="flex flex-col">
                      <span className="font-medium">{client.client_name}</span>
                      <span className="text-sm text-muted-foreground">
                        {client.client_company && `${client.client_company} • `}
                        {client.client_email}
                      </span>
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
            <div className="border-t p-2">
              <Button
                variant="ghost"
                className="w-full justify-start"
                onClick={() => {
                  setOpen(false);
                  setShowQuickAdd(true);
                }}
              >
                <UserPlus className="mr-2 h-4 w-4" />
                Create New Client
              </Button>
            </div>
          </Command>
        </PopoverContent>
      </Popover>

      <QuickClientModal
        open={showQuickAdd}
        onOpenChange={setShowQuickAdd}
        onClientCreated={handleClientCreated}
      />
    </div>
  );
};

export default ClientSelector;
