
const { createClient } = require('@supabase/supabase-js');

// Values from .env.local
const URL = "https://fcacmryjxeojfviqofus.supabase.co/";
const KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZjYWNtcnlqeGVvamZ2aXFvZnVzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NjA5ODgzOSwiZXhwIjoyMDgxNjc0ODM5fQ.zynUjdcAy29prF32_viXjIZujWQPNCpGcG-WOAonaAg";

async function testInsert() {
    const supabase = createClient(URL, KEY);

    const testProduct = {
        name: "TEST PRODUCT " + Date.now(),
        price: 9.99,
        currency: "USD",
        is_active: true,
        stock_count: 10
    };

    console.log("Attempting to insert:", testProduct);

    const { data, error } = await supabase
        .from('products')
        .insert(testProduct)
        .select();

    if (error) {
        console.error("INSERT ERROR:", JSON.stringify(error, null, 2));
    } else {
        console.log("INSERT SUCCESS:", JSON.stringify(data, null, 2));

        // Cleanup
        const { error: delError } = await supabase
            .from('products')
            .delete()
            .eq('id', data[0].id);
        if (delError) console.error("CLEANUP ERROR:", delError);
        else console.log("CLEANUP SUCCESS");
    }
}

testInsert();
