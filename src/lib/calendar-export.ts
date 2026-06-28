import { addDays, addHours, format, parseISO } from 'date-fns'

import {
	type CalendarEventType,
	calendarEventDisplayTitle,
	calendarEventLabel,
} from '#/lib/calendar-events.ts'
import { competitionTypeLabel } from '#/lib/competition-labels.ts'
import type { CalendarEvent } from '#/lib/competition-queries.ts'
import type { CalendarEventWithCompetition } from '#/lib/dashboard-queries.ts'
import type { Database } from '#/lib/database.types.ts'
import { toLocalDateString } from '#/lib/dates.ts'
import { type Sport, sportLabel } from '#/lib/sports.ts'

type NoseworkType = Database['public']['Enums']['nosework_type']
type NoseworkOfficialStatus =
	Database['public']['Enums']['nosework_official_status']
type RallyStarts = Database['public']['Enums']['rally_starts']

export type CalendarExportEntry = {
	handler: { full_name: string | null } | null
	dog: { name: string } | null
}

export type CalendarExportInput = {
	title: string
	startIso: string
	eventType: CalendarEventType
	location?: string | null
	description?: string
}

function calendarExportParticipantLabel(
	entries: CalendarExportEntry[],
): string | null {
	const labels = entries.map((entry) => {
		const handler = entry.handler?.full_name?.trim() || 'Okänd förare'
		const dog = entry.dog?.name?.trim() || 'Okänd hund'
		return `${handler} & ${dog}`
	})

	return labels.length > 0 ? labels.join(', ') : null
}

function calendarExportSportTypeLabel(
	sport: Sport,
	options: {
		noseworkType?: NoseworkType | null
		rallyStarts?: RallyStarts | null
	},
): string {
	const typeLabel = competitionTypeLabel(sport, options)
	return typeLabel !== '—' ? typeLabel : sportLabel(sport)
}

function calendarExportLeadLabel(
	sport: Sport,
	options: {
		noseworkType?: NoseworkType | null
		rallyStarts?: RallyStarts | null
		noseworkOfficialStatus?: NoseworkOfficialStatus | null
	},
): string {
	if (sport === 'nosework' && options.noseworkOfficialStatus === 'summit') {
		return 'Summit'
	}

	const sportTypeLabel = calendarExportSportTypeLabel(sport, options)

	if (sport === 'nosework' && options.noseworkOfficialStatus === 'unofficial') {
		return `CR ${sportTypeLabel}`
	}

	return sportTypeLabel
}

export function calendarExportTitle(
	leadLabel: string,
	competitionName: string,
	entries: CalendarExportEntry[] = [],
): string {
	const participant = calendarExportParticipantLabel(entries)

	if (participant) {
		return `${leadLabel}: ${participant} | ${competitionName}`
	}

	return `${leadLabel}: ${competitionName}`
}

export function calendarExportFromEvent(
	event: CalendarEventWithCompetition,
	options?: { notes?: string | null; url?: string | null },
): CalendarExportInput {
	const competition = event.competitions
	const competitionName = calendarEventDisplayTitle(event)
	const leadLabel = calendarExportLeadLabel(competition?.sport ?? 'nosework', {
		noseworkType: competition?.nosework_details?.type,
		rallyStarts: competition?.rally_details?.number_of_starts,
		noseworkOfficialStatus: competition?.nosework_details?.official_status,
	})
	const descriptionLines = [
		calendarEventLabel(event.event_type),
		options?.url?.trim(),
		options?.notes?.trim(),
	].filter(Boolean)

	return {
		title: calendarExportTitle(
			leadLabel,
			competitionName,
			competition?.entries ?? [],
		),
		startIso: event.event_date,
		eventType: event.event_type,
		location: event.competitions?.location,
		description:
			descriptionLines.length > 0 ? descriptionLines.join('\n') : undefined,
	}
}

export function calendarExportFromCompetitionEvent(
	event: CalendarEvent,
	competition: {
		name: string
		sport: Sport
		location: string | null
		url?: string | null
		notes?: string | null
		entries?: CalendarExportEntry[]
		nosework_details?: {
			type: NoseworkType
			official_status?: NoseworkOfficialStatus
		} | null
		rally_details?: { number_of_starts: RallyStarts } | null
	},
): CalendarExportInput {
	const leadLabel = calendarExportLeadLabel(competition.sport, {
		noseworkType: competition.nosework_details?.type,
		rallyStarts: competition.rally_details?.number_of_starts,
		noseworkOfficialStatus: competition.nosework_details?.official_status,
	})
	const descriptionLines = [
		calendarEventLabel(event.event_type),
		competition.url?.trim(),
		competition.notes?.trim(),
	].filter(Boolean)

	return {
		title: calendarExportTitle(
			leadLabel,
			competition.name,
			competition.entries ?? [],
		),
		startIso: event.event_date,
		eventType: event.event_type,
		location: competition.location,
		description:
			descriptionLines.length > 0 ? descriptionLines.join('\n') : undefined,
	}
}

function isAllDayEventType(eventType: CalendarEventType): boolean {
	return eventType === 'payment' || eventType === 'sign_up_close'
}

function formatGoogleUtc(date: Date): string {
	return date
		.toISOString()
		.replace(/[-:]/g, '')
		.replace(/\.\d{3}/, '')
}

function formatGoogleDates(
	startIso: string,
	eventType: CalendarEventType,
): string {
	const start = parseISO(startIso)

	if (isAllDayEventType(eventType)) {
		const localDay = parseISO(toLocalDateString(startIso))
		return `${format(localDay, 'yyyyMMdd')}/${format(addDays(localDay, 1), 'yyyyMMdd')}`
	}

	const end = addHours(start, 1)
	return `${formatGoogleUtc(start)}/${formatGoogleUtc(end)}`
}

export function buildGoogleCalendarUrl(input: CalendarExportInput): string {
	const params = new URLSearchParams({
		action: 'TEMPLATE',
		text: input.title,
		dates: formatGoogleDates(input.startIso, input.eventType),
	})

	if (input.description) params.set('details', input.description)
	if (input.location?.trim()) params.set('location', input.location.trim())

	return `https://calendar.google.com/calendar/render?${params.toString()}`
}
