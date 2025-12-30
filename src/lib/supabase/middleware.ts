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
            // Only log in production if this happens unexpectedly
            if (process.env.NODE_ENV === "production") {
                console.error("[MIDDLEWARE] Missing Supabase environment variables")
            }
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

        const pathname = request.nextUrl.pathname
        const isAdminRoute = pathname.startsWith("/admin")

        // ============================================
        // OPTIMIZATION: Skip getUser() for public routes if no Supabase cookies exist
        // ============================================
        const hasAuthCookies = request.cookies.getAll().some(c => c.name.startsWith("sb-"))

        let user = null
        if (hasAuthCookies || isAdminRoute) {
            // Refresh session if expired
            // IMPORTANT: We use getUser() instead of getSession() for the most reliable auth state
            const { data: { user: authUser }, error: authError } = await supabase.auth.getUser()

            if (authError) {
                // Handle "refresh_token_not_found" and other errors gracefully 
                // to avoid noisy stack traces in Edge runtime
                const isNoSession = authError.message.includes("Auth session missing")
                const isInvalidRefresh = authError.message.includes("Refresh Token Not Found")

                if (isAdminRoute && (isNoSession || isInvalidRefresh)) {
                    // Force redirect to login for admin routes if auth fails
                    const redirectUrl = new URL("/auth", request.url)
                    redirectUrl.searchParams.set("redirect", pathname)
                    return NextResponse.redirect(redirectUrl)
                }

                // Only log unexpected errors or logs that aren't expected for guests
                if (!isNoSession && !isInvalidRefresh) {
                    console.debug("[MIDDLEWARE] Auth error:", authError.message)
                }
            }
            user = authUser
        }

        // ============================================
        // ADMIN ROUTE PROTECTION (SERVER-SIDE)
        // ============================================
        if (isAdminRoute) {
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
