const { neon } = require('@neondatabase/serverless');
const dotenv = require('dotenv');
const path = require('path');
const { randomBytes } = require('crypto');

dotenv.config({ path: path.join(__dirname, '../.env') });

function getGlobalKey() {
	return process.env.EVOLUTION_GLOBAL_API_KEY;
}

function getBaseWebhookUrl(token) {
	const baseUrl = process.env.APP_URL || "https://extrairleads.brasilonthebox.shop";
	return `${baseUrl}/api/webhook/whatsapp?secret=${token}`;
}

async function testLogic() {
    const evolutionUrl = process.env.EVOLUTION_API_URL;
    const globalKey = getGlobalKey();
    const instanceName = "test_webhook_agent_" + Date.now();
    const newToken = randomBytes(32).toString('hex');
    const webhookUrl = getBaseWebhookUrl(newToken);

    console.log(`Creating instance: ${instanceName}`);
    const createRes = await fetch(`${evolutionUrl}/instance/create`, {
        method: "POST",
        headers: {
            apikey: globalKey,
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            instanceName: instanceName,
            name: instanceName,
            token: newToken,
            qrcode: true,
            integration: "WHATSAPP-BAILEYS",
            webhook: {
                url: webhookUrl,
                enabled: true,
                events: ["MESSAGES_UPSERT"],
            },
        }),
    });

    if (!createRes.ok) {
        console.error("Create failed:", await createRes.text());
        return;
    }

    const createData = await createRes.json();
    console.log("Create Data Token (data.token):", createData.data?.token);
    
    // NEW LOGIC
    const actualToken =
        createData.data?.token || createData.hash?.apikey || createData.instance?.apikey || newToken;

    const actualWebhookUrl = getBaseWebhookUrl(actualToken);
    console.log("Setting webhook unconditionally to:", actualWebhookUrl);
    
    try {
        const webhookRes = await fetch(`${evolutionUrl}/webhook/set/${instanceName}`, {
            method: "POST",
            headers: {
                apikey: globalKey,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                webhook: {
                    url: actualWebhookUrl,
                    enabled: true,
                    events: ["MESSAGES_UPSERT", "SEND_MESSAGE"],
                    base64: true,
                },
            }),
        });
        console.log("Webhook Set Status:", webhookRes.status);
        console.log("Webhook Set Body:", await webhookRes.text());
    } catch (e) {
        console.error("Webhook Set Error:", e);
    }
}

testLogic();
