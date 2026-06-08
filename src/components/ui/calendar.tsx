import * as React from 'react';
import { DayPicker, UI, DayFlag, SelectionState } from 'react-day-picker';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { buttonVariants } from '@/components/ui/button';

export type CalendarProps = React.ComponentProps<typeof DayPicker>;

function Calendar({ className, classNames, showOutsideDays = true, ...props }: CalendarProps) {
  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn('p-3', className)}
      classNames={{
        [UI.Months]: 'flex flex-col sm:flex-row gap-2',
        [UI.Month]: 'flex flex-col gap-4',
        [UI.MonthCaption]: 'flex justify-center pt-1 relative items-center',
        [UI.CaptionLabel]: 'text-sm font-medium',
        [UI.Nav]: 'flex items-center gap-1',
        [UI.PreviousMonthButton]: cn(
          buttonVariants({ variant: 'outline' }),
          'absolute left-1 size-7 p-0 opacity-50 hover:opacity-100'
        ),
        [UI.NextMonthButton]: cn(
          buttonVariants({ variant: 'outline' }),
          'absolute right-1 size-7 p-0 opacity-50 hover:opacity-100'
        ),
        [UI.MonthGrid]: 'w-full border-collapse space-y-1',
        [UI.Weekdays]: 'flex',
        [UI.Weekday]: 'text-gray-400 dark:text-gray-500 rounded-md w-8 font-normal text-[0.8rem]',
        [UI.Weeks]: 'space-y-0',
        [UI.Week]: 'flex w-full mt-2',
        [UI.Day]: 'relative p-0 text-center text-sm [&:has([aria-selected])]:bg-blue-100 dark:[&:has([aria-selected])]:bg-blue-900/30 [&:has([aria-selected])]:rounded-md',
        [UI.DayButton]: cn(
          buttonVariants({ variant: 'ghost' }),
          'size-8 p-0 font-normal text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 aria-selected:opacity-100'
        ),
        [SelectionState.selected]: 'bg-blue-600 text-white hover:bg-blue-600 hover:text-white focus:bg-blue-600 focus:text-white rounded-md',
        [DayFlag.today]: 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-md',
        [DayFlag.outside]: 'text-gray-400 dark:text-gray-600 opacity-50',
        [DayFlag.disabled]: 'text-gray-300 dark:text-gray-600 opacity-50',
        [DayFlag.hidden]: 'invisible',
        ...classNames,
      }}
      components={{
        Chevron: ({ orientation }) =>
          orientation === 'left'
            ? <ChevronLeft className="size-4" />
            : <ChevronRight className="size-4" />,
      }}
      {...props}
    />
  );
}
Calendar.displayName = 'Calendar';

export { Calendar };
