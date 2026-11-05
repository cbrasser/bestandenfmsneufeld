/**
 * A grade's date is a calendar day ("2026-11-12"), not a moment. It's read and written in the
 * device's own time, because going through UTC moves it to the day before in Switzerland.
 */
export function dateToStorage(date: Date): string {
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}-${month}-${day}`;
}

export function dateFromStorage(stored: string | undefined): Date | undefined {
  if (!stored) return undefined;
  const day = /^(\d{4})-(\d{2})-(\d{2})$/.exec(stored);
  const date = day ? new Date(Number(day[1]), Number(day[2]) - 1, Number(day[3])) : new Date(stored);
  return Number.isNaN(date.getTime()) ? undefined : date;
}
