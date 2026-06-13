import React, { useState } from 'react';
import { MessageSquare } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import { useConversations } from '@/hooks/chat/useConversations';
import { ConversationSidebar } from './ConversationSidebar';
import { ConversationThread } from './ConversationThread';

const ChatPage: React.FC = () => {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const isMobile = useIsMobile();
  const { data: conversations = [] } = useConversations();

  const selected = conversations.find(c => c.id === selectedId) ?? null;

  if (isMobile) {
    // Mobile: full-screen sidebar or full-screen thread
    if (selectedId && selected) {
      return (
        <div className="fixed inset-0 top-[60px] flex flex-col bg-white z-10">
          <ConversationThread
            conversation={selected}
            onBack={() => setSelectedId(null)}
          />
        </div>
      );
    }
    return (
      <div className="h-[calc(100dvh-60px)] flex flex-col">
        <ConversationSidebar selectedId={selectedId} onSelect={setSelectedId} />
      </div>
    );
  }

  // Desktop: split layout
  return (
    <div
      className="flex overflow-hidden rounded-2xl border border-slate-200 shadow-sm bg-white"
      style={{ height: 'calc(100dvh - 100px)' }}
    >
      {/* Sidebar */}
      <div className="w-72 xl:w-80 flex-shrink-0 border-r border-slate-200">
        <ConversationSidebar selectedId={selectedId} onSelect={setSelectedId} />
      </div>

      {/* Thread or empty state */}
      <div className="flex-1 min-w-0">
        {selectedId && selected ? (
          <ConversationThread conversation={selected} />
        ) : (
          <div className="h-full flex flex-col items-center justify-center bg-slate-50 text-center px-8">
            <div className="p-5 rounded-2xl bg-indigo-50 mb-4 shadow-sm">
              <MessageSquare className="h-10 w-10 text-indigo-400" />
            </div>
            <h3 className="text-lg font-bold text-slate-700">StackBuild Chat</h3>
            <p className="text-sm text-slate-400 mt-2 max-w-xs leading-relaxed">
              Select a conversation from the sidebar or start a new one with your team.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatPage;
