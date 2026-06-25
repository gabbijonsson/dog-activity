import type { Database } from '#/lib/database.types.ts'

export type Sport = Database['public']['Enums']['sport']

const SPORT_LABELS: Record<Sport, string> = {
	nosework: 'Nose Work',
	rally_obedience: 'Rally',
}

export function sportLabel(sport: Sport): string {
	return SPORT_LABELS[sport]
}
