const dotenv = require('dotenv');
const path = require('path');
dotenv.config({ path: path.join(__dirname, '../.env') });

const evolutionUrl = process.env.EVOLUTION_API_URL;
const globalKey = process.env.EVOLUTION_GLOBAL_API_KEY;
const instanceName = "arno31"; // Use an existing instance to test webhook

async function testEndpoints() {
    console.log(`Testing: /webhook/set (root)`);
    const res = await fetch(`${evolutionUrl}/webhook/set`, {
        method: "POST", // we can try PUT later if all fail
        headers: {
            apikey: globalKey,
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            instance: instanceName,
            webhook: "https://example.com/webhook",
            enabled: true,
            events: ["MESSAGES_UPSERT"],
        }),
    });
    
    console.log(`Status: ${res.status}`);
    const text = await res.text();
    console.log(`Body: ${text.substring(0, 100)}`);
}
testEndpoints();
