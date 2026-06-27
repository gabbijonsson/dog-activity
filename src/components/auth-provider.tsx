import type { Session, User } from '@supabase/supabase-js'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from '@tanstack/react-router'
import {
	createContext,
	type ReactNode,
	useCallback,
	useContext,
	useEffect,
	useMemo,
	useState,
} from 'react'
import { toast } from 'sonner'

import type { Database } from '#/lib/database.types.ts'
import { queryKeys } from '#/lib/queryKeys.ts'
import { getBrowserSupabase } from '#/lib/supabase.ts'

type Profile = Database['public']['Tables']['profiles']['Row']

interface AuthContextValue {
	session: Session | null
	user: User | null
	profile: Profile | null
	isLoading: boolean
	isAuthenticated: boolean
	signIn: (email: string, password: string) => Promise<void>
	signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
	const queryClient = useQueryClient()
	const navigate = useNavigate()
	const [session, setSession] = useState<Session | null>(null)
	const [isLoading, setIsLoading] = useState(true)

	const user = session?.user ?? null

	const { data: profile = null } = useQuery({
		queryKey: queryKeys.profiles.detail(user?.id ?? 'anonymous'),
		queryFn: async () => {
			if (!user) return null

			const supabase = getBrowserSupabase()
			const { data, error } = await supabase
				.from('profiles')
				.select('*')
				.eq('id', user.id)
				.single()

			if (error) throw error
			return data
		},
		enabled: !!user,
	})

	useEffect(() => {
		const supabase = getBrowserSupabase()

		supabase.auth.getSession().then(({ data: { session: nextSession } }) => {
			setSession(nextSession)
			setIsLoading(false)
		})

		const {
			data: { subscription },
		} = supabase.auth.onAuthStateChange((_event, nextSession) => {
			setSession(nextSession)
			setIsLoading(false)
			queryClient.invalidateQueries({ queryKey: queryKeys.auth.all })
		})

		return () => subscription.unsubscribe()
	}, [queryClient])

	const signIn = useCallback(async (email: string, password: string) => {
		const supabase = getBrowserSupabase()
		const { data, error } = await supabase.auth.signInWithPassword({
			email,
			password,
		})

		if (error) throw error
		setSession(data.session)
	}, [])

	const signOut = useCallback(async () => {
		const supabase = getBrowserSupabase()
		await supabase.auth.signOut()
		setSession(null)
		queryClient.removeQueries({ queryKey: queryKeys.auth.all })
		queryClient.removeQueries({ queryKey: queryKeys.profiles.all })
		toast.success('Utloggad')
		await navigate({ to: '/login', search: { redirect: '/' } })
	}, [navigate, queryClient])

	const value = useMemo<AuthContextValue>(
		() => ({
			session,
			user,
			profile,
			isLoading,
			isAuthenticated: !!session,
			signIn,
			signOut,
		}),
		[session, user, profile, isLoading, signIn, signOut],
	)

	return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
	const context = useContext(AuthContext)
	if (!context) {
		throw new Error('useAuth must be used within AuthProvider')
	}
	return context
}
