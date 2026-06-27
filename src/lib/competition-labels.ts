import type { Database } from '#/lib/database.types.ts'
import type { EntryStatus } from '#/lib/entries.ts'

export type Sport = Database['public']['Enums']['sport']
export type NoseworkType = Database['public']['Enums']['nosework_type']
export type NoseworkClass = Database['public']['Enums']['nosework_class']
export type NoseworkOfficialStatus =
	Database['public']['Enums']['nosework_official_status']
export type RallyStarts = Database['public']['Enums']['rally_starts']

export type CompetitionStatus =
	| 'empty'
	| 'interested'
	| 'in_progress'
	| 'reserve_slot'
	| 'registered'

const NOSEWORK_TYPE_LABELS: Record<NoseworkType, string> = {
	tsm: 'TSM',
	tem_behallare: 'TEM Behållare',
	tem_inomhus: 'TEM Inomhus',
	tem_fordon: 'TEM Fordon',
	tem_utomhus: 'TEM Utomhus',
}

const NOSEWORK_CLASS_LABELS: Record<NoseworkClass, string> = {
	class_1: 'Klass 1',
	class_2: 'Klass 2',
	class_3: 'Klass 3',
	elit: 'Elit',
}

const NOSEWORK_OFFICIAL_STATUS_LABELS: Record<NoseworkOfficialStatus, string> =
	{
		official: 'Officiell',
		unofficial: 'Inofficiell',
		summit: 'Summit',
	}

const RALLY_STARTS_LABELS: Record<RallyStarts, string> = {
	single: 'En start',
	double: 'Dubbel start',
	triple: 'Trippel start',
}

const COMPETITION_STATUS_LABELS: Record<CompetitionStatus, string> = {
	empty: 'Inga anmälningar',
	interested: 'Tilldelad',
	in_progress: 'Pågår',
	reserve_slot: 'Reserv',
	registered: 'Anmäld',
}

const REGISTERED_STATUSES = new Set<EntryStatus>(['signed_up', 'paid'])

export function noseworkTypeLabel(type: NoseworkType): string {
	return NOSEWORK_TYPE_LABELS[type]
}

export function noseworkClassLabel(className: NoseworkClass): string {
	return NOSEWORK_CLASS_LABELS[className]
}

export function noseworkOfficialStatusLabel(
	status: NoseworkOfficialStatus,
): string {
	return NOSEWORK_OFFICIAL_STATUS_LABELS[status]
}

export function rallyStartsLabel(starts: RallyStarts): string {
	return RALLY_STARTS_LABELS[starts]
}

export function competitionTypeLabel(
	sport: Sport,
	options: {
		noseworkType?: NoseworkType | null
		rallyStarts?: RallyStarts | null
	},
): string {
	if (sport === 'nosework' && options.noseworkType) {
		return noseworkTypeLabel(options.noseworkType)
	}

	if (sport === 'rally_obedience' && options.rallyStarts) {
		return rallyStartsLabel(options.rallyStarts)
	}

	return '—'
}

export function competitionStatusLabel(status: CompetitionStatus): string {
	return COMPETITION_STATUS_LABELS[status]
}

export function deriveCompetitionStatus(
	entries: Pick<{ status: EntryStatus }, 'status'>[],
): CompetitionStatus {
	if (entries.length === 0) return 'empty'
	if (entries.every((entry) => REGISTERED_STATUSES.has(entry.status))) {
		return 'registered'
	}
	if (entries.every((entry) => entry.status === 'interested')) {
		return 'interested'
	}
	if (entries.some((entry) => entry.status === 'reserve_slot')) {
		return 'reserve_slot'
	}
	return 'in_progress'
}

export const NOSEWORK_TYPE_OPTIONS = Object.entries(NOSEWORK_TYPE_LABELS).map(
	([value, label]) => ({ value: value as NoseworkType, label }),
)

export const NOSEWORK_CLASS_OPTIONS = Object.entries(NOSEWORK_CLASS_LABELS).map(
	([value, label]) => ({ value: value as NoseworkClass, label }),
)

export const NOSEWORK_OFFICIAL_STATUS_OPTIONS = Object.entries(
	NOSEWORK_OFFICIAL_STATUS_LABELS,
).map(([value, label]) => ({
	value: value as NoseworkOfficialStatus,
	label,
}))

export const RALLY_STARTS_OPTIONS = Object.entries(RALLY_STARTS_LABELS).map(
	([value, label]) => ({ value: value as RallyStarts, label }),
)

export const SPORT_OPTIONS: { value: Sport; label: string }[] = [
	{ value: 'nosework', label: 'Nose Work' },
	{ value: 'rally_obedience', label: 'Rally' },
]

export const COMPETITION_STATUS_OPTIONS = (
	Object.entries(COMPETITION_STATUS_LABELS) as [CompetitionStatus, string][]
).map(([value, label]) => ({ value, label }))

export const COMPETITION_TYPE_FILTER_OPTIONS = [
	...NOSEWORK_TYPE_OPTIONS,
	...RALLY_STARTS_OPTIONS,
]
