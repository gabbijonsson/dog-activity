import type { Database } from '#/lib/database.types.ts'
import type { EntryStatus } from '#/lib/entries.ts'

export type Sport = Database['public']['Enums']['sport']
export type NoseworkType = Database['public']['Enums']['nosework_type']
export type NoseworkClass = Database['public']['Enums']['nosework_class']
export type NoseworkOfficialStatus =
	Database['public']['Enums']['nosework_official_status']
export type RallyStarts = Database['public']['Enums']['rally_starts']
export type RallyLevel = Database['public']['Enums']['rally_level']
export type NoseworkDiplomaResult =
	Database['public']['Enums']['nosework_diploma_result']
export type CompetitionPlacement =
	Database['public']['Enums']['competition_placement']

export type CompetitionStatus =
	| 'empty'
	| 'interested'
	| 'in_progress'
	| 'reserve_slot'
	| 'registered'
	| 'paid'

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

const RALLY_LEVEL_LABELS: Record<RallyLevel, string> = {
	nyborjare: 'Nybörjare',
	fortsattning: 'Fortsättning',
	avancerad: 'Avancerad',
	mastare: 'Mästare',
}

const NOSEWORK_DIPLOMA_RESULT_LABELS: Record<NoseworkDiplomaResult, string> = {
	inget_diplom: 'Inget diplom',
	diplom: 'Diplom',
}

const PLACEMENT_LABELS: Record<CompetitionPlacement, string> = {
	ingen: 'Ingen',
	place_1: '1',
	place_2: '2',
	place_3: '3',
}

const COMPETITION_STATUS_LABELS: Record<CompetitionStatus, string> = {
	empty: 'Inga anmälningar',
	interested: 'Tilldelad',
	in_progress: 'Pågår',
	reserve_slot: 'Reserv',
	registered: 'Anmäld',
	paid: 'Betald',
}

const COMPETITION_STATUS_PRIORITY: Record<CompetitionStatus, number> = {
	empty: -1,
	in_progress: 0,
	interested: 1,
	reserve_slot: 2,
	registered: 3,
	paid: 4,
}

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

export function rallyLevelLabel(level: RallyLevel): string {
	return RALLY_LEVEL_LABELS[level]
}

export function noseworkDiplomaResultLabel(
	result: NoseworkDiplomaResult,
): string {
	return NOSEWORK_DIPLOMA_RESULT_LABELS[result]
}

export function placementLabel(placement: CompetitionPlacement): string {
	return PLACEMENT_LABELS[placement]
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

function entryStatusToCompetitionStatus(
	status: EntryStatus,
): CompetitionStatus {
	switch (status) {
		case 'paid':
			return 'paid'
		case 'signed_up':
			return 'registered'
		case 'reserve_slot':
			return 'reserve_slot'
		case 'interested':
			return 'interested'
		default:
			return 'in_progress'
	}
}

export function deriveCompetitionStatus(
	entries: Pick<{ status: EntryStatus }, 'status'>[],
): CompetitionStatus {
	if (entries.length === 0) return 'empty'
	if (entries.every((entry) => entry.status === 'interested')) {
		return 'interested'
	}

	return entries.reduce<CompetitionStatus>((best, entry) => {
		const next = entryStatusToCompetitionStatus(entry.status)
		return COMPETITION_STATUS_PRIORITY[next] > COMPETITION_STATUS_PRIORITY[best]
			? next
			: best
	}, 'in_progress')
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

export const RALLY_LEVEL_OPTIONS = Object.entries(RALLY_LEVEL_LABELS).map(
	([value, label]) => ({ value: value as RallyLevel, label }),
)

export const NOSEWORK_DIPLOMA_RESULT_OPTIONS = Object.entries(
	NOSEWORK_DIPLOMA_RESULT_LABELS,
).map(([value, label]) => ({
	value: value as NoseworkDiplomaResult,
	label,
}))

export const PLACEMENT_OPTIONS = Object.entries(PLACEMENT_LABELS).map(
	([value, label]) => ({ value: value as CompetitionPlacement, label }),
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
