const dotenv = require('dotenv');
const path = require('path');
dotenv.config({ path: path.join(__dirname, '../.env') });

const evolutionUrl = process.env.EVOLUTION_API_URL;
const globalKey = process.env.EVOLUTION_GLOBAL_API_KEY;

async function testQr() {
    // try on an instance we just created: test_webhook_c2740fc5
    const instanceName = "test_webhook_c2740fc5";
    const allRes = await fetch(`${evolutionUrl}/instance/all`, {
        headers: { 'apikey': globalKey }
    });
    const allData = await allRes.json();
    const inst = allData.data?.find(i => i.name === instanceName);
    
    if (!inst) return console.log("Instance not found");

    console.log(`Getting QR code for instance ${instanceName}`);
    const res = await fetch(`${evolutionUrl}/instance/qr`, {
        method: "GET",
        headers: {
            apikey: inst.token,
            instance: instanceName
        }
    });
    
    console.log(`Status: ${res.status}`);
    const text = await res.text();
    console.log(`Body length: ${text.length}`);
    try {
        const json = JSON.parse(text);
        console.log("Valid JSON:", json);
    } catch(e) {
        console.log("NOT JSON:", text.substring(0, 50));
    }
}
testQr();
