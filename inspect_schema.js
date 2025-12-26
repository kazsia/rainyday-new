
const { createClient } = require('@supabase/supabase-js');

async function checkSchema() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseKey) {
        console.error("Missing credentials");
        return;
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data, error } = await supabase
        .from('product_categories')
        .select('*')
        .limit(1);

    if (error) {
        console.error(error);
    } else {
        console.log("Schema Keys:", data && data.length > 0 ? Object.keys(data[0]) : "No data found");
    }
}

checkSchema();
