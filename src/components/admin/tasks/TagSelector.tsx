import { useState } from 'react';
import { useTaskTags, useTaskActions } from '@/hooks/useJobsiteTasksAdvanced';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Checkbox } from '@/components/ui/checkbox';
import { Plus, Tag, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TagSelectorProps {
  selectedTagIds: string[];
  onChange: (tagIds: string[]) => void;
}

const TAG_COLORS = [
  { name: 'Red', hex: '#ef4444' },
  { name: 'Orange', hex: '#f97316' },
  { name: 'Yellow', hex: '#eab308' },
  { name: 'Green', hex: '#22c55e' },
  { name: 'Blue', hex: '#3b82f6' },
  { name: 'Purple', hex: '#a855f7' },
  { name: 'Pink', hex: '#ec4899' },
  { name: 'Gray', hex: '#6b7280' },
];

export function TagSelector({ selectedTagIds, onChange }: TagSelectorProps) {
  const { data: tags = [], isLoading } = useTaskTags();
  const taskActions = useTaskActions();
  const [isCreating, setIsCreating] = useState(false);
  const [newTagLabel, setNewTagLabel] = useState('');
  const [selectedColor, setSelectedColor] = useState(TAG_COLORS[0].hex);
  const [isOpen, setIsOpen] = useState(false);

  const handleToggleTag = (tagId: string) => {
    if (selectedTagIds.includes(tagId)) {
      onChange(selectedTagIds.filter(id => id !== tagId));
    } else {
      onChange([...selectedTagIds, tagId]);
    }
  };

  const handleCreateTag = async () => {
    if (!newTagLabel.trim()) return;
    
    // For now, we'll just show a toast that tag creation needs to be implemented
    // The createTag mutation doesn't exist in useTaskActions yet
    console.log('Tag creation not yet implemented:', { label: newTagLabel.trim(), color: selectedColor });
    setNewTagLabel('');
    setSelectedColor(TAG_COLORS[0].hex);
    setIsCreating(false);
  };

  const selectedTags = tags.filter(tag => selectedTagIds.includes(tag.id));

  return (
    <div className="space-y-2">
      <Label>Tags</Label>
      
      {/* Selected Tags Display */}
      {selectedTags.length > 0 && (
        <div className="flex flex-wrap gap-2 p-2 border rounded-lg bg-muted/30">
          {selectedTags.map((tag) => (
            <Badge
              key={tag.id}
              variant="outline"
              style={{ 
                borderColor: tag.color,
                color: tag.color,
                backgroundColor: `${tag.color}10`
              }}
              className="gap-1"
            >
              {tag.label}
              <button
                type="button"
                onClick={() => handleToggleTag(tag.id)}
                className="ml-1 hover:bg-background/50 rounded-full p-0.5"
              >
                <X className="w-3 h-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}

      {/* Tag Selector Popover */}
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button variant="outline" className="w-full justify-start">
            <Tag className="w-4 h-4 mr-2" />
            {selectedTags.length > 0 
              ? `${selectedTags.length} tag${selectedTags.length > 1 ? 's' : ''} selected`
              : 'Select tags'}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-80 p-0" align="start">
          {!isCreating ? (
            <div className="max-h-80 overflow-y-auto">
              {/* Tag List */}
              <div className="p-2 space-y-1">
                {isLoading ? (
                  <div className="p-4 text-center text-sm text-muted-foreground">
                    Loading tags...
                  </div>
                ) : tags.length === 0 ? (
                  <div className="p-4 text-center text-sm text-muted-foreground">
                    No tags created yet
                  </div>
                ) : (
                  tags.map((tag) => (
                    <label
                      key={tag.id}
                      className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted cursor-pointer transition-colors"
                    >
                      <Checkbox
                        checked={selectedTagIds.includes(tag.id)}
                        onCheckedChange={() => handleToggleTag(tag.id)}
                      />
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: tag.color }}
                      />
                      <span className="text-sm flex-1">{tag.label}</span>
                    </label>
                  ))
                )}
              </div>

              {/* Create New Tag Button */}
              <div className="border-t p-2">
                <Button
                  variant="ghost"
                  className="w-full justify-start"
                  onClick={() => setIsCreating(true)}
                  type="button"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Create New Tag
                </Button>
              </div>
            </div>
          ) : (
            <div className="p-4 space-y-4">
              <div>
                <Label htmlFor="tag-label">Tag Label</Label>
                <Input
                  id="tag-label"
                  value={newTagLabel}
                  onChange={(e) => setNewTagLabel(e.target.value)}
                  placeholder="Enter tag name"
                  autoFocus
                />
              </div>

              <div>
                <Label>Color</Label>
                <div className="grid grid-cols-4 gap-2 mt-2">
                  {TAG_COLORS.map((color) => (
                    <button
                      key={color.hex}
                      type="button"
                      onClick={() => setSelectedColor(color.hex)}
                      className={cn(
                        "w-full aspect-square rounded-lg border-2 transition-all hover:scale-110",
                        selectedColor === color.hex
                          ? "border-foreground scale-110"
                          : "border-transparent"
                      )}
                      style={{ backgroundColor: color.hex }}
                      title={color.name}
                    />
                  ))}
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => {
                    setIsCreating(false);
                    setNewTagLabel('');
                    setSelectedColor(TAG_COLORS[0].hex);
                  }}
                  type="button"
                >
                  Cancel
                </Button>
                <Button
                  className="flex-1"
                  onClick={handleCreateTag}
                  disabled={!newTagLabel.trim()}
                  type="button"
                >
                  Create Tag
                </Button>
              </div>
            </div>
          )}
        </PopoverContent>
      </Popover>

      {selectedTags.length === 0 && (
        <p className="text-xs text-muted-foreground">No tags selected</p>
      )}
    </div>
  );
}
