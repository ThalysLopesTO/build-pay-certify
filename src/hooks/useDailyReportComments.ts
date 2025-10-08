import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useToast } from '@/hooks/use-toast';

export interface DailyReportComment {
  id: string;
  daily_report_id: string;
  user_id: string;
  comment_text: string;
  created_at: string;
  updated_at: string;
  company_id: string;
  user_profiles?: {
    first_name: string | null;
    last_name: string | null;
    photo_url: string | null;
    role: string | null;
  } | null;
  canEdit?: boolean;
  canDelete?: boolean;
}

export const useDailyReportComments = (reportId: string | null) => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['daily-report-comments', reportId],
    queryFn: async () => {
      if (!reportId) return [];

      const { data, error } = await supabase
        .from('daily_report_comments')
        .select(`
          *,
          user_profiles!daily_report_comments_user_id_fkey (
            first_name,
            last_name,
            photo_url,
            role
          )
        `)
        .eq('daily_report_id', reportId)
        .order('created_at', { ascending: true });

      if (error) throw error;

      // Add edit/delete permissions
      const commentsWithPermissions = (data || []).map(comment => {
        const createdAt = new Date(comment.created_at);
        const now = new Date();
        const hoursSinceCreation = (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60);
        
        const isOwner = comment.user_id === user?.id;
        const isAdmin = user?.role && ['admin', 'super_admin'].includes(user.role);
        
        return {
          ...comment,
          canEdit: isOwner && hoursSinceCreation < 24,
          canDelete: (isOwner && hoursSinceCreation < 24) || isAdmin,
        };
      });

      return commentsWithPermissions;
    },
    enabled: !!reportId && !!user?.companyId,
    staleTime: 30 * 1000,
    refetchOnWindowFocus: true,
  });
};

export const useCreateDailyReportComment = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ reportId, commentText }: { reportId: string; commentText: string }) => {
      if (!user?.id || !user?.companyId) {
        throw new Error('Authentication required');
      }

      if (!commentText.trim()) {
        throw new Error('Comment cannot be empty');
      }

      const { data, error } = await supabase
        .from('daily_report_comments')
        .insert({
          daily_report_id: reportId,
          user_id: user.id,
          comment_text: commentText.trim(),
          company_id: user.companyId,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['daily-report-comments', variables.reportId] });
      toast({
        title: 'Comment posted',
        description: 'Your comment has been added successfully',
      });
    },
    onError: (error) => {
      toast({
        title: 'Failed to post comment',
        description: error.message || 'Please try again',
        variant: 'destructive',
      });
    },
  });
};

export const useDeleteDailyReportComment = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ commentId, reportId }: { commentId: string; reportId: string }) => {
      const { error } = await supabase
        .from('daily_report_comments')
        .delete()
        .eq('id', commentId);

      if (error) throw error;
      return { commentId, reportId };
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['daily-report-comments', result.reportId] });
      toast({
        title: 'Comment deleted',
        description: 'The comment has been removed',
      });
    },
    onError: (error) => {
      toast({
        title: 'Failed to delete comment',
        description: error.message || 'Please try again',
        variant: 'destructive',
      });
    },
  });
};
