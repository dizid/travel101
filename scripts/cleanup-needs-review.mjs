import { neon } from '@neondatabase/serverless';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: resolve(__dirname, '../.env') });
dotenv.config({ path: resolve(__dirname, '../.env.local') });

const sql = neon(process.env.DATABASE_URL);

async function cleanup() {
  // Approve all remaining needs_review places (they're all legitimate)
  console.log('Approving all remaining needs_review places...');
  const approved = await sql`
    UPDATE attractions
    SET verification_status = 'human_verified'
    WHERE verification_status = 'needs_review'
    RETURNING name
  `;
  console.log('Approved:', approved.length, 'places');
  for (const row of approved) {
    console.log('  -', row.name);
  }

  console.log('\nFinal counts...');
  const counts = await sql`
    SELECT verification_status, COUNT(*) as count
    FROM attractions
    GROUP BY verification_status
    ORDER BY count DESC
  `;
  console.log('\nStatus breakdown:');
  for (const row of counts) {
    console.log('  ' + row.verification_status + ': ' + row.count);
  }
}

cleanup().catch(console.error);
