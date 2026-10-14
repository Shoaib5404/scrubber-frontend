'use client';

import { useEffect, useId, useState } from 'react';
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
import {
  DropdownEmptyState,
  DropdownErrorState,
  DropdownLoadingState,
} from './dropdown-states';

export type AsyncComboboxOption = {
  value: string;
  label: string;
};

export type AsyncComboboxProps = {
  id?: string;
  label?: string;
  value: string;
  displayLabel?: string;
  onValueChange: (value: string, option?: AsyncComboboxOption) => void;
  loadOptions: (
    query: string,
    signal: AbortSignal,
  ) => Promise<AsyncComboboxOption[]>;
  placeholder?: string;
  searchPlaceholder?: string;
  emptyMessage?: string;
  noMatchMessage?: string;
  clearable?: boolean;
  disabled?: boolean;
  debounceMs?: number;
  triggerClassName?: string;
  /** Extra static options always shown (e.g. "All tenants") */
  leadingOptions?: AsyncComboboxOption[];
  'data-testid'?: string;
};

export function AsyncCombobox({
  id: idProp,
  label,
  value,
  displayLabel,
  onValueChange,
  loadOptions,
  placeholder = 'Select…',
  searchPlaceholder = 'Search…',
  emptyMessage = 'No options available.',
  noMatchMessage = 'No matching options.',
  clearable = false,
  disabled,
  debounceMs = 300,
  triggerClassName,
  leadingOptions = [],
  'data-testid': testId,
}: AsyncComboboxProps) {
  const autoId = useId();
  const id = idProp ?? autoId;
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [options, setOptions] = useState<AsyncComboboxOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pickedLabel, setPickedLabel] = useState('');

  useEffect(() => {
    if (!open) return;
    const controller = new AbortController();
    const timer = window.setTimeout(() => {
      setLoading(true);
      setError(null);
      void loadOptions(query, controller.signal)
        .then((rows) => {
          if (controller.signal.aborted) return;
          setOptions(rows);
        })
        .catch((err: unknown) => {
          if (controller.signal.aborted) return;
          if (err instanceof DOMException && err.name === 'AbortError') return;
          setError(
            err instanceof Error ? err.message : 'Failed to load options.',
          );
          setOptions([]);
        })
        .finally(() => {
          if (!controller.signal.aborted) setLoading(false);
        });
    }, debounceMs);

    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [open, query, debounceMs, loadOptions]);

  const labelText =
    pickedLabel ||
    displayLabel ||
    leadingOptions.find((o) => o.value === value)?.label ||
    placeholder;

  const showList = !loading && !error;
  const hasRows = leadingOptions.length > 0 || options.length > 0;

  return (
    <div className="flex flex-col gap-1.5">
      {label ? <Label htmlFor={id}>{label}</Label> : null}
      <Popover
        open={open}
        onOpenChange={(next) => {
          setOpen(next);
          if (next) setQuery('');
        }}
      >
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
              !value && 'text-muted-foreground',
              triggerClassName,
            )}
          >
            <span className="truncate">{value ? labelText : placeholder}</span>
            <span className="flex shrink-0 items-center gap-1">
              {clearable && value ? (
                <span
                  role="button"
                  tabIndex={-1}
                  className="rounded p-0.5 hover:bg-muted"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setPickedLabel('');
                    onValueChange('');
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
          <Command shouldFilter={false}>
            <CommandInput
              placeholder={searchPlaceholder}
              value={query}
              onValueChange={setQuery}
            />
            <CommandList>
              {loading ? <DropdownLoadingState /> : null}
              {!loading && error ? (
                <DropdownErrorState
                  message={error}
                  onRetry={() => {
                    setError(null);
                    setOpen(true);
                    void loadOptions(query, new AbortController().signal)
                      .then(setOptions)
                      .catch((err: unknown) => {
                        setError(
                          err instanceof Error
                            ? err.message
                            : 'Failed to load options.',
                        );
                      });
                  }}
                />
              ) : null}
              {showList && !hasRows ? (
                <DropdownEmptyState
                  message={query.trim() ? noMatchMessage : emptyMessage}
                />
              ) : null}
              {showList && hasRows ? (
                <CommandGroup>
                  {leadingOptions.map((opt) => (
                    <CommandItem
                      key={`lead-${opt.value || 'empty'}`}
                      value={`lead-${opt.label}`}
                      onSelect={() => {
                        setPickedLabel(opt.label);
                        onValueChange(opt.value, opt);
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
                  {options.map((opt) => (
                    <CommandItem
                      key={opt.value}
                      value={opt.label}
                      onSelect={() => {
                        setPickedLabel(opt.label);
                        onValueChange(opt.value, opt);
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
              ) : null}
              {showList && hasRows && options.length === 0 && query.trim() ? (
                <CommandEmpty>{noMatchMessage}</CommandEmpty>
              ) : null}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
}
