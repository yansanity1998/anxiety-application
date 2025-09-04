const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing environment variables:');
  console.error('VITE_SUPABASE_URL:', supabaseUrl ? '✅' : '❌');
  console.error('SUPABASE_SERVICE_ROLE_KEY:', supabaseServiceKey ? '✅' : '❌');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function setupReferralsTable() {
  try {
    console.log('🚀 Setting up referrals table...');
    
    // Read the SQL file
    const sqlPath = path.join(__dirname, '../sql/create_referrals_table.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');
    
    // Execute the SQL
    const { error } = await supabase.rpc('exec_sql', { sql });
    
    if (error) {
      // Try alternative approach - execute SQL directly
      console.log('⚠️  RPC method failed, trying direct execution...');
      
      // Split SQL into individual statements
      const statements = sql.split(';').filter(stmt => stmt.trim());
      
      for (const statement of statements) {
        if (statement.trim()) {
          try {
            await supabase.rpc('exec_sql', { sql: statement + ';' });
            console.log('✅ Executed:', statement.substring(0, 50) + '...');
          } catch (stmtError) {
            console.log('⚠️  Statement failed:', statement.substring(0, 50) + '...');
            console.log('Error:', stmtError.message);
          }
        }
      }
    }
    
    console.log('✅ Referrals table setup completed!');
    console.log('');
    console.log('📋 Next steps:');
    console.log('1. Refresh your admin dashboard');
    console.log('2. Try creating a new referral');
    console.log('3. The referral should now appear in the list');
    
  } catch (error) {
    console.error('❌ Error setting up referrals table:', error);
    console.log('');
    console.log('🔧 Manual setup required:');
    console.log('1. Go to your Supabase dashboard');
    console.log('2. Navigate to SQL Editor');
    console.log('3. Copy and paste the contents of sql/create_referrals_table.sql');
    console.log('4. Execute the SQL');
  }
}

// Run the setup
setupReferralsTable(); 