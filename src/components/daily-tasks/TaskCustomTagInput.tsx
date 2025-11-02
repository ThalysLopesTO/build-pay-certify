import React, { useState, KeyboardEvent } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { TaskCustomTagChip } from './TaskCustomTagChip';
import { Badge } from '@/components/ui/badge';

interface TaskCustomTagInputProps {
  tags: string[];
  onChange: (tags: string[]) => void;
  placeholder?: string;
  suggestions?: string[];
  disabled?: boolean;
}

export const TaskCustomTagInput: React.FC<TaskCustomTagInputProps> = ({
  tags,
  onChange,
  placeholder = 'Add tags (press Enter)...',
  suggestions = [],
  disabled,
}) => {
  const [input, setInput] = useState('');

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && input.trim()) {
      e.preventDefault();
      const newTag = input.trim();
      if (!tags.includes(newTag)) {
        onChange([...tags, newTag]);
      }
      setInput('');
    } else if (e.key === 'Backspace' && !input && tags.length > 0) {
      onChange(tags.slice(0, -1));
    }
  };

  const removeTag = (tagToRemove: string) => {
    onChange(tags.filter((t) => t !== tagToRemove));
  };

  const addSuggestion = (tag: string) => {
    if (!tags.includes(tag)) {
      onChange([...tags, tag]);
    }
  };

  const availableSuggestions = suggestions.filter((s) => !tags.includes(s));

  return (
    <div className="space-y-2">
      <Label>Tags</Label>
      <div className="space-y-2">
        <div className="flex flex-wrap gap-2 min-h-[32px] p-2 border rounded-md bg-background">
          {tags.map((tag) => (
            <TaskCustomTagChip key={tag} tag={tag} onRemove={() => removeTag(tag)} />
          ))}
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={tags.length === 0 ? placeholder : ''}
            disabled={disabled}
            className="flex-1 min-w-[120px] border-0 shadow-none focus-visible:ring-0 p-0 h-6"
          />
        </div>
        {availableSuggestions.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            <span className="text-xs text-muted-foreground">Suggestions:</span>
            {availableSuggestions.slice(0, 5).map((tag) => (
              <Badge
                key={tag}
                variant="outline"
                className="cursor-pointer hover:bg-accent text-xs"
                onClick={() => addSuggestion(tag)}
              >
                {tag}
              </Badge>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
