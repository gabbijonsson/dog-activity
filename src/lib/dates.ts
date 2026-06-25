import {
	endOfDay,
	endOfMonth,
	format,
	parseISO,
	startOfDay,
	startOfMonth,
} from 'date-fns'

/** ISO datetime string for the current moment. */
export function nowIso(): string {
	return new Date().toISOString()
}

/** ISO date string (yyyy-MM-dd) for today in local timezone. */
export function todayDateString(): string {
	return format(new Date(), 'yyyy-MM-dd')
}

export function toDateString(date: Date): string {
	return format(date, 'yyyy-MM-dd')
}

/** Local calendar date (yyyy-MM-dd) from an ISO date or datetime string. */
export function toLocalDateString(iso: string): string {
	return format(parseISO(iso), 'yyyy-MM-dd')
}

/** End of the local calendar day as an ISO datetime (for payment deadlines). */
export function endOfLocalDayIso(dateString: string): string {
	return endOfDay(parseISO(dateString)).toISOString()
}

/** Build a payment deadline from a date-only picker value (23:59 local). */
export function paymentDeadlineFromDate(dateString: string): string {
	return endOfLocalDayIso(dateString)
}

export function formatDisplayDate(iso: string): string {
	return format(parseISO(iso), 'yyyy-MM-dd')
}

export function formatDisplayDateTime(iso: string): string {
	return format(parseISO(iso), 'yyyy-MM-dd HH:mm')
}

export function formatShortDate(iso: string): string {
	return format(parseISO(iso), 'd MMM')
}

export function formatShortDateTime(iso: string): string {
	return format(parseISO(iso), 'd/M HH:mm')
}

export function monthRange(date: Date): { from: string; to: string } {
	return {
		from: startOfDay(startOfMonth(date)).toISOString(),
		to: endOfDay(endOfMonth(date)).toISOString(),
	}
}

export function isSameDateString(a: string, b: string): boolean {
	return toLocalDateString(a) === toLocalDateString(b)
}
