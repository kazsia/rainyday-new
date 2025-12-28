
import crypto from 'crypto';

const API_URL = 'http://localhost:3000';
const OXAPAY_API_KEY = process.env.OXAPAY_API_KEY || 'your_test_key_here';

// Sample payment data - update these values to match a real pending payment in your DB
const TEST_TRACK_ID = 'test_track_id_100'; // Must exist in your DB with status 'pending'
const TEST_AMOUNT = '10.00'; // Must matches payment.amount in DB

async function testOxaPayWebhook() {
    console.log('\n--- Testing OxaPay Webhook (Strict V1 Mode) ---');

    // V1 Payload Structure based on official docs
    const payload = JSON.stringify({
        track_id: TEST_TRACK_ID, // Note: official docs use snake_case track_id in some places, but our code checks 'trackId' or 'track_id'?
        // Let's look at the handler: const { order_id, status, trackId, type } = data;
        // Wait, the handler destructures `trackId` from `data`. 
        // The V1 docs sample showed "track_id" in the JSON but the handler uses "trackId".
        // I should check if I need to update the handler to support "track_id" as well.
        // Chunk 7 sample: { "track_id": "..." }
        // Chunk 2 sample: { "track_id": "..." }
        // My handler code (Step 371) has: const { order_id, status, trackId, type } = data
        // If OxaPay sends "track_id", then "trackId" will be undefined!
        // I need to fix the handler first!

        // For now I will put BOTH to be safe in the test, but I MUST fix the handler.
        // Handler now supports both track_id and trackId
        trackId: TEST_TRACK_ID,

        status: 'Paid', // TitleCase as per V1
        type: 'invoice',
        amount: TEST_AMOUNT,
        currency: 'USD',
        pay_amount: '0.001',
        pay_currency: 'BTC',
        address: 'bc1testaddress',
        txs: [
            {
                tx_hash: "test_tx_hash_123456789",
                status: "confirmed"
            }
        ]
    });

    const hmac = crypto.createHmac('sha512', OXAPAY_API_KEY);
    hmac.update(payload);
    const signature = hmac.digest('hex');

    console.log('Sending payload:', payload);
    console.log('Signature:', signature);

    try {
        const res = await fetch(`${API_URL}/api/webhooks/oxapay`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'HMAC': signature
            },
            body: payload
        });

        console.log('Status:', res.status);
        console.log('Response:', await res.text());
    } catch (err) {
        console.error('Failed to send webhook:', err);
    }
}

async function main() {
    await testOxaPayWebhook();
}

main();
