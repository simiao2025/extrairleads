const { drizzle } = require('drizzle-orm/neon-http');
const { neon } = require('@neondatabase/serverless');
const { sql } = require('drizzle-orm/sql');
const bcrypt = require('bcryptjs');

async function createAdmin() {
  const hash = await bcrypt.hash('admin123', 10);
  const client = neon(process.env.DATABASE_URL);
  const db = drizzle(client);
  
  await db.execute(
    sql`INSERT INTO users (email, name, password) 
        VALUES ('admin@extrairleads.com', 'Administrador', ${hash}) 
        ON CONFLICT (email) DO NOTHING`
  );
  
  console.log('✅ Usuário admin criado com sucesso!');
  console.log('📧 Email: admin@extrairleads.com');
  console.log('🔑 Senha: admin123');
}

createAdmin().catch(e => console.error('Erro:', e.message));
