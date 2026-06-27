import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ExternalLink, Pencil, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'

import { CompetitionEntriesSection } from '#/components/competitions/competition-entries-section.tsx'
import { CompetitionStatusBadge } from '#/components/competitions/competition-status-badge.tsx'
import {
	ErrorState,
	SectionSkeleton,
} from '#/components/dashboard/dashboard-primitives.tsx'
import { CompetitionLocationSection } from '#/components/map/competition-map.tsx'
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
import {
	CALENDAR_EVENT_CONFIG,
	calendarEventLabel,
} from '#/lib/calendar-events.ts'
import {
	deriveCompetitionStatus,
	noseworkClassLabel,
	noseworkOfficialStatusLabel,
	noseworkTypeLabel,
	rallyStartsLabel,
} from '#/lib/competition-labels.ts'
import {
	deleteCompetition,
	fetchCompetitionById,
} from '#/lib/competition-queries.ts'
import { formatDisplayDate, formatDisplayDateTime } from '#/lib/dates.ts'
import { queryKeys } from '#/lib/queryKeys.ts'
import { sportLabel } from '#/lib/sports.ts'
import { getBrowserSupabase } from '#/lib/supabase.ts'
import { cn } from '#/lib/utils.ts'

interface CompetitionDetailDrawerProps {
	competitionId: string | null
	open: boolean
	onOpenChange: (open: boolean) => void
	onEdit?: (competitionId: string) => void
}

