const dotenv = require('dotenv');
const path = require('path');
dotenv.config({ path: path.join(__dirname, '../.env') });

const evolutionUrl = process.env.EVOLUTION_API_URL;
const globalKey = process.env.EVOLUTION_GLOBAL_API_KEY;
const instanceName = "arno31";

async function testWebhookSet() {
    console.log(`Setting webhook for ${instanceName}`);
    const res = await fetch(`${evolutionUrl}/webhook/set/${instanceName}`, {
        method: "POST",
        headers: {
            apikey: globalKey,
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            url: "https://example.com/webhook",
            events: ["MESSAGE", "SEND_MESSAGE", "CONNECTION_UPDATE"],
            webhookByEvents: false
        }),
    });
    
    console.log(`Status: ${res.status}`);
    const text = await res.text();
    console.log(`Body: ${text}`);
}

testWebhookSet();
