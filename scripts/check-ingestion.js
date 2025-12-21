const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Manually parse .env.local
const envPath = path.join(__dirname, '..', '.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
    const [key, ...value] = line.split('=');
    if (key && value) {
        env[key.trim()] = value.join('=').trim();
    }
});

const supabaseUrl = env['NEXT_PUBLIC_SUPABASE_URL'];
const supabaseKey = env['SUPABASE_SERVICE_ROLE_KEY'];

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials in .env.local');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function debug() {
    console.log('--- DB Check ---');

    const { data: orders, error: ordersError } = await supabase
        .from('orders')
        .select('email, id');

    if (ordersError) {
        console.error('Orders Error:', ordersError);
    } else {
        const uniqueEmails = [...new Set(orders.map(o => o.email))];
        console.log('Total Orders:', orders.length);
        console.log('Unique Emails in Orders:', uniqueEmails.length);
        console.log('Order Emails:', uniqueEmails);
    }

    const { data: customers, error: customersError } = await supabase
        .from('customers')
        .select('email');

    if (customersError) {
        console.error('Customers Error:', customersError);
    } else {
        console.log('Total Customers:', customers.length);
        console.log('Customer Emails:', customers.map(c => c.email));
    }

    const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('email');

    if (profilesError) {
        console.error('Profiles Error:', profilesError);
    } else {
        console.log('Total Profiles:', profiles.length);
    }
}

debug();
