const { neon } = require('@neondatabase/serverless');
require('dotenv').config();
const sql = neon(process.env.DATABASE_URL);
async function run() {
    const msgs = await sql`SELECT audio_base64 FROM chat_history WHERE id = 123`;
    const b64 = msgs[0].audio_base64;
    console.log("Has newline?", b64.includes('\n') || b64.includes('\r'));
    console.log("Length:", b64.length);
}
run().catch(console.error);
