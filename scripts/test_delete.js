const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env') });

const url = process.env.EVOLUTION_API_URL;
const globalKey = process.env.EVOLUTION_GLOBAL_API_KEY;

async function run() {
    const testInstanceName = "test_uuid_inst";
    const token = "104cf47d-d795-4cb9-ab5d-7e06eb880ea4";

    try {
        console.log(`Logging out instance "${testInstanceName}"...`);
        const logoutRes = await fetch(`${url}/instance/logout/${testInstanceName}`, {
            method: 'DELETE',
            headers: { 'apikey': token }
        });
        console.log("Logout Status:", logoutRes.status);
        const logoutText = await logoutRes.text();
        console.log("Logout Response:", logoutText);

        console.log(`Deleting instance "${testInstanceName}"...`);
        const delRes = await fetch(`${url}/instance/delete/${testInstanceName}`, {
            method: 'DELETE',
            headers: { 'apikey': globalKey }
        });
        console.log("Delete Status:", delRes.status);
        const delText = await delRes.text();
        console.log("Delete Response:", delText);

    } catch (err) {
        console.error(err);
    }
}
run();
