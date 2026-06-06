const dotenv = require('dotenv');
const path = require('path');
dotenv.config({ path: path.join(__dirname, '../.env') });

const evolutionUrl = process.env.EVOLUTION_API_URL;
const globalKey = process.env.EVOLUTION_GLOBAL_API_KEY;

async function debugQrFlow() {
    console.log("=== 1. Listing all instances ===");
    const allRes = await fetch(`${evolutionUrl}/instance/all`, {
        headers: { 'apikey': globalKey }
    });
    console.log(`Status: ${allRes.status}`);
    const allData = await allRes.json();
    const instances = allData.data || [];
    console.log(`Found ${instances.length} instances:`);
    instances.forEach(i => console.log(`  - ${i.name} | connected: ${i.connected} | token: ${i.token?.substring(0,10)}...`));

    if (instances.length === 0) {
        console.log("No instances found, creating a test one...");
        const createRes = await fetch(`${evolutionUrl}/instance/create`, {
            method: "POST",
            headers: { apikey: globalKey, "Content-Type": "application/json" },
            body: JSON.stringify({ name: "debug_qr_test", token: "debug123456" })
        });
        console.log(`Create status: ${createRes.status}`);
        const createData = await createRes.json();
        console.log("Create response:", JSON.stringify(createData, null, 2));
        return;
    }

    const inst = instances[0];
    console.log(`\nUsing instance: ${inst.name} | token: ${inst.token}`);

    // Test 1: /instance/qr with GET
    console.log("\n=== 2. GET /instance/qr ===");
    try {
        const qrRes = await fetch(`${evolutionUrl}/instance/qr`, {
            method: "GET",
            headers: { apikey: inst.token, instance: inst.name }
        });
        console.log(`Status: ${qrRes.status}`);
        const qrText = await qrRes.text();
        console.log(`Body (first 200 chars): ${qrText.substring(0, 200)}`);
    } catch (e) {
        console.log(`Error: ${e.message}`);
    }

    // Test 2: /instance/connect with POST (this should return QR)
    console.log("\n=== 3. POST /instance/connect (immediate=true) ===");
    try {
        const connectRes = await fetch(`${evolutionUrl}/instance/connect`, {
            method: "POST",
            headers: { apikey: inst.token, "Content-Type": "application/json" },
            body: JSON.stringify({ immediate: true })
        });
        console.log(`Status: ${connectRes.status}`);
        const connectText = await connectRes.text();
        console.log(`Body (first 500 chars): ${connectText.substring(0, 500)}`);
    } catch (e) {
        console.log(`Error: ${e.message}`);
    }

    // Test 3: /instance/connect with POST (immediate=false)
    console.log("\n=== 4. POST /instance/connect (immediate=false) ===");
    try {
        const connectRes2 = await fetch(`${evolutionUrl}/instance/connect`, {
            method: "POST",
            headers: { apikey: inst.token, "Content-Type": "application/json" },
            body: JSON.stringify({ immediate: false })
        });
        console.log(`Status: ${connectRes2.status}`);
        const connectText2 = await connectRes2.text();
        console.log(`Body (first 500 chars): ${connectText2.substring(0, 500)}`);
    } catch (e) {
        console.log(`Error: ${e.message}`);
    }
}

debugQrFlow().catch(e => console.error("Fatal:", e));
