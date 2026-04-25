const { Client } = require('pg');
require('dotenv').config({ path: 'apps/api/.env' });

async function fixConsultations() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    await client.connect();
    console.log(`Connecting to database...`);
    
    // Fix 1: Restore ARCHIVED consultations to COMPLETED if they are PAID
    const res1 = await client.query(
      "UPDATE consultations SET status = 'COMPLETED' WHERE status = 'ARCHIVED' AND \"payoutStatus\" = 'PAID' RETURNING id"
    );
    console.log(`Fixed ${res1.rowCount} consultations that were stuck in ARCHIVED status.`);

    // Fix 2: (Optional) If you want to force process payouts for consultations that have feedback but are stuck
    // This is safer to do via the scheduler, but we can check them here.
  } catch (err) {
    console.error('Error executing query', err.stack);
  } finally {
    await client.end();
  }
}

fixConsultations();
