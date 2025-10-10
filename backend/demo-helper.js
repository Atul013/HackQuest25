/**
 * Demo Helper Script
 * Quick commands to set up and demo your geofencing system
 */

const { Client } = require('pg');
const redis = require('redis');

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

async function checkPostgreSQL() {
  log('\n📊 Checking PostgreSQL...', 'cyan');
  try {
    const client = new Client({
      connectionString: process.env.DATABASE_URL || 'postgresql://postgres:password@localhost:5432/publicalert'
    });
    
    await client.connect();
    
    // Check venues
    const venuesResult = await client.query('SELECT COUNT(*) FROM venues');
    log(`  ✅ Database connected`, 'green');
    log(`  📍 Venues in database: ${venuesResult.rows[0].count}`, 'cyan');
    
    // Check subscriptions
    const subsResult = await client.query('SELECT COUNT(*) FROM subscriptions WHERE active = true');
    log(`  👥 Active subscriptions: ${subsResult.rows[0].count}`, 'cyan');
    
    // Check PostGIS
    const postgisResult = await client.query('SELECT PostGIS_Version()');
    log(`  🗺️  PostGIS version: ${postgisResult.rows[0].postgis_version.split(' ')[0]}`, 'cyan');
    
    await client.end();
    return true;
  } catch (error) {
    log(`  ❌ PostgreSQL error: ${error.message}`, 'red');
    return false;
  }
}

async function checkRedis() {
  log('\n💾 Checking Redis...', 'cyan');
  try {
    const client = redis.createClient({
      url: process.env.REDIS_URL || 'redis://localhost:6379'
    });
    
    await client.connect();
    const pong = await client.ping();
    
    if (pong === 'PONG') {
      log(`  ✅ Redis connected`, 'green');
      
      // Check cached data
      const keys = await client.keys('*');
      log(`  🔑 Cached keys: ${keys.length}`, 'cyan');
    }
    
    await client.quit();
    return true;
  } catch (error) {
    log(`  ❌ Redis error: ${error.message}`, 'red');
    return false;
  }
}

async function showVenueInfo() {
  log('\n📍 Sample Venues for Testing:', 'cyan');
  
  try {
    const client = new Client({
      connectionString: process.env.DATABASE_URL || 'postgresql://postgres:password@localhost:5432/publicalert'
    });
    
    await client.connect();
    
    const result = await client.query(`
      SELECT id, name, latitude, longitude, geofence_radius, type
      FROM venues
      ORDER BY id
    `);
    
    console.log('\n┌─────┬──────────────────────────┬────────────┬─────────────┬────────┐');
    console.log('│ ID  │ Name                     │ Latitude   │ Longitude   │ Radius │');
    console.log('├─────┼──────────────────────────┼────────────┼─────────────┼────────┤');
    
    result.rows.forEach(venue => {
      console.log(
        `│ ${venue.id.toString().padEnd(3)} │ ${venue.name.padEnd(24)} │ ` +
        `${venue.latitude.toFixed(4).padEnd(10)} │ ${venue.longitude.toFixed(4).padEnd(11)} │ ` +
        `${venue.geofence_radius.toString().padEnd(6)} │`
      );
    });
    
    console.log('└─────┴──────────────────────────┴────────────┴─────────────┴────────┘\n');
    
    await client.end();
  } catch (error) {
    log(`  ❌ Error: ${error.message}`, 'red');
  }
}

async function showTestLocations() {
  log('\n🧪 Test Locations for GPS Spoofing:', 'cyan');
  log('\nVenue 1: Central Railway Station (300m radius)', 'yellow');
  log('  Inside:  40.7489, -73.9680', 'green');
  log('  Outside: 40.7520, -73.9680', 'red');
  
  log('\nVenue 2: JFK Airport (800m radius)', 'yellow');
  log('  Inside:  40.6413, -73.7781', 'green');
  log('  Outside: 40.6500, -73.7781', 'red');
  
  log('\nVenue 3: Madison Square Garden (400m radius)', 'yellow');
  log('  Inside:  40.7505, -73.9934', 'green');
  log('  Outside: 40.7550, -73.9934', 'red');
}

