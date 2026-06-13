import React, { useState } from 'react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useChatUsers } from '@/hooks/chat/useChatUsers';
import { UserAvatar } from './UserAvatar';
import { ChatUserProfile } from './types';
import { toast } from '@/hooks/use-toast';
import { Check, Search, X, Users, MessageCircle } from 'lucide-react';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConversationCreated: (id: string) => void;
}

const ROLE_BADGE: Record<string, string> = {
  admin:       'bg-indigo-100 text-indigo-700',
  super_admin: 'bg-purple-100 text-purple-700',
  foreman:     'bg-amber-100 text-amber-700',
  management:  'bg-blue-100 text-blue-700',
  employee:    'bg-slate-100 text-slate-600',
};

type TabType = 'direct' | 'group';

export const NewConversationDialog: React.FC<Props> = ({
  open,
  onOpenChange,
  onConversationCreated,
}) => {
  const { user } = useAuth();
  const { data: users = [], isLoading } = useChatUsers();

  const [tab, setTab]               = useState<TabType>('direct');
  const [search, setSearch]         = useState('');
  const [selected, setSelected]     = useState<string[]>([]);
  const [groupName, setGroupName]   = useState('');
  const [creating, setCreating]     = useState(false);

  const filtered = users.filter(u => {
    if (!search) return true;
    const name = `${u.first_name ?? ''} ${u.last_name ?? ''}`.toLowerCase();
    return name.includes(search.toLowerCase()) || u.role.toLowerCase().includes(search.toLowerCase());
  });

  const toggle = (uid: string) => {
    if (tab === 'direct') {
      setSelected(prev => prev.includes(uid) ? [] : [uid]);
    } else {
      setSelected(prev => prev.includes(uid) ? prev.filter(id => id !== uid) : [...prev, uid]);
    }
  };

  const handleCreate = async () => {
    if (selected.length === 0) return;
    if (tab === 'group' && !groupName.trim()) {
      toast({ title: 'Please enter a group name', variant: 'destructive' });
      return;
    }

    setCreating(true);
    try {
      const { data: conv, error: convErr } = await supabase
        .from('chat_conversations')
        .insert({
          company_id: user?.companyId,
          name: tab === 'group' ? groupName.trim() : null,
          type: tab,
          created_by: user?.id,
        })
        .select()
        .single();

      if (convErr) throw convErr;

      const members = [user?.id!, ...selected].map(uid => ({
        conversation_id: conv.id,
        user_id: uid,
        last_read_at: new Date().toISOString(),
        joined_at: new Date().toISOString(),
      }));

      const { error: memErr } = await supabase.from('chat_members').insert(members);
      if (memErr) throw memErr;

      onConversationCreated(conv.id);
      onOpenChange(false);
      setSelected([]);
      setGroupName('');
      setSearch('');
      setTab('direct');
    } catch (e) {
      console.error(e);
      toast({ title: 'Failed to create conversation', variant: 'destructive' });
    } finally {
      setCreating(false);
    }
  };

  const reset = () => {
    setSelected([]);
    setGroupName('');
    setSearch('');
    setTab('direct');
  };

  const canCreate =
    selected.length > 0 && (tab === 'direct' || groupName.trim().length > 0);

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) reset(); onOpenChange(v); }}>
      <DialogContent className="sm:max-w-md p-0 overflow-hidden rounded-2xl">
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-700 to-indigo-500 px-5 py-4">
          <DialogTitle className="text-white font-bold text-base">New Conversation</DialogTitle>
          <p className="text-indigo-200 text-xs mt-0.5">Start a direct message or create a group</p>
        </div>

        <div className="p-5 space-y-4">
          {/* Tab switcher */}
          <div className="flex bg-slate-100 rounded-xl p-1 gap-1">
            {([['direct', MessageCircle, 'Direct Message'], ['group', Users, 'Group Chat']] as const).map(
              ([type, Icon, label]) => (
                <button
                  key={type}
                  onClick={() => { setTab(type); setSelected([]); }}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-sm font-semibold transition-all ${
                    tab === type
                      ? 'bg-white text-indigo-700 shadow-sm'
                      : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  <Icon className="h-3.5 w-3.5" />
                  {label}
                </button>
              )
            )}
          </div>

          {/* Group name */}
          {tab === 'group' && (
            <div>
              <Label className="text-xs font-semibold text-slate-600 uppercase tracking-wide">
                Group Name
              </Label>
              <Input
                placeholder="e.g. Project Alpha, Site B Team…"
                value={groupName}
                onChange={e => setGroupName(e.target.value)}
                className="mt-1.5 h-9 text-sm"
                autoFocus
              />
            </div>
          )}

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
            <Input
              placeholder="Search team members…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-8 h-9 text-sm"
            />
          </div>

          {/* Selected chips (group) */}
          {tab === 'group' && selected.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {selected.map(uid => {
                const u = users.find(u => u.user_id === uid);
                if (!u) return null;
                return (
                  <button
                    key={uid}
                    onClick={() => toggle(uid)}
                    className="flex items-center gap-1 px-2 py-0.5 bg-indigo-100 text-indigo-800 text-xs rounded-full hover:bg-indigo-200 font-medium"
                  >
                    {u.first_name} {u.last_name}
                    <X className="h-3 w-3" />
                  </button>
                );
              })}
            </div>
          )}

          {/* User list */}
          <div className="max-h-60 overflow-y-auto -mx-1 px-1 space-y-0.5">
            {isLoading ? (
              [...Array(4)].map((_, i) => (
                <div key={i} className="h-12 rounded-xl bg-slate-100 animate-pulse" />
              ))
            ) : filtered.length === 0 ? (
              <p className="text-center text-sm text-slate-400 py-6">No team members found</p>
            ) : (
              filtered.map(u => {
                const isSelected = selected.includes(u.user_id);
                const isDisabledForDM =
                  tab === 'direct' && selected.length === 1 && !isSelected;

                return (
                  <button
                    key={u.user_id}
                    onClick={() => !isDisabledForDM && toggle(u.user_id)}
                    disabled={isDisabledForDM}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-colors ${
                      isSelected
                        ? 'bg-indigo-50 border border-indigo-200'
                        : isDisabledForDM
                        ? 'opacity-40 cursor-not-allowed'
                        : 'hover:bg-slate-50'
                    }`}
                  >
                    <UserAvatar profile={u} size="sm" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-900 truncate">
                        {u.first_name} {u.last_name}
                      </p>
                      <span className={`inline-block text-[10px] font-semibold px-1.5 py-0.5 rounded-full mt-0.5 ${ROLE_BADGE[u.role] ?? 'bg-slate-100 text-slate-600'}`}>
                        {u.role.replace('_', ' ')}
                      </span>
                    </div>
                    {isSelected && (
                      <div className="w-5 h-5 bg-indigo-600 rounded-full flex items-center justify-center flex-shrink-0">
                        <Check className="h-3 w-3 text-white" />
                      </div>
                    )}
                  </button>
                );
              })
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-1">
            <Button variant="outline" className="flex-1 h-9" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button
              className="flex-1 h-9 bg-indigo-600 hover:bg-indigo-700 text-white"
              onClick={handleCreate}
              disabled={!canCreate || creating}
            >
              {creating
                ? 'Creating…'
                : tab === 'direct'
                ? 'Start Chat'
                : `Create Group (${selected.length})`}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
