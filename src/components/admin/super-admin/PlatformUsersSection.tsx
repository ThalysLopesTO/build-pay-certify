import React, { useMemo, useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Search, Users, MoreHorizontal, Key, UserCheck, UserX, Building2 } from 'lucide-react';
import { usePlatformUsers, useToggleUserActive, PlatformUser } from '@/hooks/super-admin/usePlatformUsers';
import { useResetUserPassword } from '@/hooks/usePasswordManagement';
import { ResetUserPasswordDialog } from './ResetUserPasswordDialog';

const ROLE_BADGE: Record<string, string> = {
  super_admin: 'bg-purple-100 text-purple-700',
  admin:       'bg-orange-100 text-orange-700',
  management:  'bg-blue-100 text-blue-700',
  foreman:     'bg-amber-100 text-amber-700',
  employee:    'bg-slate-100 text-slate-600',
};

const ALL = '__all__';
const companyKey = (u: PlatformUser) => u.company_id || '__none__';

const initials = (u: PlatformUser) =>
  `${u.first_name?.[0] ?? ''}${u.last_name?.[0] ?? ''}`.toUpperCase() || (u.email?.[0]?.toUpperCase() ?? '?');

export const PlatformUsersSection: React.FC = () => {
  const { data: users = [], isLoading } = usePlatformUsers();
  const toggleActive = useToggleUserActive();
  const resetPassword = useResetUserPassword();

  const [selectedCompany, setSelectedCompany] = useState<string>(ALL);
  const [companySearch, setCompanySearch] = useState('');
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [resetTarget, setResetTarget] = useState<PlatformUser | null>(null);

  // Group users into companies (derived from the user list, no extra query).
  const companies = useMemo(() => {
    const map = new Map<string, { id: string; name: string; count: number; active: number }>();
    for (const u of users) {
      const id = companyKey(u);
      const name = u.company_id ? u.company_name : 'Unassigned';
      const g = map.get(id) ?? { id, name, count: 0, active: 0 };
      g.count++;
      if (u.is_active) g.active++;
      map.set(id, g);
    }
    return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name));
  }, [users]);

  const visibleCompanies = useMemo(() => {
    const q = companySearch.toLowerCase();
    return q ? companies.filter(c => c.name.toLowerCase().includes(q)) : companies;
  }, [companies, companySearch]);

  const members = useMemo(() => {
    const q = search.toLowerCase();
    return users.filter(u => {
      const inCompany = selectedCompany === ALL || companyKey(u) === selectedCompany;
      const matchesRole = roleFilter === 'all' || u.role === roleFilter;
      const matchesSearch = !q ||
        `${u.first_name ?? ''} ${u.last_name ?? ''}`.toLowerCase().includes(q) ||
        (u.email ?? '').toLowerCase().includes(q);
      return inCompany && matchesRole && matchesSearch;
    });
  }, [users, selectedCompany, roleFilter, search]);

  const selectedName = selectedCompany === ALL
    ? 'All companies'
    : companies.find(c => c.id === selectedCompany)?.name ?? 'Company';

  const renderActions = (u: PlatformUser) => (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="h-8 w-8 p-0"><MoreHorizontal className="h-4 w-4" /></Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-44">
        <DropdownMenuItem onClick={() => setResetTarget(u)}>
          <Key className="h-4 w-4 mr-2" /> Reset password
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        {u.is_active ? (
          <DropdownMenuItem onClick={() => toggleActive.mutate({ userId: u.user_id, isActive: false })} className="text-red-600 focus:text-red-600">
            <UserX className="h-4 w-4 mr-2" /> Deactivate
          </DropdownMenuItem>
        ) : (
          <DropdownMenuItem onClick={() => toggleActive.mutate({ userId: u.user_id, isActive: true })}>
            <UserCheck className="h-4 w-4 mr-2 text-emerald-600" /> Activate
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );

  return (
    <div className="bg-white rounded-2xl border border-slate-200/70 shadow-sm overflow-hidden">
      <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr]">

        {/* ── Company rail ── */}
        <aside className="border-b lg:border-b-0 lg:border-r border-slate-100 p-3 flex flex-col">
          <div className="flex items-center gap-2 px-2 pt-1 pb-2">
            <Building2 className="h-4 w-4 text-orange-500" />
            <h3 className="text-sm font-bold text-slate-900">Companies</h3>
          </div>
          <div className="relative mb-2">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
            <Input value={companySearch} onChange={e => setCompanySearch(e.target.value)} placeholder="Find company…" className="pl-8 h-8 text-xs" />
          </div>
          <div className="space-y-0.5 lg:max-h-[560px] overflow-y-auto pr-0.5">
            <button
              onClick={() => setSelectedCompany(ALL)}
              className={`w-full flex items-center justify-between gap-2 px-3 py-2 rounded-xl text-left text-sm transition-colors ${selectedCompany === ALL ? 'bg-orange-50 text-orange-700 font-semibold' : 'text-slate-600 hover:bg-slate-100'}`}
            >
              <span className="truncate">All companies</span>
              <span className={`text-[11px] rounded-full px-1.5 py-0.5 ${selectedCompany === ALL ? 'bg-orange-100 text-orange-700' : 'bg-slate-100 text-slate-500'}`}>{users.length}</span>
            </button>
            {visibleCompanies.map(c => (
              <button
                key={c.id}
                onClick={() => setSelectedCompany(c.id)}
                className={`w-full flex items-center justify-between gap-2 px-3 py-2 rounded-xl text-left text-sm transition-colors ${selectedCompany === c.id ? 'bg-orange-50 text-orange-700 font-semibold' : 'text-slate-600 hover:bg-slate-100'}`}
              >
                <span className="truncate">{c.name}</span>
                <span className={`text-[11px] rounded-full px-1.5 py-0.5 flex-shrink-0 ${selectedCompany === c.id ? 'bg-orange-100 text-orange-700' : 'bg-slate-100 text-slate-500'}`}>{c.count}</span>
              </button>
            ))}
            {visibleCompanies.length === 0 && (
              <p className="text-center text-xs text-slate-400 py-4">No companies</p>
            )}
          </div>
        </aside>

        {/* ── Members of the selected company ── */}
        <section className="flex flex-col min-w-0">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 border-b border-slate-100">
            <div className="flex items-center gap-2.5 min-w-0">
              <span className="p-1.5 rounded-lg bg-orange-100 flex-shrink-0"><Users className="h-4 w-4 text-orange-600" /></span>
              <div className="min-w-0">
                <h3 className="text-base font-bold text-slate-900 truncate">{selectedName}</h3>
                <p className="text-xs text-slate-500">{members.length} member{members.length !== 1 ? 's' : ''}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
                <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search members…" className="pl-8 h-9 w-full sm:w-52 text-sm" />
              </div>
              <Select value={roleFilter} onValueChange={setRoleFilter}>
                <SelectTrigger className="h-9 w-32 text-sm"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All roles</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="management">Management</SelectItem>
                  <SelectItem value="foreman">Foreman</SelectItem>
                  <SelectItem value="employee">Employee</SelectItem>
                  <SelectItem value="super_admin">Super Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50/60">
                  <TableHead className="text-xs font-semibold text-slate-500 uppercase tracking-wide">User</TableHead>
                  <TableHead className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Role</TableHead>
                  {selectedCompany === ALL && <TableHead className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Company</TableHead>}
                  <TableHead className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Status</TableHead>
                  <TableHead className="text-xs font-semibold text-slate-500 uppercase tracking-wide text-right pr-4">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow><TableCell colSpan={5} className="py-10 text-center text-slate-400">Loading members…</TableCell></TableRow>
                ) : members.length === 0 ? (
                  <TableRow><TableCell colSpan={5} className="py-10 text-center text-slate-400">No members found</TableCell></TableRow>
                ) : members.map(u => (
                  <TableRow key={u.user_id} className="hover:bg-slate-50/60">
                    <TableCell className="py-2.5">
                      <div className="flex items-center gap-3">
                        {u.photo_url ? (
                          <img src={u.photo_url} alt="" className="w-8 h-8 rounded-full object-cover flex-shrink-0" />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-[11px] font-semibold text-slate-600 flex-shrink-0">{initials(u)}</div>
                        )}
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-slate-900 truncate">{`${u.first_name ?? ''} ${u.last_name ?? ''}`.trim() || '—'}</p>
                          <p className="text-xs text-slate-400 truncate">{u.email}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="py-2.5">
                      <Badge className={`${ROLE_BADGE[u.role] ?? 'bg-slate-100 text-slate-600'} capitalize border-0`}>{u.role.replace('_', ' ')}</Badge>
                    </TableCell>
                    {selectedCompany === ALL && <TableCell className="py-2.5 text-sm text-slate-600">{u.company_name}</TableCell>}
                    <TableCell className="py-2.5">
                      {u.is_active ? (
                        <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-700"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Active</span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-400"><span className="w-1.5 h-1.5 rounded-full bg-slate-300" /> Inactive</span>
                      )}
                    </TableCell>
                    <TableCell className="py-2.5 pr-4 text-right">{renderActions(u)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </section>
      </div>

      <ResetUserPasswordDialog
        open={!!resetTarget}
        onOpenChange={(o) => !o && setResetTarget(null)}
        user={resetTarget ? {
          user_id: resetTarget.user_id,
          email: resetTarget.email,
          name: `${resetTarget.first_name ?? ''} ${resetTarget.last_name ?? ''}`.trim() || (resetTarget.email ?? 'User'),
        } : null}
        isProcessing={resetPassword.isPending}
        onConfirm={(userId, pwd, email, name) => {
          resetPassword.mutate(
            { targetUserId: userId, newPassword: pwd, targetUserEmail: email, targetUserName: name },
            { onSettled: () => setResetTarget(null) },
          );
        }}
      />
    </div>
  );
};

export default PlatformUsersSection;
