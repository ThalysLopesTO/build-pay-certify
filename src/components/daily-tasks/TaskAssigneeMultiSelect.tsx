import React from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Label } from '@/components/ui/label';
import { useCompanyUsers } from '@/hooks/useCompanyUsers';
import { TaskAssigneeChips } from './TaskAssigneeChips';
import { DailyTaskAssignee } from '@/types/daily-tasks';

interface TaskAssigneeMultiSelectProps {
  selectedUserIds: string[];
  onChange: (userIds: string[]) => void;
  disabled?: boolean;
}

export const TaskAssigneeMultiSelect: React.FC<TaskAssigneeMultiSelectProps> = ({
  selectedUserIds,
  onChange,
  disabled,
}) => {
  const { data: users = [] } = useCompanyUsers();

  const handleAddUser = (userId: string) => {
    if (!selectedUserIds.includes(userId)) {
      onChange([...selectedUserIds, userId]);
    }
  };

  const handleRemoveUser = (userId: string) => {
    onChange(selectedUserIds.filter((id) => id !== userId));
  };

  const selectedAssignees: DailyTaskAssignee[] = selectedUserIds
    .map((userId) => {
      const user = users.find((u) => u.user_id === userId);
      if (!user) return null;
      return {
        id: userId,
        item_id: '',
        user_id: userId,
        assigned_by: null,
        assigned_at: new Date().toISOString(),
        user_profiles: {
          user_id: userId,
          first_name: user.first_name || '',
          last_name: user.last_name || '',
          photo_url: user.photo_url || null,
        },
      };
    })
    .filter(Boolean) as DailyTaskAssignee[];

  const availableUsers = users.filter((u) => !selectedUserIds.includes(u.user_id));

  return (
    <div className="space-y-2">
      <Label>Assignees</Label>
      <div className="space-y-2">
        {selectedAssignees.length > 0 && (
          <TaskAssigneeChips
            assignees={selectedAssignees}
            onRemove={handleRemoveUser}
            maxVisible={10}
          />
        )}
        <Select onValueChange={handleAddUser} disabled={disabled}>
          <SelectTrigger>
            <SelectValue placeholder="Add assignee..." />
          </SelectTrigger>
          <SelectContent>
            {availableUsers.map((user) => {
              const fullName = `${user.first_name || ''} ${user.last_name || ''}`.trim();
              const initials = `${user.first_name?.[0] || ''}${user.last_name?.[0] || ''}`.toUpperCase();

              return (
                <SelectItem key={user.user_id} value={user.user_id}>
                  <div className="flex items-center gap-2">
                    <Avatar className="h-6 w-6">
                      <AvatarImage src={user.photo_url || undefined} alt={fullName} />
                      <AvatarFallback className="text-xs">{initials}</AvatarFallback>
                    </Avatar>
                    <span>{fullName || user.email}</span>
                  </div>
                </SelectItem>
              );
            })}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
};
