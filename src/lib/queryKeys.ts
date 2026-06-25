export const queryKeys = {
	auth: {
		all: ['auth'] as const,
		session: () => [...queryKeys.auth.all, 'session'] as const,
	},
	profiles: {
		all: ['profiles'] as const,
		list: () => [...queryKeys.profiles.all, 'list'] as const,
		detail: (id: string) => [...queryKeys.profiles.all, id] as const,
	},
	dogs: {
		all: ['dogs'] as const,
		list: () => [...queryKeys.dogs.all, 'list'] as const,
		detail: (id: string) => [...queryKeys.dogs.all, id] as const,
	},
	competitions: {
		all: ['competitions'] as const,
		list: () => [...queryKeys.competitions.all, 'list'] as const,
		detail: (id: string) => [...queryKeys.competitions.all, id] as const,
	},
	entries: {
		all: ['entries'] as const,
		byCompetition: (competitionId: string) =>
			[...queryKeys.entries.all, 'competition', competitionId] as const,
		byDog: (dogId: string) => [...queryKeys.entries.all, 'dog', dogId] as const,
	},
	calendarEvents: {
		all: ['calendar-events'] as const,
		list: (filters?: { from?: string; to?: string }) =>
			[...queryKeys.calendarEvents.all, 'list', filters ?? {}] as const,
		byCompetition: (competitionId: string) =>
			[...queryKeys.calendarEvents.all, 'competition', competitionId] as const,
	},
} as const
