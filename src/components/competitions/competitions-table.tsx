import { useQuery } from '@tanstack/react-query'
import type { Column, FilterFn } from '@tanstack/react-table'
import {
	type ColumnDef,
	type ColumnFiltersState,
	flexRender,
	getCoreRowModel,
	getFilteredRowModel,
	getSortedRowModel,
	type SortingState,
	useReactTable,
} from '@tanstack/react-table'
import { ArrowUpDown, MapPin, Pencil, Trash2 } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'

import { CompetitionStatusBadge } from '#/components/competitions/competition-status-badge.tsx'
import {
	EmptyState,
	ErrorState,
	SectionSkeleton,
} from '#/components/dashboard/dashboard-primitives.tsx'
import { Button } from '#/components/ui/button.tsx'
import { Input } from '#/components/ui/input.tsx'
import {
	MultiSelectFilter,
	type MultiSelectFilterOption,
} from '#/components/ui/multi-select-filter.tsx'
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from '#/components/ui/table.tsx'
import { activateOnKeyboard } from '#/lib/a11y.ts'
import {
	COMPETITION_STATUS_OPTIONS,
	COMPETITION_TYPE_FILTER_OPTIONS,
	SPORT_OPTIONS,
	competitionTypeLabel,
} from '#/lib/competition-labels.ts'
import {
	type CompetitionListItem,
	fetchCompetitionsList,
} from '#/lib/competition-queries.ts'
import {
	competitionHasResults,
	formatCompetitionResultsSummary,
} from '#/lib/competition-results.ts'
import {
	formatDisplayDate,
	formatDisplayDateWithWeekday,
	todayDateString,
	toLocalDateString,
} from '#/lib/dates.ts'
import { cityFromAddress } from '#/lib/location.ts'
import { formatLogistik } from '#/lib/logistik.ts'
import { profileDisplayName } from '#/lib/profile-queries.ts'
import { queryKeys } from '#/lib/queryKeys.ts'
import { sportLabel } from '#/lib/sports.ts'
import { readMultiSelectFilter } from '#/lib/table-filters.ts'
import { getBrowserSupabase } from '#/lib/supabase.ts'
import { cn } from '#/lib/utils.ts'

interface CompetitionsTableProps {
	onCompetitionSelect: (competitionId: string) => void
	onEdit: (competitionId: string) => void
	onDelete: (competitionId: string) => void
}

type CompetitionTab = 'upcoming' | 'past'

const RESULTS_FILTER_OPTIONS: MultiSelectFilterOption[] = [
	{ value: 'has_results', label: 'Har resultat' },
	{ value: 'missing_results', label: 'Saknar resultat' },
]

