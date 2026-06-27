import { useForm } from '@tanstack/react-form'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { ReactNode } from 'react'
import { useEffect } from 'react'
import { toast } from 'sonner'
import { useAuth } from '#/components/auth-provider.tsx'
import { DateTimePickerField } from '#/components/competitions/datetime-picker-field.tsx'
import { EntryRegistrationFields } from '#/components/competitions/entry-registration-fields.tsx'
import { OriginAddressFavorites } from '#/components/competitions/origin-address-favorites.tsx'
import { SectionSkeleton } from '#/components/dashboard/dashboard-primitives.tsx'
import { DatePickerField } from '#/components/dogs/date-picker-field.tsx'
import { AddressAutocompleteField } from '#/components/map/address-autocomplete-field.tsx'
import { Button } from '#/components/ui/button.tsx'
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
	Sheet,
	SheetBody,
	SheetContent,
	SheetDescription,
	SheetFooter,
	SheetHeader,
	SheetTitle,
} from '#/components/ui/sheet.tsx'
import { Textarea } from '#/components/ui/textarea.tsx'
import {
	NOSEWORK_CLASS_OPTIONS,
	NOSEWORK_OFFICIAL_STATUS_OPTIONS,
	NOSEWORK_TYPE_OPTIONS,
	RALLY_STARTS_OPTIONS,
	SPORT_OPTIONS,
} from '#/lib/competition-labels.ts'
import {
	competitionToFormInput,
	fetchCompetitionById,
	formInputToSavePayload,
} from '#/lib/competition-queries.ts'
import { fetchDogsList } from '#/lib/dog-queries.ts'
import { fetchProfilesList } from '#/lib/profile-queries.ts'
import { queryKeys } from '#/lib/queryKeys.ts'
import {
	type CompetitionFormInput,
	competitionFormSchema,
} from '#/lib/schemas.ts'
import { getBrowserSupabase } from '#/lib/supabase.ts'
import { CompetitionSaveError, saveCompetition } from '#/server/competitions.ts'
import { createEntry, EntryError } from '#/server/entries.ts'

const emptyValues: CompetitionFormInput = {
	name: '',
	sport: 'nosework',
	location: '',
	origin_location: '',
	sign_up_opens_date: '',
	sign_up_opens_time: '09:00',
	sign_up_closes: '',
	payment_deadline: '',
	event_date: '',
	event_time: '08:00',
	url: '',
	notes: '',
	nosework_type: 'tem_utomhus',
	nosework_class: 'class_1',
	nosework_official_status: 'official',
	number_of_starts: 'single',
	entry_dog_id: '',
	entry_handler_id: '',
	entry_status: 'interested',
}

interface CompetitionFormDrawerProps {
	open: boolean
	onOpenChange: (open: boolean) => void
	competitionId?: string | null
	initialEventDate?: string | null
	onSaved?: (competitionId: string) => void
}

