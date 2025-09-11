import * as React from "react"
import { Check, ChevronDown, X } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { cn } from "@/lib/utils"

export interface MultiSelectOption {
  value: string
  label: string
}

interface MultiSelectProps {
  options: MultiSelectOption[]
  selected: string[]
  onChange: (selected: string[]) => void
  placeholder?: string
  className?: string
}

export function MultiSelect({
  options,
  selected,
  onChange,
  placeholder = "Select items...",
  className
}: MultiSelectProps) {
  const [isOpen, setIsOpen] = React.useState(false)

  const handleSelect = (value: string) => {
    const newSelected = selected.includes(value)
      ? selected.filter((item) => item !== value)
      : [...selected, value]
    onChange(newSelected)
  }

  const handleSelectAll = () => {
    if (selected.length === options.length) {
      onChange([])
    } else {
      onChange(options.map(option => option.value))
    }
  }

  const handleRemove = (value: string) => {
    onChange(selected.filter((item) => item !== value))
  }

  const getDisplayText = () => {
    if (selected.length === 0) return placeholder
    if (selected.length === 1) {
      const option = options.find(opt => opt.value === selected[0])
      return option?.label || selected[0]
    }
    return `${selected.length} selected`
  }

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={isOpen}
          className={cn(
            "w-full justify-between h-10 text-left font-normal",
            selected.length === 0 && "text-muted-foreground",
            className
          )}
        >
          <span className="truncate">{getDisplayText()}</span>
          <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0" align="start">
        <div className="flex items-center border-b px-3 py-2">
          <Checkbox
            checked={selected.length === options.length && options.length > 0}
            onCheckedChange={handleSelectAll}
            className="mr-2"
          />
          <span className="text-sm font-medium">Select All</span>
        </div>
        <div className="max-h-60 overflow-auto">
          {options.map((option) => (
            <div
              key={option.value}
              className="flex items-center space-x-2 px-3 py-2 hover:bg-accent cursor-pointer"
              onClick={() => handleSelect(option.value)}
            >
              <Checkbox
                checked={selected.includes(option.value)}
                onChange={() => handleSelect(option.value)}
              />
              <span className="text-sm flex-1">{option.label}</span>
            </div>
          ))}
        </div>
        {selected.length > 0 && (
          <div className="border-t p-2">
            <div className="flex flex-wrap gap-1">
              {selected.map((value) => {
                const option = options.find(opt => opt.value === value)
                return (
                  <Badge
                    key={value}
                    variant="secondary"
                    className="text-xs"
                  >
                    {option?.label || value}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="ml-1 h-auto p-0 text-muted-foreground hover:text-foreground"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleRemove(value)
                      }}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </Badge>
                )
              })}
            </div>
          </div>
        )}
      </PopoverContent>
    </Popover>
  )
}