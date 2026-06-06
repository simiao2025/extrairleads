const { neon } = require('@neondatabase/serverless');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env') });

const databaseUrl = process.env.DATABASE_URL;
const sql = neon(databaseUrl);

async function run() {
    try {
        const [user] = await sql`SELECT * FROM users WHERE email = 'simacjr@hotmail.com'`;
        const instanceName = user.whatsapp_instance_name;
        const savedToken = user.whatsapp_instance_token;
        const evolutionUrl = process.env.EVOLUTION_API_URL;

        console.log(`Saved Token in DB: ${savedToken}`);

        // 1. Try with saved token
        console.log("Fetching QR using saved token...");
        const resSaved = await fetch(`${evolutionUrl}/instance/qr`, {
            method: 'GET',
            headers: {
                apikey: savedToken,
                instance: instanceName
            }
        });
        console.log("Status with saved token:", resSaved.status);
        const textSaved = await resSaved.text();
        console.log("Response with saved token:", textSaved);

        // 2. Try with real token (which we saw in the previous log)
        const realToken = "331d14d06995876a8bf51ff9d8eb35f4b809f570210ba9eef22428e696ab0496";
        console.log(`\nFetching QR using real token (${realToken})...`);
        const resReal = await fetch(`${evolutionUrl}/instance/qr`, {
            method: 'GET',
            headers: {
                apikey: realToken,
                instance: instanceName
            }
        });
        console.log("Status with real token:", resReal.status);
        const textReal = await resReal.text();
        console.log("Response with real token (trimmed):", textReal.substring(0, 100) + "...");

    } catch (err) {
        console.error(err);
    }
}
run();
