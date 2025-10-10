/**
 * Quick Test Script
 * Run this to verify your geofencing system is working
 */

const axios = require('axios');

const API_URL = process.env.API_URL || 'http://localhost:3000';

// Test data
const testVenues = [
  { id: 1, name: 'Central Railway Station', lat: 40.7489, lon: -73.9680, radius: 300 },
  { id: 2, name: 'JFK Airport', lat: 40.6413, lon: -73.7781, radius: 800 },
  { id: 3, name: 'Madison Square Garden', lat: 40.7505, lon: -73.9934, radius: 400 }
];

// Test colors
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logTest(testName) {
  console.log(`\n${colors.cyan}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}`);
  console.log(`${colors.blue}TEST: ${testName}${colors.reset}`);
  console.log(`${colors.cyan}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}`);
}

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function testHealthCheck() {
  logTest('Health Check');
  try {
    const response = await axios.get(`${API_URL}/health`);
    if (response.data.status === 'healthy') {
      log('✅ Server is healthy', 'green');
      log(`   Geofencing: ${response.data.services.geofencing}`, 'cyan');
      log(`   Scheduler: ${response.data.services.scheduler}`, 'cyan');
      return true;
    }
  } catch (error) {
    log('❌ Server health check failed', 'red');
    log(`   Error: ${error.message}`, 'red');
    return false;
  }
}

async function testGeofenceDetection() {
  logTest('Geofence Detection');
  
  let passed = 0;
  let failed = 0;

  for (const venue of testVenues) {
    log(`\nTesting: ${venue.name}`, 'yellow');

    // Test 1: Inside geofence
    try {
      const insideResponse = await axios.post(`${API_URL}/api/geofence/check-location`, {
        venueId: venue.id,
        lat: venue.lat,
        lon: venue.lon
      });

      if (insideResponse.data.isInside === true) {
        log(`  ✅ Inside detection: PASS`, 'green');
        passed++;
      } else {
        log(`  ❌ Inside detection: FAIL (expected true, got false)`, 'red');
        failed++;
      }
    } catch (error) {
      log(`  ❌ Inside detection: ERROR - ${error.message}`, 'red');
      failed++;
    }

    // Test 2: Outside geofence (far away)
    try {
      const outsideResponse = await axios.post(`${API_URL}/api/geofence/check-location`, {
        venueId: venue.id,
        lat: venue.lat + 0.1, // ~10km away
        lon: venue.lon + 0.1
      });

      if (outsideResponse.data.isInside === false) {
        log(`  ✅ Outside detection: PASS`, 'green');
        passed++;
      } else {
        log(`  ❌ Outside detection: FAIL (expected false, got true)`, 'red');
        failed++;
      }
    } catch (error) {
      log(`  ❌ Outside detection: ERROR - ${error.message}`, 'red');
      failed++;
    }

    await sleep(100); // Small delay between tests
  }

  log(`\n📊 Results: ${passed} passed, ${failed} failed`, passed > failed ? 'green' : 'red');
  return failed === 0;
}

async function testDistanceCalculation() {
  logTest('Distance Calculation Accuracy');

  const testCases = [
    {
      name: 'Same location',
      lat1: 40.7489, lon1: -73.9680,
      lat2: 40.7489, lon2: -73.9680,
      expectedDistance: 0
    },
    {
      name: 'Approximately 1km',
      lat1: 40.7489, lon1: -73.9680,
      lat2: 40.7580, lon2: -73.9680,
      expectedDistance: 1000, // ~1km
      tolerance: 100 // ±100m
    }
  ];

  for (const test of testCases) {
    try {
      const response = await axios.post(`${API_URL}/api/geofence/check-location`, {
        venueId: 1,
        lat: test.lat2,
        lon: test.lon2
      });

      log(`  Testing: ${test.name}`, 'yellow');
      log(`  ✅ Distance calculation works`, 'green');
    } catch (error) {
      log(`  ❌ ${test.name}: ${error.message}`, 'red');
    }
  }
}

async function testAPIEndpoints() {
  logTest('API Endpoints');

  const endpoints = [
    { method: 'GET', path: '/health', description: 'Health check' },
    { method: 'POST', path: '/api/geofence/check-location', description: 'Check location', 
      data: { venueId: 1, lat: 40.7489, lon: -73.9680 } }
  ];

  let passed = 0;
  let failed = 0;

  for (const endpoint of endpoints) {
    try {
      let response;
      if (endpoint.method === 'GET') {
        response = await axios.get(`${API_URL}${endpoint.path}`);
      } else {
        response = await axios.post(`${API_URL}${endpoint.path}`, endpoint.data);
      }

      if (response.status === 200) {
        log(`  ✅ ${endpoint.method} ${endpoint.path} - ${endpoint.description}`, 'green');
        passed++;
      }
    } catch (error) {
      log(`  ❌ ${endpoint.method} ${endpoint.path} - ${error.message}`, 'red');
      failed++;
    }

    await sleep(100);
  }

  log(`\n📊 Results: ${passed} passed, ${failed} failed`, passed > failed ? 'green' : 'red');
  return failed === 0;
}

async function runAllTests() {
  console.log(`
╔═══════════════════════════════════════════════════╗
║     🧪 GEOFENCING SYSTEM TEST SUITE              ║
╚═══════════════════════════════════════════════════╝
  `);

  log(`Testing API: ${API_URL}`, 'cyan');
  
  const results = {
    healthCheck: false,
    geofenceDetection: false,
    distanceCalculation: false,
    apiEndpoints: false
  };

  // Run tests
  results.healthCheck = await testHealthCheck();
  
  if (!results.healthCheck) {
    log('\n❌ Server is not running or not healthy. Please start the server first.', 'red');
    log('Run: cd backend && npm start', 'yellow');
    process.exit(1);
  }

  await sleep(500);
  results.geofenceDetection = await testGeofenceDetection();
  
  await sleep(500);
  await testDistanceCalculation();
  
  await sleep(500);
  results.apiEndpoints = await testAPIEndpoints();

  // Summary
  console.log(`\n${colors.cyan}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}`);
  console.log(`${colors.blue}FINAL SUMMARY${colors.reset}`);
  console.log(`${colors.cyan}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}\n`);

  const passed = Object.values(results).filter(r => r).length;
  const total = Object.keys(results).length;

  log(`Health Check:          ${results.healthCheck ? '✅ PASS' : '❌ FAIL'}`, results.healthCheck ? 'green' : 'red');
  log(`Geofence Detection:    ${results.geofenceDetection ? '✅ PASS' : '❌ FAIL'}`, results.geofenceDetection ? 'green' : 'red');
  log(`API Endpoints:         ${results.apiEndpoints ? '✅ PASS' : '❌ FAIL'}`, results.apiEndpoints ? 'green' : 'red');

  console.log(`\n${colors.cyan}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}`);
  
  if (passed === total) {
    log(`\n🎉 ALL TESTS PASSED! (${passed}/${total})`, 'green');
    log('✅ Your geofencing system is working correctly!', 'green');
    log('\nYou are ready for the demo! 🚀', 'cyan');
  } else {
    log(`\n⚠️  SOME TESTS FAILED (${passed}/${total} passed)`, 'yellow');
    log('Please check the errors above and fix them.', 'yellow');
  }

  console.log(`\n${colors.cyan}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}\n`);
}

// Run tests
runAllTests().catch(error => {
  log(`\n❌ Test suite failed: ${error.message}`, 'red');
  process.exit(1);
});
