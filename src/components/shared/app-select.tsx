import { cn } from '@/lib/utils'
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

interface SelectOption {
  value: string | number
  label: string
  disabled?: boolean
}

interface AppSelectProps {
  options: SelectOption[]
  value?: string | number
  defaultValue?: string | number
  onValueChange?: (value: string) => void
  name?: string
  required?: boolean
  disabled?: boolean
  className?: string
  'aria-label'?: string
}

export function AppSelect({ options, value, defaultValue, onValueChange, name, required, disabled, className, 'aria-label': label }: AppSelectProps) {
  const items = options.map(option => ({ ...option, value: String(option.value) }))
  return (
    <Select
      items={items}
      {...(value !== undefined ? { value: String(value) } : { defaultValue: String(defaultValue ?? '') })}
      onValueChange={next => onValueChange?.(next ?? '')}
      name={name}
      required={required}
      disabled={disabled}
    >
      <SelectTrigger className={cn('h-9 w-full min-w-0 data-[size=default]:h-9', className)} aria-label={label}>
        <SelectValue className="min-w-0 truncate" />
      </SelectTrigger>
      <SelectContent align="start" alignItemWithTrigger={false} className="max-h-[min(18rem,var(--available-height))]">
        <SelectGroup>
          {items.map(item => <SelectItem key={item.value} value={item.value} disabled={item.disabled}>{item.label}</SelectItem>)}
        </SelectGroup>
      </SelectContent>
    </Select>
  )
}
