import { useMutation, useQueryClient } from '@tanstack/react-query'
import { createFileRoute } from '@tanstack/react-router'
import { Plus } from 'lucide-react'
import { useCallback, useState } from 'react'
import { toast } from 'sonner'
import { z } from 'zod'

import { CompetitionDetailDrawer } from '#/components/competitions/competition-detail-drawer.tsx'
import { CompetitionFormDrawer } from '#/components/competitions/competition-form-drawer.tsx'
import { CompetitionsTable } from '#/components/competitions/competitions-table.tsx'
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from '#/components/ui/alert-dialog.tsx'
import { Button } from '#/components/ui/button.tsx'
import { deleteCompetition } from '#/lib/competition-queries.ts'
import { queryKeys } from '#/lib/queryKeys.ts'
import { getBrowserSupabase } from '#/lib/supabase.ts'

const competitionsSearchSchema = z.object({
	event_date: z.string().optional(),
})

import { pageTitle } from '#/lib/page-meta.ts'

export const Route = createFileRoute('/_authenticated/competitions')({
	validateSearch: competitionsSearchSchema,
	head: () => ({
		meta: [{ title: pageTitle('Tävlingar') }],
	}),
	component: CompetitionsPage,
})

function CompetitionsPage() {
	const { event_date: initialEventDate } = Route.useSearch()
	const queryClient = useQueryClient()

	const [selectedCompetitionId, setSelectedCompetitionId] = useState<
		string | null
	>(null)
	const [detailOpen, setDetailOpen] = useState(false)
	const [formOpen, setFormOpen] = useState(!!initialEventDate)
	const [editCompetitionId, setEditCompetitionId] = useState<string | null>(
		null,
	)
	const [deleteCompetitionId, setDeleteCompetitionId] = useState<string | null>(
		null,
	)

	const deleteMutation = useMutation({
		mutationFn: async (id: string) => {
			const supabase = getBrowserSupabase()
			await deleteCompetition(supabase, id)
		},
		onSuccess: () => {
			void queryClient.invalidateQueries({
				queryKey: queryKeys.competitions.all,
			})
			void queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.all })
			void queryClient.invalidateQueries({
				queryKey: queryKeys.calendarEvents.all,
			})
			void queryClient.invalidateQueries({ queryKey: queryKeys.dogs.all })
			toast.success('Tävling borttagen')
			setDeleteCompetitionId(null)
		},
		onError: () => {
			toast.error('Kunde inte ta bort tävlingen')
		},
	})

	const handleCompetitionSelect = useCallback((competitionId: string) => {
		setSelectedCompetitionId(competitionId)
		setDetailOpen(true)
	}, [])

	const handleAddCompetition = useCallback(() => {
		setEditCompetitionId(null)
		setFormOpen(true)
	}, [])

	const handleEditCompetition = useCallback((competitionId: string) => {
		setDetailOpen(false)
		setEditCompetitionId(competitionId)
		setFormOpen(true)
	}, [])

	const handleFormOpenChange = useCallback((open: boolean) => {
		setFormOpen(open)
		if (!open) setEditCompetitionId(null)
	}, [])

	const handleSaved = useCallback((competitionId: string) => {
		setSelectedCompetitionId(competitionId)
		setDetailOpen(true)
	}, [])

	return (
		<div className="rise-in space-y-6">
			<section className="island-shell rounded-xl p-4 sm:p-6">
				<div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
					<div>
						<p className="island-kicker">Startlistan</p>
						<h1 className="display-title mt-1 text-2xl sm:text-3xl">
							Tävlingar
						</h1>
						<p className="mt-2 max-w-xl text-sm text-muted-foreground">
							Alla datum, platser och anmälningsstatus — sorterat efter
							tävlingsdag.
						</p>
					</div>
					<Button onClick={handleAddCompetition} className="shrink-0">
						<Plus className="size-4" aria-hidden="true" />
						Lägg till tävling
					</Button>
				</div>

				<CompetitionsTable
					onCompetitionSelect={handleCompetitionSelect}
					onEdit={handleEditCompetition}
					onDelete={setDeleteCompetitionId}
				/>
			</section>

			<CompetitionDetailDrawer
				competitionId={selectedCompetitionId}
				open={detailOpen}
				onOpenChange={setDetailOpen}
				onEdit={handleEditCompetition}
			/>

			<CompetitionFormDrawer
				open={formOpen}
				onOpenChange={handleFormOpenChange}
				competitionId={editCompetitionId}
				initialEventDate={initialEventDate ?? null}
				onSaved={handleSaved}
			/>

			<AlertDialog
				open={!!deleteCompetitionId}
				onOpenChange={(open) => {
					if (!open) setDeleteCompetitionId(null)
				}}
			>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>Ta bort tävling?</AlertDialogTitle>
						<AlertDialogDescription>
							Detta tar bort tävlingen, sportdetaljer, anmälningar och
							kalenderhändelser permanent.
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel>Avbryt</AlertDialogCancel>
						<AlertDialogAction
							variant="destructive"
							disabled={deleteMutation.isPending}
							onClick={(event) => {
								event.preventDefault()
								if (deleteCompetitionId) {
									void deleteMutation.mutateAsync(deleteCompetitionId)
								}
							}}
						>
							{deleteMutation.isPending ? 'Tar bort…' : 'Ta bort'}
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</div>
	)
}
