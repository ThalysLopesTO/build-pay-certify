import { supabase } from '@/integrations/supabase/client';

export interface MiniProfile {
  user_id: string;
  first_name: string | null;
  last_name: string | null;
  photo_url: string | null;
  role?: string | null;
}

// Fetch one profile per user_id for the given ids. RLS scopes the rows to the
// caller's active company, so with multi-company users we still get the right
// company's row (and we de-dupe defensively).
//
// This replaces PostgREST FK embeds like `user_profiles!<fk>(...)`, which broke
// when per-user FKs were repointed from user_profiles(user_id) to auth.users(id)
// for multi-company support (a user now has multiple user_profiles rows).
export const fetchProfilesByUserIds = async (
  userIds: (string | null | undefined)[]
): Promise<Record<string, MiniProfile>> => {
  const ids = Array.from(new Set(userIds.filter(Boolean))) as string[];
  if (ids.length === 0) return {};

  const { data, error } = await supabase
    .from('user_profiles')
    .select('user_id, first_name, last_name, photo_url, role')
    .in('user_id', ids);

  if (error) {
    console.error('fetchProfilesByUserIds error:', error);
    return {};
  }

  const map: Record<string, MiniProfile> = {};
  for (const row of (data || []) as MiniProfile[]) {
    if (!map[row.user_id]) map[row.user_id] = row; // first (company-scoped) row wins
  }
  return map;
};
