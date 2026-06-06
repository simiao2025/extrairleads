const { neon } = require('@neondatabase/serverless');
require('dotenv').config();
const sql = neon(process.env.DATABASE_URL);
async function run() {
    console.log("Atualizando prefixos de mime type mp3 para ogg no DB...");
    const res = await sql`
        UPDATE chat_history 
        SET audio_base64 = replace(audio_base64, 'data:audio/mp3;base64,', 'data:audio/ogg;base64,')
        WHERE type = 'audio' AND audio_base64 LIKE 'data:audio/mp3;base64,%'
    `;
    console.log("Linhas afetadas:", res.length || "Desconhecido (depende do retorno do neon)");
}
run().catch(console.error);