async function showCurlCommands() {
  log('\n📡 Quick Test Commands:', 'cyan');
  
  log('\n1. Health Check:', 'yellow');
  log('curl http://localhost:3000/health', 'green');
  
  log('\n2. Check Inside Geofence:', 'yellow');
  log(`curl -X POST http://localhost:3000/api/geofence/check-location \\
  -H "Content-Type: application/json" \\
  -d '{"venueId": 1, "lat": 40.7489, "lon": -73.9680}'`, 'green');
  
  log('\n3. Check Outside Geofence:', 'yellow');
  log(`curl -X POST http://localhost:3000/api/geofence/check-location \\
  -H "Content-Type: application/json" \\
  -d '{"venueId": 1, "lat": 40.7520, "lon": -73.9680}'`, 'green');
}

async function showDatabaseQueries() {
  log('\n💾 Useful Database Queries:', 'cyan');
  
  log('\n1. View all venues:', 'yellow');
  log('SELECT id, name, latitude, longitude, geofence_radius FROM venues;', 'green');
  
  log('\n2. View active subscriptions:', 'yellow');
  log(`SELECT u.device_id, v.name, s.subscribed_at, s.last_seen_at 
FROM subscriptions s 
JOIN users u ON s.user_id = u.id 
JOIN venues v ON s.venue_id = v.id 
WHERE s.active = true;`, 'green');
  
  log('\n3. Test geofence function:', 'yellow');
  log('SELECT is_inside_venue_geofence(1, 40.7489, -73.9680);', 'green');
  
  log('\n4. Find nearby venues:', 'yellow');
  log('SELECT * FROM find_nearby_venues(40.7489, -73.9680, 1000);', 'green');
}

async function runDemoChecks() {
  console.log(`
╔═══════════════════════════════════════════════════╗
║     🎬 DEMO HELPER - System Status Check         ║
╚═══════════════════════════════════════════════════╝
  `);

  log('Running pre-demo checks...', 'cyan');

  const dbOk = await checkPostgreSQL();
  const redisOk = await checkRedis();

  if (dbOk) {
    await showVenueInfo();
  }

  await showTestLocations();
  await showCurlCommands();
  await showDatabaseQueries();

  // Final summary
  console.log(`\n${colors.cyan}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}`);
  log('\n📋 DEMO READINESS CHECKLIST:', 'cyan');
  console.log(`${colors.cyan}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}\n`);

  log(`PostgreSQL:  ${dbOk ? '✅ Ready' : '❌ Not Ready'}`, dbOk ? 'green' : 'red');
  log(`Redis:       ${redisOk ? '✅ Ready' : '❌ Not Ready'}`, redisOk ? 'green' : 'red');

  if (dbOk && redisOk) {
    log('\n🎉 System is ready for demo!', 'green');
    log('\nNext steps:', 'cyan');
    log('1. Start backend: cd backend && npm start', 'yellow');
    log('2. Open frontend in browser', 'yellow');
    log('3. Grant location permission', 'yellow');
    log('4. Use Chrome DevTools to spoof GPS', 'yellow');
    log('5. Run test script: node backend/test-geofencing.js', 'yellow');
  } else {
    log('\n⚠️  System is NOT ready for demo', 'red');
    log('\nFix these issues:', 'yellow');
    if (!dbOk) log('- Start PostgreSQL and run schema.sql', 'red');
    if (!redisOk) log('- Start Redis server', 'red');
  }

  console.log(`\n${colors.cyan}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}\n`);
}

// Run demo checks
runDemoChecks().catch(error => {
  log(`\n❌ Demo helper failed: ${error.message}`, 'red');
  process.exit(1);
});