export function CompetitionsTable({
	onCompetitionSelect,
	onEdit,
	onDelete,
}: CompetitionsTableProps) {
	const [activeTab, setActiveTab] = useState<CompetitionTab>('upcoming')
	const [sorting, setSorting] = useState<SortingState>([
		{ id: 'event_date', desc: false },
	])
	const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
	const [globalFilter, setGlobalFilter] = useState('')

	const {
		data: competitions = [],
		isLoading,
		isError,
		refetch,
	} = useQuery({
		queryKey: queryKeys.competitions.list(),
		queryFn: async () => {
			const supabase = getBrowserSupabase()
			return fetchCompetitionsList(supabase)
		},
	})

	const { upcomingCompetitions, pastCompetitions } = useMemo(() => {
		const today = todayDateString()
		const upcoming: CompetitionListItem[] = []
		const past: CompetitionListItem[] = []

		for (const competition of competitions) {
			if (toLocalDateString(competition.event_date) < today) {
				past.push(competition)
			} else {
				upcoming.push(competition)
			}
		}

		return { upcomingCompetitions: upcoming, pastCompetitions: past }
	}, [competitions])

	const tabData =
		activeTab === 'upcoming' ? upcomingCompetitions : pastCompetitions

	const handlerFilterOptions = useMemo(() => {
		const handlers = new Map<string, string>()
		for (const competition of tabData) {
			for (const entry of competition.entries) {
				if (!entry.handler_id || !entry.handler) continue
				handlers.set(entry.handler_id, profileDisplayName(entry.handler))
			}
		}

		return [...handlers.entries()]
			.map(([value, label]) => ({ value, label }))
			.sort((a, b) => a.label.localeCompare(b.label, 'sv'))
	}, [tabData])

	useEffect(() => {
		setColumnFilters([])
		setGlobalFilter('')
		setSorting([{ id: 'event_date', desc: activeTab === 'past' }])
	}, [activeTab])

	const columns = useMemo<ColumnDef<CompetitionListItem>[]>(() => {
		const shared: ColumnDef<CompetitionListItem>[] = [
			{
				accessorKey: 'name',
				header: ({ column }) => <SortHeader column={column} label="Namn" />,
				cell: ({ row }) => (
					<div className="flex items-center gap-3">
						<span
							className={cn(
								'h-8 w-1 rounded-full',
								row.original.sport === 'nosework'
									? 'bg-[var(--lagoon)]'
									: 'bg-[var(--signal)]',
							)}
							aria-hidden="true"
						/>
						<span className="font-medium">{row.original.name}</span>
					</div>
				),
			},
			{
				accessorKey: 'sport',
				header: ({ column }) => <SortHeader column={column} label="Sport" />,
				cell: ({ row }) => sportLabel(row.original.sport),
				filterFn: multiSelectFilterFn,
			},
			{
				id: 'type',
				accessorFn: (row) => {
					if (row.sport === 'nosework') {
						return row.nosework_details?.type ?? ''
					}
					return row.rally_details?.number_of_starts ?? ''
				},
				header: ({ column }) => <SortHeader column={column} label="Typ" />,
				cell: ({ row }) =>
					competitionTypeLabel(row.original.sport, {
						noseworkType: row.original.nosework_details?.type,
						rallyStarts: row.original.rally_details?.number_of_starts,
					}),
				filterFn: multiSelectFilterFn,
			},
			{
				id: 'handler',
				accessorFn: (row) => competitionHandlerIds(row.entries),
				header: ({ column }) => (
					<SortHeader column={column} label="Hundförare" />
				),
				cell: ({ row }) => formatCompetitionHandlers(row.original.entries),
				filterFn: multiSelectFilterFn,
				sortingFn: (rowA, rowB) =>
					formatCompetitionHandlers(rowA.original.entries).localeCompare(
						formatCompetitionHandlers(rowB.original.entries),
						'sv',
					),
			},
			{
				accessorKey: 'event_date',
				header: ({ column }) => (
					<SortHeader column={column} label="Tävlingsdag" />
				),
				cell: ({ row }) =>
					activeTab === 'past'
						? formatDisplayDate(row.original.event_date)
						: formatDisplayDateWithWeekday(row.original.event_date),
			},
			{
				accessorKey: 'location',
				header: ({ column }) => <SortHeader column={column} label="Plats" />,
				cell: ({ row }) => formatCompetitionCity(row.original.location) ?? '—',
			},
		]

		if (activeTab === 'past') {
			return [
				...shared,
				{
					id: 'results',
					accessorFn: (row) =>
						competitionHasResults(row) ? 'has_results' : 'missing_results',
					header: 'Resultat',
					cell: ({ row }) => {
						const summary = formatCompetitionResultsSummary(row.original)
						const missing = summary === 'Inga resultat'
						return (
							<span
								className={missing ? 'results-missing' : 'results-recorded'}
							>
								{summary}
							</span>
						)
					},
					filterFn: multiSelectFilterFn,
				},
				{
					id: 'actions',
					header: () => <span className="sr-only">Åtgärder</span>,
					cell: ({ row }) => (
						<ActionButtons
							competition={row.original}
							onEdit={onEdit}
							onDelete={onDelete}
						/>
					),
				},
			]
		}

		return [
			...shared,
			{
				id: 'logistik',
				accessorFn: (row) =>
					formatLogistik({
						driveDistanceMeters: row.drive_distance_meters,
						driveDurationSeconds: row.drive_duration_seconds,
					}) ?? '',
				header: ({ column }) => <SortHeader column={column} label="Logistik" />,
				cell: ({ row }) =>
					formatLogistik({
						driveDistanceMeters: row.original.drive_distance_meters,
						driveDurationSeconds: row.original.drive_duration_seconds,
					}) ?? '—',
			},
			{
				id: 'status',
				accessorFn: (row) => row.status,
				header: 'Status',
				cell: ({ row }) => (
					<CompetitionStatusBadge status={row.original.status} />
				),
				filterFn: multiSelectFilterFn,
			},
			{
				id: 'actions',
				header: () => <span className="sr-only">Åtgärder</span>,
				cell: ({ row }) => (
					<ActionButtons
						competition={row.original}
						onEdit={onEdit}
						onDelete={onDelete}
					/>
				),
			},
		]
	}, [activeTab, onDelete, onEdit])

	const table = useReactTable({
		data: tabData,
		columns,
		state: { sorting, columnFilters, globalFilter },
		onSortingChange: setSorting,
		onColumnFiltersChange: setColumnFilters,
		onGlobalFilterChange: setGlobalFilter,
		globalFilterFn: searchFilterFn,
		getCoreRowModel: getCoreRowModel(),
		getSortedRowModel: getSortedRowModel(),
		getFilteredRowModel: getFilteredRowModel(),
	})

	const sportFilter = readMultiSelectFilter(
		table.getColumn('sport')?.getFilterValue(),
	)
	const typeFilter = readMultiSelectFilter(
		table.getColumn('type')?.getFilterValue(),
	)
	const handlerFilter = readMultiSelectFilter(
		table.getColumn('handler')?.getFilterValue(),
	)
	const statusFilter = readMultiSelectFilter(
		table.getColumn('status')?.getFilterValue(),
	)
	const resultsFilter = readMultiSelectFilter(
		table.getColumn('results')?.getFilterValue(),
	)
	const filteredRows = table.getRowModel().rows

	function setColumnFilter(columnId: string, values: string[]) {
		table
			.getColumn(columnId)
			?.setFilterValue(values.length > 0 ? values : undefined)
	}

	if (isLoading) {
		return <SectionSkeleton rows={5} />
	}

	if (isError) {
		return (
			<ErrorState
				title="Kunde inte ladda tävlingar"
				description="Kontrollera anslutningen och försök igen."
				onRetry={() => void refetch()}
			/>
		)
	}

	if (competitions.length === 0) {
		return (
			<EmptyState
				title="Inga tävlingar än"
				description="Lägg till din första tävling för att börja spåra datum och anmälningar."
			/>
		)
	}

	return (
		<div className="space-y-4">
			<div
				className="startlist-tabs"
				role="tablist"
				aria-label="Tävlingar efter tid"
			>
				<button
					type="button"
					role="tab"
					id="competitions-tab-upcoming"
					aria-selected={activeTab === 'upcoming'}
					aria-controls="competitions-panel"
					className={cn(
						'startlist-tab',
						activeTab === 'upcoming' && 'is-active',
					)}
					onClick={() => setActiveTab('upcoming')}
				>
					Kommande
					<span className="startlist-tab-count">
						{upcomingCompetitions.length}
					</span>
				</button>
				<button
					type="button"
					role="tab"
					id="competitions-tab-past"
					aria-selected={activeTab === 'past'}
					aria-controls="competitions-panel"
					className={cn('startlist-tab', activeTab === 'past' && 'is-active')}
					onClick={() => setActiveTab('past')}
				>
					Tidigare
					<span className="startlist-tab-count">{pastCompetitions.length}</span>
				</button>
			</div>

			<div
				id="competitions-panel"
				role="tabpanel"
				aria-labelledby={
					activeTab === 'upcoming'
						? 'competitions-tab-upcoming'
						: 'competitions-tab-past'
				}
				className="space-y-4"
			>
				<div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
					<Input
						placeholder="Sök på namn eller plats…"
						value={globalFilter}
						onChange={(event) => setGlobalFilter(event.target.value)}
						className="max-w-sm bg-background"
					/>
					<MultiSelectFilter
						placeholder="Alla sporter"
						options={SPORT_OPTIONS}
						selected={sportFilter}
						onChange={(values) => setColumnFilter('sport', values)}
						className="max-w-[180px]"
					/>
					<MultiSelectFilter
						placeholder="Alla typer"
						options={COMPETITION_TYPE_FILTER_OPTIONS}
						selected={typeFilter}
						onChange={(values) => setColumnFilter('type', values)}
						className="max-w-[200px]"
					/>
					{handlerFilterOptions.length > 0 ? (
						<MultiSelectFilter
							placeholder="Alla hundförare"
							options={handlerFilterOptions}
							selected={handlerFilter}
							onChange={(values) => setColumnFilter('handler', values)}
							className="max-w-[220px]"
						/>
					) : null}
					{activeTab === 'upcoming' ? (
						<MultiSelectFilter
							placeholder="Alla statusar"
							options={COMPETITION_STATUS_OPTIONS}
							selected={statusFilter}
							onChange={(values) => setColumnFilter('status', values)}
							className="max-w-[200px]"
						/>
					) : (
						<MultiSelectFilter
							placeholder="Alla resultat"
							options={RESULTS_FILTER_OPTIONS}
							selected={resultsFilter}
							onChange={(values) => setColumnFilter('results', values)}
							className="max-w-[220px]"
						/>
					)}
				</div>

				<div className="md:hidden">
					{filteredRows.length === 0 ? (
						<EmptyState
							title={
								tabData.length === 0
									? activeTab === 'upcoming'
										? 'Inga kommande tävlingar'
										: 'Inga tidigare tävlingar'
									: 'Inga tävlingar matchar filtret'
							}
							description={
								tabData.length === 0
									? activeTab === 'upcoming'
										? 'Lägg till en tävling med framtida tävlingsdag.'
										: 'Tävlingar flyttas hit efter tävlingsdagen.'
									: 'Prova ett annat sökord eller filter.'
							}
						/>
					) : (
						<ul className="space-y-3">
							{filteredRows.map((row) => {
								const competition = row.original
								const city = formatCompetitionCity(competition.location)
								const accentClass =
									competition.sport === 'nosework'
										? 'record-card-accent-nosework'
										: 'record-card-accent-rally'
								const resultsSummary =
									formatCompetitionResultsSummary(competition)
								const resultsMissing = resultsSummary === 'Inga resultat'

								return (
									<li key={row.id} className={cn('record-card', accentClass)}>
										<button
											type="button"
											className="w-full px-4 py-3.5 text-left"
											onClick={() => onCompetitionSelect(competition.id)}
										>
											<div className="flex items-start justify-between gap-3">
												<p className="min-w-0 font-medium leading-snug">
													{competition.name}
												</p>
												{activeTab === 'upcoming' ? (
													<CompetitionStatusBadge status={competition.status} />
												) : (
													<span
														className={cn(
															'text-xs',
															resultsMissing
																? 'results-missing'
																: 'results-recorded',
														)}
													>
														{resultsSummary}
													</span>
												)}
											</div>
											<p className="mt-2 text-xs font-semibold text-primary tabular-nums">
												<time dateTime={competition.event_date}>
													{activeTab === 'past'
														? formatDisplayDate(competition.event_date)
														: formatDisplayDateWithWeekday(
																competition.event_date,
															)}
												</time>
											</p>
											<p className="mt-1 text-xs text-muted-foreground">
												{sportLabel(competition.sport)}
												{' · '}
												{competitionTypeLabel(competition.sport, {
													noseworkType: competition.nosework_details?.type,
													rallyStarts:
														competition.rally_details?.number_of_starts,
												})}
											</p>
											{formatCompetitionHandlers(competition.entries) !==
											'—' ? (
												<p className="mt-1 text-xs text-muted-foreground">
													{formatCompetitionHandlers(competition.entries)}
												</p>
											) : null}
											{city ? (
												<p className="mt-2 flex items-start gap-1.5 text-xs text-muted-foreground">
													<MapPin
														className="mt-0.5 size-3.5 shrink-0"
														aria-hidden="true"
													/>
													<span className="line-clamp-2">{city}</span>
												</p>
											) : null}
											{activeTab === 'upcoming' &&
											formatLogistik({
												driveDistanceMeters: competition.drive_distance_meters,
												driveDurationSeconds:
													competition.drive_duration_seconds,
											}) ? (
												<p className="mt-1 text-xs text-muted-foreground">
													{formatLogistik({
														driveDistanceMeters:
															competition.drive_distance_meters,
														driveDurationSeconds:
															competition.drive_duration_seconds,
													})}
												</p>
											) : null}
										</button>
										<div className="flex border-t border-border/70">
											<Button
												type="button"
												variant="ghost"
												className="h-10 flex-1 rounded-none"
												onClick={() => onEdit(competition.id)}
											>
												<Pencil className="size-4" aria-hidden="true" />
												Redigera
											</Button>
											<Button
												type="button"
												variant="ghost"
												className="h-10 flex-1 rounded-none text-destructive hover:text-destructive"
												onClick={() => onDelete(competition.id)}
											>
												<Trash2 className="size-4" aria-hidden="true" />
												Ta bort
											</Button>
										</div>
									</li>
								)
							})}
						</ul>
					)}
				</div>

				<div className="hidden md:block">
					<Table>
						<TableHeader>
							{table.getHeaderGroups().map((headerGroup) => (
								<TableRow key={headerGroup.id}>
									{headerGroup.headers.map((header) => (
										<TableHead key={header.id}>
											{header.isPlaceholder
												? null
												: flexRender(
														header.column.columnDef.header,
														header.getContext(),
													)}
										</TableHead>
									))}
								</TableRow>
							))}
						</TableHeader>
						<TableBody>
							{filteredRows.length === 0 ? (
								<TableRow>
									<TableCell
										colSpan={columns.length}
										className="h-24 text-center text-muted-foreground"
									>
										{tabData.length === 0
											? activeTab === 'upcoming'
												? 'Inga kommande tävlingar.'
												: 'Inga tidigare tävlingar.'
											: 'Inga tävlingar matchar filtret.'}
									</TableCell>
								</TableRow>
							) : (
								filteredRows.map((row) => (
									<TableRow
										key={row.id}
										tabIndex={0}
										className="cursor-pointer"
										aria-label={`Öppna ${row.original.name}`}
										onClick={() => onCompetitionSelect(row.original.id)}
										onKeyDown={(event) =>
											activateOnKeyboard(event, () =>
												onCompetitionSelect(row.original.id),
											)
										}
									>
										{row.getVisibleCells().map((cell) => (
											<TableCell key={cell.id}>
												{flexRender(
													cell.column.columnDef.cell,
													cell.getContext(),
												)}
											</TableCell>
										))}
									</TableRow>
								))
							)}
						</TableBody>
					</Table>
				</div>
			</div>
		</div>
	)
}

