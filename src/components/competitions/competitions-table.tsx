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
import { ArrowUpDown, Pencil, Trash2 } from 'lucide-react'
import { useMemo, useState } from 'react'

import { CompetitionStatusBadge } from '#/components/competitions/competition-status-badge.tsx'
import {
	EmptyState,
	SectionSkeleton,
} from '#/components/dashboard/dashboard-primitives.tsx'
import { Button } from '#/components/ui/button.tsx'
import { Input } from '#/components/ui/input.tsx'
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '#/components/ui/select.tsx'
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from '#/components/ui/table.tsx'
import {
	type CompetitionListItem,
	fetchCompetitionsList,
} from '#/lib/competition-queries.ts'
import { formatDisplayDateTime } from '#/lib/dates.ts'
import { queryKeys } from '#/lib/queryKeys.ts'
import { sportLabel } from '#/lib/sports.ts'
import { getBrowserSupabase } from '#/lib/supabase.ts'
import { cn } from '#/lib/utils.ts'

interface CompetitionsTableProps {
	onCompetitionSelect: (competitionId: string) => void
	onEdit: (competitionId: string) => void
	onDelete: (competitionId: string) => void
}

export function CompetitionsTable({
	onCompetitionSelect,
	onEdit,
	onDelete,
}: CompetitionsTableProps) {
	const [sorting, setSorting] = useState<SortingState>([
		{ id: 'event_date', desc: false },
	])
	const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
	const [globalFilter, setGlobalFilter] = useState('')

	const {
		data: competitions = [],
		isLoading,
		isError,
	} = useQuery({
		queryKey: queryKeys.competitions.list(),
		queryFn: async () => {
			const supabase = getBrowserSupabase()
			return fetchCompetitionsList(supabase)
		},
	})

	const columns = useMemo<ColumnDef<CompetitionListItem>[]>(
		() => [
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
				filterFn: 'equals',
			},
			{
				accessorKey: 'event_date',
				header: ({ column }) => (
					<SortHeader column={column} label="Tävlingsdag" />
				),
				cell: ({ row }) => formatDisplayDateTime(row.original.event_date),
			},
			{
				accessorKey: 'location',
				header: ({ column }) => <SortHeader column={column} label="Till" />,
				cell: ({ row }) => row.original.location ?? '—',
			},
			{
				id: 'status',
				accessorFn: (row) => row.status,
				header: 'Status',
				cell: ({ row }) => (
					<CompetitionStatusBadge status={row.original.status} />
				),
			},
			{
				id: 'actions',
				header: () => <span className="sr-only">Åtgärder</span>,
				cell: ({ row }) => (
					<div className="flex justify-end gap-1">
						<Button
							type="button"
							variant="ghost"
							size="icon-sm"
							aria-label={`Redigera ${row.original.name}`}
							onClick={(event) => {
								event.stopPropagation()
								onEdit(row.original.id)
							}}
						>
							<Pencil className="size-4" aria-hidden="true" />
						</Button>
						<Button
							type="button"
							variant="ghost"
							size="icon-sm"
							aria-label={`Ta bort ${row.original.name}`}
							onClick={(event) => {
								event.stopPropagation()
								onDelete(row.original.id)
							}}
						>
							<Trash2 className="size-4 text-destructive" aria-hidden="true" />
						</Button>
					</div>
				),
			},
		],
		[onDelete, onEdit],
	)

	const table = useReactTable({
		data: competitions,
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

	const sportFilter =
		(table.getColumn('sport')?.getFilterValue() as string | undefined) ?? 'all'

	if (isLoading) {
		return <SectionSkeleton rows={5} />
	}

	if (isError) {
		return (
			<EmptyState
				title="Kunde inte ladda tävlingar"
				description="Uppdatera sidan för att försöka igen."
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
			<div className="flex flex-col gap-3 sm:flex-row sm:items-center">
				<Input
					placeholder="Sök på namn eller plats…"
					value={globalFilter}
					onChange={(event) => setGlobalFilter(event.target.value)}
					className="max-w-sm bg-background"
				/>
				<Select
					value={sportFilter}
					onValueChange={(value) =>
						table
							.getColumn('sport')
							?.setFilterValue(value === 'all' ? undefined : value)
					}
				>
					<SelectTrigger className="w-full max-w-[180px] bg-background">
						<SelectValue placeholder="Alla sporter" />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="all">Alla sporter</SelectItem>
						<SelectItem value="nosework">Nose Work</SelectItem>
						<SelectItem value="rally_obedience">Rally</SelectItem>
					</SelectContent>
				</Select>
			</div>

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
					{table.getRowModel().rows.length === 0 ? (
						<TableRow>
							<TableCell
								colSpan={columns.length}
								className="h-24 text-center text-muted-foreground"
							>
								Inga tävlingar matchar filtret.
							</TableCell>
						</TableRow>
					) : (
						table.getRowModel().rows.map((row) => (
							<TableRow
								key={row.id}
								className="cursor-pointer"
								onClick={() => onCompetitionSelect(row.original.id)}
							>
								{row.getVisibleCells().map((cell) => (
									<TableCell key={cell.id}>
										{flexRender(cell.column.columnDef.cell, cell.getContext())}
									</TableCell>
								))}
							</TableRow>
						))
					)}
				</TableBody>
			</Table>
		</div>
	)
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
