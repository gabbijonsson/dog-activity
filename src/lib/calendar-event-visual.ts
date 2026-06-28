import type { EntryStatus } from '#/lib/entries.ts'
import { parseISO } from 'date-fns'

import type { CalendarEventType } from '#/lib/calendar-events.ts'
import type { CalendarEventWithCompetition } from '#/lib/dashboard-queries.ts'
import { cn } from '#/lib/utils.ts'

export type CalendarEventVisualState = 'default' | 'stale' | 'past'

const SIGN_UP_OPEN_STALE: EntryStatus[] = [
	'signed_up',
	'slot_assigned',
	'reserve_slot',
	'paid',
]

const SIGN_UP_CLOSE_STALE: EntryStatus[] = [
	'slot_assigned',
	'reserve_slot',
	'paid',
]

function entryStatuses(event: CalendarEventWithCompetition): EntryStatus[] {
	return (
		event.competitions?.entries
			.map((entry) => entry.status)
			.filter((status): status is EntryStatus => status != null) ?? []
	)
}

export function calendarEventVisualState(
	event: CalendarEventWithCompetition,
	now: Date = new Date(),
): CalendarEventVisualState {
	if (parseISO(event.event_date) < now) return 'past'

	const statuses = entryStatuses(event)
	if (statuses.length === 0) return 'default'

	if (
		event.event_type === 'sign_up_open' &&
		statuses.some((status) => SIGN_UP_OPEN_STALE.includes(status))
	) {
		return 'stale'
	}

	if (
		event.event_type === 'sign_up_close' &&
		statuses.some((status) => SIGN_UP_CLOSE_STALE.includes(status))
	) {
		return 'stale'
	}

	if (
		event.event_type === 'payment' &&
		statuses.some((status) => status === 'paid')
	) {
		return 'stale'
	}

	return 'default'
}

export function calendarEventChipClass(
	eventType: CalendarEventType,
	visualState: CalendarEventVisualState,
): string {
	if (visualState === 'stale') {
		return 'bg-muted/90 text-muted-foreground'
	}

	const base = {
		sign_up_open: 'bg-event-sign-up-open',
		sign_up_close: 'bg-event-sign-up-close',
		payment: 'bg-event-payment',
		event_day: 'bg-event-day',
	}[eventType]

	if (visualState === 'past') {
		return cn(base, 'text-black/70 opacity-60 saturate-[0.55]')
	}

	return cn(base, 'text-black')
}

export function calendarEventLabelClass(
	eventType: CalendarEventType,
	visualState: CalendarEventVisualState,
): string {
	if (visualState === 'stale') return 'text-muted-foreground'
	if (visualState === 'past') {
		return {
			sign_up_open: 'text-event-sign-up-open/60',
			sign_up_close: 'text-event-sign-up-close/60',
			payment: 'text-event-payment/60',
			event_day: 'text-event-day/60',
		}[eventType]
	}

	return {
		sign_up_open: 'text-event-sign-up-open',
		sign_up_close: 'text-event-sign-up-close',
		payment: 'text-event-payment',
		event_day: 'text-event-day',
	}[eventType]
}

export function calendarEventDotClass(
	eventType: CalendarEventType,
	visualState: CalendarEventVisualState,
): string {
	if (visualState === 'stale') return 'bg-muted-foreground/45'

	const base = {
		sign_up_open: 'bg-event-sign-up-open',
		sign_up_close: 'bg-event-sign-up-close',
		payment: 'bg-event-payment',
		event_day: 'bg-event-day',
	}[eventType]

	if (visualState === 'past') {
		return cn(base, 'opacity-55 saturate-[0.55]')
	}

	return base
}
