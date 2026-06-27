import type { Database } from '#/lib/database.types.ts'
import type { PromotionContext } from '#/lib/promotion-queries.ts'
import {
	noseworkPromotionWarning,
	rallyPromotionWarning,
} from '#/lib/promotion-tracking.ts'

type Sport = Database['public']['Enums']['sport']
type NoseworkType = Database['public']['Enums']['nosework_type']
type NoseworkClass = Database['public']['Enums']['nosework_class']
type RallyLevel = Database['public']['Enums']['rally_level']

type DogOption = { id: string; name: string }

export function buildDogPromotionWarnings(
	dogs: DogOption[],
	sport: Sport,
	context: PromotionContext,
	options: {
		noseworkType?: NoseworkType | null
		noseworkClass?: NoseworkClass | null
		rallyLevel?: RallyLevel | null
	},
): Map<string, string> {
	const warnings = new Map<string, string>()

	for (const dog of dogs) {
		if (sport === 'nosework' && options.noseworkType && options.noseworkClass) {
			const message = noseworkPromotionWarning(
				dog.name,
				dog.id,
				options.noseworkType,
				options.noseworkClass,
				context.priorNoseworkDiplomas,
				context.appNoseworkDiplomas,
			)
			if (message) warnings.set(dog.id, message)
			continue
		}

		if (sport === 'rally_obedience' && options.rallyLevel) {
			const message = rallyPromotionWarning(
				dog.name,
				dog.id,
				options.rallyLevel,
				context.priorRallyQualified,
				context.appRallyQualifiedStarts,
			)
			if (message) warnings.set(dog.id, message)
		}
	}

	return warnings
}

export function promotionWarningForDog(
	warnings: Map<string, string>,
	dogId: string,
): string | null {
	if (!dogId) return null
	return warnings.get(dogId) ?? null
}
