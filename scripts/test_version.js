const dotenv = require('dotenv');
const path = require('path');
dotenv.config({ path: path.join(__dirname, '../.env') });

const evolutionUrl = process.env.EVOLUTION_API_URL;

async function checkVersion() {
    const res = await fetch(`${evolutionUrl}`);
    console.log(`Status: ${res.status}`);
    console.log(`Body:`, await res.text());
}
checkVersion();
