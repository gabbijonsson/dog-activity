import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Pencil, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'

import { CompetitionDetailDrawer } from '#/components/competitions/competition-detail-drawer.tsx'
import { DogMeritsSummary } from '#/components/dogs/dog-merits-summary.tsx'
import {
	EmptyState,
	ErrorState,
	SectionSkeleton,
} from '#/components/dashboard/dashboard-primitives.tsx'
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
import {
	Sheet,
	SheetBody,
	SheetContent,
	SheetDescription,
	SheetHeader,
	SheetTitle,
} from '#/components/ui/sheet.tsx'
import { formatDisplayDate } from '#/lib/dates.ts'
import { summarizeDogMerits } from '#/lib/dog-merits.ts'
import {
	DogDeleteRestrictedError,
	deleteDog,
	fetchDogById,
} from '#/lib/dog-queries.ts'
import { entryStatusLabel } from '#/lib/entries.ts'
import { fetchPromotionContext } from '#/lib/promotion-queries.ts'
import { queryKeys } from '#/lib/queryKeys.ts'
import { sportLabel } from '#/lib/sports.ts'
import { getBrowserSupabase } from '#/lib/supabase.ts'

interface DogDetailDrawerProps {
	dogId: string | null
	open: boolean
	onOpenChange: (open: boolean) => void
	onEdit: (dogId: string) => void
}

