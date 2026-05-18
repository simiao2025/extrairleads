import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from '../src/db/schema';
import * as dotenv from 'dotenv';
import { sql } from 'drizzle-orm';

dotenv.config();

const client = neon(process.env.DATABASE_URL!);
const db = drizzle(client, { schema });

async function main() {
  console.log('Iniciando limpeza de dados mocados no banco de dados Neon...');
  
  try {
    // Excluir registros das tabelas dependentes primeiro
    console.log('Limpando chat_history...');
    await db.delete(schema.chatHistory);
    
    console.log('Limpando appointments...');
    await db.delete(schema.appointments);
    
    console.log('Limpando outreach_logs...');
    await db.delete(schema.outreachLogs);

    // Excluir registros da tabela principal de leads
    // Vamos deletar os leads específicos gerados pelos testes de mock
    console.log('Limpando leads mocados...');
    await db.execute(sql`DELETE FROM leads WHERE name LIKE '%do João' OR name LIKE '%& Cia' OR name LIKE '%Express'`);
    
    // Opcional: Para uma limpeza total, descomente a linha abaixo
    // await db.delete(schema.leads);

    console.log('Limpeza concluída com sucesso! Banco pronto para dados 100% reais.');
  } catch (error) {
    console.error('Erro durante a limpeza:', error);
  }
}

main();
