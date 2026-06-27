import { useForm } from '@tanstack/react-form'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Plus, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'

import { useAuth } from '#/components/auth-provider.tsx'
import { EntryRegistrationFields } from '#/components/competitions/entry-registration-fields.tsx'
import { EmptyState } from '#/components/dashboard/dashboard-primitives.tsx'
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
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '#/components/ui/select.tsx'
import type { CompetitionEntry } from '#/lib/competition-queries.ts'
import type { Database } from '#/lib/database.types.ts'
import { fetchDogsList } from '#/lib/dog-queries.ts'
import { ENTRY_STATUS_OPTIONS, entryStatusLabel } from '#/lib/entries.ts'
import {
	canAddEntry,
	getAvailableDogs,
	getAvailableHandlers,
} from '#/lib/entry-options.ts'
import { fetchProfilesList } from '#/lib/profile-queries.ts'
import { queryKeys } from '#/lib/queryKeys.ts'
import { type EntryCreateInput, entryCreateSchema } from '#/lib/schemas.ts'
import { getBrowserSupabase } from '#/lib/supabase.ts'
import { cn } from '#/lib/utils.ts'
import {
	createEntry,
	deleteEntry,
	EntryError,
	updateEntryStatus,
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
		entries.flatMap((entry) => (entry.dog?.id ? [entry.dog.id] : [])),
	)
	const enteredHandlerIds = new Set(
		entries.flatMap((entry) => (entry.handler?.id ? [entry.handler.id] : [])),
	)

	const availableDogs = getAvailableDogs(dogs, enteredDogIds)
	const availableHandlers = getAvailableHandlers(
		handlers,
		enteredHandlerIds,
		sport,
	)
	const showAddForm = canAddEntry(sport, availableDogs, availableHandlers)

	const createMutation = useMutation({
		mutationFn: async (values: EntryCreateInput) =>
			createEntry({ data: values }),
		onSuccess: () => {
			invalidateEntryQueries(queryClient, competitionId)
			toast.success('Anmälan tillagd')
		},
		onError: (error) => {
			toast.error(
				error instanceof EntryError
					? error.message
					: 'Kunde inte lägga till anmälan',
			)
		},
	})

	const statusMutation = useMutation({
		mutationFn: async ({ id, status }: { id: string; status: EntryStatus }) =>
			updateEntryStatus({ data: { id, status } }),
		onSuccess: () => {
			invalidateEntryQueries(queryClient, competitionId)
			toast.success('Status uppdaterad')
		},
		onError: (error) => {
			toast.error(
				error instanceof EntryError
					? error.message
					: 'Kunde inte uppdatera status',
			)
		},
	})

	const deleteMutation = useMutation({
		mutationFn: async (id: string) => deleteEntry({ data: { id } }),
		onSuccess: () => {
			invalidateEntryQueries(queryClient, competitionId)
			toast.success('Anmälan borttagen')
			setDeleteEntryId(null)
		},
		onError: (error) => {
			toast.error(
				error instanceof EntryError
					? error.message
					: 'Kunde inte ta bort anmälan',
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

	return (
		<section>
			<h3 className="island-kicker mb-3">Anmälningar</h3>

			{showAddForm && (
				<form
					className="mb-4 space-y-3 rounded-lg border border-border/70 bg-muted/15 p-4"
					onSubmit={(event) => {
						event.preventDefault()
						void form.handleSubmit()
					}}
				>
					<p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
						Lägg till
					</p>

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
												disabled={createMutation.isPending}
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
						{createMutation.isPending ? 'Lägger till…' : 'Lägg till anmälan'}
					</Button>
				</form>
			)}

			{entries.length === 0 ? (
				<EmptyState
					title="Inga anmälningar än"
					description={
						showAddForm
							? 'Lägg till hund och handler ovan.'
							: 'Alla hundar är redan anmälda.'
					}
				/>
			) : (
				<ul className="divide-y divide-border/60 rounded-lg border border-border/70">
					{entries.map((entry) => (
						<li
							key={entry.id}
							className={cn(
								'flex items-start gap-3 border-l-[3px] px-4 py-3',
								STATUS_ACCENT[entry.status],
							)}
						>
							<div className="min-w-0 flex-1 space-y-1 text-sm">
								<p className="font-medium">{entry.dog?.name ?? 'Okänd hund'}</p>
								<p className="text-xs text-muted-foreground">
									{entry.handler?.full_name ??
										entry.handler?.email ??
										'Okänd handler'}
								</p>
								<Select
									value={entry.status}
									onValueChange={(value) => {
										if (value === entry.status) return
										void statusMutation.mutateAsync({
											id: entry.id,
											status: value as EntryStatus,
										})
									}}
									disabled={
										statusMutation.isPending &&
										statusMutation.variables?.id === entry.id
									}
								>
									<SelectTrigger
										className="h-8 w-full max-w-44 border-border/60 bg-background/80 text-xs font-medium"
										aria-label={`Status för ${entry.dog?.name ?? 'anmälan'}`}
									>
										<SelectValue>{entryStatusLabel(entry.status)}</SelectValue>
									</SelectTrigger>
									<SelectContent>
										{ENTRY_STATUS_OPTIONS.map((option) => (
											<SelectItem key={option.value} value={option.value}>
												{option.label}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
							</div>
							<Button
								type="button"
								variant="ghost"
								size="icon-sm"
								className="shrink-0 text-muted-foreground hover:text-destructive"
								onClick={() => setDeleteEntryId(entry.id)}
								aria-label={`Ta bort anmälan för ${entry.dog?.name ?? 'hund'}`}
							>
								<Trash2 className="size-4" aria-hidden="true" />
							</Button>
						</li>
					))}
				</ul>
			)}

			<AlertDialog
				open={deleteEntryId !== null}
				onOpenChange={(open) => {
					if (!open) setDeleteEntryId(null)
				}}
			>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>Ta bort anmälan?</AlertDialogTitle>
						<AlertDialogDescription>
							{entryToDelete
								? `Detta tar bort ${entryToDelete.dog?.name ?? 'hunden'} från tävlingen.`
								: 'Detta tar bort anmälan från tävlingen.'}
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
