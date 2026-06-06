const dotenv = require('dotenv');
const path = require('path');
dotenv.config({ path: path.join(__dirname, '../.env') });

const evolutionUrl = process.env.EVOLUTION_API_URL;
const globalKey = process.env.EVOLUTION_GLOBAL_API_KEY;
const instanceName = "arno31"; // we have this instance

async function testConnect() {
    console.log(`Getting instance token for ${instanceName}`);
    const allRes = await fetch(`${evolutionUrl}/instance/all`, {
        headers: { 'apikey': globalKey }
    });
    const allData = await allRes.json();
    const inst = allData.data?.find(i => i.name === instanceName);
    if (!inst) return console.log("Instance not found");

    console.log(`Connecting instance and setting webhook`);
    const res = await fetch(`${evolutionUrl}/instance/connect`, {
        method: "POST",
        headers: {
            apikey: inst.token,
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            immediate: false,
            subscribe: ["MESSAGE", "SEND_MESSAGE"],
            webhookUrl: "https://example.com/webhook"
        }),
    });
    
    console.log(`Status: ${res.status}`);
    const text = await res.text();
    console.log(`Body: ${text}`);

    const allRes2 = await fetch(`${evolutionUrl}/instance/all`, {
        headers: { 'apikey': globalKey }
    });
    const allData2 = await allRes2.json();
    console.log("Updated Webhook:", allData2.data?.find(i => i.name === instanceName)?.webhook);
}

testConnect();
