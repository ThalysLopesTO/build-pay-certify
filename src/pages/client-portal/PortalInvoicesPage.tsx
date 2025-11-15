import { useClientPortalContext } from '@/contexts/ClientPortalContext';
import { DocumentGroup } from '@/components/client-portal/DocumentGroup';
import { PortalInvoiceCard } from '@/components/client-portal/PortalInvoiceCard';

export default function PortalInvoicesPage() {
  const { invoices } = useClientPortalContext();

  const awaitingInvoices = invoices.filter(
    i => i.status === 'pending' && new Date(i.due_date) >= new Date()
  );
  const overdueInvoices = invoices.filter(
    i => i.status === 'pending' && new Date(i.due_date) < new Date()
  );
  const paidInvoices = invoices.filter(i => i.status === 'paid');

  return (
    <div className="space-y-6 pt-16 lg:pt-0">
      <div>
        <h1 className="text-3xl font-bold mb-2">Your invoices</h1>
        <p className="text-muted-foreground">
          View and track all your invoices
        </p>
      </div>

      {invoices.length === 0 ? (
        <div className="bg-card border rounded-lg p-12 text-center">
          <p className="text-muted-foreground">No invoices found</p>
        </div>
      ) : (
        <div className="space-y-4">
          <DocumentGroup
            title="Overdue"
            count={overdueInvoices.length}
            color="red"
            defaultOpen={true}
          >
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4">
              {overdueInvoices.map(invoice => (
                <PortalInvoiceCard key={invoice.id} invoice={invoice} />
              ))}
            </div>
          </DocumentGroup>

          <DocumentGroup
            title="Awaiting payment"
            count={awaitingInvoices.length}
            color="orange"
            defaultOpen={true}
          >
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4">
              {awaitingInvoices.map(invoice => (
                <PortalInvoiceCard key={invoice.id} invoice={invoice} />
              ))}
            </div>
          </DocumentGroup>

          <DocumentGroup
            title="Paid"
            count={paidInvoices.length}
            color="green"
            defaultOpen={false}
          >
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4">
              {paidInvoices.map(invoice => (
                <PortalInvoiceCard key={invoice.id} invoice={invoice} />
              ))}
            </div>
          </DocumentGroup>
        </div>
      )}
    </div>
  );
}
