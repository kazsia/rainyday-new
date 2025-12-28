const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

async function deleteIncompleteOrders() {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get all order_ids that have payments
    const { data: ordersWithPayments } = await supabase
        .from('payments')
        .select('order_id');

    const orderIdsWithPayments = new Set((ordersWithPayments || []).map(p => p.order_id));

    // Get all orders
    const { data: allOrders } = await supabase
        .from('orders')
        .select('id');

    // Find orders without payments
    const ordersToDelete = (allOrders || []).filter(o => !orderIdsWithPayments.has(o.id));

    console.log('Found', ordersToDelete.length, 'incomplete orders to delete');

    if (ordersToDelete.length === 0) {
        console.log('No incomplete orders to delete');
        return;
    }

    // Delete order_items first (foreign key)
    for (const order of ordersToDelete) {
        await supabase.from('order_items').delete().eq('order_id', order.id);
    }

    // Delete the orders
    const orderIds = ordersToDelete.map(o => o.id);
    const { error } = await supabase.from('orders').delete().in('id', orderIds);

    if (error) {
        console.error('Error:', error);
    } else {
        console.log('Successfully deleted', ordersToDelete.length, 'incomplete orders');
    }
}

deleteIncompleteOrders().catch(console.error);
