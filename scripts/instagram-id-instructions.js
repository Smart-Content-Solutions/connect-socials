/**
 * Simple script to get the real Instagram Business Account ID
 * Run this and follow the instructions
 */

console.log('🔧 Instagram ID Fixer\n');
console.log('Follow these steps:\n');
console.log('1️⃣  Go to your database and run:');
console.log('   SELECT access_token, meta FROM user_social_accounts WHERE provider = \'instagram\';\n');
console.log('2️⃣  Copy the access_token value\n');
console.log('3️⃣  Copy the page_id from the meta column\n');
console.log('4️⃣  Open this URL in your browser (replace PAGE_ID and ACCESS_TOKEN):');
console.log('   https://graph.facebook.com/v19.0/PAGE_ID?fields=instagram_business_account&access_token=ACCESS_TOKEN\n');
console.log('5️⃣  You will see JSON like: {"instagram_business_account":{"id":"12345678901234567"}}\n');
console.log('6️⃣  Copy the ID number\n');
console.log('7️⃣  Run this SQL in your database (replace YOUR_REAL_IG_ID):');
console.log('   UPDATE user_social_accounts');
console.log('   SET meta = jsonb_set(COALESCE(meta, \'{}\'), \'{ig_id}\', \'"YOUR_REAL_IG_ID"\')');
console.log('   WHERE provider = \'instagram\';\n');
console.log('8️⃣  Verify with:');
console.log('   SELECT meta FROM user_social_accounts WHERE provider = \'instagram\';\n');
console.log('✅ After this, your Instagram posting will work!\n');
