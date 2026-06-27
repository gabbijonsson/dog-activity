import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Input } from '#/components/ui/input.tsx'
import { Label } from '#/components/ui/label.tsx'
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '#/components/ui/select.tsx'
import {
	NOSEWORK_DIPLOMA_RESULT_OPTIONS,
	PLACEMENT_OPTIONS,
} from '#/lib/competition-labels.ts'
import type { CompetitionEntry } from '#/lib/competition-queries.ts'
import type { Database } from '#/lib/database.types.ts'
import {
	isRallyStartQualified,
	RALLY_QUALIFICATION_THRESHOLDS,
} from '#/lib/promotion-tracking.ts'
import { queryKeys } from '#/lib/queryKeys.ts'
import type {
	NoseworkEntryResultsInput,
	RallyEntryResultsInput,
} from '#/lib/schemas.ts'
import { cn } from '#/lib/utils.ts'
import {
	EntryResultsError,
	saveNoseworkEntryResults,
	saveRallyEntryResults,
} from '#/server/entry-results.ts'

type Sport = Database['public']['Enums']['sport']
type RallyStarts = Database['public']['Enums']['rally_starts']
type RallyLevel = Database['public']['Enums']['rally_level']
type NoseworkDiplomaResult =
	Database['public']['Enums']['nosework_diploma_result']
type CompetitionPlacement = Database['public']['Enums']['competition_placement']

const EMPTY_DIPLOMA_VALUE = '__none__'

interface EntryResultsFieldsProps {
	competitionId: string
	sport: Sport
	entry: CompetitionEntry
	numberOfStarts?: RallyStarts | null
	rallyLevel?: RallyLevel | null
	disabled?: boolean
}

function rallyStartCount(starts: RallyStarts | null | undefined): number {
	switch (starts) {
		case 'double':
			return 2
		case 'triple':
			return 3
		default:
			return 1
	}
}

export function EntryResultsFields({
	competitionId,
	sport,
	entry,
	numberOfStarts,
	rallyLevel,
	disabled = false,
}: EntryResultsFieldsProps) {
	const queryClient = useQueryClient()

	if (!entry.dog_id) return null

	const invalidate = () => {
		void queryClient.invalidateQueries({ queryKey: queryKeys.competitions.all })
		void queryClient.invalidateQueries({
			queryKey: queryKeys.competitions.detail(competitionId),
		})
		void queryClient.invalidateQueries({ queryKey: queryKeys.dogs.all })
		void queryClient.invalidateQueries({ queryKey: queryKeys.promotion.all })
	}

	if (sport === 'nosework') {
		return (
			<NoseworkResultsFields
				entry={entry}
				disabled={disabled}
				onSave={async (values) => {
					await saveNoseworkEntryResults({ data: values })
					invalidate()
				}}
			/>
		)
	}

	if (!rallyLevel) return null

	return (
		<RallyResultsFields
			entry={entry}
			startCount={rallyStartCount(numberOfStarts)}
			rallyLevel={rallyLevel}
			disabled={disabled}
			onSave={async (values) => {
				await saveRallyEntryResults({ data: values })
				invalidate()
			}}
		/>
	)
}

function NoseworkResultsFields({
	entry,
	disabled,
	onSave,
}: {
	entry: CompetitionEntry
	disabled: boolean
	onSave: (values: NoseworkEntryResultsInput) => Promise<void>
}) {
	const results = entry.nosework_results
	const mutation = useMutation({
		mutationFn: onSave,
		onError: (error) => {
			toast.error(
				error instanceof EntryResultsError
					? error.message
					: 'Kunde inte spara resultat',
			)
		},
	})

	async function savePatch(
		patch: Partial<Omit<NoseworkEntryResultsInput, 'entry_id'>>,
	) {
		await mutation.mutateAsync({
			entry_id: entry.id,
			diploma_result: patch.diploma_result ?? results?.diploma_result ?? null,
			search_1_placement:
				patch.search_1_placement ?? results?.search_1_placement ?? 'ingen',
			search_2_placement:
				patch.search_2_placement ?? results?.search_2_placement ?? 'ingen',
			search_3_placement:
				patch.search_3_placement ?? results?.search_3_placement ?? 'ingen',
			search_4_placement:
				patch.search_4_placement ?? results?.search_4_placement ?? 'ingen',
			total_placement:
				patch.total_placement ?? results?.total_placement ?? 'ingen',
		})
	}

	const diplomaValue = results?.diploma_result ?? EMPTY_DIPLOMA_VALUE

	return (
		<div className="space-y-3 rounded-md border border-border/60 bg-background/60 p-3">
			<p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
				Resultat
			</p>

			<div className="space-y-1.5">
				<Label htmlFor={`${entry.id}-diploma`}>Resultat</Label>
				<Select
					value={diplomaValue}
					onValueChange={(value) => {
						void savePatch({
							diploma_result:
								value === EMPTY_DIPLOMA_VALUE
									? null
									: (value as NoseworkDiplomaResult),
						})
					}}
					disabled={disabled || mutation.isPending}
				>
					<SelectTrigger
						id={`${entry.id}-diploma`}
						className="w-full bg-background"
					>
						<SelectValue placeholder="Välj resultat" />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value={EMPTY_DIPLOMA_VALUE}>Ej registrerat</SelectItem>
						{NOSEWORK_DIPLOMA_RESULT_OPTIONS.map((option) => (
							<SelectItem key={option.value} value={option.value}>
								{option.label}
							</SelectItem>
						))}
					</SelectContent>
				</Select>
			</div>

			{(['search_1', 'search_2', 'search_3', 'search_4'] as const).map(
				(key, index) => (
					<PlacementField
						key={key}
						id={`${entry.id}-${key}`}
						label={`Placering sök ${index + 1}`}
						value={results?.[`${key}_placement`] ?? 'ingen'}
						disabled={disabled || mutation.isPending}
						onChange={(placement) => {
							void savePatch({ [`${key}_placement`]: placement })
						}}
					/>
				),
			)}

			<PlacementField
				id={`${entry.id}-total`}
				label="Placering totalen"
				value={results?.total_placement ?? 'ingen'}
				disabled={disabled || mutation.isPending}
				onChange={(placement) => {
					void savePatch({ total_placement: placement })
				}}
			/>
		</div>
	)
}

