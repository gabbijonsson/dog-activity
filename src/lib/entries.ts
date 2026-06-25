import type { Database } from '#/lib/database.types.ts'

export type EntryStatus = Database['public']['Enums']['entry_status']

const ENTRY_STATUS_LABELS: Record<EntryStatus, string> = {
	interested: 'Intresserad',
	signed_up: 'Anmäld',
	slot_assigned: 'Startplats',
	reserve_slot: 'Reserv',
	paid: 'Betald',
}

export function entryStatusLabel(status: EntryStatus): string {
	return ENTRY_STATUS_LABELS[status]
}
