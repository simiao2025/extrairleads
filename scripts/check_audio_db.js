const { neon } = require('@neondatabase/serverless');
require('dotenv').config();
const sql = neon(process.env.DATABASE_URL);
async function run() {
    const msgs = await sql`SELECT id, role, type, substring(audio_base64, 1, 100) as audio_preview, created_at FROM chat_history WHERE type = 'audio' AND role = 'user' ORDER BY created_at DESC LIMIT 2`;
    console.log(msgs);
}
run().catch(console.error);
