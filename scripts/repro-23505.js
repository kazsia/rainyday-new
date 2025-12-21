const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function reproduce() {
    const testEmail = `test-${Date.now()}@example.com`;
    console.log(`Testing with email: ${testEmail}`);

    try {
        // 1. Create Order (should trigger customer ingestion)
        const readableId = `RD-TEST-${Math.random().toString(36).substring(2, 5).toUpperCase()}`;
        console.log(`Creating order with readableId: ${readableId}`);

        const { data: order, error: orderError } = await supabase
            .from('orders')
            .insert({
                email: testEmail,
                total: 10.00,
                readable_id: readableId
            })
            .select()
            .single();

        if (orderError) {
            console.error('Order Error:', orderError);
            return;
        }
        console.log('Order created successfully:', order.id);

        // 2. Try to create another order with SAME email but different readable_id
        const readableId2 = `RD-TEST-${Math.random().toString(36).substring(2, 5).toUpperCase()}`;
        console.log(`Creating second order with same email: ${testEmail}`);

        const { data: order2, error: orderError2 } = await supabase
            .from('orders')
            .insert({
                email: testEmail,
                total: 20.00,
                readable_id: readableId2
            })
            .select()
            .single();

        if (orderError2) {
            console.error('Second Order Error (Expected?):', orderError2);
        } else {
            console.log('Second Order created successfully:', order2.id);
        }

    } catch (err) {
        console.error('Unexpected error:', err);
    }
}

reproduce();
