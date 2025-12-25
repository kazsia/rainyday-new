import { createClient } from "@supabase/supabase-js"

async function checkColumns() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ""
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ""
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    console.log("Checking columns for 'invoices' table...")
    const { data: records, error: queryError } = await supabase.from('invoices').select('*').limit(1)
    if (queryError) {
        console.error("Query Error:", queryError)
    } else if (records && records.length > 0) {
        console.log("Columns:", Object.keys(records[0]))
    } else {
        console.log("No records found, attempting dummy insert to see schema errors...")
        // Try inserting with just order_id to trigger a "missing columns" or "invalid column" error
        const { error: insertError } = await supabase.from('invoices').insert({ order_id: '00000000-0000-0000-0000-000000000000' })
        console.log("Dummy Insert Response:", insertError)
    }
}

checkColumns()
