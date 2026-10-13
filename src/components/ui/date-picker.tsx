import { format } from 'date-fns';
import { de, fr, enUS, it } from 'date-fns/locale';
import type { Locale } from 'date-fns';
import { CalendarIcon, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import type { Language } from '@/i18n/locales';

const dateFnsLocales: Record<Language, Locale> = {
  de,
  fr,
  en: enUS,
  it,
};

interface DatePickerProps {
  date: Date | undefined;
  onDateChange: (date: Date | undefined) => void;
  placeholder?: string;
  language?: Language;
  clearLabel?: string;
  className?: string;
}

export function DatePicker({ date, onDateChange, placeholder = 'Pick a date', language = 'de', clearLabel = 'Clear date', className }: DatePickerProps) {
  const locale = dateFnsLocales[language];

  return (
    <div className={cn('flex items-center gap-1', className)}>
      <Popover>
        <PopoverTrigger asChild>
          <button type="button" className="input input-button" data-empty={!date}>
            <CalendarIcon size={16} strokeWidth={2.5} aria-hidden="true" />
            {date ? format(date, 'dd.MM.yyyy', { locale }) : <span>{placeholder}</span>}
          </button>
        </PopoverTrigger>
        <PopoverContent align="start">
          <Calendar
            mode="single"
            selected={date}
            onSelect={onDateChange}
            locale={locale}
            defaultMonth={date ?? new Date()}
          />
        </PopoverContent>
      </Popover>
      {date && (
        <button
          type="button"
          onClick={() => onDateChange(undefined)}
          className="btn btn-quiet btn-sm btn-icon"
          aria-label={clearLabel}
        >
          <X size={16} strokeWidth={2.5} aria-hidden="true" />
        </button>
      )}
    </div>
  );
}
