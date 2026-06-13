export interface ChatUserProfile {
  user_id: string;
  first_name: string | null;
  last_name: string | null;
  role: string;
  photo_url: string | null;
}

export interface ChatConversation {
  id: string;
  company_id: string;
  name: string | null;
  type: 'direct' | 'group';
  description: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface ChatMember {
  id: string;
  conversation_id: string;
  user_id: string;
  last_read_at: string;
  joined_at: string;
}

export interface ChatMemberWithProfile extends ChatMember {
  profile: ChatUserProfile;
}

export interface ChatMessage {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  created_at: string;
  is_deleted: boolean;
  attachment_url: string | null;
  sender?: ChatUserProfile;
}

export interface ConversationWithDetails extends ChatConversation {
  members: ChatMemberWithProfile[];
  last_message: ChatMessage | null;
  unread_count: number;
}
