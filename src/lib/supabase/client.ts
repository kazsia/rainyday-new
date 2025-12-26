import { createBrowserClient } from "@supabase/ssr"

export function createClient() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseAnonKey || supabaseAnonKey === 'your_anon_key_here') {
        const isPlaceholder = supabaseAnonKey === 'your_anon_key_here';
        if (typeof window !== 'undefined') {
            console.error(
                `[SUPABASE_CLIENT_ERROR][REF: ANTIGRAVITY_V2] ${isPlaceholder ? 'Placeholder' : 'Missing'} environment variables! ` +
                "Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local"
            );
        }
        return createBrowserClient(
            supabaseUrl || 'http://localhost:54321',
            supabaseAnonKey || 'anon'
        )
    }

    return createBrowserClient(supabaseUrl, supabaseAnonKey)
}
