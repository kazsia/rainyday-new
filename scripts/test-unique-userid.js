const { createClient } = require('@supabase/supabase-js');
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function listConstraints() {
    try {
        // We can't run raw SQL, but we can try to guess by looking at metadata if possible,
        // or try to trigger specific errors.

        console.log('Attempting to trigger unique violation on user_id in customers...');
        const testEmail1 = `test1-${Date.now()}@example.com`;
        const testEmail2 = `test2-${Date.now()}@example.com`;
        const userId = '8b449c0d-f3aa-4a34-8da7-a9e67442d3f4';

        console.log('Inserting first customer...');
        const { error: err1 } = await supabase.from('customers').insert({ email: testEmail1, user_id: userId });
        if (err1) console.error('Error 1:', err1);

        console.log('Inserting second customer with SAME user_id but DIFFERENT email...');
        const { error: err2 } = await supabase.from('customers').insert({ email: testEmail2, user_id: userId });
        if (err2) {
            console.log('VIOLATION DETECTED on user_id!');
            console.error('Error 2:', err2);
        } else {
            console.log('No violation on user_id. user_id is NOT unique.');
        }

    } catch (err) {
        console.error(err);
    }
}

listConstraints();
