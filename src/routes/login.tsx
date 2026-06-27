import { useForm } from '@tanstack/react-form'
import { createFileRoute, redirect, useNavigate } from '@tanstack/react-router'
import { toast } from 'sonner'

import { useAuth } from '#/components/auth-provider.tsx'
import { Button } from '#/components/ui/button.tsx'
import {
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from '#/components/ui/card.tsx'
import { Input } from '#/components/ui/input.tsx'
import { Label } from '#/components/ui/label.tsx'
import { getAuthSession, sanitizeRedirect } from '#/lib/auth.ts'
import { pageTitle } from '#/lib/page-meta.ts'
import { loginSchema } from '#/lib/schemas.ts'

export const Route = createFileRoute('/login')({
	head: () => ({
		meta: [{ title: pageTitle('Logga in') }],
	}),
	validateSearch: (search: Record<string, unknown>) => ({
		redirect: sanitizeRedirect(search.redirect),
	}),
	beforeLoad: async ({ search }) => {
		const session = await getAuthSession()
		if (session) {
			throw redirect({ to: search.redirect })
		}
	},
	component: LoginPage,
})

function LoginPage() {
	const { signIn } = useAuth()
	const navigate = useNavigate({ from: '/login' })
	const { redirect: redirectTo } = Route.useSearch()

	const form = useForm({
		defaultValues: {
			email: '',
			password: '',
		},
		validators: {
			onSubmit: loginSchema,
		},
		onSubmit: async ({ value }) => {
			try {
				await signIn(value.email, value.password)
				toast.success('Inloggad')
				await navigate({ to: redirectTo, search: { redirect: redirectTo } })
			} catch {
				toast.error('Fel e-post eller lösenord')
			}
		},
	})

	return (
		<Card className="island-shell w-full max-w-md border-0">
			<CardHeader>
				<CardTitle className="display-title">Logga in</CardTitle>
				<CardDescription>
					E-post och lösenord till ditt Dog Sports Tracker-konto.
				</CardDescription>
			</CardHeader>
			<form
				onSubmit={(event) => {
					event.preventDefault()
					event.stopPropagation()
					void form.handleSubmit()
				}}
			>
				<CardContent className="space-y-4">
					<form.Field name="email">
						{(field) => (
							<div className="space-y-2">
								<Label htmlFor={field.name}>Email</Label>
								<Input
									id={field.name}
									name={field.name}
									type="email"
									autoComplete="email"
									value={field.state.value}
									onBlur={field.handleBlur}
									onChange={(event) => field.handleChange(event.target.value)}
									aria-invalid={field.state.meta.errors.length > 0}
								/>
								{field.state.meta.errors.map((error) => (
									<p key={error?.message} className="text-sm text-destructive">
										{error?.message}
									</p>
								))}
							</div>
						)}
					</form.Field>
					<form.Field name="password">
						{(field) => (
							<div className="space-y-2">
								<Label htmlFor={field.name}>Password</Label>
								<Input
									id={field.name}
									name={field.name}
									type="password"
									autoComplete="current-password"
									value={field.state.value}
									onBlur={field.handleBlur}
									onChange={(event) => field.handleChange(event.target.value)}
									aria-invalid={field.state.meta.errors.length > 0}
								/>
								{field.state.meta.errors.map((error) => (
									<p key={error?.message} className="text-sm text-destructive">
										{error?.message}
									</p>
								))}
							</div>
						)}
					</form.Field>
				</CardContent>
				<CardFooter>
					<form.Subscribe
						selector={(state) => [state.canSubmit, state.isSubmitting]}
					>
						{([canSubmit, isSubmitting]) => (
							<Button
								type="submit"
								className="w-full"
								disabled={!canSubmit || isSubmitting}
							>
								{isSubmitting ? 'Loggar in…' : 'Logga in'}
							</Button>
						)}
					</form.Subscribe>
				</CardFooter>
			</form>
		</Card>
	)
}
