import { noseworkTypeLabel } from '#/lib/competition-labels.ts'
import type { Database } from '#/lib/database.types.ts'
import type { ProfileListItem } from '#/lib/profile-queries.ts'
import { sportLabel } from '#/lib/sports.ts'

type Sport = Database['public']['Enums']['sport']
type NoseworkType = Database['public']['Enums']['nosework_type']

type DogOption = { id: string; name: string }

export function getAvailableDogs(
	dogs: DogOption[],
	enteredDogIds: Set<string>,
): DogOption[] {
	return dogs.filter((dog) => !enteredDogIds.has(dog.id))
}

export function getAvailableHandlers(
	handlers: ProfileListItem[],
	enteredHandlerIds: Set<string>,
	sport: Sport,
): ProfileListItem[] {
	if (sport !== 'nosework') return handlers
	return handlers.filter((handler) => !enteredHandlerIds.has(handler.id))
}

export function canAddEntry(
	sport: Sport,
	availableDogs: DogOption[],
	availableHandlers: ProfileListItem[],
): boolean {
	if (availableDogs.length === 0) return false
	if (sport === 'nosework' && availableHandlers.length === 0) return false
	return true
}

export function timelineSportDetail(
	sport: Sport,
	options: {
		noseworkType?: NoseworkType | null
		handlerNames: string[]
	},
): string {
	const uniqueHandlers = [...new Set(options.handlerNames.filter(Boolean))]
	const handlerPart =
		uniqueHandlers.length > 0 ? uniqueHandlers.join(', ') : null

	if (sport === 'nosework') {
		const typePart = options.noseworkType
			? noseworkTypeLabel(options.noseworkType)
			: null
		return [sportLabel(sport), typePart, handlerPart]
			.filter(Boolean)
			.join(' | ')
	}

	return [sportLabel(sport), handlerPart].filter(Boolean).join(' | ')
}
