/**
 * Script to remove "In Stock!" placeholder labels from existing products
 * Run with: node scripts/remove-in-stock-labels.js
 */

const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

async function removeInStockLabels() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !supabaseServiceKey) {
        console.error('❌ Missing Supabase credentials in .env.local')
        process.exit(1)
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    console.log('🔍 Finding products with "In Stock!" labels...')

    // Find products with "In Stock!" or "In Stock" labels
    const { data: products, error: fetchError } = await supabase
        .from('products')
        .select('id, name, status_label')
        .or('status_label.eq.In Stock!,status_label.eq.In Stock')

    if (fetchError) {
        console.error('❌ Error fetching products:', fetchError)
        process.exit(1)
    }

    if (!products || products.length === 0) {
        console.log('✅ No products found with "In Stock!" labels')
        return
    }

    console.log(`📦 Found ${products.length} product(s) with "In Stock!" labels:`)
    products.forEach(p => console.log(`   - ${p.name} (${p.status_label})`))

    console.log('\n🔄 Removing labels...')

    // Update products to remove the labels (set to empty string due to NOT NULL constraint)
    const { error: updateError } = await supabase
        .from('products')
        .update({ status_label: '', status_color: '' })
        .or('status_label.eq.In Stock!,status_label.eq.In Stock')

    if (updateError) {
        console.error('❌ Error updating products:', updateError)
        process.exit(1)
    }

    console.log('✅ Successfully removed "In Stock!" labels from all products')
    console.log('🎉 Done! Refresh your product pages to see the changes.')
}

removeInStockLabels().catch(console.error)
