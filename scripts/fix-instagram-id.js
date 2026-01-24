/**
 * Script to fetch and update the real Instagram Business Account ID
 * This bypasses the Live mode restriction by using the Graph API Explorer approach
 */

import pg from 'pg';
const { Pool } = pg;

// Database connection
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function fixInstagramID() {
    try {
        // 1. Get the current Instagram account from DB
        const result = await pool.query(
            'SELECT user_id, access_token, meta FROM user_social_accounts WHERE provider = $1',
            ['instagram']
        );

        if (result.rows.length === 0) {
            console.log('❌ No Instagram account found in database');
            return;
        }

        const account = result.rows[0];
        const accessToken = account.access_token;
        const pageId = account.meta?.page_id;

        console.log('📱 Found Instagram account for user:', account.user_id);
        console.log('📄 Page ID:', pageId);

        // 2. Fetch the real Instagram Business Account ID from Facebook
        const apiUrl = `https://graph.facebook.com/v19.0/${pageId}?fields=instagram_business_account&access_token=${accessToken}`;

        console.log('🔍 Fetching real Instagram ID from Meta API...');
        const response = await fetch(apiUrl);
        const data = await response.json();

        if (data.error) {
            console.log('❌ Meta API Error:', data.error.message);
            console.log('\n📋 Manual Steps:');
            console.log('1. Go to: https://developers.facebook.com/tools/explorer/');
            console.log('2. Paste this access token:', accessToken);
            console.log(`3. Query: ${pageId}?fields=instagram_business_account`);
            console.log('4. Copy the instagram_business_account.id value');
            console.log('5. Run this SQL:');
            console.log(`   UPDATE user_social_accounts SET meta = jsonb_set(meta, '{ig_id}', '"YOUR_IG_ID"') WHERE provider = 'instagram';`);
            return;
        }

        const realIgId = data.instagram_business_account?.id;

        if (!realIgId) {
            console.log('❌ No Instagram Business Account linked to this Facebook Page');
            console.log('   Please link your Instagram account in Facebook Page Settings');
            return;
        }

        console.log('✅ Real Instagram Business Account ID:', realIgId);

        // 3. Update the database
        await pool.query(
            `UPDATE user_social_accounts 
       SET meta = jsonb_set(COALESCE(meta, '{}'::jsonb), '{ig_id}', $1::jsonb)
       WHERE provider = 'instagram'`,
            [`"${realIgId}"`]
        );

        console.log('✅ Database updated successfully!');
        console.log('🎉 Instagram posting should now work!');

    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        await pool.end();
    }
}

fixInstagramID();
