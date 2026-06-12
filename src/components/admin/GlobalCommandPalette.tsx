import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Building2,
  Calculator,
  FileText,
  MapPin,
  Search,
  User,
} from 'lucide-react';
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/components/ui/command';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { supabase } from '@/integrations/supabase/client';
import { adminTabRoutes } from '@/components/admin/adminTabRoutes';

interface EntityResult {
  id: string;
  label: string;
  sublabel?: string;
  destination: string;
}

interface EntityResults {
  employees: EntityResult[];
  jobsites: EntityResult[];
  clients: EntityResult[];
  invoices: EntityResult[];
  quotes: EntityResult[];
}

const EMPTY_RESULTS: EntityResults = {
  employees: [],
  jobsites: [],
  clients: [],
  invoices: [],
  quotes: [],
};

const GlobalCommandPalette = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<EntityResults>(EMPTY_RESULTS);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, []);

  const searchEntities = useCallback(
    async (q: string, companyId: string): Promise<EntityResults> => {
      const like = `%${q}%`;
      const [employees, jobsites, clients, invoices, quotes] = await Promise.all([
        supabase
          .from('user_profiles')
          .select('user_id, first_name, last_name, trade, position')
          .eq('company_id', companyId)
          .eq('is_active', true)
          .or(`first_name.ilike.${like},last_name.ilike.${like}`)
          .limit(5),
        supabase
          .from('jobsites')
          .select('id, name, address, status')
          .eq('company_id', companyId)
          .ilike('name', like)
          .limit(5),
        supabase
          .from('clients')
          .select('id, client_name, client_company, client_email')
          .eq('company_id', companyId)
          .or(`client_name.ilike.${like},client_company.ilike.${like}`)
          .limit(5),
        supabase
          .from('invoices')
          .select('id, invoice_number, title, client_company, status')
          .eq('company_id', companyId)
          .or(`invoice_number.ilike.${like},title.ilike.${like},client_company.ilike.${like}`)
          .limit(5),
        supabase
          .from('quotes')
          .select('id, quote_number, project_name, client_name, status')
          .eq('company_id', companyId)
          .or(`quote_number.ilike.${like},project_name.ilike.${like},client_name.ilike.${like}`)
          .limit(5),
      ]);

      return {
        employees: (employees.data ?? []).map((e) => ({
          id: e.user_id,
          label: `${e.first_name ?? ''} ${e.last_name ?? ''}`.trim(),
          sublabel: [e.trade, e.position].filter(Boolean).join(' · ') || undefined,
          destination: '/admin/employees',
        })),
        jobsites: (jobsites.data ?? []).map((j) => ({
          id: j.id,
          label: j.name,
          sublabel: j.address ?? j.status,
          destination: '/admin/jobsites',
        })),
        clients: (clients.data ?? []).map((c) => ({
          id: c.id,
          label: c.client_name,
          sublabel: c.client_company ?? c.client_email,
          destination: '/admin/clients',
        })),
        invoices: (invoices.data ?? []).map((i) => ({
          id: i.id,
          label: `${i.invoice_number} — ${i.title}`,
          sublabel: `${i.client_company} · ${i.status}`,
          destination: '/admin/invoices',
        })),
        quotes: (quotes.data ?? []).map((qt) => ({
          id: qt.id,
          label: `${qt.quote_number} — ${qt.project_name}`,
          sublabel: `${qt.client_name} · ${qt.status}`,
          destination: '/admin/quotes',
        })),
      };
    },
    []
  );

  // Debounced entity search across the company's data
  useEffect(() => {
    const q = query.trim();
    const companyId = user?.companyId;
    if (!open || q.length < 2 || !companyId) {
      setResults(EMPTY_RESULTS);
      return;
    }
    let cancelled = false;
    const timer = setTimeout(async () => {
      try {
        const next = await searchEntities(q, companyId);
        if (!cancelled) setResults(next);
      } catch {
        if (!cancelled) setResults(EMPTY_RESULTS);
      }
    }, 250);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [open, query, user?.companyId, searchEntities]);

  const go = (path: string) => {
    setOpen(false);
    setQuery('');
    navigate(path);
  };

  const filteredNav = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return adminTabRoutes;
    return adminTabRoutes.filter((r) => r.title.toLowerCase().includes(q));
  }, [query]);

  const entityGroups: { heading: string; icon: React.ElementType; items: EntityResult[] }[] = [
    { heading: 'Employees', icon: User, items: results.employees },
    { heading: 'Jobsites', icon: MapPin, items: results.jobsites },
    { heading: 'Clients', icon: Building2, items: results.clients },
    { heading: 'Invoices', icon: FileText, items: results.invoices },
    { heading: 'Quotes', icon: Calculator, items: results.quotes },
  ];
  const hasEntityResults = entityGroups.some((g) => g.items.length > 0);

  return (
    <CommandDialog open={open} onOpenChange={setOpen} shouldFilter={false}>
      <CommandInput
        placeholder="Search pages, employees, jobsites, invoices..."
        value={query}
        onValueChange={setQuery}
      />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>

        {filteredNav.length > 0 && (
          <CommandGroup heading="Go to">
            {filteredNav.map((route) => (
              <CommandItem
                key={route.slug}
                value={`nav-${route.slug}`}
                onSelect={() => go(`/admin/${route.slug}`)}
              >
                <Search className="mr-2 h-4 w-4 text-muted-foreground" />
                {route.title}
              </CommandItem>
            ))}
          </CommandGroup>
        )}

        {hasEntityResults && <CommandSeparator />}

        {entityGroups.map(({ heading, icon: Icon, items }) =>
          items.length > 0 ? (
            <CommandGroup key={heading} heading={heading}>
              {items.map((item) => (
                <CommandItem
                  key={`${heading}-${item.id}`}
                  value={`${heading}-${item.id}`}
                  onSelect={() => go(item.destination)}
                >
                  <Icon className="mr-2 h-4 w-4 text-muted-foreground" />
                  <div className="flex flex-col min-w-0">
                    <span className="truncate">{item.label}</span>
                    {item.sublabel && (
                      <span className="text-xs text-muted-foreground truncate">{item.sublabel}</span>
                    )}
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          ) : null
        )}
      </CommandList>
    </CommandDialog>
  );
};

export default GlobalCommandPalette;
