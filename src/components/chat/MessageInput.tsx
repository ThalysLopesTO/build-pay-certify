import React, { useState, useRef, KeyboardEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Send } from 'lucide-react';

interface MessageInputProps {
  onSend: (content: string) => Promise<void>;
  disabled?: boolean;
}

export const MessageInput: React.FC<MessageInputProps> = ({ onSend, disabled }) => {
  const [content, setContent] = useState('');
  const [sending, setSending] = useState(false);
  const ref = useRef<HTMLTextAreaElement>(null);

  const autoResize = () => {
    if (!ref.current) return;
    ref.current.style.height = 'auto';
    ref.current.style.height = `${Math.min(ref.current.scrollHeight, 128)}px`;
  };

  const handleSend = async () => {
    if (!content.trim() || sending || disabled) return;
    setSending(true);
    try {
      await onSend(content);
      setContent('');
      if (ref.current) ref.current.style.height = 'auto';
    } finally {
      setSending(false);
      ref.current?.focus();
    }
  };

  const onKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const canSend = !!content.trim() && !sending && !disabled;

  return (
    <div className="px-4 pb-4 pt-3 bg-white border-t border-slate-100">
      <div
        className={`flex items-end gap-2 bg-slate-50 rounded-2xl border px-4 py-2.5 transition-all duration-150 ${
          content ? 'border-indigo-300 ring-2 ring-indigo-50' : 'border-slate-200'
        }`}
      >
        <textarea
          ref={ref}
          value={content}
          onChange={e => { setContent(e.target.value); autoResize(); }}
          onKeyDown={onKeyDown}
          placeholder="Type a message…"
          disabled={disabled || sending}
          rows={1}
          className="flex-1 resize-none bg-transparent text-sm text-slate-800 placeholder:text-slate-400 outline-none min-h-[24px] max-h-32 py-0.5 leading-relaxed"
        />
        <Button
          size="sm"
          onClick={handleSend}
          disabled={!canSend}
          className={`h-8 w-8 p-0 rounded-xl flex-shrink-0 transition-all duration-150 ${
            canSend
              ? 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-200'
              : 'bg-slate-200 text-slate-400 cursor-not-allowed'
          }`}
        >
          <Send className="h-3.5 w-3.5" />
        </Button>
      </div>
      <p className="text-[10px] text-slate-400 text-center mt-1.5 select-none">
        Enter to send · Shift + Enter for new line
      </p>
    </div>
  );
};
