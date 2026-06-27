import { useQuery } from '@tanstack/react-query'
import type { Column } from '@tanstack/react-table'
import {
	type ColumnDef,
	flexRender,
	getCoreRowModel,
	getSortedRowModel,
	type SortingState,
	useReactTable,
} from '@tanstack/react-table'
import { ArrowUpDown, ChevronRight } from 'lucide-react'
import { useMemo, useState } from 'react'
import {
	EmptyState,
	ErrorState,
	SectionSkeleton,
} from '#/components/dashboard/dashboard-primitives.tsx'
import { EntryCountBadge } from '#/components/dogs/entry-count-badge.tsx'
import { Button } from '#/components/ui/button.tsx'
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from '#/components/ui/table.tsx'
import { activateOnKeyboard } from '#/lib/a11y.ts'
import { formatDisplayDate } from '#/lib/dates.ts'
import { type DogListItem, fetchDogsList } from '#/lib/dog-queries.ts'
import { queryKeys } from '#/lib/queryKeys.ts'
import { getBrowserSupabase } from '#/lib/supabase.ts'

interface DogsTableProps {
	onDogSelect: (dogId: string) => void
}

export function DogsTable({ onDogSelect }: DogsTableProps) {
	const [sorting, setSorting] = useState<SortingState>([
		{ id: 'name', desc: false },
	])

	const {
		data: dogs = [],
		isLoading,
		isError,
		refetch,
	} = useQuery({
		queryKey: queryKeys.dogs.list(),
		queryFn: async () => {
			const supabase = getBrowserSupabase()
			return fetchDogsList(supabase)
		},
	})

	const columns = useMemo<ColumnDef<DogListItem>[]>(
		() => [
			{
				accessorKey: 'name',
				header: ({ column }) => <SortHeader column={column} label="Namn" />,
				cell: ({ row }) => (
					<span className="font-medium">{row.original.name}</span>
				),
			},
			{
				accessorKey: 'breed',
				header: ({ column }) => <SortHeader column={column} label="Ras" />,
				cell: ({ row }) => row.original.breed ?? '—',
			},
			{
				accessorKey: 'date_of_birth',
				header: ({ column }) => (
					<SortHeader column={column} label="Födelsedatum" />
				),
				cell: ({ row }) =>
					row.original.date_of_birth
						? formatDisplayDate(row.original.date_of_birth)
						: '—',
				sortingFn: (rowA, rowB) => {
					const a = rowA.original.date_of_birth ?? ''
					const b = rowB.original.date_of_birth ?? ''
					return a.localeCompare(b)
				},
			},
			{
				accessorKey: 'entry_count',
				header: ({ column }) => (
					<SortHeader column={column} label="Anmälningar" />
				),
				cell: ({ row }) => <EntryCountBadge count={row.original.entry_count} />,
			},
		],
		[],
	)

	const table = useReactTable({
		data: dogs,
		columns,
		state: { sorting },
		onSortingChange: setSorting,
		getCoreRowModel: getCoreRowModel(),
		getSortedRowModel: getSortedRowModel(),
	})

	const sortedRows = table.getRowModel().rows

	if (isLoading) {
		return <SectionSkeleton rows={4} />
	}

	if (isError) {
		return (
			<ErrorState
				title="Kunde inte ladda hundar"
				description="Kontrollera anslutningen och försök igen."
				onRetry={() => void refetch()}
			/>
		)
	}

	if (dogs.length === 0) {
		return (
			<EmptyState
				title="Inga hundar än"
				description="Lägg till din första hund för att börja anmäla till tävlingar."
			/>
		)
	}

	return (
		<>
			<ul className="space-y-3 md:hidden">
				{sortedRows.map((row) => {
					const dog = row.original
					const meta = [
						dog.breed,
						dog.date_of_birth && formatDisplayDate(dog.date_of_birth),
					]
						.filter(Boolean)
						.join(' · ')

					return (
						<li key={row.id} className="record-card record-card-accent-dog">
							<button
								type="button"
								className="flex w-full items-center gap-3 px-4 py-3.5 text-left"
								onClick={() => onDogSelect(dog.id)}
							>
								<div className="min-w-0 flex-1">
									<p className="font-medium leading-snug">{dog.name}</p>
									{meta ? (
										<p className="mt-1 text-xs text-muted-foreground">{meta}</p>
									) : (
										<p className="mt-1 text-xs text-muted-foreground">
											Ingen ras eller födelsedatum
										</p>
									)}
									<p className="mt-2 text-[0.68rem] font-semibold uppercase tracking-wide text-muted-foreground">
										Anmälningar
									</p>
								</div>
								<div className="flex shrink-0 flex-col items-end gap-2">
									<EntryCountBadge count={dog.entry_count} />
									<ChevronRight
										className="size-4 text-muted-foreground"
										aria-hidden="true"
									/>
								</div>
							</button>
						</li>
					)
				})}
			</ul>

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
						{sortedRows.map((row) => (
							<TableRow
								key={row.id}
								tabIndex={0}
								className="cursor-pointer"
								aria-label={`Öppna ${row.original.name}`}
								onClick={() => onDogSelect(row.original.id)}
								onKeyDown={(event) =>
									activateOnKeyboard(event, () => onDogSelect(row.original.id))
								}
							>
								{row.getVisibleCells().map((cell) => (
									<TableCell key={cell.id}>
										{flexRender(cell.column.columnDef.cell, cell.getContext())}
									</TableCell>
								))}
							</TableRow>
						))}
					</TableBody>
				</Table>
			</div>
		</>
	)
}

function SortHeader({
	column,
	label,
}: {
	column: Column<DogListItem, unknown>
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
