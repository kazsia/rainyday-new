import { createBrowserClient } from "@supabase/ssr"

export function createClient() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseAnonKey) {
        // Return a mock or handle gracefully - client components should check for null if needed
        // but for now, logging and returning a "broken" client is better than a hard crash during SSR
        console.error("[SUPABASE_CLIENT] Missing environment variables!")
        return createBrowserClient(
            supabaseUrl || 'http://localhost:54321', // placeholder
            supabaseAnonKey || 'anon' // placeholder
        )
    }

    return createBrowserClient(supabaseUrl, supabaseAnonKey)
}
