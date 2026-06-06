const { neon } = require('@neondatabase/serverless');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env') });

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
    console.error("DATABASE_URL is not set in env");
    process.exit(1);
}

const sql = neon(databaseUrl);

async function run() {
    try {
        console.log("=== Querying users table ===");
        const result = await sql`SELECT id, name, email, cpf_cnpj, whatsapp_instance_name, whatsapp_instance_token, whatsapp_provider FROM users`;
        console.log("Users in database:");
        console.log(JSON.stringify(result, null, 2));
    } catch (err) {
        console.error("Error querying db:", err);
    }
}

run();
