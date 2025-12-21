import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"

export async function createClient() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    const cookieStore = await cookies()

    if (!supabaseUrl || !supabaseAnonKey) {
        console.error("[SERVER_CLIENT] Missing environment variables (URL/ANON_KEY)")
        // Return a client initialized with placeholders to avoid hard crash in components that don't check
        return createServerClient(
            supabaseUrl || 'http://localhost:54321',
            supabaseAnonKey || 'anon',
            { cookies: { getAll: () => cookieStore.getAll(), setAll: () => { } } }
        )
    }

    return createServerClient(
        supabaseUrl,
        supabaseAnonKey,
        {
            cookies: {
                getAll() {
                    return cookieStore.getAll()
                },
                setAll(cookiesToSet) {
                    try {
                        cookiesToSet.forEach(({ name, value, options }) =>
                            cookieStore.set(name, value, options)
                        )
                    } catch {
                        // Called from Server Component - ignore
                    }
                },
            },
        }
    )
}

// Admin client with service role (use sparingly)
export async function createAdminClient() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    const cookieStore = await cookies()

    if (!supabaseUrl || !supabaseServiceKey) {
        console.error("[ADMIN_CLIENT] Missing environment variables (URL/SERVICE_KEY)")
        return createServerClient(
            supabaseUrl || 'http://localhost:54321',
            supabaseServiceKey || 'service-role',
            { cookies: { getAll: () => cookieStore.getAll(), setAll: () => { } } }
        )
    }

    return createServerClient(
        supabaseUrl,
        supabaseServiceKey,
        {
            cookies: {
                getAll() {
                    return cookieStore.getAll()
                },
                setAll(cookiesToSet) {
                    try {
                        cookiesToSet.forEach(({ name, value, options }) =>
                            cookieStore.set(name, value, options)
                        )
                    } catch {
                        // Called from Server Component - ignore
                    }
                },
            },
        }
    )
}