function PlacementField({
	id,
	label,
	value,
	disabled,
	onChange,
}: {
	id: string
	label: string
	value: CompetitionPlacement
	disabled: boolean
	onChange: (placement: CompetitionPlacement) => void
}) {
	return (
		<div className="space-y-1.5">
			<Label htmlFor={id}>{label}</Label>
			<Select
				value={value}
				onValueChange={(next) => onChange(next as CompetitionPlacement)}
				disabled={disabled}
			>
				<SelectTrigger id={id} className="w-full bg-background">
					<SelectValue />
				</SelectTrigger>
				<SelectContent>
					{PLACEMENT_OPTIONS.map((option) => (
						<SelectItem key={option.value} value={option.value}>
							{option.label}
						</SelectItem>
					))}
				</SelectContent>
			</Select>
		</div>
	)
}

function RallyResultsFields({
	entry,
	startCount,
	rallyLevel,
	disabled,
	onSave,
}: {
	entry: CompetitionEntry
	startCount: number
	rallyLevel: RallyLevel
	disabled: boolean
	onSave: (values: RallyEntryResultsInput) => Promise<void>
}) {
	const threshold = RALLY_QUALIFICATION_THRESHOLDS[rallyLevel]
	const mutation = useMutation({
		mutationFn: onSave,
		onError: (error) => {
			toast.error(
				error instanceof EntryResultsError
					? error.message
					: 'Kunde inte spara resultat',
			)
		},
	})

	const pointsByStart = new Map(
		entry.rally_start_results.map((row) => [row.start_number, row.points]),
	)

	async function saveStart(startNumber: number, rawValue: string) {
		const trimmed = rawValue.trim()
		const points = trimmed.length === 0 ? null : Number.parseInt(trimmed, 10)

		const starts = Array.from({ length: startCount }, (_, index) => {
			const number = index + 1
			return {
				start_number: number,
				points:
					number === startNumber
						? Number.isFinite(points)
							? points
							: null
						: (pointsByStart.get(number) ?? null),
			}
		})

		await mutation.mutateAsync({ entry_id: entry.id, starts })
	}

	return (
		<div className="space-y-3 rounded-md border border-border/60 bg-background/60 p-3">
			<p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
				Resultat
			</p>
			<p className="text-xs text-muted-foreground">
				Kvalificerat från {threshold} poäng
			</p>

			{Array.from({ length: startCount }, (_, index) => {
				const startNumber = index + 1
				const points = pointsByStart.get(startNumber)
				const qualified = isRallyStartQualified(rallyLevel, points)

				return (
					<div key={startNumber} className="space-y-1.5">
						<Label htmlFor={`${entry.id}-start-${startNumber}`}>
							Start {startNumber} — poäng
						</Label>
						<Input
							id={`${entry.id}-start-${startNumber}`}
							type="number"
							min={0}
							max={100}
							inputMode="numeric"
							placeholder="Poäng"
							defaultValue={points ?? ''}
							disabled={disabled || mutation.isPending}
							onBlur={(event) => {
								void saveStart(startNumber, event.target.value)
							}}
						/>
						{points != null ? (
							<p
								className={cn(
									'text-xs',
									qualified ? 'text-[var(--palm)]' : 'text-muted-foreground',
								)}
							>
								{qualified ? 'Kvalificerat resultat' : 'Ej kvalificerat'}
							</p>
						) : null}
					</div>
				)
			})}
		</div>
	)
}
