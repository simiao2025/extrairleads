const { neon } = require('@neondatabase/serverless');
require('dotenv').config();
const sql = neon(process.env.DATABASE_URL);
async function run() {
    console.log("Adicionando codecs=opus ao audio_base64...");
    const res = await sql`
        UPDATE chat_history 
        SET audio_base64 = replace(audio_base64, 'data:audio/ogg;base64,', 'data:audio/ogg; codecs=opus;base64,')
        WHERE type = 'audio' AND audio_base64 LIKE 'data:audio/ogg;base64,%'
    `;
    console.log("Linhas afetadas:", res.length || "Desconhecido");
}
run().catch(console.error);
