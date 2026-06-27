import {
	noseworkDiplomaResultLabel,
	placementLabel,
} from '#/lib/competition-labels.ts'
import type { CompetitionListItem } from '#/lib/competition-queries.ts'
import type { Database } from '#/lib/database.types.ts'
import { isRallyStartQualified } from '#/lib/promotion-tracking.ts'

type RallyLevel = Database['public']['Enums']['rally_level']
type ListEntry = CompetitionListItem['entries'][number]

function noseworkEntryHasResults(entry: ListEntry): boolean {
	const results = entry.nosework_results
	if (!results) return false
	if (results.diploma_result != null) return true

	return (
		results.total_placement !== 'ingen' ||
		results.search_1_placement !== 'ingen' ||
		results.search_2_placement !== 'ingen' ||
		results.search_3_placement !== 'ingen' ||
		results.search_4_placement !== 'ingen'
	)
}

function rallyEntryHasResults(entry: ListEntry): boolean {
	return entry.rally_start_results.some((row) => row.points != null)
}

export function competitionEntryHasResults(
	sport: CompetitionListItem['sport'],
	entry: ListEntry,
): boolean {
	if (sport === 'nosework') return noseworkEntryHasResults(entry)
	return rallyEntryHasResults(entry)
}

export function competitionHasResults(
	competition: CompetitionListItem,
): boolean {
	return competition.entries.some((entry) =>
		competitionEntryHasResults(competition.sport, entry),
	)
}

function formatNoseworkEntryResults(entry: ListEntry): string | null {
	const results = entry.nosework_results
	if (!results || !noseworkEntryHasResults(entry)) return null

	const parts: string[] = []
	if (results.diploma_result != null) {
		parts.push(noseworkDiplomaResultLabel(results.diploma_result))
	}
	if (results.total_placement !== 'ingen') {
		parts.push(`Total ${placementLabel(results.total_placement)}`)
	}

	return parts.length > 0 ? parts.join(' · ') : null
}

function formatRallyEntryResults(
	entry: ListEntry,
	rallyLevel: RallyLevel | null | undefined,
): string | null {
	if (!rallyEntryHasResults(entry) || !rallyLevel) return null

	const startSummaries = [...entry.rally_start_results]
		.sort((a, b) => a.start_number - b.start_number)
		.filter((row) => row.points != null)
		.map((row) => {
			const qualified = isRallyStartQualified(rallyLevel, row.points)
			return qualified ? `${row.points} p · Kval` : `${row.points} p`
		})

	return startSummaries.length > 0 ? startSummaries.join(' · ') : null
}

function formatEntryResultsSummary(
	competition: CompetitionListItem,
	entry: ListEntry,
): string | null {
	if (competition.sport === 'nosework') {
		return formatNoseworkEntryResults(entry)
	}

	return formatRallyEntryResults(entry, competition.rally_details?.level)
}

export function formatCompetitionResultsSummary(
	competition: CompetitionListItem,
): string {
	const summaries = competition.entries
		.map((entry) => formatEntryResultsSummary(competition, entry))
		.filter((summary): summary is string => summary != null)

	return summaries.length > 0 ? summaries.join(' · ') : 'Inga resultat'
}
