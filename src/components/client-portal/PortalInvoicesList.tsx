import { PortalInvoiceCard } from './PortalInvoiceCard';

interface PortalInvoice {
  id: string;
  invoice_number: string;
  title: string;
  due_date: string;
  status: string;
  total_amount: number;
  sent_date: string | null;
  notes: string | null;
}

interface PortalInvoicesListProps {
  invoices: PortalInvoice[];
}

export function PortalInvoicesList({ invoices }: PortalInvoicesListProps) {
  if (invoices.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">No invoices found</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Invoices</h2>
      <div className="grid grid-cols-1 gap-4">
        {invoices.map((invoice) => (
          <PortalInvoiceCard key={invoice.id} invoice={invoice} />
        ))}
      </div>
    </div>
  );
}
