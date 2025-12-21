import { createServerClient } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"

export async function updateSession(request: NextRequest) {
    try {
        let supabaseResponse = NextResponse.next({
            request,
        })

        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
        const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

        if (!supabaseUrl || !supabaseAnonKey) {
            console.error("[MIDDLEWARE] Missing Supabase environment variables")
            return supabaseResponse
        }

        const supabase = createServerClient(
            supabaseUrl,
            supabaseAnonKey,
            {
                cookies: {
                    getAll() {
                        return request.cookies.getAll()
                    },
                    setAll(cookiesToSet) {
                        cookiesToSet.forEach(({ name, value }) =>
                            request.cookies.set(name, value)
                        )
                        supabaseResponse = NextResponse.next({
                            request,
                        })
                        cookiesToSet.forEach(({ name, value, options }) =>
                            supabaseResponse.cookies.set(name, value, options)
                        )
                    },
                },
            }
        )

        // Refresh session if expired
        // IMPORTANT: We use getUser() instead of getSession() for the most reliable auth state
        const { data: { user }, error: authError } = await supabase.auth.getUser()

        if (authError) {
            // Log and continue - session might just be invalid/expired
            console.debug("[MIDDLEWARE] Auth error:", authError.message)
        }

        const pathname = request.nextUrl.pathname

        // ============================================
        // ADMIN ROUTE PROTECTION (SERVER-SIDE)
        // ============================================
        if (pathname.startsWith("/admin")) {
            // Not authenticated -> redirect to auth
            if (!user) {
                const redirectUrl = new URL("/auth", request.url)
                redirectUrl.searchParams.set("redirect", pathname)
                return NextResponse.redirect(redirectUrl)
            }

            // Check admin role
            const { data: profile, error: profileError } = await supabase
                .from("profiles")
                .select("role")
                .eq("id", user.id)
                .single()

            if (profileError) {
                console.error("[MIDDLEWARE] Profile fetch error:", profileError)
                // If we can't verify role, safer to redirect to home than allow access
                return NextResponse.redirect(new URL("/", request.url))
            }

            // Not admin -> redirect to home
            if (!profile || profile.role !== "admin") {
                console.warn(`[SECURITY] Non-admin user ${user.id} attempted to access ${pathname}`)
                return NextResponse.redirect(new URL("/", request.url))
            }
        }

        return supabaseResponse
    } catch (e) {
        console.error("[MIDDLEWARE_CRASH] Critical failure in middleware:", e)
        // Fallback to standard request handling to prevent 500 across site
        return NextResponse.next({
            request,
        })
    }
}
