import { useForm } from '@tanstack/react-form'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Plus, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'

import { useAuth } from '#/components/auth-provider.tsx'
import { EntryRegistrationFields } from '#/components/competitions/entry-registration-fields.tsx'
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
import type { CompetitionEntry } from '#/lib/competition-queries.ts'
import type { Database } from '#/lib/database.types.ts'
import { fetchDogsList } from '#/lib/dog-queries.ts'
import {
	canAssignCompetition,
	getAvailableDogs,
	getAvailableHandlers,
} from '#/lib/entry-options.ts'
import { entryRequiresDogHandler } from '#/lib/entry-validation.ts'
import { fetchProfilesList } from '#/lib/profile-queries.ts'
import { queryKeys } from '#/lib/queryKeys.ts'
import { type EntryCreateInput, entryCreateSchema } from '#/lib/schemas.ts'
import { getBrowserSupabase } from '#/lib/supabase.ts'
import { cn } from '#/lib/utils.ts'
import {
	createEntry,
	deleteEntry,
	EntryError,
	updateEntry,
} from '#/server/entries.ts'

type Sport = Database['public']['Enums']['sport']
type EntryStatus = Database['public']['Enums']['entry_status']

const STATUS_ACCENT: Record<EntryStatus, string> = {
	interested: 'border-l-[var(--signal)]',
	signed_up: 'border-l-[var(--lagoon-deep)]',
	slot_assigned: 'border-l-[var(--palm)]',
	reserve_slot: 'border-l-muted-foreground/40',
	paid: 'border-l-[var(--palm)]',
}

interface CompetitionEntriesSectionProps {
	competitionId: string
	sport: Sport
	entries: CompetitionEntry[]
}

const emptyFormValues: EntryCreateInput = {
	competition_id: '',
	dog_id: '',
	handler_id: '',
	status: 'interested',
}

function invalidateEntryQueries(
	queryClient: ReturnType<typeof useQueryClient>,
	competitionId: string,
) {
	void queryClient.invalidateQueries({ queryKey: queryKeys.competitions.all })
	void queryClient.invalidateQueries({
		queryKey: queryKeys.competitions.detail(competitionId),
	})
	void queryClient.invalidateQueries({ queryKey: queryKeys.dogs.all })
	void queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.all })
}

function enteredDogIdsForEntry(
	entries: CompetitionEntry[],
	currentEntryId: string,
): Set<string> {
	return new Set(
		entries.flatMap((entry) =>
			entry.id !== currentEntryId && entry.dog_id ? [entry.dog_id] : [],
		),
	)
}

function enteredHandlerIdsForEntry(
	entries: CompetitionEntry[],
	currentEntryId: string,
): Set<string> {
	return new Set(
		entries.flatMap((entry) =>
			entry.id !== currentEntryId && entry.handler_id
				? [entry.handler_id]
				: [],
		),
	)
}

