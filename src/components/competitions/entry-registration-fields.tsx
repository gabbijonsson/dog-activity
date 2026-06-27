import { useEffect } from 'react'

import { Label } from '#/components/ui/label.tsx'
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '#/components/ui/select.tsx'
import type { Database } from '#/lib/database.types.ts'
import { ENTRY_STATUS_OPTIONS } from '#/lib/entries.ts'
import { getAvailableDogs, getAvailableHandlers } from '#/lib/entry-options.ts'
import type { ProfileListItem } from '#/lib/profile-queries.ts'
import { profileDisplayName } from '#/lib/profile-queries.ts'

type Sport = Database['public']['Enums']['sport']
type EntryStatus = Database['public']['Enums']['entry_status']

type DogOption = { id: string; name: string }

const EMPTY_PARTICIPANT_VALUE = '__none__'

interface EntryRegistrationFieldsProps {
	sport: Sport
	enteredDogIds: Set<string>
	enteredHandlerIds: Set<string>
	dogs: DogOption[]
	handlers: ProfileListItem[]
	dogId: string
	handlerId: string
	status: EntryStatus
	onDogIdChange: (id: string) => void
	onHandlerIdChange: (id: string) => void
	onStatusChange: (status: EntryStatus) => void
	requireDogHandler?: boolean
	disabled?: boolean
	idPrefix?: string
	dogPromotionWarnings?: Map<string, string>
	selectedDogPromotionWarning?: string | null
}

export function EntryRegistrationFields({
	sport,
	enteredDogIds,
	enteredHandlerIds,
	dogs,
	handlers,
	dogId,
	handlerId,
	status,
	onDogIdChange,
	onHandlerIdChange,
	onStatusChange,
	requireDogHandler = false,
	disabled = false,
	idPrefix = 'entry',
	dogPromotionWarnings,
	selectedDogPromotionWarning,
}: EntryRegistrationFieldsProps) {
	const availableDogs = getAvailableDogs(dogs, enteredDogIds)
	const availableHandlers = getAvailableHandlers(
		handlers,
		enteredHandlerIds,
		sport,
	)

	useEffect(() => {
		if (!requireDogHandler) return
		if (availableDogs.length === 1 && dogId !== availableDogs[0].id) {
			onDogIdChange(availableDogs[0].id)
		}
	}, [availableDogs, dogId, onDogIdChange, requireDogHandler])

	useEffect(() => {
		if (!requireDogHandler) return
		if (
			availableHandlers.length === 1 &&
			handlerId !== availableHandlers[0].id
		) {
			onHandlerIdChange(availableHandlers[0].id)
		}
	}, [availableHandlers, handlerId, onHandlerIdChange, requireDogHandler])

	const dogFieldId = `${idPrefix}-dog`
	const handlerFieldId = `${idPrefix}-handler`
	const statusFieldId = `${idPrefix}-status`
	const dogSelectValue = dogId || EMPTY_PARTICIPANT_VALUE
	const handlerSelectValue = handlerId || EMPTY_PARTICIPANT_VALUE

	return (
		<>
			<div className="space-y-1.5">
				<Label htmlFor={dogFieldId}>
					Hund{requireDogHandler ? '' : ' (valfritt)'}
				</Label>
				<Select
					value={dogSelectValue}
					onValueChange={(value) =>
						onDogIdChange(value === EMPTY_PARTICIPANT_VALUE ? '' : value)
					}
					disabled={disabled || availableDogs.length === 0}
				>
					<SelectTrigger id={dogFieldId} className="w-full bg-background">
						<SelectValue placeholder="Välj hund" />
					</SelectTrigger>
					<SelectContent>
						{!requireDogHandler ? (
							<SelectItem value={EMPTY_PARTICIPANT_VALUE}>
								Ingen hund än
							</SelectItem>
						) : null}
						{availableDogs.map((dog) => (
							<SelectItem key={dog.id} value={dog.id}>
								<span className="flex flex-col items-start gap-0.5">
									<span>{dog.name}</span>
									{dogPromotionWarnings?.get(dog.id) ? (
										<span className="text-xs text-[var(--signal)]">
											{dogPromotionWarnings.get(dog.id)}
										</span>
									) : null}
								</span>
							</SelectItem>
						))}
					</SelectContent>
				</Select>
				{selectedDogPromotionWarning ? (
					<p className="text-xs text-[var(--signal)]">
						{selectedDogPromotionWarning}
					</p>
				) : null}
			</div>

			<div className="space-y-1.5">
				<Label htmlFor={handlerFieldId}>
					Hundförare{requireDogHandler ? '' : ' (valfritt)'}
				</Label>
				<Select
					value={handlerSelectValue}
					onValueChange={(value) =>
						onHandlerIdChange(value === EMPTY_PARTICIPANT_VALUE ? '' : value)
					}
					disabled={disabled || availableHandlers.length === 0}
				>
					<SelectTrigger id={handlerFieldId} className="w-full bg-background">
						<SelectValue placeholder="Välj hundförare" />
					</SelectTrigger>
					<SelectContent>
						{!requireDogHandler ? (
							<SelectItem value={EMPTY_PARTICIPANT_VALUE}>
								Ingen hundförare än
							</SelectItem>
						) : null}
						{availableHandlers.map((handler) => (
							<SelectItem key={handler.id} value={handler.id}>
								{profileDisplayName(handler)}
							</SelectItem>
						))}
					</SelectContent>
				</Select>
			</div>

			<div className="space-y-1.5">
				<Label htmlFor={statusFieldId}>Status</Label>
				<Select
					value={status}
					onValueChange={(value) => onStatusChange(value as EntryStatus)}
					disabled={disabled}
				>
					<SelectTrigger id={statusFieldId} className="w-full bg-background">
						<SelectValue />
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
		</>
	)
}
