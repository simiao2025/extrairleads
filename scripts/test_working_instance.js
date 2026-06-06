const dotenv = require('dotenv');
const path = require('path');
dotenv.config({ path: path.join(__dirname, '../.env') });

const evolutionUrl = process.env.EVOLUTION_API_URL;
const globalKey = process.env.EVOLUTION_GLOBAL_API_KEY;
const instanceName = "66228253000125";

async function checkInstance() {
    console.log(`Checking instance ${instanceName}`);
    const allRes = await fetch(`${evolutionUrl}/instance/all`, {
        method: 'GET',
        headers: { 'apikey': globalKey }
    });
    const allData = await allRes.json();
    const inst = allData.data?.find(i => i.name === instanceName);
    console.log(`Instance Details:`, JSON.stringify(inst, null, 2));
}
checkInstance();
