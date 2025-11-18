import { Client } from '@/hooks/useClients';
import { ClientMobileCard } from './ClientMobileCard';
import { Card, CardContent } from '@/components/ui/card';

interface ClientsMobileListProps {
  clients: Client[];
  isLoading: boolean;
}

export function ClientsMobileList({ clients, isLoading }: ClientsMobileListProps) {
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
    <div className="space-y-3">
      {clients.map((client) => (
        <ClientMobileCard key={client.id} client={client} />
      ))}
    </div>
  );
}
