const { Client } = require('pg');
require('dotenv').config({ path: 'apps/api/.env' });

async function retroCreditAdmin() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    await client.connect();
    console.log(`Connecting to database...`);
    
    // 1. Find the admin user
    const adminRes = await client.query("SELECT u.id, w.id as wallet_id, u.email FROM users u JOIN wallets w ON w.\"userId\" = u.id WHERE u.roles::text LIKE '%ADMIN%' LIMIT 1");
    if (adminRes.rowCount === 0) {
        console.error("No admin found");
        return;
    }
    const admin = adminRes.rows[0];
    console.log(`Found Admin: ${admin.email}`);

    // 2. Find completed consultations where payout status is PAID
    const consRes = await client.query(`
        SELECT c.id, c."platformFee", c."specialistId"
        FROM consultations c 
        WHERE c."payoutStatus" = 'PAID'
    `);

    console.log(`Checking ${consRes.rowCount} consultations.`);

    for (const row of consRes.rows) {
        const fee = parseFloat(row.platformFee);
        const ref = `FEE-${row.id}`;
        
        // Check if admin already has this transaction
        const checkAdminTx = await client.query("SELECT 1 FROM transactions WHERE reference = $1 AND \"walletId\" = $2", [ref, admin.wallet_id]);
        
        if (checkAdminTx.rowCount === 0) {
            console.log(`Processing Consultation ${row.id}...`);

            // 1. Credit Admin Wallet
            await client.query("UPDATE wallets SET balance = balance + $1 WHERE id = $2", [fee, admin.wallet_id]);
            
            // 2. Create/Update Transaction for Admin
            const existingTx = await client.query("SELECT id FROM transactions WHERE reference = $1", [ref]);
            
            if (existingTx.rowCount > 0) {
                // Move it to admin
                await client.query("UPDATE transactions SET \"walletId\" = $1, metadata = $2 WHERE reference = $3", [
                    admin.wallet_id, 
                    JSON.stringify({ consultationId: row.id, note: 'Platform Fee Income (Transferred)', specialistId: row.specialistId }),
                    ref
                ]);
            } else {
                // Insert new
                await client.query(`
                    INSERT INTO transactions (id, type, amount, reference, status, metadata, "createdAt", "updatedAt", "walletId")
                    VALUES (gen_random_uuid(), 'PLATFORM_FEE', $1, $2, 'COMPLETED', $3, NOW(), NOW(), $4)
                `, [fee, ref, JSON.stringify({ consultationId: row.id, note: 'Platform Fee Income', specialistId: row.specialistId }), admin.wallet_id]);
            }
            
            console.log(`✅ Credited ₦${fee} to ${admin.email}`);
        } else {
            console.log(`⏭️ Consultation ${row.id} already credited to admin.`);
        }
    }

    console.log("Cleanup complete.");
  } catch (err) {
    console.error('Error executing query', err.stack);
  } finally {
    await client.end();
  }
}

retroCreditAdmin();
