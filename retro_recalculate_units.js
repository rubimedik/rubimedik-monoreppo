const { Client } = require('pg');

async function run() {
  const client = new Client({
    connectionString: "postgresql://postgres:postgres@localhost:5433/rudimedik"
  });

  try {
    await client.connect();
    console.log('Connected to database');

    // 1. Fetch all hospitals
    const hospitalsRes = await client.query('SELECT "id", "userId" FROM hospital_profiles');
    const hospitals = hospitalsRes.rows;

    for (const hospital of hospitals) {
      console.log(`Processing hospital: ${hospital.id} (User: ${hospital.userId})`);

      // 2. Sum up units from completed donation matches for this hospital's requests
      const matchesRes = await client.query(`
        SELECT SUM(COALESCE(dm.units, 1)) as total_units
        FROM donation_matches dm
        INNER JOIN blood_requests br ON dm."requestId" = br.id
        WHERE br."hospitalId" = $1 AND dm.status = 'COMPLETED'
      `, [hospital.userId]);

      const totalUnits = parseInt(matchesRes.rows[0].total_units || 0);
      const reservedUnits = Math.floor(totalUnits / 5) * 2;

      console.log(`Total units: ${totalUnits}, Reserved: ${reservedUnits}`);

      // 3. Update the hospital profile
      await client.query(`
        UPDATE hospital_profiles 
        SET "unitsReceived" = $1, "reservedUnits" = $2 
        WHERE id = $3
      `, [totalUnits, reservedUnits, hospital.id]);
    }

    console.log('Finished recalculating units for all hospitals');
  } catch (err) {
    console.error('Error:', err);
  } finally {
    await client.end();
  }
}

run();
