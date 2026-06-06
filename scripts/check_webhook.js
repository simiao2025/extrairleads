const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env') });

const url = process.env.EVOLUTION_API_URL;
const globalKey = process.env.EVOLUTION_GLOBAL_API_KEY;

async function run() {
    try {
        const res = await fetch(`${url}/instance/all`, {
            method: 'GET',
            headers: { 'apikey': globalKey }
        });
        const json = await res.json();
        const list = json.data || [];
        console.log("=== Webhook configurations on server ===");
        list.forEach(inst => {
            console.log(`Instance: ${inst.name} | Webhook: "${inst.webhook}" | Connected: ${inst.connected}`);
        });
    } catch (err) {
        console.error(err);
    }
}
run();
