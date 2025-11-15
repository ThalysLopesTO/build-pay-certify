interface PortalHeaderProps {
  client: {
    client_name: string;
    client_company: string | null;
    client_email: string;
  };
  companySettings: {
    company_name: string;
    company_logo_url: string | null;
    company_email: string | null;
    company_phone: string | null;
  };
}

export function PortalHeader({ client, companySettings }: PortalHeaderProps) {
  return (
    <header className="border-b bg-card">
      <div className="container mx-auto py-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            {companySettings.company_logo_url && (
              <img
                src={companySettings.company_logo_url}
                alt={companySettings.company_name}
                className="h-12 w-auto"
              />
            )}
            <div>
              <h1 className="text-2xl font-bold">{companySettings.company_name}</h1>
              <p className="text-sm text-muted-foreground">Client Portal</p>
            </div>
          </div>

          <div className="text-right">
            <p className="font-semibold">{client.client_name}</p>
            {client.client_company && (
              <p className="text-sm text-muted-foreground">{client.client_company}</p>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
