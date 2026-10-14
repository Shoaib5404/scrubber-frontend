'use client';

import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export type AppSelectOption = {
  value: string;
  label: string;
  disabled?: boolean;
};

export type AppSelectProps = {
  id: string;
  label?: string;
  value: string;
  onValueChange: (value: string) => void;
  options: AppSelectOption[];
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
  invalid?: boolean;
  errorMessage?: string;
  className?: string;
  triggerClassName?: string;
  size?: 'sm' | 'default';
  'data-testid'?: string;
};

export function AppSelect({
  id,
  label,
  value,
  onValueChange,
  options,
  placeholder = 'Select…',
  disabled,
  required,
  invalid,
  errorMessage,
  className,
  triggerClassName,
  size = 'default',
  'data-testid': testId,
}: AppSelectProps) {
  const errorId = `${id}-error`;
  const describedBy = invalid && errorMessage ? errorId : undefined;

  return (
    <div className={className ? `flex flex-col gap-1.5 ${className}` : 'flex flex-col gap-1.5'}>
      {label ? (
        <Label htmlFor={id}>
          {label}
          {required ? <span className="text-destructive"> *</span> : null}
        </Label>
      ) : null}
      <Select
        value={value}
        onValueChange={onValueChange}
        disabled={disabled}
        required={required}
      >
        <SelectTrigger
          id={id}
          size={size}
          className={triggerClassName ?? 'w-full'}
          aria-invalid={invalid || undefined}
          aria-describedby={describedBy}
          data-testid={testId}
        >
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent position="popper" align="start">
          {options.map((opt) => (
            <SelectItem
              key={opt.value}
              value={opt.value}
              disabled={opt.disabled}
            >
              {opt.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {invalid && errorMessage ? (
        <p id={errorId} className="text-sm text-destructive">
          {errorMessage}
        </p>
      ) : null}
    </div>
  );
}
