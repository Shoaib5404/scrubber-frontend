'use client';

import { useMemo, useState } from 'react';
import { CheckIcon, ChevronsUpDownIcon, XIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { Label } from '@/components/ui/label';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { cn } from 'cn';
import type { AppSelectOption } from './app-select';
import { DropdownEmptyState } from './dropdown-states';

export type SearchableSelectProps = {
  id: string;
  label?: string;
  value: string;
  onValueChange: (value: string) => void;
  options: AppSelectOption[];
  placeholder?: string;
  searchPlaceholder?: string;
  emptyMessage?: string;
  noMatchMessage?: string;
  clearable?: boolean;
  disabled?: boolean;
  triggerClassName?: string;
  'data-testid'?: string;
};

export function SearchableSelect({
  id,
  label,
  value,
  onValueChange,
  options,
  placeholder = 'Select…',
  searchPlaceholder = 'Search…',
  emptyMessage = 'No options available.',
  noMatchMessage = 'No matching options.',
  clearable = false,
  disabled,
  triggerClassName,
  'data-testid': testId,
}: SearchableSelectProps) {
  const [open, setOpen] = useState(false);
  const selected = useMemo(
    () => options.find((o) => o.value === value),
    [options, value],
  );

  return (
    <div className="flex flex-col gap-1.5">
      {label ? <Label htmlFor={id}>{label}</Label> : null}
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            id={id}
            type="button"
            variant="outline"
            role="combobox"
            aria-expanded={open}
            disabled={disabled}
            data-testid={testId}
            className={cn(
              'h-9 w-full justify-between font-normal',
              !selected && 'text-muted-foreground',
              triggerClassName,
            )}
          >
            <span className="truncate">{selected?.label ?? placeholder}</span>
            <span className="flex shrink-0 items-center gap-1">
              {clearable && value ? (
                <span
                  role="button"
                  tabIndex={-1}
                  className="rounded p-0.5 hover:bg-muted"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    onValueChange('');
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      e.stopPropagation();
                      onValueChange('');
                    }
                  }}
                  aria-label="Clear selection"
                >
                  <XIcon className="size-3.5 opacity-60" />
                </span>
              ) : null}
              <ChevronsUpDownIcon className="size-4 opacity-50" />
            </span>
          </Button>
        </PopoverTrigger>
        <PopoverContent
          className="w-[var(--radix-popover-trigger-width)] p-0"
          align="start"
        >
          {options.length === 0 ? (
            <DropdownEmptyState message={emptyMessage} />
          ) : (
            <Command>
              <CommandInput placeholder={searchPlaceholder} />
              <CommandList>
                <CommandEmpty>{noMatchMessage}</CommandEmpty>
                <CommandGroup>
                  {options.map((opt) => (
                    <CommandItem
                      key={opt.value}
                      value={`${opt.label} ${opt.value}`}
                      disabled={opt.disabled}
                      onSelect={() => {
                        onValueChange(opt.value);
                        setOpen(false);
                      }}
                    >
                      <CheckIcon
                        className={cn(
                          'size-4',
                          value === opt.value ? 'opacity-100' : 'opacity-0',
                        )}
                      />
                      {opt.label}
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          )}
        </PopoverContent>
      </Popover>
    </div>
  );
}
