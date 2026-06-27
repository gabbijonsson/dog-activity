import type { EntryStatus } from '#/lib/entries.ts'

export const STATUSES_REQUIRING_DOG_HANDLER = [
	'signed_up',
	'slot_assigned',
	'reserve_slot',
	'paid',
] as const satisfies readonly EntryStatus[]

export function entryRequiresDogHandler(status: EntryStatus): boolean {
	return (STATUSES_REQUIRING_DOG_HANDLER as readonly EntryStatus[]).includes(
		status,
	)
}

export function hasEntryParticipants(
	dogId: string | null | undefined,
	handlerId: string | null | undefined,
): boolean {
	return Boolean(dogId?.trim()) || Boolean(handlerId?.trim())
}
