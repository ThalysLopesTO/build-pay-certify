import { Client } from '@/hooks/useClients';
import { useIsMobile } from '@/hooks/use-mobile';
import { ClientsTable } from './ClientsTable';
import { ClientsMobileList } from './ClientsMobileList';

interface ClientsListProps {
  clients: Client[];
  isLoading: boolean;
}

export function ClientsList({ clients, isLoading }: ClientsListProps) {
  const isMobile = useIsMobile();

  if (isLoading) {
    if (isMobile) {
      return <ClientsMobileList clients={[]} isLoading={true} />;
    }
    return (
      <div className="border rounded-lg p-8">
        <div className="animate-pulse space-y-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-16 bg-muted rounded" />
          ))}
        </div>
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

  if (isMobile) {
    return <ClientsMobileList clients={clients} isLoading={false} />;
  }

  return <ClientsTable clients={clients} />;
}
