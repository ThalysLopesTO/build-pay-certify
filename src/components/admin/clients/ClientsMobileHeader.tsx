import { Users } from 'lucide-react';

interface ClientsMobileHeaderProps {
  clientCount: number;
}

export function ClientsMobileHeader({ clientCount }: ClientsMobileHeaderProps) {
  return (
    <div className="sticky top-0 z-10 bg-background border-b md:hidden">
      <div className="px-4 py-3 flex items-center gap-3">
        <div className="p-2 rounded-lg bg-primary/10">
          <Users className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="text-lg font-bold text-foreground">Clients</h1>
          <p className="text-xs text-muted-foreground">{clientCount} total</p>
        </div>
      </div>
    </div>
  );
}
