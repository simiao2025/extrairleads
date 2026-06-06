const dotenv = require('dotenv');
const path = require('path');
const { randomBytes } = require('crypto');
dotenv.config({ path: path.join(__dirname, '../.env') });

const evolutionUrl = process.env.EVOLUTION_API_URL;
const globalKey = process.env.EVOLUTION_GLOBAL_API_KEY;

async function testCreate() {
    const instanceName = "test_webhook_" + randomBytes(4).toString('hex');
    const token = randomBytes(32).toString('hex');
    
    console.log(`Testing creation with webhook on instance ${instanceName}`);
    const res = await fetch(`${evolutionUrl}/instance/create`, {
        method: "POST",
        headers: {
            apikey: globalKey,
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            instanceName: instanceName,
            name: instanceName,
            token: token,
            qrcode: true,
            integration: "WHATSAPP-BAILEYS",
            webhook: {
                url: "https://example.com/webhook",
                events: ["MESSAGE", "SEND_MESSAGE", "CONNECTION_UPDATE"]
            }
        }),
    });

    if (!res.ok) {
        console.error(`Create failed:`, await res.text());
        return;
    }
    
    console.log("Create successful.");

    // Now check if webhook was set
    const allRes = await fetch(`${evolutionUrl}/instance/all`, {
        method: 'GET',
        headers: { 'apikey': globalKey }
    });
    const allData = await allRes.json();
    const inst = allData.data?.find(i => i.name === instanceName);
    console.log(`Result Webhook:`, inst?.webhook);
}

testCreate();
