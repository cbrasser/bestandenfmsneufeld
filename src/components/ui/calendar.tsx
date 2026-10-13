import * as React from 'react';
import { DayPicker, UI, DayFlag, SelectionState } from 'react-day-picker';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

export type CalendarProps = React.ComponentProps<typeof DayPicker>;

function Calendar({ className, classNames, showOutsideDays = true, ...props }: CalendarProps) {
  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn('relative', className)}
      classNames={{
        [UI.Month]: 'cal-month',
        [UI.MonthCaption]: 'cal-caption',
        [UI.Nav]: 'cal-nav',
        [UI.PreviousMonthButton]: 'btn btn-quiet btn-sm btn-icon',
        [UI.NextMonthButton]: 'btn btn-quiet btn-sm btn-icon',
        [UI.Weekday]: 'cal-weekday',
        [UI.Day]: 'cal-day',
        [SelectionState.selected]: 'cal-selected',
        [DayFlag.today]: 'cal-today',
        [DayFlag.outside]: 'cal-outside',
        [DayFlag.disabled]: 'cal-outside',
        [DayFlag.hidden]: 'invisible',
        ...classNames,
      }}
      components={{
        Chevron: ({ orientation }) =>
          orientation === 'left'
            ? <ChevronLeft size={16} strokeWidth={2.5} />
            : <ChevronRight size={16} strokeWidth={2.5} />,
      }}
      {...props}
    />
  );
}
Calendar.displayName = 'Calendar';

export { Calendar };
