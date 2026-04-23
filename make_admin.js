
const { Client } = require('pg');
require('dotenv').config({ path: 'apps/api/.env' });

async function makeAdmin(email) {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    await client.connect();
    console.log(`Connecting to database...`);
    
    const res = await client.query(
      "UPDATE users SET roles = array_append(roles, 'ADMIN') WHERE email = $1 AND NOT ('ADMIN' = ANY(roles)) RETURNING id, roles",
      [email]
    );

    if (res.rowCount === 0) {
      console.log(`User with email ${email} not found or already an admin.`);
    } else {
      console.log(`Success! User ${email} is now an ADMIN.`);
      console.log('Updated User:', res.rows[0]);
    }
  } catch (err) {
    console.error('Error executing query', err.stack);
  } finally {
    await client.end();
  }
}

const email = process.argv[2];
if (!email) {
  console.log('Please provide an email: node make_admin.js user@example.com');
} else {
  makeAdmin(email);
}
