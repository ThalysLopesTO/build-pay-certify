import { useClientPortalContext } from '@/contexts/ClientPortalContext';
import { Card, CardContent } from '@/components/ui/card';
import { Mail, Phone, MapPin, Building2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function PortalContactPage() {
  const { company_settings } = useClientPortalContext();

  const contactItems = [
    {
      icon: Mail,
      label: 'Email',
      value: company_settings.company_email,
      href: company_settings.company_email ? `mailto:${company_settings.company_email}` : null,
    },
    {
      icon: Phone,
      label: 'Phone',
      value: company_settings.company_phone,
      href: company_settings.company_phone ? `tel:${company_settings.company_phone}` : null,
    },
    {
      icon: MapPin,
      label: 'Address',
      value: company_settings.company_address,
      href: null,
    },
  ];

  return (
    <div className="space-y-8 pt-16 lg:pt-0 max-w-4xl">
      <div>
        <h1 className="text-3xl font-bold mb-2">Contact us</h1>
        <p className="text-muted-foreground">
          Get in touch with our team
        </p>
      </div>

      <Card>
        <CardContent className="p-8">
          <div className="flex items-start gap-6 mb-8">
            {company_settings.company_logo_url ? (
              <img
                src={company_settings.company_logo_url}
                alt={company_settings.company_name}
                className="h-20 w-auto"
              />
            ) : (
              <div className="h-20 w-20 rounded-lg bg-primary/10 flex items-center justify-center">
                <Building2 className="h-10 w-10 text-primary" />
              </div>
            )}
            <div>
              <h2 className="text-2xl font-bold mb-2">
                {company_settings.company_name}
              </h2>
              <p className="text-muted-foreground">
                We're here to help with any questions you may have.
              </p>
            </div>
          </div>

          <div className="space-y-6">
            {contactItems.map((item) => {
              const Icon = item.icon;
              if (!item.value) return null;

              return (
                <div key={item.label} className="flex items-start gap-4 p-4 bg-muted/30 rounded-lg">
                  <Icon className="h-5 w-5 text-primary mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm text-muted-foreground mb-1">{item.label}</p>
                    <p className="font-medium">{item.value}</p>
                  </div>
                  {item.href && (
                    <Button
                      variant="outline"
                      size="sm"
                      asChild
                    >
                      <a href={item.href} target="_blank" rel="noopener noreferrer">
                        Contact
                      </a>
                    </Button>
                  )}
                </div>
              );
            })}
          </div>

          {!company_settings.company_email && !company_settings.company_phone && !company_settings.company_address && (
            <p className="text-center text-muted-foreground py-8">
              No contact information available at this time.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
