import { z } from 'zod'

/**
 * Shared Zod schemas for TanStack Form and server validation.
 */
export const placeholderSchema = z.object({})

export const dogSchema = z.object({
	name: z.string().trim().min(1, { error: 'Namn krävs' }),
	breed: z.string(),
	date_of_birth: z.string(),
	withers_height_cm: z.string().refine(
		(value) => {
			const trimmed = value.trim()
			if (trimmed.length === 0) return true
			const parsed = Number.parseInt(trimmed, 10)
			return (
				Number.isFinite(parsed) && parsed > 0 && parsed <= 120 && /^\d+$/.test(trimmed)
			)
		},
		{ error: 'Ange mankhöjd som ett heltal i cm (1–120)' },
	),
	notes: z.string(),
})

export type DogInput = z.infer<typeof dogSchema>

export const loginSchema = z.object({
	email: z.email({ error: 'Enter a valid email address' }),
	password: z.string().min(1, { error: 'Password is required' }),
})

export type LoginInput = z.infer<typeof loginSchema>