export function CompetitionFormDrawer({
	open,
	onOpenChange,
	competitionId,
	initialEventDate,
	onSaved,
}: CompetitionFormDrawerProps) {
	const queryClient = useQueryClient()
	const { user } = useAuth()
	const isEditing = !!competitionId

	const { data: existingCompetition, isLoading } = useQuery({
		queryKey: queryKeys.competitions.detail(competitionId ?? 'new'),
		queryFn: async () => {
			if (!competitionId) return null
			const supabase = getBrowserSupabase()
			return fetchCompetitionById(supabase, competitionId)
		},
		enabled: open && isEditing,
	})

	const { data: dogs = [] } = useQuery({
		queryKey: queryKeys.dogs.list(),
		queryFn: async () => {
			const supabase = getBrowserSupabase()
			return fetchDogsList(supabase)
		},
		enabled: open && !isEditing,
	})

	const { data: handlers = [] } = useQuery({
		queryKey: queryKeys.profiles.list(),
		queryFn: async () => {
			const supabase = getBrowserSupabase()
			return fetchProfilesList(supabase)
		},
		enabled: open && !isEditing,
	})

	const mutation = useMutation({
		mutationFn: async (values: CompetitionFormInput) => {
			const { entry_dog_id, entry_handler_id, entry_status, ...formValues } =
				values
			const payload = formInputToSavePayload(formValues)
			const result = await saveCompetition({
				data: {
					...payload,
					id: competitionId ?? undefined,
				},
			})

			if (
				!isEditing &&
				entry_dog_id &&
				entry_handler_id &&
				entry_dog_id.length > 0 &&
				entry_handler_id.length > 0
			) {
				await createEntry({
					data: {
						competition_id: result.id,
						dog_id: entry_dog_id,
						handler_id: entry_handler_id,
						status: entry_status,
					},
				})
			}

			return result
		},
		onSuccess: (result) => {
			void queryClient.invalidateQueries({
				queryKey: queryKeys.competitions.all,
			})
			void queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.all })
			void queryClient.invalidateQueries({
				queryKey: queryKeys.calendarEvents.all,
			})
			void queryClient.invalidateQueries({ queryKey: queryKeys.dogs.all })
			toast.success(isEditing ? 'Tävling uppdaterad' : 'Tävling tillagd')
			onOpenChange(false)
			onSaved?.(result.id)
		},
		onError: (error) => {
			const message =
				error instanceof CompetitionSaveError || error instanceof EntryError
					? error.message
					: isEditing
						? 'Kunde inte uppdatera tävlingen'
						: 'Kunde inte lägga till tävlingen'
			toast.error(message)
		},
	})

	const form = useForm({
		defaultValues: emptyValues,
		validators: {
			onSubmit: competitionFormSchema,
		},
		onSubmit: async ({ value }) => {
			await mutation.mutateAsync(value)
		},
	})

	useEffect(() => {
		if (!open) {
			form.reset(emptyValues)
			return
		}

		if (isEditing && existingCompetition) {
			form.reset(competitionToFormInput(existingCompetition))
			return
		}

		if (initialEventDate) {
			form.reset({
				...emptyValues,
				event_date: initialEventDate,
				entry_handler_id: user?.id ?? '',
			})
			return
		}

		form.reset({
			...emptyValues,
			entry_handler_id: user?.id ?? '',
		})
	}, [open, isEditing, existingCompetition, initialEventDate, user?.id, form])

	return (
		<Sheet open={open} onOpenChange={onOpenChange}>
			<SheetContent className="w-full sm:max-w-lg">
				<SheetHeader>
					<SheetTitle className="display-title pr-8">
						{isEditing ? 'Redigera tävling' : 'Lägg till tävling'}
					</SheetTitle>
					<SheetDescription>
						{isEditing
							? 'Uppdatera datum, plats och sportdetaljer.'
							: 'Registrera en ny tävling — kalenderhändelser skapas automatiskt.'}
					</SheetDescription>
				</SheetHeader>

				{isEditing && isLoading ? (
					<SheetBody>
						<SectionSkeleton rows={6} />
					</SheetBody>
				) : (
					<form
						className="flex min-h-0 flex-1 flex-col"
						onSubmit={(event) => {
							event.preventDefault()
							event.stopPropagation()
							void form.handleSubmit()
						}}
					>
						<SheetBody className="space-y-5">
							<form.Field name="name">
								{(field) => (
									<FieldShell
										label="Namn"
										htmlFor={field.name}
										errors={field.state.meta.errors}
									>
										<Input
											id={field.name}
											value={field.state.value}
											onBlur={field.handleBlur}
											onChange={(event) =>
												field.handleChange(event.target.value)
											}
											aria-invalid={field.state.meta.errors.length > 0}
										/>
									</FieldShell>
								)}
							</form.Field>

							<form.Field name="sport">
								{(field) => (
									<FieldShell label="Sport" htmlFor={field.name}>
										<Select
											value={field.state.value}
											onValueChange={(value) =>
												field.handleChange(
													value as CompetitionFormInput['sport'],
												)
											}
										>
											<SelectTrigger id={field.name} className="w-full">
												<SelectValue />
											</SelectTrigger>
											<SelectContent>
												{SPORT_OPTIONS.map((option) => (
													<SelectItem key={option.value} value={option.value}>
														{option.label}
													</SelectItem>
												))}
											</SelectContent>
										</Select>
									</FieldShell>
								)}
							</form.Field>

							<form.Subscribe selector={(state) => state.values.sport}>
								{(sport) =>
									sport === 'nosework' ? (
										<div className="space-y-4 rounded-lg border border-border/70 bg-muted/20 p-4">
											<p className="island-kicker">Nose Work</p>
											<form.Field name="nosework_type">
												{(field) => (
													<FieldShell label="Typ" htmlFor={field.name}>
														<Select
															value={field.state.value}
															onValueChange={(value) =>
																field.handleChange(
																	value as CompetitionFormInput['nosework_type'],
																)
															}
														>
															<SelectTrigger id={field.name} className="w-full">
																<SelectValue placeholder="Välj typ" />
															</SelectTrigger>
															<SelectContent>
																{NOSEWORK_TYPE_OPTIONS.map((option) => (
																	<SelectItem
																		key={option.value}
																		value={option.value}
																	>
																		{option.label}
																	</SelectItem>
																))}
															</SelectContent>
														</Select>
													</FieldShell>
												)}
											</form.Field>
											<form.Field name="nosework_class">
												{(field) => (
													<FieldShell label="Klass" htmlFor={field.name}>
														<Select
															value={field.state.value}
															onValueChange={(value) =>
																field.handleChange(
																	value as CompetitionFormInput['nosework_class'],
																)
															}
														>
															<SelectTrigger id={field.name} className="w-full">
																<SelectValue placeholder="Välj klass" />
															</SelectTrigger>
															<SelectContent>
																{NOSEWORK_CLASS_OPTIONS.map((option) => (
																	<SelectItem
																		key={option.value}
																		value={option.value}
																	>
																		{option.label}
																	</SelectItem>
																))}
															</SelectContent>
														</Select>
													</FieldShell>
												)}
											</form.Field>
											<form.Field name="nosework_official_status">
												{(field) => (
													<FieldShell
														label="Officiell status"
														htmlFor={field.name}
													>
														<Select
															value={field.state.value}
															onValueChange={(value) =>
																field.handleChange(
																	value as CompetitionFormInput['nosework_official_status'],
																)
															}
														>
															<SelectTrigger id={field.name} className="w-full">
																<SelectValue placeholder="Välj status" />
															</SelectTrigger>
															<SelectContent>
																{NOSEWORK_OFFICIAL_STATUS_OPTIONS.map(
																	(option) => (
																		<SelectItem
																			key={option.value}
																			value={option.value}
																		>
																			{option.label}
																		</SelectItem>
																	),
																)}
															</SelectContent>
														</Select>
													</FieldShell>
												)}
											</form.Field>
										</div>
									) : (
										<div className="space-y-4 rounded-lg border border-border/70 bg-muted/20 p-4">
											<p className="island-kicker">Rally</p>
											<form.Field name="number_of_starts">
												{(field) => (
													<FieldShell
														label="Antal starter"
														htmlFor={field.name}
														errors={field.state.meta.errors}
													>
														<Select
															value={field.state.value}
															onValueChange={(value) =>
																field.handleChange(
																	value as CompetitionFormInput['number_of_starts'],
																)
															}
														>
															<SelectTrigger id={field.name} className="w-full">
																<SelectValue placeholder="Välj antal starter" />
															</SelectTrigger>
															<SelectContent>
																{RALLY_STARTS_OPTIONS.map((option) => (
																	<SelectItem
																		key={option.value}
																		value={option.value}
																	>
																		{option.label}
																	</SelectItem>
																))}
															</SelectContent>
														</Select>
													</FieldShell>
												)}
											</form.Field>
										</div>
									)
								}
							</form.Subscribe>

							<form.Field name="origin_location">
								{(field) => (
									<div className="space-y-3">
										<OriginAddressFavorites
											active={open}
											value={field.state.value}
											onSelect={field.handleChange}
										/>
										<FieldShell
											label="Från"
											htmlFor={field.name}
											errors={field.state.meta.errors}
										>
											<AddressAutocompleteField
												id={field.name}
												active={open}
												placeholder="Startadress"
												value={field.state.value}
												onBlur={field.handleBlur}
												onChange={field.handleChange}
												invalid={field.state.meta.errors.length > 0}
											/>
										</FieldShell>
									</div>
								)}
							</form.Field>

							<form.Field name="location">
								{(field) => (
									<FieldShell
										label="Till"
										htmlFor={field.name}
										errors={field.state.meta.errors}
									>
										<AddressAutocompleteField
											id={field.name}
											active={open}
											placeholder="Tävlingsadress"
											value={field.state.value}
											onBlur={field.handleBlur}
											onChange={field.handleChange}
											invalid={field.state.meta.errors.length > 0}
										/>
									</FieldShell>
								)}
							</form.Field>

							<div className="space-y-4 rounded-lg border border-border/70 p-4">
								<p className="island-kicker">Datum</p>

								<form.Field name="sign_up_opens_date">
									{(dateField) => (
										<form.Field name="sign_up_opens_time">
											{(timeField) => (
												<DateTimePickerField
													dateId={dateField.name}
													timeId={timeField.name}
													dateLabel="Anmälan öppnar"
													dateValue={dateField.state.value}
													timeValue={timeField.state.value}
													onDateChange={dateField.handleChange}
													onTimeChange={timeField.handleChange}
													onBlur={dateField.handleBlur}
													dateInvalid={dateField.state.meta.errors.length > 0}
												/>
											)}
										</form.Field>
									)}
								</form.Field>

								<form.Field name="sign_up_closes">
									{(field) => (
										<FieldShell
											label="Anmälan stänger"
											htmlFor={field.name}
											errors={field.state.meta.errors}
										>
											<DatePickerField
												id={field.name}
												value={field.state.value}
												onChange={field.handleChange}
												onBlur={field.handleBlur}
												aria-invalid={field.state.meta.errors.length > 0}
											/>
										</FieldShell>
									)}
								</form.Field>

								<form.Field name="payment_deadline">
									{(field) => (
										<FieldShell
											label="Betalningsdatum"
											htmlFor={field.name}
											errors={field.state.meta.errors}
										>
											<DatePickerField
												id={field.name}
												value={field.state.value}
												onChange={field.handleChange}
												onBlur={field.handleBlur}
												aria-invalid={field.state.meta.errors.length > 0}
											/>
										</FieldShell>
									)}
								</form.Field>

								<form.Field name="event_date">
									{(dateField) => (
										<form.Field name="event_time">
											{(timeField) => (
												<DateTimePickerField
													dateId={dateField.name}
													timeId={timeField.name}
													dateLabel="Tävlingsdag"
													dateValue={dateField.state.value}
													timeValue={timeField.state.value}
													onDateChange={dateField.handleChange}
													onTimeChange={timeField.handleChange}
													onBlur={dateField.handleBlur}
													dateInvalid={dateField.state.meta.errors.length > 0}
												/>
											)}
										</form.Field>
									)}
								</form.Field>
							</div>

							{!isEditing && (
								<div className="space-y-4 rounded-lg border border-border/70 bg-muted/20 p-4">
									<p className="island-kicker">Anmälan</p>
									<form.Subscribe selector={(state) => state.values.sport}>
										{(sport) => (
											<form.Field name="entry_dog_id">
												{(dogField) => (
													<form.Field name="entry_handler_id">
														{(handlerField) => (
															<form.Field name="entry_status">
																{(statusField) => (
																	<EntryRegistrationFields
																		sport={sport}
																		enteredDogIds={new Set()}
																		enteredHandlerIds={new Set()}
																		dogs={dogs}
																		handlers={handlers}
																		dogId={dogField.state.value}
																		handlerId={handlerField.state.value}
																		status={statusField.state.value}
																		onDogIdChange={dogField.handleChange}
																		onHandlerIdChange={
																			handlerField.handleChange
																		}
																		onStatusChange={statusField.handleChange}
																		disabled={mutation.isPending}
																		idPrefix="create-entry"
																	/>
																)}
															</form.Field>
														)}
													</form.Field>
												)}
											</form.Field>
										)}
									</form.Subscribe>
								</div>
							)}

							<form.Field name="url">
								{(field) => (
									<FieldShell label="Webbplats" htmlFor={field.name}>
										<Input
											id={field.name}
											type="url"
											placeholder="https://"
											value={field.state.value}
											onBlur={field.handleBlur}
											onChange={(event) =>
												field.handleChange(event.target.value)
											}
										/>
									</FieldShell>
								)}
							</form.Field>

							<form.Field name="notes">
								{(field) => (
									<FieldShell label="Anteckningar" htmlFor={field.name}>
										<Textarea
											id={field.name}
											rows={3}
											value={field.state.value}
											onBlur={field.handleBlur}
											onChange={(event) =>
												field.handleChange(event.target.value)
											}
										/>
									</FieldShell>
								)}
							</form.Field>
						</SheetBody>

						<SheetFooter>
							<form.Subscribe
								selector={(state) => [state.canSubmit, state.isSubmitting]}
							>
								{([canSubmit, isSubmitting]) => (
									<Button
										type="submit"
										className="w-full"
										disabled={!canSubmit || isSubmitting || mutation.isPending}
									>
										{isSubmitting || mutation.isPending
											? 'Sparar…'
											: isEditing
												? 'Spara ändringar'
												: 'Lägg till tävling'}
									</Button>
								)}
							</form.Subscribe>
						</SheetFooter>
					</form>
				)}
			</SheetContent>
		</Sheet>
	)
}

function FieldShell({
	label,
	htmlFor,
	errors = [],
	children,
}: {
	label: string
	htmlFor: string
	errors?: Array<{ message?: string } | undefined>
	children: ReactNode
}) {
	return (
		<div className="space-y-2">
			<Label htmlFor={htmlFor}>{label}</Label>
			{children}
			{errors.map((error) => (
				<p key={error?.message} className="text-sm text-destructive">
					{error?.message}
				</p>
			))}
		</div>
	)
}
