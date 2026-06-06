const { neon } = require('@neondatabase/serverless');
require('dotenv').config();
const sql = neon(process.env.DATABASE_URL);
async function run() {
    const msgs = await sql`SELECT id, lead_id, role, type, substring(content, 1, 50) as content, length(audio_base64) as audio_len, created_at FROM chat_history WHERE role = 'user' AND type = 'audio' ORDER BY created_at DESC LIMIT 5`;
    console.log(msgs);
}
run().catch(console.error);
