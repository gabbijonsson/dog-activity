import { createFileRoute, redirect } from '@tanstack/react-router'

import { getAuthSession } from '#/lib/auth.ts'

export const Route = createFileRoute('/_authenticated')({
	beforeLoad: async ({ location }) => {
		const session = await getAuthSession()
		if (!session) {
			throw redirect({
				to: '/login',
				search: { redirect: location.href },
			})
		}
	},
})
