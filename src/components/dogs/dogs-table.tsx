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
import { ArrowUpDown } from 'lucide-react'
import { useMemo, useState } from 'react'
import {
	EmptyState,
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

	if (isLoading) {
		return <SectionSkeleton rows={4} />
	}

	if (isError) {
		return (
			<EmptyState
				title="Kunde inte ladda hundar"
				description="Uppdatera sidan för att försöka igen."
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
				{table.getRowModel().rows.map((row) => (
					<TableRow
						key={row.id}
						className="cursor-pointer"
						onClick={() => onDogSelect(row.original.id)}
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
