/**
 * Database Connection - Using Supabase Client
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Initialize Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY
);

// Test connection
async function testConnection() {
  try {
    const { data, error } = await supabase.from('venues').select('count').limit(1);
    if (error) throw error;
    console.log('✅ Connected to Supabase Database');
  } catch (err) {
    console.error('❌ Supabase connection error:', err.message);
  }
}

testConnection();

// Query helper that mimics pg Pool interface
const query = async (text, params) => {
  // This is a compatibility layer - convert SQL to Supabase queries
  console.warn('Direct SQL queries not supported with Supabase client. Use supabase.from() instead.');
  return { rows: [] };
};

module.exports = {
  query,
  supabase,
  testConnection
};
