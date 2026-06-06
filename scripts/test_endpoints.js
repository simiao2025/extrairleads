const dotenv = require('dotenv');
const path = require('path');
dotenv.config({ path: path.join(__dirname, '../.env') });

const evolutionUrl = process.env.EVOLUTION_API_URL;
const globalKey = process.env.EVOLUTION_GLOBAL_API_KEY;
const instanceName = "arno31"; // Use an existing instance to test webhook

async function testEndpoints() {
    const endpoints = [
        `/webhook/set/${instanceName}`,
        `/webhook/instance/${instanceName}`,
        `/webhook/${instanceName}`,
        `/instance/webhook/${instanceName}`,
        `/settings/webhook/${instanceName}`,
        `/webhook/update/${instanceName}`
    ];

    for (const ep of endpoints) {
        console.log(`Testing: ${ep}`);
        const res = await fetch(`${evolutionUrl}${ep}`, {
            method: "POST", // we can try PUT later if all fail
            headers: {
                apikey: globalKey,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                webhook: {
                    url: "https://example.com/webhook",
                    enabled: true,
                    events: ["MESSAGES_UPSERT"],
                },
                // For endpoints that don't nest inside webhook:
                url: "https://example.com/webhook",
                enabled: true,
                events: ["MESSAGES_UPSERT"],
            }),
        });
        
        console.log(`Status: ${res.status}`);
        const text = await res.text();
        console.log(`Body: ${text.substring(0, 100)}`);
        if (res.ok) {
            console.log("SUCCESS on", ep);
            break;
        }
    }
}
testEndpoints();
