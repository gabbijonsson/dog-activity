import type { Database } from '#/lib/database.types.ts'

export type CalendarEventType =
	Database['public']['Enums']['calendar_event_type']

export const CALENDAR_EVENT_CONFIG: Record<
	CalendarEventType,
	{ label: string; dotClass: string; textClass: string }
> = {
	sign_up_open: {
		label: 'Anmälan öppnar',
		dotClass: 'bg-event-sign-up-open',
		textClass: 'text-event-sign-up-open',
	},
	sign_up_close: {
		label: 'Anmälan stänger',
		dotClass: 'bg-event-sign-up-close',
		textClass: 'text-event-sign-up-close',
	},
	payment: {
		label: 'Betalningsdatum',
		dotClass: 'bg-event-payment',
		textClass: 'text-event-payment',
	},
	event_day: {
		label: 'Tävlingsdag',
		dotClass: 'bg-event-day',
		textClass: 'text-event-day',
	},
}

export function calendarEventLabel(type: CalendarEventType): string {
	return CALENDAR_EVENT_CONFIG[type].label
}

export function calendarEventDisplayTitle(event: {
	title: string
	competitions: { name: string } | null
}): string {
	return event.competitions?.name ?? event.title
}
