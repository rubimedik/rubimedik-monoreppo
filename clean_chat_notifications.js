const { Client } = require('pg');
require('dotenv').config({ path: 'apps/api/.env' });

async function cleanChatNotifications() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    await client.connect();
    console.log(`Connecting to database...`);
    
    // Delete all notifications of type 'CHAT_MESSAGE'
    const res = await client.query(
      "DELETE FROM notifications WHERE type = 'CHAT_MESSAGE' RETURNING id"
    );
    console.log(`Deleted ${res.rowCount} existing chat notifications from the database.`);
    
  } catch (err) {
    console.error('Error executing query', err.stack);
  } finally {
    await client.end();
  }
}

cleanChatNotifications();
