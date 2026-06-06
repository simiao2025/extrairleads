const dotenv = require('dotenv');
const path = require('path');
dotenv.config({ path: path.join(__dirname, '../.env') });

const evolutionUrl = process.env.EVOLUTION_API_URL;
const globalKey = process.env.EVOLUTION_GLOBAL_API_KEY;
const instanceName = "test_webhook_c2740fc5";

async function testConnectQR() {
    const allRes = await fetch(`${evolutionUrl}/instance/all`, {
        headers: { 'apikey': globalKey }
    });
    const allData = await allRes.json();
    const inst = allData.data?.find(i => i.name === instanceName);
    if (!inst) return console.log("Instance not found");

    console.log(`Connecting instance and getting QR`);
    const res = await fetch(`${evolutionUrl}/instance/connect`, {
        method: "POST",
        headers: {
            apikey: inst.token,
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            immediate: false,
            subscribe: ["MESSAGE", "SEND_MESSAGE"],
            webhookUrl: "https://example.com/webhook",
            webhookBase64: true,
            base64: true
        }),
    });
    
    console.log(`Status: ${res.status}`);
    const text = await res.text();
    console.log(`Body: ${text.substring(0, 300)}`);
}
testConnectQR();
