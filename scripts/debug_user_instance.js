const dotenv = require('dotenv');
const path = require('path');
dotenv.config({ path: path.join(__dirname, '../.env') });

const evolutionUrl = process.env.EVOLUTION_API_URL;
const globalKey = process.env.EVOLUTION_GLOBAL_API_KEY;

async function testExactCodeFlow() {
    // Find user's real instance
    const allRes = await fetch(`${evolutionUrl}/instance/all`, {
        headers: { 'apikey': globalKey }
    });
    const allData = await allRes.json();
    const instances = allData.data || [];
    
    // Use the actual user instance (66228253000125)
    const inst = instances.find(i => i.name === "66228253000125");
    if (!inst) {
        console.log("User instance 66228253000125 not found, available:", instances.map(i => i.name));
        return;
    }
    
    console.log(`Instance: ${inst.name} | connected: ${inst.connected} | token: ${inst.token}`);
    
    if (inst.connected) {
        console.log("Instance is CONNECTED. This means QR code won't be generated (already connected).");
        console.log("The user might be seeing 'Erro interno' because the QR endpoint returns differently when already connected.");
    }

    // Test /instance/qr on the connected instance
    console.log("\n=== GET /instance/qr on connected instance ===");
    try {
        const qrRes = await fetch(`${evolutionUrl}/instance/qr`, {
            method: "GET",
            headers: { apikey: inst.token, instance: inst.name }
        });
        console.log(`Status: ${qrRes.status}`);
        const qrText = await qrRes.text();
        console.log(`Body: ${qrText.substring(0, 500)}`);
    } catch (e) {
        console.log(`Error: ${e.message}`);
    }

    // Also test webhook/set endpoint (old v2 way)
    console.log("\n=== POST /webhook/set/<instanceName> ===");
    try {
        const webhookRes = await fetch(`${evolutionUrl}/webhook/set/${inst.name}`, {
            method: "POST",
            headers: { apikey: globalKey, "Content-Type": "application/json" },
            body: JSON.stringify({
                webhook: {
                    url: "https://example.com/test",
                    enabled: true,
                    events: ["MESSAGES_UPSERT"]
                }
            })
        });
        console.log(`Status: ${webhookRes.status}`);
        const text = await webhookRes.text();
        console.log(`Body: ${text.substring(0, 300)}`);
    } catch (e) {
        console.log(`Error: ${e.message}`);
    }

    // Test webhook find endpoint
    console.log("\n=== GET /webhook/find/<instanceName> ===");
    try {
        const findRes = await fetch(`${evolutionUrl}/webhook/find/${inst.name}`, {
            headers: { apikey: globalKey }
        });
        console.log(`Status: ${findRes.status}`);
        const text = await findRes.text();
        console.log(`Body: ${text.substring(0, 300)}`);
    } catch (e) {
        console.log(`Error: ${e.message}`);
    }
}

testExactCodeFlow().catch(e => console.error("Fatal:", e));