function ActionButtons({
	competition,
	onEdit,
	onDelete,
}: {
	competition: CompetitionListItem
	onEdit: (competitionId: string) => void
	onDelete: (competitionId: string) => void
}) {
	return (
		<div className="flex justify-end gap-1">
			<Button
				type="button"
				variant="ghost"
				size="icon-sm"
				aria-label={`Redigera ${competition.name}`}
				onClick={(event) => {
					event.stopPropagation()
					onEdit(competition.id)
				}}
			>
				<Pencil className="size-4" aria-hidden="true" />
			</Button>
			<Button
				type="button"
				variant="ghost"
				size="icon-sm"
				aria-label={`Ta bort ${competition.name}`}
				onClick={(event) => {
					event.stopPropagation()
					onDelete(competition.id)
				}}
			>
				<Trash2 className="size-4 text-destructive" aria-hidden="true" />
			</Button>
		</div>
	)
}

function formatCompetitionCity(location: string | null | undefined) {
	if (!location) return null
	return cityFromAddress(location)
}

function competitionHandlerIds(
	entries: CompetitionListItem['entries'],
): string[] {
	return [
		...new Set(
			entries.flatMap((entry) => (entry.handler_id ? [entry.handler_id] : [])),
		),
	]
}

function formatCompetitionHandlers(entries: CompetitionListItem['entries']) {
	const names = [
		...new Set(
			entries
				.map((entry) => entry.handler?.full_name?.trim())
				.filter((name): name is string => Boolean(name)),
		),
	]

	return names.length > 0 ? names.join(', ') : '—'
}

const multiSelectFilterFn: FilterFn<CompetitionListItem> = (
	row,
	columnId,
	filterValue,
) => {
	const selected = filterValue as string[] | undefined
	if (!selected || selected.length === 0) return true

	const cellValue = row.getValue(columnId)
	if (Array.isArray(cellValue)) {
		return cellValue.some((value) => selected.includes(String(value)))
	}

	return selected.includes(String(cellValue))
}

const searchFilterFn: FilterFn<CompetitionListItem> = (
	row,
	_columnId,
	value,
) => {
	const query = String(value).toLowerCase().trim()
	if (query.length === 0) return true
	const name = row.original.name.toLowerCase()
	const location = (row.original.location ?? '').toLowerCase()
	return name.includes(query) || location.includes(query)
}

function SortHeader({
	column,
	label,
}: {
	column: Column<CompetitionListItem, unknown>
	label: string
}) {
	return (
		<Button
			type="button"
			variant="ghost"
			size="sm"
			className="-ml-3 h-8 font-semibold"
			onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
		>
			{label}
			<ArrowUpDown className="size-3.5" aria-hidden="true" />
		</Button>
	)
}
