const dotenv = require('dotenv');
const path = require('path');
dotenv.config({ path: path.join(__dirname, '../.env') });

const evolutionUrl = process.env.EVOLUTION_API_URL;
const globalKey = process.env.EVOLUTION_GLOBAL_API_KEY;
const instanceName = "96187190149";

async function reproduceQrFlow() {
    // Step 1: Find the instance (same as getWhatsAppQrCodeAction)
    console.log("=== Step 1: GET /instance/all ===");
    const listRes = await fetch(`${evolutionUrl}/instance/all`, {
        method: "GET",
        headers: { apikey: globalKey },
    });
    console.log(`Status: ${listRes.status}`);
    const listData = await listRes.json();
    const found = listData?.data?.find(inst => inst.name === instanceName);
    
    if (!found) {
        console.log(`Instance "${instanceName}" NOT FOUND in /instance/all`);
        console.log("This means the code would try to recreate it via checkWhatsAppConnectionAction...");
        return;
    }
    
    console.log(`Found: name=${found.name} | connected=${found.connected} | token=${found.token}`);
    const token = found.token;

    // Step 2: POST /instance/connect (same as getWhatsAppQrCodeAction lines 291-311)
    console.log("\n=== Step 2: POST /instance/connect ===");
    const webhookUrl = `https://extrairleads.brasilonthebox.shop/api/webhook/whatsapp?secret=${token}`;
    try {
        const connectRes = await fetch(`${evolutionUrl}/instance/connect`, {
            method: "POST",
            headers: {
                apikey: token,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                immediate: false,
                subscribe: ["MESSAGE", "SEND_MESSAGE"],
                webhookUrl: webhookUrl,
                webhookBase64: true,
                base64: true,
            }),
        });
        console.log(`Status: ${connectRes.status}`);
        const connectText = await connectRes.text();
        console.log(`Body: ${connectText.substring(0, 500)}`);
    } catch (e) {
        console.log(`CONNECT ERROR: ${e.message}`);
    }

    // Step 3: GET /instance/qr (same as getWhatsAppQrCodeAction lines 313-316)
    console.log("\n=== Step 3: GET /instance/qr ===");
    try {
        const qrRes = await fetch(`${evolutionUrl}/instance/qr`, {
            method: "GET",
            headers: { apikey: token, instance: instanceName },
        });
        console.log(`Status: ${qrRes.status}`);
        const qrText = await qrRes.text();
        console.log(`Body (first 300 chars): ${qrText.substring(0, 300)}`);
        
        if (qrRes.ok) {
            try {
                const json = JSON.parse(qrText);
                const qrImage = json?.data?.Qrcode || json?.base64 || json?.qrcode?.base64 || json?.code;
                console.log(`\nQR image found: ${qrImage ? 'YES (' + qrImage.substring(0, 40) + '...)' : 'NO'}`);
            } catch (e) {
                console.log(`JSON parse error: ${e.message}`);
            }
        }
    } catch (e) {
        console.log(`QR FETCH ERROR: ${e.message}`);
    }
}

reproduceQrFlow().catch(e => console.error("Fatal:", e));
