import { createContext, useContext, ReactNode } from 'react';
import { useParams } from 'react-router-dom';
import { useClientPortal } from '@/hooks/useClientPortal';

interface PortalQuote {
  id: string;
  quote_number: string;
  project_name: string;
  quote_date: string;
  expiry_date: string | null;
  status: string;
  public_status: string | null;
  total_amount: number;
  public_token: string | null;
  notes: string | null;
  client_address: string | null;
  client_viewed_at: string | null;
  client_approved_at: string | null;
  client_declined_at: string | null;
  client_name_signed: string | null;
  accepted_date: string | null;
  declined_date: string | null;
  client_change_request: string | null;
}

interface PortalInvoice {
  id: string;
  invoice_number: string;
  title: string;
  due_date: string;
  status: string;
  total_amount: number;
  sent_date: string | null;
  notes: string | null;
  client_address: string | null;
  subtotal: number;
  tax: number | null;
  discount: number | null;
}

interface ClientPortalContextType {
  client: {
    id: string;
    client_name: string;
    client_company: string | null;
    client_email: string;
    client_phone: string | null;
    client_address: string | null;
  };
  quotes: PortalQuote[];
  invoices: PortalInvoice[];
  company_settings: {
    company_name: string;
    company_logo_url: string | null;
    company_email: string | null;
    company_phone: string | null;
    company_address: string | null;
  };
  token: string;
  isLoading: boolean;
  error: Error | null;
}

const ClientPortalContext = createContext<ClientPortalContextType | null>(null);

export function ClientPortalProvider({ children }: { children: ReactNode }) {
  const { token } = useParams<{ token: string }>();
  const { data, isLoading, error } = useClientPortal(token);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading your portal...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center max-w-md">
          <h1 className="text-2xl font-bold text-destructive mb-2">Access Denied</h1>
          <p className="text-muted-foreground">
            Unable to load client portal. Please check your link and try again.
          </p>
        </div>
      </div>
    );
  }

  const contextValue: ClientPortalContextType = {
    client: data.client,
    quotes: data.quotes,
    invoices: data.invoices,
    company_settings: data.company_settings,
    token: token!,
    isLoading,
    error: error as Error | null,
  };

  return (
    <ClientPortalContext.Provider value={contextValue}>
      {children}
    </ClientPortalContext.Provider>
  );
}

export function useClientPortalContext() {
  const context = useContext(ClientPortalContext);
  if (!context) {
    throw new Error('useClientPortalContext must be used within ClientPortalProvider');
  }
  return context;
}
