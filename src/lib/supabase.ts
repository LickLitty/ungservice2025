import { createClient, type SupabaseClient } from '@supabase/supabase-js'

let cachedClient: SupabaseClient | null = null

function getClient(): SupabaseClient {
	if (cachedClient) return cachedClient
	const url = process.env.NEXT_PUBLIC_SUPABASE_URL
	const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
	if (!url || !anon) {
		// Defer initialization until runtime; throwing helps in dev but avoids build-time side effects
		throw new Error('Supabase environment variables are missing')
	}
	cachedClient = createClient(url, anon, {
		auth: {
			persistSession: true,
			autoRefreshToken: true,
			detectSessionInUrl: true,
		},
		realtime: { params: { eventsPerSecond: 10 } },
	})
	return cachedClient
}

// Export a proxy that supports both `supabase()` and property access like `supabase.from(...)`
export const supabase: any = new Proxy(function () {}, {
	apply() {
		return getClient()
	},
	get(_target, prop) {
		const client = getClient() as any
		return client[prop]
	},
})


