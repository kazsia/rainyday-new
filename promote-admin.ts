
import { createClient } from "@supabase/supabase-js"
import dotenv from "dotenv"

dotenv.config({ path: ".env.local" })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!supabaseUrl || !supabaseServiceKey) {
    console.error("Missing Supabase credentials in .env.local")
    process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function promoteToAdmin(email: string) {
    console.log(`Promoting ${email} to admin...`)

    // 1. Get user by email to verify they exist
    const { data: profiles, error: findError } = await supabase
        .from("profiles")
        .select("*")
        .eq("email", email)
        .single()

    if (findError) {
        // If not found in profiles, maybe they are in auth.users but not profiles?
        // But profiles should be created on signup.
        console.error("User not found in profiles:", findError.message)

        // Try to find in auth (admin only)
        const { data: { users }, error: authError } = await supabase.auth.admin.listUsers()
        const user = users?.find(u => u.email === email)

        if (user) {
            console.log("User found in Auth but not Profiles. Creating profile...")
            // Create profile
            const { error: insertError } = await supabase
                .from("profiles")
                .insert({
                    id: user.id,
                    email: email,
                    role: 'admin'
                })
            if (insertError) {
                console.error("Failed to create profile:", insertError)
            } else {
                console.log("Profile created and set to admin.")
            }
            return
        }

        return
    }

    // 2. Update role
    const { error: updateError } = await supabase
        .from("profiles")
        .update({ role: "admin" })
        .eq("email", email)

    if (updateError) {
        console.error("Failed to update role:", updateError.message)
    } else {
        console.log(`Successfully promoted ${email} to admin.`)
    }
}

promoteToAdmin("eggplcer@gmail.com")
