const dotenv = require('dotenv');
const path = require('path');
const crypto = require('crypto');

dotenv.config({ path: path.join(__dirname, '../.env') });

const url = process.env.EVOLUTION_API_URL;
const globalKey = process.env.EVOLUTION_GLOBAL_API_KEY;

async function run() {
    const testInstanceName = "test_uuid_inst";
    const testUuidToken = crypto.randomUUID();

    try {
        console.log(`Sending POST to create instance "${testInstanceName}" with token: ${testUuidToken}`);
        const res = await fetch(`${url}/instance/create`, {
            method: 'POST',
            headers: {
                'apikey': globalKey,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                instanceName: testInstanceName,
                name: testInstanceName,
                token: testUuidToken,
                qrcode: true,
                integration: 'WHATSAPP-BAILEYS'
            })
        });

        console.log("Create Status:", res.status);
        const data = await res.json();
        console.log("Create Response JSON:", JSON.stringify(data, null, 2));

        // Clean up test instance
        console.log(`Deleting test instance "${testInstanceName}"...`);
        const delRes = await fetch(`${url}/instance/delete/${testInstanceName}`, {
            method: 'DELETE',
            headers: { 'apikey': globalKey }
        });
        console.log("Delete Status:", delRes.status);

    } catch (err) {
        console.error(err);
    }
}
run();
