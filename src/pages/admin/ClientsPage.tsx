import { useMemo, useState } from 'react';
import { Plus, Search, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ClientsList } from '@/components/admin/clients/ClientsList';
import { ClientFormModal } from '@/components/admin/clients/ClientFormModal';
import { ImportClientsModal } from '@/components/admin/clients/ImportClientsModal';
import { ClientsMobileHeader } from '@/components/admin/clients/ClientsMobileHeader';
import { ClientsMobileSummary } from '@/components/admin/clients/ClientsMobileSummary';
import { ClientsMobileSearch } from '@/components/admin/clients/ClientsMobileSearch';
import { useClients } from '@/hooks/useClients';
import { useIsMobile } from '@/hooks/use-mobile';

export default function ClientsPage() {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const { data: clients, isLoading } = useClients();
  const isMobile = useIsMobile();

  const filteredClients = useMemo(() => {
    if (!clients) return [];
    const q = searchQuery.trim().toLowerCase();
    if (!q) return clients;
    return clients.filter(
      (c) =>
        c.client_name.toLowerCase().includes(q) ||
        c.client_email.toLowerCase().includes(q) ||
        (c.client_company?.toLowerCase().includes(q) ?? false)
    );
  }, [clients, searchQuery]);

  const stats = useMemo(() => {
    if (!clients) return { totalClients: 0, totalRevenue: 0, totalQuotes: 0, totalInvoices: 0 };
    let totalRevenue = 0;
    let totalQuotes = 0;
    let totalInvoices = 0;
    for (const c of clients) {
      totalRevenue += c.total_revenue || 0;
      totalQuotes += c.total_quotes || 0;
      totalInvoices += c.total_invoices || 0;
    }
    return { totalClients: clients.length, totalRevenue, totalQuotes, totalInvoices };
  }, [clients]);

  return (
    <div className="min-h-screen overflow-x-hidden">
      {/* Mobile Layout */}
      {isMobile && (
        <div className="space-y-4 pb-24">
          <ClientsMobileHeader clientCount={stats.totalClients} />
          <ClientsMobileSummary
            totalClients={stats.totalClients}
            totalQuotes={stats.totalQuotes}
            totalInvoices={stats.totalInvoices}
            totalRevenue={stats.totalRevenue}
          />
          <ClientsMobileSearch searchQuery={searchQuery} onSearchChange={setSearchQuery} />
          <div className="px-4">
            <Button
              variant="outline"
              className="w-full mb-3"
              onClick={() => setIsImportOpen(true)}
            >
              <Upload className="w-4 h-4 mr-2" />
              Import Clients
            </Button>
            <ClientsList clients={filteredClients} isLoading={isLoading} />
          </div>
        </div>
      )}

      {/* Desktop Layout */}
      {!isMobile && (
        <div className="container mx-auto py-8 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">Clients</h1>
              <p className="text-muted-foreground">Manage your clients and their documents</p>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={() => setIsImportOpen(true)}>
                <Upload className="w-4 h-4 mr-2" />
                Import Clients
              </Button>
              <Button onClick={() => setIsCreateOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                New Client
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-card border rounded-lg p-6">
              <p className="text-sm text-muted-foreground">Total Clients</p>
              <p className="text-2xl font-bold">{stats.totalClients}</p>
            </div>
            <div className="bg-card border rounded-lg p-6">
              <p className="text-sm text-muted-foreground">Total Quotes</p>
              <p className="text-2xl font-bold">{stats.totalQuotes}</p>
            </div>
            <div className="bg-card border rounded-lg p-6">
              <p className="text-sm text-muted-foreground">Total Invoices</p>
              <p className="text-2xl font-bold">{stats.totalInvoices}</p>
            </div>
            <div className="bg-card border rounded-lg p-6">
              <p className="text-sm text-muted-foreground">Total Revenue</p>
              <p className="text-2xl font-bold">${stats.totalRevenue.toFixed(2)}</p>
            </div>
          </div>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search clients by name, email, or company..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          <ClientsList clients={filteredClients} isLoading={isLoading} />
        </div>
      )}

      {/* Floating Action Button - Mobile Only */}
      {isMobile && (
        <Button
          onClick={() => setIsCreateOpen(true)}
          className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg z-50"
          size="icon"
        >
          <Plus className="h-6 w-6" />
        </Button>
      )}

      <ClientFormModal isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)} />
      <ImportClientsModal isOpen={isImportOpen} onClose={() => setIsImportOpen(false)} />
    </div>
  );
}
