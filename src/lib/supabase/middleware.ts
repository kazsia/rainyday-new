import { createServerClient } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"

export async function updateSession(request: NextRequest) {
    let supabaseResponse = NextResponse.next({
        request,
    })

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
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
    const { data: { user } } = await supabase.auth.getUser()

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
        const { data: profile } = await supabase
            .from("profiles")
            .select("role")
            .eq("id", user.id)
            .single()

        // Not admin -> redirect to home
        if (!profile || profile.role !== "admin") {
            console.warn(`[SECURITY] Non-admin user ${user.id} attempted to access ${pathname}`)
            return NextResponse.redirect(new URL("/", request.url))
        }
    }

    return supabaseResponse
}