export function CompetitionEntriesSection({
	competitionId,
	sport,
	entries,
}: CompetitionEntriesSectionProps) {
	const queryClient = useQueryClient()
	const { user } = useAuth()
	const [deleteEntryId, setDeleteEntryId] = useState<string | null>(null)

	const { data: dogs = [] } = useQuery({
		queryKey: queryKeys.dogs.list(),
		queryFn: async () => {
			const supabase = getBrowserSupabase()
			return fetchDogsList(supabase)
		},
	})

	const { data: handlers = [] } = useQuery({
		queryKey: queryKeys.profiles.list(),
		queryFn: async () => {
			const supabase = getBrowserSupabase()
			return fetchProfilesList(supabase)
		},
	})

	const enteredDogIds = new Set(
		entries.flatMap((entry) => (entry.dog_id ? [entry.dog_id] : [])),
	)
	const enteredHandlerIds = new Set(
		entries.flatMap((entry) => (entry.handler_id ? [entry.handler_id] : [])),
	)

	const availableDogs = getAvailableDogs(dogs, enteredDogIds)
	const availableHandlers = getAvailableHandlers(
		handlers,
		enteredHandlerIds,
		sport,
	)
	const showAssignForm = canAssignCompetition(
		sport,
		availableDogs,
		availableHandlers,
	)
	const showEntriesList = entries.length > 0

	const createMutation = useMutation({
		mutationFn: async (values: EntryCreateInput) =>
			createEntry({ data: values }),
		onSuccess: () => {
			invalidateEntryQueries(queryClient, competitionId)
			toast.success('Tilldelning sparad')
		},
		onError: (error) => {
			toast.error(
				error instanceof EntryError
					? error.message
					: 'Kunde inte tilldela tävlingen',
			)
		},
	})

	const updateMutation = useMutation({
		mutationFn: async (values: {
			id: string
			dog_id?: string
			handler_id?: string
			status?: EntryStatus
		}) => updateEntry({ data: values }),
		onSuccess: () => {
			invalidateEntryQueries(queryClient, competitionId)
		},
		onError: (error) => {
			toast.error(
				error instanceof EntryError
					? error.message
					: 'Kunde inte uppdatera tilldelningen',
			)
		},
	})

	const deleteMutation = useMutation({
		mutationFn: async (id: string) => deleteEntry({ data: { id } }),
		onSuccess: () => {
			invalidateEntryQueries(queryClient, competitionId)
			toast.success('Tilldelning borttagen')
			setDeleteEntryId(null)
		},
		onError: (error) => {
			toast.error(
				error instanceof EntryError
					? error.message
					: 'Kunde inte ta bort tilldelningen',
			)
		},
	})

	const form = useForm({
		defaultValues: {
			...emptyFormValues,
			competition_id: competitionId,
			handler_id: user?.id ?? '',
		},
		validators: {
			onSubmit: entryCreateSchema,
		},
		onSubmit: async ({ value }) => {
			await createMutation.mutateAsync(value)
			form.reset({
				...emptyFormValues,
				competition_id: competitionId,
				handler_id: user?.id ?? '',
			})
		},
	})

	const entryToDelete = entries.find((entry) => entry.id === deleteEntryId)

	if (!showAssignForm && !showEntriesList) {
		return null
	}

	return (
		<section className="space-y-6">
			{showAssignForm && (
				<div>
					<h3 className="island-kicker mb-3">Tilldela tävling</h3>
					<form
						className="space-y-3 rounded-lg border border-border/70 bg-muted/15 p-4"
						onSubmit={(event) => {
							event.preventDefault()
							void form.handleSubmit()
						}}
					>
						<form.Field name="dog_id">
							{(dogField) => (
								<form.Field name="handler_id">
									{(handlerField) => (
										<form.Field name="status">
											{(statusField) => (
												<EntryRegistrationFields
													sport={sport}
													enteredDogIds={enteredDogIds}
													enteredHandlerIds={enteredHandlerIds}
													dogs={dogs}
													handlers={handlers}
													dogId={dogField.state.value}
													handlerId={handlerField.state.value}
													status={statusField.state.value}
													onDogIdChange={dogField.handleChange}
													onHandlerIdChange={handlerField.handleChange}
													onStatusChange={statusField.handleChange}
													requireDogHandler={entryRequiresDogHandler(
														statusField.state.value,
													)}
													disabled={createMutation.isPending}
													idPrefix="assign-entry"
												/>
											)}
										</form.Field>
									)}
								</form.Field>
							)}
						</form.Field>

						<Button
							type="submit"
							className="w-full"
							disabled={createMutation.isPending}
						>
							<Plus className="size-4" aria-hidden="true" />
							{createMutation.isPending ? 'Sparar…' : 'Tilldela tävling'}
						</Button>
					</form>
				</div>
			)}

			{showEntriesList && (
				<div>
					<h3 className="island-kicker mb-3">Deltagare</h3>
					<ul className="divide-y divide-border/60 rounded-lg border border-border/70">
						{entries.map((entry) => {
							const isUpdating =
								updateMutation.isPending &&
								updateMutation.variables?.id === entry.id

							return (
								<li
									key={entry.id}
									className={cn(
										'border-l-[3px] px-4 py-3',
										STATUS_ACCENT[entry.status],
									)}
								>
									<div className="flex items-start gap-3">
										<div className="min-w-0 flex-1 space-y-3">
											<EntryRegistrationFields
												sport={sport}
												enteredDogIds={enteredDogIdsForEntry(
													entries,
													entry.id,
												)}
												enteredHandlerIds={enteredHandlerIdsForEntry(
													entries,
													entry.id,
												)}
												dogs={dogs}
												handlers={handlers}
												dogId={entry.dog_id ?? ''}
												handlerId={entry.handler_id ?? ''}
												status={entry.status}
												onDogIdChange={(dogId) => {
													if (dogId === (entry.dog_id ?? '')) return
													void updateMutation.mutateAsync({
														id: entry.id,
														dog_id: dogId,
													})
												}}
												onHandlerIdChange={(handlerId) => {
													if (handlerId === (entry.handler_id ?? '')) return
													void updateMutation.mutateAsync({
														id: entry.id,
														handler_id: handlerId,
													})
												}}
												onStatusChange={(status) => {
													if (status === entry.status) return
													void updateMutation.mutateAsync({
														id: entry.id,
														status,
													})
												}}
												requireDogHandler={entryRequiresDogHandler(
													entry.status,
												)}
												disabled={isUpdating}
												idPrefix={`entry-${entry.id}`}
											/>
										</div>
										<Button
											type="button"
											variant="ghost"
											size="icon-sm"
											className="shrink-0 text-muted-foreground hover:text-destructive"
											onClick={() => setDeleteEntryId(entry.id)}
											aria-label="Ta bort tilldelning"
										>
											<Trash2 className="size-4" aria-hidden="true" />
										</Button>
									</div>
								</li>
							)
						})}
					</ul>
				</div>
			)}

			<AlertDialog
				open={deleteEntryId !== null}
				onOpenChange={(open) => {
					if (!open) setDeleteEntryId(null)
				}}
			>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>Ta bort tilldelning?</AlertDialogTitle>
						<AlertDialogDescription>
							{entryToDelete?.dog?.name
								? `Detta tar bort ${entryToDelete.dog.name} från tävlingen.`
								: 'Detta tar bort tilldelningen från tävlingen.'}
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel>Avbryt</AlertDialogCancel>
						<AlertDialogAction
							variant="destructive"
							disabled={deleteMutation.isPending}
							onClick={(event) => {
								event.preventDefault()
								if (deleteEntryId) {
									void deleteMutation.mutateAsync(deleteEntryId)
								}
							}}
						>
							{deleteMutation.isPending ? 'Tar bort…' : 'Ta bort'}
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</section>
	)
}
