import { useForm } from '@tanstack/react-form'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect } from 'react'
import { toast } from 'sonner'

import { useAuth } from '#/components/auth-provider.tsx'
import { SectionSkeleton } from '#/components/dashboard/dashboard-primitives.tsx'
import { DatePickerField } from '#/components/dogs/date-picker-field.tsx'
import { Button } from '#/components/ui/button.tsx'
import { Input } from '#/components/ui/input.tsx'
import { Label } from '#/components/ui/label.tsx'
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
import { createDog, fetchDogById, updateDog } from '#/lib/dog-queries.ts'
import { queryKeys } from '#/lib/queryKeys.ts'
import { type DogInput, dogSchema } from '#/lib/schemas.ts'
import { getBrowserSupabase } from '#/lib/supabase.ts'

const emptyValues: DogInput = {
	name: '',
	breed: '',
	date_of_birth: '',
	withers_height_cm: '',
	notes: '',
}

interface DogFormDrawerProps {
	open: boolean
	onOpenChange: (open: boolean) => void
	dogId?: string | null
	onSaved?: (dogId: string) => void
}

export function DogFormDrawer({
	open,
	onOpenChange,
	dogId,
	onSaved,
}: DogFormDrawerProps) {
	const queryClient = useQueryClient()
	const { user } = useAuth()
	const isEditing = !!dogId

	const { data: existingDog, isLoading } = useQuery({
		queryKey: queryKeys.dogs.detail(dogId ?? 'new'),
		queryFn: async () => {
			if (!dogId) return null
			const supabase = getBrowserSupabase()
			return fetchDogById(supabase, dogId)
		},
		enabled: open && isEditing,
	})

	const mutation = useMutation({
		mutationFn: async (values: DogInput) => {
			const supabase = getBrowserSupabase()

			if (isEditing && dogId) {
				return updateDog(supabase, dogId, values)
			}

			if (!user) throw new Error('Not authenticated')
			return createDog(supabase, values, user.id)
		},
		onSuccess: (dog) => {
			void queryClient.invalidateQueries({ queryKey: queryKeys.dogs.all })
			toast.success(isEditing ? 'Hund uppdaterad' : 'Hund tillagd')
			onOpenChange(false)
			onSaved?.(dog.id)
		},
		onError: () => {
			toast.error(
				isEditing
					? 'Kunde inte uppdatera hunden'
					: 'Kunde inte lägga till hunden',
			)
		},
	})

	const form = useForm({
		defaultValues: emptyValues,
		validators: {
			onSubmit: dogSchema,
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

		if (isEditing && existingDog) {
			form.reset({
				name: existingDog.name,
				breed: existingDog.breed ?? '',
				date_of_birth: existingDog.date_of_birth ?? '',
				withers_height_cm:
					existingDog.withers_height_cm != null
						? String(existingDog.withers_height_cm)
						: '',
				notes: existingDog.notes ?? '',
			})
		}
	}, [open, isEditing, existingDog, form])

	return (
		<Sheet open={open} onOpenChange={onOpenChange}>
			<SheetContent className="w-full sm:max-w-md">
				<SheetHeader>
					<SheetTitle className="display-title pr-8">
						{isEditing ? 'Redigera hund' : 'Lägg till hund'}
					</SheetTitle>
					<SheetDescription>
						{isEditing
							? 'Uppdatera namn, ras och övriga uppgifter.'
							: 'Registrera en ny hund i stallet.'}
					</SheetDescription>
				</SheetHeader>

				{isEditing && isLoading ? (
					<SheetBody>
						<SectionSkeleton rows={4} />
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
						<SheetBody className="space-y-4">
							<form.Field name="name">
								{(field) => (
									<div className="space-y-2">
										<Label htmlFor={field.name}>Namn</Label>
										<Input
											id={field.name}
											name={field.name}
											value={field.state.value}
											onBlur={field.handleBlur}
											onChange={(event) =>
												field.handleChange(event.target.value)
											}
											aria-invalid={field.state.meta.errors.length > 0}
										/>
										{field.state.meta.errors.map((error) => (
											<p
												key={error?.message}
												className="text-sm text-destructive"
											>
												{error?.message}
											</p>
										))}
									</div>
								)}
							</form.Field>

							<form.Field name="breed">
								{(field) => (
									<div className="space-y-2">
										<Label htmlFor={field.name}>Ras</Label>
										<Input
											id={field.name}
											name={field.name}
											value={field.state.value}
											onBlur={field.handleBlur}
											onChange={(event) =>
												field.handleChange(event.target.value)
											}
										/>
									</div>
								)}
							</form.Field>

							<form.Field name="date_of_birth">
								{(field) => (
									<div className="space-y-2">
										<Label htmlFor={field.name}>Födelsedatum</Label>
										<DatePickerField
											id={field.name}
											value={field.state.value}
											onBlur={field.handleBlur}
											onChange={field.handleChange}
										/>
									</div>
								)}
							</form.Field>

							<form.Field name="withers_height_cm">
								{(field) => (
									<div className="space-y-2">
										<Label htmlFor={field.name}>Mankhöjd (cm)</Label>
										<Input
											id={field.name}
											name={field.name}
											type="number"
											min={1}
											max={120}
											inputMode="numeric"
											placeholder="t.ex. 45"
											value={field.state.value}
											onBlur={field.handleBlur}
											onChange={(event) =>
												field.handleChange(event.target.value)
											}
											aria-invalid={field.state.meta.errors.length > 0}
										/>
										{field.state.meta.errors.map((error) => (
											<p
												key={error?.message}
												className="text-sm text-destructive"
											>
												{error?.message}
											</p>
										))}
									</div>
								)}
							</form.Field>

							<form.Field name="notes">
								{(field) => (
									<div className="space-y-2">
										<Label htmlFor={field.name}>Anteckningar</Label>
										<Textarea
											id={field.name}
											name={field.name}
											rows={4}
											value={field.state.value}
											onBlur={field.handleBlur}
											onChange={(event) =>
												field.handleChange(event.target.value)
											}
										/>
									</div>
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
												: 'Lägg till hund'}
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
