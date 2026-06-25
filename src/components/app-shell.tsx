import { Link, useRouterState } from '@tanstack/react-router'

import { UserMenu } from '#/components/user-menu.tsx'

const navItems = [
	{ to: '/', label: 'Översikt' },
	{ to: '/competitions', label: 'Tävlingar' },
	{ to: '/dogs', label: 'Hundar' },
] as const

export function AppShell({ children }: { children: React.ReactNode }) {
	const pathname = useRouterState({
		select: (state) => state.location.pathname,
	})
	const isLoginPage = pathname === '/login'

	if (isLoginPage) {
		return (
			<div className="flex min-h-screen flex-col items-center justify-center p-4">
				{children}
			</div>
		)
	}

	return (
		<div className="flex min-h-screen flex-col">
			<header className="sticky top-0 z-40 border-b border-border/80 bg-header/90 backdrop-blur-md">
				<div className="flex h-14 w-full items-center justify-between gap-4 px-6">
					<nav className="hidden items-center gap-6 sm:flex">
						{navItems.map(({ to, label }) => (
							<Link
								key={to}
								to={to}
								className="nav-link text-sm font-medium"
								activeProps={{ className: 'nav-link is-active' }}
							>
								{label}
							</Link>
						))}
					</nav>
					<UserMenu />
				</div>
			</header>
			<main className="w-full flex-1 p-6">{children}</main>
		</div>
	)
}
