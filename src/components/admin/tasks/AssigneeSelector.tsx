import { useEmployees } from '@/hooks/new/useUsers';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Label } from '@/components/ui/label';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Checkbox } from '@/components/ui/checkbox';
import { User, X } from 'lucide-react';
import { useState } from 'react';

interface AssigneeSelectorProps {
  selectedUserIds: string[];
  onChange: (userIds: string[]) => void;
}

export function AssigneeSelector({ selectedUserIds, onChange }: AssigneeSelectorProps) {
  const { data, isLoading } = useEmployees();
  
  const users = data?.activeEmployees || [];
  const [isOpen, setIsOpen] = useState(false);

  const getInitials = (firstName?: string | null, lastName?: string | null) => {
    return `${firstName?.[0] || ''}${lastName?.[0] || ''}`.toUpperCase() || '?';
  };

  const handleToggleUser = (userId: string) => {
    if (selectedUserIds.includes(userId)) {
      onChange(selectedUserIds.filter(id => id !== userId));
    } else {
      onChange([...selectedUserIds, userId]);
    }
  };

  const selectedUsers = users.filter(user => selectedUserIds.includes(user.user_id));

  return (
    <div className="space-y-2">
      <Label>Assign To</Label>
      
      {/* Selected Assignees Display */}
      {selectedUsers.length > 0 && (
        <div className="flex flex-wrap gap-2 p-2 border rounded-lg bg-muted/30">
          {selectedUsers.map((user) => (
            <Badge
              key={user.user_id}
              variant="secondary"
              className="gap-2 pr-1 pl-2"
            >
              <Avatar className="w-5 h-5">
                {user.photo_url && <AvatarImage src={user.photo_url} />}
                <AvatarFallback className="text-[10px] bg-primary/10 text-primary">
                  {getInitials(user.first_name, user.last_name)}
                </AvatarFallback>
              </Avatar>
              <span className="text-xs">
                {user.first_name} {user.last_name}
              </span>
              <button
                type="button"
                onClick={() => handleToggleUser(user.user_id)}
                className="ml-1 hover:bg-background/50 rounded-full p-0.5"
              >
                <X className="w-3 h-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}

      {/* Assignee Selector Popover */}
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button variant="outline" className="w-full justify-start">
            <User className="w-4 h-4 mr-2" />
            {selectedUsers.length > 0 
              ? `${selectedUsers.length} assignee${selectedUsers.length > 1 ? 's' : ''} selected`
              : 'Select assignees'}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-80 p-0" align="start">
          <div className="max-h-80 overflow-y-auto p-2 space-y-1">
            {isLoading ? (
              <div className="p-4 text-center text-sm text-muted-foreground">
                Loading employees...
              </div>
            ) : users.length === 0 ? (
              <div className="p-4 text-center text-sm text-muted-foreground">
                No employees found
              </div>
            ) : (
              users.map((user) => (
                <label
                  key={user.user_id}
                  className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted cursor-pointer transition-colors"
                >
                  <Checkbox
                    checked={selectedUserIds.includes(user.user_id)}
                    onCheckedChange={() => handleToggleUser(user.user_id)}
                  />
                  <Avatar className="w-8 h-8">
                    {user.photo_url && <AvatarImage src={user.photo_url} />}
                    <AvatarFallback className="text-xs bg-primary/10 text-primary">
                      {getInitials(user.first_name, user.last_name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate">
                      {user.first_name} {user.last_name}
                    </div>
                    {user.position && (
                      <div className="text-xs text-muted-foreground truncate">
                        {user.position}
                      </div>
                    )}
                  </div>
                  {(user.role === 'admin' || user.role === 'foreman') && (
                    <Badge variant="secondary" className="text-xs">
                      {user.role}
                    </Badge>
                  )}
                </label>
              ))
            )}
          </div>
        </PopoverContent>
      </Popover>

      {selectedUsers.length === 0 && (
        <p className="text-xs text-muted-foreground">No assignees selected</p>
      )}
    </div>
  );
}
