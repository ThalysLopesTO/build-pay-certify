import { useState } from 'react';
import { Plus, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ClientsList } from '@/components/admin/clients/ClientsList';
import { ClientFormModal } from '@/components/admin/clients/ClientFormModal';
import { useClients } from '@/hooks/useClients';

export default function ClientsPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const { data: clients, isLoading } = useClients();

  const filteredClients = clients?.filter(client =>
    client.client_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    client.client_email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    client.client_company?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalClients = clients?.length || 0;
  const totalRevenue = clients?.reduce((sum, c) => sum + (c.total_revenue || 0), 0) || 0;
  const totalQuotes = clients?.reduce((sum, c) => sum + (c.total_quotes || 0), 0) || 0;
  const totalInvoices = clients?.reduce((sum, c) => sum + (c.total_invoices || 0), 0) || 0;

  return (
    <div className="container mx-auto py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Clients</h1>
          <p className="text-muted-foreground">Manage your clients and their documents</p>
        </div>
        <Button onClick={() => setIsModalOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          New Client
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-card border rounded-lg p-6">
          <p className="text-sm text-muted-foreground">Total Clients</p>
          <p className="text-2xl font-bold">{totalClients}</p>
        </div>
        <div className="bg-card border rounded-lg p-6">
          <p className="text-sm text-muted-foreground">Total Quotes</p>
          <p className="text-2xl font-bold">{totalQuotes}</p>
        </div>
        <div className="bg-card border rounded-lg p-6">
          <p className="text-sm text-muted-foreground">Total Invoices</p>
          <p className="text-2xl font-bold">{totalInvoices}</p>
        </div>
        <div className="bg-card border rounded-lg p-6">
          <p className="text-sm text-muted-foreground">Total Revenue</p>
          <p className="text-2xl font-bold">${totalRevenue.toFixed(2)}</p>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search clients by name, email, or company..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Clients List */}
      <ClientsList clients={filteredClients || []} isLoading={isLoading} />

      {/* Create Modal */}
      <ClientFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </div>
  );
}