export function DogDetailDrawer({
	dogId,
	open,
	onOpenChange,
	onEdit,
}: DogDetailDrawerProps) {
	const queryClient = useQueryClient()
	const [deleteOpen, setDeleteOpen] = useState(false)
	const [selectedCompetitionId, setSelectedCompetitionId] = useState<
		string | null
	>(null)
	const [competitionDrawerOpen, setCompetitionDrawerOpen] = useState(false)

	const {
		data: dog,
		isLoading,
		isError,
		refetch,
	} = useQuery({
		queryKey: queryKeys.dogs.detail(dogId ?? 'none'),
		queryFn: async () => {
			if (!dogId) return null
			const supabase = getBrowserSupabase()
			return fetchDogById(supabase, dogId)
		},
		enabled: open && !!dogId,
	})

	const { data: promotionContext } = useQuery({
		queryKey: queryKeys.promotion.context(),
		queryFn: async () => {
			const supabase = getBrowserSupabase()
			return fetchPromotionContext(supabase)
		},
		enabled: open && !!dogId,
	})

	const deleteMutation = useMutation({
		mutationFn: async () => {
			if (!dogId) return
			const supabase = getBrowserSupabase()
			await deleteDog(supabase, dogId)
		},
		onSuccess: () => {
			void queryClient.invalidateQueries({ queryKey: queryKeys.dogs.all })
			toast.success('Hund borttagen')
			setDeleteOpen(false)
			onOpenChange(false)
		},
		onError: (error) => {
			if (error instanceof DogDeleteRestrictedError) {
				toast.error('Kan inte ta bort hund med tävlingsanmälningar')
				setDeleteOpen(false)
				return
			}
			toast.error('Kunde inte ta bort hunden')
		},
	})

	const hasEntries = (dog?.entries.length ?? 0) > 0
	const merits =
		dog && promotionContext
			? summarizeDogMerits(dog.id, promotionContext)
			: { nosework: [], rally: [] }

	return (
		<>
			<Sheet open={open} onOpenChange={onOpenChange}>
				<SheetContent className="w-full sm:max-w-md">
					<SheetHeader>
						<SheetTitle className="display-title pr-8">
							{dog?.name ?? 'Hund'}
						</SheetTitle>
						<SheetDescription>
							{dog?.breed ? dog.breed : 'Hundprofil och tävlingshistorik'}
						</SheetDescription>
					</SheetHeader>

					{isLoading ? (
						<SheetBody>
							<SectionSkeleton rows={5} />
						</SheetBody>
					) : isError ? (
						<SheetBody>
							<ErrorState
								title="Kunde inte ladda hund"
								description="Kontrollera anslutningen och försök igen."
								onRetry={() => void refetch()}
							/>
						</SheetBody>
					) : dog ? (
						<SheetBody className="flex min-h-0 flex-1 flex-col gap-6 overflow-hidden">
							<dl className="shrink-0 space-y-4 text-sm">
								<DetailRow label="Namn" value={dog.name} />
								<DetailRow label="Ras" value={dog.breed ?? '—'} />
								<DetailRow
									label="Födelsedatum"
									value={
										dog.date_of_birth
											? formatDisplayDate(dog.date_of_birth)
											: '—'
									}
								/>
								<DetailRow
									label="Mankhöjd"
									value={
										dog.withers_height_cm != null
											? `${dog.withers_height_cm} cm`
											: '—'
									}
								/>
								{dog.notes && (
									<DetailRow label="Anteckningar" value={dog.notes} />
								)}
							</dl>

							<section className="shrink-0">
								<h3 className="island-kicker mb-3">Meriter</h3>
								<div className="rounded-lg border border-border/70 bg-muted/15 p-4">
									<DogMeritsSummary merits={merits} variant="full" />
								</div>
							</section>

							<section className="flex min-h-0 flex-1 flex-col">
								<h3 className="island-kicker mb-3 shrink-0">Tävlingar</h3>
								{dog.entries.length === 0 ? (
									<EmptyState
										title="Inga anmälningar än"
										description="Anmäl hunden via en tävling."
									/>
								) : (
									<div className="min-h-0 overflow-y-auto rounded-lg border border-border/70">
										<ul className="divide-y divide-border/60">
											{dog.entries.map((entry) => {
												const competition = entry.competition
												if (!competition) return null

												return (
													<li key={entry.id}>
														<button
															type="button"
															className="group flex w-full flex-col gap-1 px-4 py-3 text-left transition-colors hover:bg-muted/40"
															onClick={() => {
																setSelectedCompetitionId(competition.id)
																setCompetitionDrawerOpen(true)
															}}
														>
															<span className="text-sm font-medium underline-offset-2 group-hover:text-primary group-hover:underline">
																{competition.name}
															</span>
															<span className="text-xs text-muted-foreground">
																{sportLabel(competition.sport)} ·{' '}
																{formatDisplayDate(competition.event_date)}
															</span>
															<span className="text-xs font-medium text-[var(--palm)]">
																{entryStatusLabel(entry.status)}
															</span>
														</button>
													</li>
												)
											})}
										</ul>
									</div>
								)}
							</section>

							<div className="flex shrink-0 flex-col gap-2 sm:flex-row">
								<Button
									variant="outline"
									className="flex-1"
									onClick={() => onEdit(dog.id)}
								>
									<Pencil className="size-4" aria-hidden="true" />
									Redigera
								</Button>
								<Button
									variant="destructive"
									className="flex-1"
									onClick={() => setDeleteOpen(true)}
								>
									<Trash2 className="size-4" aria-hidden="true" />
									Ta bort
								</Button>
							</div>

							{hasEntries && (
								<p className="shrink-0 text-xs text-muted-foreground">
									Hundar med tävlingsanmälningar kan inte tas bort.
								</p>
							)}
						</SheetBody>
					) : (
						<SheetBody>
							<p className="text-sm text-muted-foreground">
								Hunden hittades inte.
							</p>
						</SheetBody>
					)}
				</SheetContent>
			</Sheet>

			<AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>Ta bort {dog?.name}?</AlertDialogTitle>
						<AlertDialogDescription>
							{hasEntries
								? 'Den här hunden har tävlingsanmälningar och kan inte tas bort. Ta bort anmälningarna först.'
								: 'Detta går inte att ångra. Hunden tas bort permanent.'}
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel>Avbryt</AlertDialogCancel>
						<AlertDialogAction
							variant="destructive"
							disabled={hasEntries || deleteMutation.isPending}
							onClick={(event) => {
								event.preventDefault()
								void deleteMutation.mutateAsync()
							}}
						>
							{deleteMutation.isPending ? 'Tar bort…' : 'Ta bort'}
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>

			<CompetitionDetailDrawer
				competitionId={selectedCompetitionId}
				open={competitionDrawerOpen}
				onOpenChange={setCompetitionDrawerOpen}
			/>
		</>
	)
}

function DetailRow({ label, value }: { label: string; value: string }) {
	return (
		<div>
			<dt className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
				{label}
			</dt>
			<dd className="mt-1 font-medium">{value}</dd>
		</div>
	)
}
