import React, { useMemo, useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Search, Users, MoreHorizontal, Key, UserCheck, UserX } from 'lucide-react';
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

const initials = (u: PlatformUser) =>
  `${u.first_name?.[0] ?? ''}${u.last_name?.[0] ?? ''}`.toUpperCase() || (u.email?.[0]?.toUpperCase() ?? '?');

export const PlatformUsersSection: React.FC = () => {
  const { data: users = [], isLoading } = usePlatformUsers();
  const toggleActive = useToggleUserActive();
  const resetPassword = useResetUserPassword();

  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [resetTarget, setResetTarget] = useState<PlatformUser | null>(null);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return users.filter(u => {
      const matchesRole = roleFilter === 'all' || u.role === roleFilter;
      const matchesSearch = !q ||
        `${u.first_name ?? ''} ${u.last_name ?? ''}`.toLowerCase().includes(q) ||
        (u.email ?? '').toLowerCase().includes(q) ||
        u.company_name.toLowerCase().includes(q);
      return matchesRole && matchesSearch;
    });
  }, [users, search, roleFilter]);

  return (
    <div className="bg-white rounded-2xl border border-slate-200/70 shadow-sm">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-5 border-b border-slate-100">
        <div className="flex items-center gap-2.5">
          <span className="p-1.5 rounded-lg bg-orange-100"><Users className="h-4 w-4 text-orange-600" /></span>
          <div>
            <h3 className="text-base font-bold text-slate-900">Platform Members</h3>
            <p className="text-xs text-slate-500">{filtered.length} of {users.length} users across all companies</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
            <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search name, email, company…" className="pl-8 h-9 w-full sm:w-64 text-sm" />
          </div>
          <Select value={roleFilter} onValueChange={setRoleFilter}>
            <SelectTrigger className="h-9 w-36 text-sm"><SelectValue /></SelectTrigger>
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

      {/* Table */}
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-slate-50/60">
              <TableHead className="text-xs font-semibold text-slate-500 uppercase tracking-wide">User</TableHead>
              <TableHead className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Role</TableHead>
              <TableHead className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Company</TableHead>
              <TableHead className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Status</TableHead>
              <TableHead className="text-xs font-semibold text-slate-500 uppercase tracking-wide text-right pr-4">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={5} className="py-10 text-center text-slate-400">Loading members…</TableCell></TableRow>
            ) : filtered.length === 0 ? (
              <TableRow><TableCell colSpan={5} className="py-10 text-center text-slate-400">No members found</TableCell></TableRow>
            ) : filtered.map(u => (
              <TableRow key={u.user_id} className="hover:bg-slate-50/60">
                <TableCell className="py-2.5">
                  <div className="flex items-center gap-3">
                    {u.photo_url ? (
                      <img src={u.photo_url} alt="" className="w-8 h-8 rounded-full object-cover flex-shrink-0" />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-[11px] font-semibold text-slate-600 flex-shrink-0">
                        {initials(u)}
                      </div>
                    )}
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-slate-900 truncate">{`${u.first_name ?? ''} ${u.last_name ?? ''}`.trim() || '—'}</p>
                      <p className="text-xs text-slate-400 truncate">{u.email}</p>
                    </div>
                  </div>
                </TableCell>
                <TableCell className="py-2.5">
                  <Badge className={`${ROLE_BADGE[u.role] ?? 'bg-slate-100 text-slate-600'} capitalize border-0`}>
                    {u.role.replace('_', ' ')}
                  </Badge>
                </TableCell>
                <TableCell className="py-2.5 text-sm text-slate-600">{u.company_name}</TableCell>
                <TableCell className="py-2.5">
                  {u.is_active ? (
                    <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-700">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Active
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-400">
                      <span className="w-1.5 h-1.5 rounded-full bg-slate-300" /> Inactive
                    </span>
                  )}
                </TableCell>
                <TableCell className="py-2.5 pr-4 text-right">
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
                        <DropdownMenuItem
                          onClick={() => toggleActive.mutate({ userId: u.user_id, isActive: false })}
                          className="text-red-600 focus:text-red-600"
                        >
                          <UserX className="h-4 w-4 mr-2" /> Deactivate
                        </DropdownMenuItem>
                      ) : (
                        <DropdownMenuItem onClick={() => toggleActive.mutate({ userId: u.user_id, isActive: true })}>
                          <UserCheck className="h-4 w-4 mr-2 text-emerald-600" /> Activate
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
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
