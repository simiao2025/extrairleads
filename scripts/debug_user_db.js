const dotenv = require('dotenv');
const path = require('path');
dotenv.config({ path: path.join(__dirname, '../.env') });

const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

async function checkUserDb() {
    const client = await pool.connect();
    try {
        // Find users with whatsappInstanceName containing 96187
        const res = await client.query(
            `SELECT id, name, email, "cpfCnpj", "whatsappInstanceName", "whatsappInstanceToken", "whatsappProvider" 
             FROM users 
             WHERE "whatsappInstanceName" LIKE '%96187%' OR "cpfCnpj" LIKE '%96187%'`
        );
        
        if (res.rows.length === 0) {
            console.log("No user found with 96187 in instanceName or cpfCnpj");
            
            // List all users with their instance info
            const allRes = await client.query(
                `SELECT id, name, email, "cpfCnpj", "whatsappInstanceName", 
                        LEFT("whatsappInstanceToken", 20) as token_prefix, "whatsappProvider" 
                 FROM users ORDER BY id`
            );
            console.log("\nAll users:");
            allRes.rows.forEach(u => {
                console.log(`  id=${u.id} | email=${u.email} | cpf=${u.cpfCnpj} | instance=${u.whatsappInstanceName} | token_prefix=${u.token_prefix} | provider=${u.whatsappProvider}`);
            });
        } else {
            console.log("Found users matching 96187:");
            res.rows.forEach(u => {
                console.log(`  id=${u.id}`);
                console.log(`  name=${u.name}`);
                console.log(`  email=${u.email}`);
                console.log(`  cpfCnpj=${u.cpfCnpj}`);
                console.log(`  whatsappInstanceName=${u.whatsappInstanceName}`);
                console.log(`  whatsappInstanceToken=${u.whatsappInstanceToken}`);
                console.log(`  whatsappProvider=${u.whatsappProvider}`);
                console.log(`  ---`);
            });
        }
    } finally {
        client.release();
        await pool.end();
    }
}

checkUserDb().catch(e => console.error("Fatal:", e));
