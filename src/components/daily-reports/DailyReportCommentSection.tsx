import React, { useState, useRef, useEffect } from 'react';
import { MessageSquare, Trash2, User } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import {
  useDailyReportComments,
  useCreateDailyReportComment,
  useDeleteDailyReportComment,
  DailyReportComment,
} from '@/hooks/useDailyReportComments';
import { formatDistanceToNow } from 'date-fns';

interface DailyReportCommentSectionProps {
  reportId: string;
}

const getRoleBadgeColor = (role: string | null | undefined) => {
  switch (role) {
    case 'admin':
    case 'super_admin':
      return 'bg-blue-500 text-white';
    case 'management':
      return 'bg-purple-500 text-white';
    case 'foreman':
      return 'bg-green-500 text-white';
    default:
      return 'bg-gray-500 text-white';
  }
};

const getRoleDisplay = (role: string | null | undefined) => {
  if (role === 'super_admin') return 'Admin';
  if (!role) return 'User';
  return role.charAt(0).toUpperCase() + role.slice(1);
};

const getInitials = (firstName: string | null, lastName: string | null) => {
  const first = firstName?.charAt(0) || '';
  const last = lastName?.charAt(0) || '';
  return (first + last).toUpperCase() || 'U';
};

const CommentCard: React.FC<{
  comment: DailyReportComment;
  onDelete: (commentId: string) => void;
}> = ({ comment, onDelete }) => {
  const userProfile = comment.user_profiles;
  const fullName = `${userProfile?.first_name || ''} ${userProfile?.last_name || ''}`.trim() || 'Unknown User';

  return (
    <div className="border rounded-lg p-4 bg-muted/30 hover:bg-muted/50 transition-colors">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 flex-1">
          <Avatar className="h-8 w-8 border-2 border-border">
            <AvatarImage src={userProfile?.photo_url || undefined} alt={fullName} />
            <AvatarFallback className="text-xs">
              {getInitials(userProfile?.first_name, userProfile?.last_name)}
            </AvatarFallback>
          </Avatar>
          
          <div className="flex-1 space-y-2">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-medium text-sm">{fullName}</span>
              <Badge className={`${getRoleBadgeColor(userProfile?.role)} text-xs px-2 py-0`}>
                {getRoleDisplay(userProfile?.role)}
              </Badge>
              <span className="text-xs text-muted-foreground">
                {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
              </span>
            </div>
            
            <p className="text-sm whitespace-pre-wrap break-words">{comment.comment_text}</p>
          </div>
        </div>
        
        {comment.canDelete && (
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-muted-foreground hover:text-destructive"
            onClick={() => onDelete(comment.id)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
};

export const DailyReportCommentSection: React.FC<DailyReportCommentSectionProps> = ({ reportId }) => {
  const { user } = useAuth();
  const [commentText, setCommentText] = useState('');
  const commentsEndRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const { data: comments = [], isLoading } = useDailyReportComments(reportId);
  const createMutation = useCreateDailyReportComment();
  const deleteMutation = useDeleteDailyReportComment();

  const canComment = user?.role && ['admin', 'super_admin', 'management', 'foreman'].includes(user.role);
  const characterCount = commentText.length;
  const maxCharacters = 2000;

  useEffect(() => {
    if (comments.length > 0 && commentsEndRef.current) {
      commentsEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [comments.length]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim() || characterCount > maxCharacters) return;

    await createMutation.mutateAsync({
      reportId,
      commentText: commentText.trim(),
    });

    setCommentText('');
  };

  const handleDelete = async (commentId: string) => {
    if (confirm('Are you sure you want to delete this comment?')) {
      await deleteMutation.mutateAsync({ commentId, reportId });
    }
  };

  return (
    <div className="space-y-4 mt-6">
      <Separator />
      
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5 text-muted-foreground" />
          <h3 className="text-lg font-semibold">Comments</h3>
        </div>
        {comments.length > 0 && (
          <Badge variant="secondary">{comments.length} {comments.length === 1 ? 'comment' : 'comments'}</Badge>
        )}
      </div>

      {/* Comments List */}
      <div ref={containerRef} className="space-y-3 max-h-96 overflow-y-auto">
        {isLoading ? (
          <div className="text-center py-8 text-muted-foreground">
            <p>Loading comments...</p>
          </div>
        ) : comments.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground border rounded-lg bg-muted/20">
            <MessageSquare className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>No comments yet</p>
            {canComment && <p className="text-sm">Be the first to comment on this report</p>}
          </div>
        ) : (
          <>
            {comments.map((comment) => (
              <CommentCard key={comment.id} comment={comment} onDelete={handleDelete} />
            ))}
            <div ref={commentsEndRef} />
          </>
        )}
      </div>

      {/* Comment Input */}
      {canComment && (
        <form onSubmit={handleSubmit} className="space-y-2">
          <Textarea
            placeholder="Add a comment... (visible to all admins, managers, and foremen)"
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            className="min-h-[80px] resize-y"
            disabled={createMutation.isPending}
          />
          
          <div className="flex items-center justify-between gap-2">
            <span className={`text-xs ${characterCount > maxCharacters ? 'text-destructive' : 'text-muted-foreground'}`}>
              {characterCount}/{maxCharacters} characters
            </span>
            
            <Button
              type="submit"
              disabled={!commentText.trim() || characterCount > maxCharacters || createMutation.isPending}
            >
              {createMutation.isPending ? 'Posting...' : 'Post Comment'}
            </Button>
          </div>
        </form>
      )}

      {!canComment && (
        <div className="text-sm text-muted-foreground italic text-center py-2 border rounded-lg bg-muted/20">
          Only admins, managers, and foremen can post comments
        </div>
      )}
    </div>
  );
};

export default DailyReportCommentSection;
