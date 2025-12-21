import { createAdminClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function POST(req: Request) {
    try {
        const supabase = await createAdminClient()
        const { email, full_name, password } = await req.json()

        if (!email || !password) {
            return NextResponse.json({ error: "Email and password are required" }, { status: 400 })
        }

        // 1. Create user in auth.users
        const { data: authData, error: authError } = await supabase.auth.admin.createUser({
            email,
            password,
            email_confirm: true,
            user_metadata: { full_name }
        })

        if (authError) throw authError

        // 2. Profile is usually created via trigger, but let's ensure full_name is set
        if (full_name && authData.user) {
            const { error: profileError } = await supabase
                .from('profiles')
                .update({ full_name })
                .eq('id', authData.user.id)

            if (profileError) {
                console.error("Profile update error:", profileError)
                // Non-critical if user was created
            }
        }

        return NextResponse.json({ success: true, user: authData.user })
    } catch (error: any) {
        console.error("Admin create customer error:", error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
