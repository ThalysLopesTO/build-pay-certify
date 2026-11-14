import React, { useMemo, useState } from 'react';
import { Check, ChevronsUpDown, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Command, CommandEmpty, CommandGroup, CommandItem, CommandList } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import {
  employeeFullName,
  matchesEmployeeSearch,
  sortEmployeesByName,
  type NamedEmployee,
} from '@/utils/employeeSearch';

export interface PickerEmployee extends NamedEmployee {
  user_id: string;
  photo_url?: string | null;
}

const initials = (e: PickerEmployee) =>
  ((e.first_name ?? '').trim().charAt(0) + (e.last_name ?? '').trim().charAt(0)).toUpperCase() || '?';

const EmployeeAvatar: React.FC<{ employee: PickerEmployee }> = ({ employee }) => (
  <Avatar className="h-6 w-6 shrink-0">
    <AvatarImage src={employee.photo_url ?? undefined} alt={employeeFullName(employee)} />
    <AvatarFallback className="text-[10px]">{initials(employee)}</AvatarFallback>
  </Avatar>
);

interface EmployeePickerProps {
  employees: PickerEmployee[];
  value: string;
  onChange: (userId: string) => void;
  loading?: boolean;
  disabled?: boolean;
}

// Searchable, A–Z employee picker: type part of a name or trade to filter,
// use the arrow keys and Enter to choose.
export const EmployeePicker: React.FC<EmployeePickerProps> = ({
  employees,
  value,
  onChange,
  loading = false,
  disabled = false,
}) => {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');

  const sorted = useMemo(() => sortEmployeesByName(employees), [employees]);
  const visible = useMemo(() => sorted.filter(e => matchesEmployeeSearch(e, query)), [sorted, query]);
  const selected = employees.find(e => e.user_id === value);

  const handleOpenChange = (next: boolean) => {
    setOpen(next);
    if (!next) setQuery('');
  };

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled || loading}
          className="h-10 w-full justify-between font-normal"
        >
          {selected ? (
            <span className="flex items-center gap-2 truncate">
              <EmployeeAvatar employee={selected} />
              <span className="truncate">{employeeFullName(selected)}</span>
            </span>
          ) : (
            <span className="text-muted-foreground">{loading ? 'Loading...' : 'Choose employee'}</span>
          )}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] min-w-[280px] p-0 pointer-events-auto" align="start">
        {/* Filtering is done here (accent-insensitive, A–Z kept), not by cmdk's fuzzy match */}
        <Command shouldFilter={false}>
          <div className="flex items-center border-b px-3">
            <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
            <input
              autoFocus
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Type a name or trade..."
              className="flex h-10 w-full bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground"
            />
          </div>
          <CommandList
            className="max-h-72"
            // Let the list scroll with the mouse wheel / finger even inside the Edit pop-up
            onWheel={e => e.stopPropagation()}
            onTouchMove={e => e.stopPropagation()}
          >
            <CommandEmpty>No employee matches "{query}".</CommandEmpty>
            <CommandGroup>
              {visible.map(e => (
                <CommandItem
                  key={e.user_id}
                  value={e.user_id}
                  onSelect={() => {
                    onChange(e.user_id);
                    handleOpenChange(false);
                  }}
                  className="gap-2"
                >
                  <Check className={cn('h-4 w-4 shrink-0', value === e.user_id ? 'opacity-100' : 'opacity-0')} />
                  <EmployeeAvatar employee={e} />
                  <span className="truncate">
                    {employeeFullName(e)}
                    {e.position ? <span className="text-muted-foreground"> — {e.position}</span> : null}
                  </span>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
          {employees.length > 0 && (
            <div className="border-t px-3 py-1.5 text-xs text-muted-foreground">
              {visible.length} of {employees.length} employees
            </div>
          )}
        </Command>
      </PopoverContent>
    </Popover>
  );
};
