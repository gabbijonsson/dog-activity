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
				Number.isFinite(parsed) &&
				parsed > 0 &&
				parsed <= 120 &&
				/^\d+$/.test(trimmed)
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

const sportEnum = z.enum(['nosework', 'rally_obedience'])
const noseworkTypeEnum = z.enum([
	'tsm',
	'tem_behallare',
	'tem_inomhus',
	'tem_fordon',
	'tem_utomhus',
])
const noseworkClassEnum = z.enum(['class_1', 'class_2', 'class_3', 'elit'])
const noseworkOfficialStatusEnum = z.enum(['official', 'unofficial', 'summit'])
const rallyStartsEnum = z.enum(['single', 'double', 'triple'])

export const competitionFormSchema = z
	.object({
		name: z.string().trim().min(1, { error: 'Namn krävs' }),
		sport: sportEnum,
		location: z.string(),
		origin_location: z.string(),
		sign_up_opens_date: z.string().min(1, { error: 'Datum krävs' }),
		sign_up_opens_time: z.string().min(1, { error: 'Tid krävs' }),
		sign_up_closes_date: z.string().min(1, { error: 'Datum krävs' }),
		sign_up_closes_time: z.string().min(1, { error: 'Tid krävs' }),
		payment_deadline: z.string().min(1, { error: 'Datum krävs' }),
		event_date: z.string().min(1, { error: 'Datum krävs' }),
		event_time: z.string().min(1, { error: 'Tid krävs' }),
		url: z.string(),
		notes: z.string(),
		nosework_type: noseworkTypeEnum.optional(),
		nosework_class: noseworkClassEnum.optional(),
		nosework_official_status: noseworkOfficialStatusEnum.optional(),
		number_of_starts: rallyStartsEnum.optional(),
	})
	.superRefine((data, ctx) => {
		if (data.sport === 'nosework') {
			if (!data.nosework_type) {
				ctx.addIssue({
					code: 'custom',
					message: 'Typ krävs',
					path: ['nosework_type'],
				})
			}
			if (!data.nosework_class) {
				ctx.addIssue({
					code: 'custom',
					message: 'Klass krävs',
					path: ['nosework_class'],
				})
			}
			if (!data.nosework_official_status) {
				ctx.addIssue({
					code: 'custom',
					message: 'Status krävs',
					path: ['nosework_official_status'],
				})
			}
		}

		if (data.sport === 'rally_obedience' && !data.number_of_starts) {
			ctx.addIssue({
				code: 'custom',
				message: 'Antal starter krävs',
				path: ['number_of_starts'],
			})
		}
	})

export type CompetitionFormInput = z.infer<typeof competitionFormSchema>

export const competitionSaveSchema = z
	.object({
		id: z.string().uuid().optional(),
		name: z.string().trim().min(1, { error: 'Namn krävs' }),
		sport: sportEnum,
		location: z.string(),
		origin_location: z.string(),
		sign_up_opens: z.string().min(1),
		sign_up_closes: z.string().min(1),
		payment_deadline: z.string().min(1),
		event_date: z.string().min(1),
		url: z.string(),
		notes: z.string(),
		nosework_type: noseworkTypeEnum.optional(),
		nosework_class: noseworkClassEnum.optional(),
		nosework_official_status: noseworkOfficialStatusEnum.optional(),
		number_of_starts: rallyStartsEnum.optional(),
	})
	.superRefine((data, ctx) => {
		if (data.sport === 'nosework') {
			if (
				!data.nosework_type ||
				!data.nosework_class ||
				!data.nosework_official_status
			) {
				ctx.addIssue({
					code: 'custom',
					message: 'Nose Work-fält saknas',
					path: ['sport'],
				})
			}
		}

		if (data.sport === 'rally_obedience' && !data.number_of_starts) {
			ctx.addIssue({
				code: 'custom',
				message: 'Rally-fält saknas',
				path: ['sport'],
			})
		}

		const opens = Date.parse(data.sign_up_opens)
		const closes = Date.parse(data.sign_up_closes)
		const payment = Date.parse(data.payment_deadline)
		const event = Date.parse(data.event_date)

		if (opens > closes) {
			ctx.addIssue({
				code: 'custom',
				message: 'Anmälan stänger måste vara efter att den öppnar',
				path: ['sign_up_closes'],
			})
		}
		if (closes > payment) {
			ctx.addIssue({
				code: 'custom',
				message: 'Betalningsdatum måste vara efter stängning',
				path: ['payment_deadline'],
			})
		}
		if (opens > event || closes > event) {
			ctx.addIssue({
				code: 'custom',
				message: 'Tävlingsdag måste vara efter anmälningsperioden',
				path: ['event_date'],
			})
		}
	})

export type CompetitionSaveInput = z.infer<typeof competitionSaveSchema>
