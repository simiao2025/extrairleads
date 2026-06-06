const dotenv = require('dotenv');
const path = require('path');
const { randomBytes } = require('crypto');
dotenv.config({ path: path.join(__dirname, '../.env') });

const evolutionUrl = process.env.EVOLUTION_API_URL;
const globalKey = process.env.EVOLUTION_GLOBAL_API_KEY;

async function testCreate(formatName, bodyPayload) {
    const instanceName = "test_webhook_" + randomBytes(4).toString('hex');
    bodyPayload.instanceName = instanceName;
    bodyPayload.name = instanceName;
    bodyPayload.token = randomBytes(32).toString('hex');
    bodyPayload.qrcode = true;
    bodyPayload.integration = "WHATSAPP-BAILEYS";

    console.log(`\nTesting format: ${formatName} on instance ${instanceName}`);
    const res = await fetch(`${evolutionUrl}/instance/create`, {
        method: "POST",
        headers: {
            apikey: globalKey,
            "Content-Type": "application/json",
        },
        body: JSON.stringify(bodyPayload),
    });

    if (!res.ok) {
        console.error(`Create failed:`, await res.text());
        return;
    }

    // Now check if webhook was set
    const allRes = await fetch(`${evolutionUrl}/instance/all`, {
        method: 'GET',
        headers: { 'apikey': globalKey }
    });
    const allData = await allRes.json();
    const inst = allData.data?.find(i => i.name === instanceName);
    console.log(`Result Webhook:`, inst?.webhook);
}

async function runTests() {
    const testUrl = "https://example.com/webhook/test";

    // 1. Root webhookUrl
    await testCreate("root webhookUrl string", {
        webhookUrl: testUrl
    });

    // 2. Root webhook string
    await testCreate("root webhook string", {
        webhook: testUrl
    });

    // 3. Object inside webhook
    await testCreate("webhook object", {
        webhook: {
            url: testUrl,
            events: ["MESSAGES_UPSERT"]
        }
    });

    // 4. Object inside webhook_url
    await testCreate("webhook_url object", {
        webhook_url: {
            url: testUrl
        }
    });
}

runTests();
