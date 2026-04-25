const { Client } = require('pg');
require('dotenv').config({ path: 'apps/api/.env' });

async function fixStuckPayouts() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    await client.connect();
    console.log(`Connecting to database...`);
    
    // Find consultations held specifically due to missing feedback but that now have feedback
    const res = await client.query(`
        UPDATE consultations 
        SET "payoutStatus" = 'PENDING', 
            "payoutNote" = 'Feedback received. Flag cleared retroactively.'
        WHERE "payoutStatus" = 'HELD' 
        AND "patientFeedback" IS NOT NULL 
        AND ("payoutNote" LIKE '%feedback%' OR "payoutNote" LIKE '%review%')
        RETURNING id
    `);

    console.log(`Fixed ${res.rowCount} stuck payouts where feedback was recently submitted.`);

    if (res.rowCount > 0) {
        console.log("IDs fixed:", res.rows.map(r => r.id));
    }

  } catch (err) {
    console.error('Error executing query', err.stack);
  } finally {
    await client.end();
  }
}

fixStuckPayouts();