export function CompetitionDetailDrawer({
	competitionId,
	open,
	onOpenChange,
	onEdit,
}: CompetitionDetailDrawerProps) {
	const queryClient = useQueryClient()
	const [deleteOpen, setDeleteOpen] = useState(false)

	const {
		data: competition,
		isLoading,
		isError,
		refetch,
	} = useQuery({
		queryKey: queryKeys.competitions.detail(competitionId ?? 'none'),
		queryFn: async () => {
			if (!competitionId) return null
			const supabase = getBrowserSupabase()
			return fetchCompetitionById(supabase, competitionId)
		},
		enabled: open && !!competitionId,
	})

	const deleteMutation = useMutation({
		mutationFn: async () => {
			if (!competitionId) return
			const supabase = getBrowserSupabase()
			await deleteCompetition(supabase, competitionId)
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
			setDeleteOpen(false)
			onOpenChange(false)
		},
		onError: () => {
			toast.error('Kunde inte ta bort tävlingen')
		},
	})

	const status = competition
		? deriveCompetitionStatus(competition.entries)
		: null

	return (
		<>
			<Sheet open={open} onOpenChange={onOpenChange}>
				<SheetContent className="w-full sm:max-w-md">
					<SheetHeader>
						<SheetTitle className="display-title pr-8">
							{competition?.name ?? 'Tävling'}
						</SheetTitle>
						<SheetDescription className="flex flex-wrap items-center gap-2">
							{competition ? (
								<>
									<span>{sportLabel(competition.sport)}</span>
									{status && <CompetitionStatusBadge status={status} />}
								</>
							) : (
								'Laddar tävlingsdetaljer…'
							)}
						</SheetDescription>
					</SheetHeader>

					{isLoading ? (
						<SheetBody>
							<SectionSkeleton rows={6} />
						</SheetBody>
					) : isError ? (
						<SheetBody>
							<ErrorState
								title="Kunde inte ladda tävling"
								description="Kontrollera anslutningen och försök igen."
								onRetry={() => void refetch()}
							/>
						</SheetBody>
					) : competition ? (
						<SheetBody className="space-y-6">
							{competition.sport === 'nosework' &&
								competition.nosework_details && (
									<dl className="grid grid-cols-2 gap-3 rounded-lg border border-border/70 bg-muted/20 p-4 text-sm">
										<DetailRow
											label="Typ"
											value={noseworkTypeLabel(
												competition.nosework_details.type,
											)}
										/>
										<DetailRow
											label="Klass"
											value={noseworkClassLabel(
												competition.nosework_details.class,
											)}
										/>
										<DetailRow
											label="Status"
											value={noseworkOfficialStatusLabel(
												competition.nosework_details.official_status,
											)}
											className="col-span-2"
										/>
									</dl>
								)}

							{competition.sport === 'rally_obedience' &&
								competition.rally_details && (
									<dl className="rounded-lg border border-border/70 bg-muted/20 p-4 text-sm">
										<DetailRow
											label="Starter"
											value={rallyStartsLabel(
												competition.rally_details.number_of_starts,
											)}
										/>
									</dl>
								)}

							<dl className="space-y-4 text-sm">
								<DetailRow
									label="Tävlingsdag"
									value={formatDisplayDateTime(competition.event_date)}
								/>
								<DetailRow
									label="Anmälan öppnar"
									value={formatDisplayDateTime(competition.sign_up_opens)}
								/>
								<DetailRow
									label="Anmälan stänger"
									value={formatDisplayDateTime(competition.sign_up_closes)}
								/>
								<DetailRow
									label="Betalningsdatum"
									value={formatDisplayDate(competition.payment_deadline)}
								/>
								<DetailRow label="Till" value={competition.location ?? '—'} />
								<DetailRow
									label="Från"
									value={competition.origin_location ?? '—'}
								/>
								{competition.notes && (
									<DetailRow label="Anteckningar" value={competition.notes} />
								)}
							</dl>

							<CompetitionLocationSection
								lat={competition.location_lat}
								lng={competition.location_lng}
								location={competition.location}
								originLocation={competition.origin_location}
								driveDistanceText={competition.drive_distance_text}
								driveDurationText={competition.drive_duration_text}
								active={open}
							/>

							{competition.url && (
								<Button variant="outline" className="w-full" asChild>
									<a
										href={competition.url}
										target="_blank"
										rel="noopener noreferrer"
									>
										Öppna tävlingssida
										<ExternalLink className="size-4" aria-hidden="true" />
									</a>
								</Button>
							)}

							<section>
								<h3 className="island-kicker mb-3">Kalender</h3>
								<ul className="divide-y divide-border/60 rounded-lg border border-border/70">
									{competition.calendar_events.map((event) => {
										const config = CALENDAR_EVENT_CONFIG[event.event_type]
										return (
											<li
												key={event.id}
												className="flex items-start gap-3 px-4 py-3 text-sm"
											>
												<span
													className={cn(
														'mt-1.5 size-2 shrink-0 rounded-full',
														config.dotClass,
													)}
													aria-hidden="true"
												/>
												<div>
													<p className="font-medium">
														{calendarEventLabel(event.event_type)}
													</p>
													<p className="text-xs text-muted-foreground">
														{formatDisplayDateTime(event.event_date)}
													</p>
												</div>
											</li>
										)
									})}
								</ul>
							</section>

							<CompetitionEntriesSection
								key={competition.id}
								competitionId={competition.id}
								sport={competition.sport}
								entries={competition.entries}
							/>

							{onEdit && (
								<div className="flex flex-col gap-2 sm:flex-row">
									<Button
										variant="outline"
										className="flex-1"
										onClick={() => onEdit(competition.id)}
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
							)}
						</SheetBody>
					) : (
						<SheetBody>
							<p className="text-sm text-muted-foreground">
								Tävlingen hittades inte.
							</p>
						</SheetBody>
					)}
				</SheetContent>
			</Sheet>

			<AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>Ta bort {competition?.name}?</AlertDialogTitle>
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
								void deleteMutation.mutateAsync()
							}}
						>
							{deleteMutation.isPending ? 'Tar bort…' : 'Ta bort'}
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</>
	)
}

function DetailRow({
	label,
	value,
	className,
}: {
	label: string
	value: string
	className?: string
}) {
	return (
		<div className={className}>
			<dt className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
				{label}
			</dt>
			<dd className="mt-1 font-medium">{value}</dd>
		</div>
	)
}
