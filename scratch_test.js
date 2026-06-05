const url = 'https://evolution-api.brasilonthebox.shop';
const globalKey = 'abcslirm2026';

async function run() {
    try {
        const res = await fetch(`${url}/instance/create`, {
            method: 'POST',
            headers: {
                'apikey': globalKey,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                instanceName: 'test_webhook_agent',
                name: 'test_webhook_agent',
                qrcode: true,
                integration: 'WHATSAPP-BAILEYS'
            })
        });
        console.log("Status:", res.status);
        const text = await res.text();
        console.log("Response text:", text);
    } catch (err) {
        console.error("Error:", err);
    }
}
run();
