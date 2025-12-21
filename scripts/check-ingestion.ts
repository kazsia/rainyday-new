import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function debug() {
    const { data: orders, error: ordersError } = await supabase
        .from('orders')
        .select('email')

    if (ordersError) {
        console.error('Orders Error:', ordersError)
        return
    }

    const uniqueEmails = [...new Set(orders.map(o => o.email))]
    console.log('Unique Emails in Orders:', uniqueEmails.length)
    console.log('Emails:', uniqueEmails)

    const { data: customers, error: customersError } = await supabase
        .from('customers')
        .select('email')

    if (customersError) {
        console.error('Customers Error:', customersError)
        return
    }

    console.log('Total Customers:', customers.length)
    console.log('Customer Emails:', customers.map(c => c.email))

    const missingEmails = uniqueEmails.filter(email => !customers.map(c => c.email).includes(email))
    console.log('Missing Emails in Customers:', missingEmails)
}

debug()
