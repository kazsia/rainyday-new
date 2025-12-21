const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
const envPath = path.join(__dirname, '..', '.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
    const [key, ...value] = line.split('=');
    if (key && value) env[key.trim()] = value.join('=').trim();
});
const supabase = createClient(env['NEXT_PUBLIC_SUPABASE_URL'], env['SUPABASE_SERVICE_ROLE_KEY']);

async function testIngestion() {
    const testEmail = `test_${Math.random().toString(36).substring(7)}@example.com`;
    console.log(`Creating test order for: ${testEmail}`);

    const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert({
            email: testEmail,
            total: 10.00,
            status: 'pending'
        })
        .select()
        .single();

    if (orderError) {
        console.error('Order Creation Error:', orderError);
        return;
    }
    console.log('Order created:', order.id);

    // Wait a moment for trigger
    await new Promise(r => setTimeout(r, 1000));

    const { data: customer, error: customerError } = await supabase
        .from('customers')
        .select('*')
        .eq('email', testEmail)
        .single();

    if (customerError) {
        console.error('Customer Not Found (Trigger Failed?):', customerError.message);
    } else {
        console.log('Customer ingested successfully:', customer.id);
    }
}

testIngestion();
