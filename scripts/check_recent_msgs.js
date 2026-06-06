const { neon } = require('@neondatabase/serverless');
require('dotenv').config();
const sql = neon(process.env.DATABASE_URL);
async function run() {
    const msgs = await sql`SELECT id, role, type, substring(content, 1, 50) as content, audio_base64 IS NOT NULL as has_audio, created_at FROM chat_history ORDER BY created_at DESC LIMIT 10`;
    console.log(msgs);
}
run().catch(console.error);
