import { z } from 'zod'

/**
 * Shared Zod schemas for TanStack Form and server validation.
 * Domain schemas (dogs, competitions, entries) added in later epics.
 */
export const placeholderSchema = z.object({})

export const loginSchema = z.object({
	email: z.email({ error: 'Enter a valid email address' }),
	password: z.string().min(1, { error: 'Password is required' }),
})

export type LoginInput = z.infer<typeof loginSchema>
