const dotenv = require('dotenv');
const path = require('path');
dotenv.config({ path: path.join(__dirname, '../.env') });

const evolutionUrl = process.env.EVOLUTION_API_URL;
const globalKey = process.env.EVOLUTION_GLOBAL_API_KEY;
const instanceName = "arno31";

async function testConnect() {
    const allRes = await fetch(`${evolutionUrl}/instance/all`, {
        headers: { 'apikey': globalKey }
    });
    const allData = await allRes.json();
    const inst = allData.data?.find(i => i.name === instanceName);
    
    console.log(`Connecting instance and setting webhook with base64`);
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
            webhookBase64: true, // test base64 config
            base64: true
        }),
    });
    
    console.log(`Status: ${res.status}`);
    const text = await res.text();
    console.log(`Body: ${text}`);
}
testConnect();
