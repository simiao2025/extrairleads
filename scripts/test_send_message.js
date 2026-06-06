const dotenv = require('dotenv');
const path = require('path');
dotenv.config({ path: path.join(__dirname, '../.env') });

const evolutionUrl = process.env.EVOLUTION_API_URL;
const globalKey = process.env.EVOLUTION_GLOBAL_API_KEY;
const instanceName = "arno31"; // Use an existing instance to test sending

async function testSend(endpoint, payload) {
    console.log(`\nTesting endpoint: ${endpoint}`);
    const res = await fetch(`${evolutionUrl}${endpoint}`, {
        method: "POST",
        headers: {
            apikey: globalKey,
            "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
    });
    
    console.log(`Status: ${res.status}`);
    const text = await res.text();
    console.log(`Body: ${text.substring(0, 100)}`);
}

async function run() {
    // 1. Current whatsapp.ts logic
    await testSend(`/send/text`, {
        instance: instanceName,
        number: "5511999999999",
        text: "Test 1",
        delay: 1200
    });

    // 2. Standard Evolution API endpoint
    await testSend(`/message/sendText/${instanceName}`, {
        number: "5511999999999",
        text: "Test 2",
        delay: 1200
    });
}
run();
