import { Link } from '@tanstack/react-router'

import { UserMenu } from '#/components/user-menu.tsx'

const navItems = [
	{ to: '/', label: 'Dashboard' },
	{ to: '/competitions', label: 'Competitions' },
	{ to: '/dogs', label: 'Dogs' },
] as const

export function AppShell({ children }: { children: React.ReactNode }) {
	return (
		<div className="flex min-h-screen flex-col">
			<header className="sticky top-0 z-40 border-b border-border/80 bg-header/90 backdrop-blur-md">
				<div className="page-wrap flex h-14 items-center justify-between gap-4">
					<div className="flex items-center gap-8">
						<Link
							to="/"
							className="display-title text-lg font-bold tracking-tight text-foreground no-underline"
						>
							Dog Sports Tracker
						</Link>
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
					</div>
					<UserMenu />
				</div>
			</header>
			<main className="page-wrap flex-1 py-8">{children}</main>
		</div>
	)
}
