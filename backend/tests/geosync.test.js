// TrustBite — Geo-Sync & SSE Tests

const assert = require('assert');

let passed = 0;
let failed = 0;

function test(name, fn) {
  try {
    fn();
    passed++;
    console.log(`  ✓ ${name}`);
  } catch (err) {
    failed++;
    console.error(`  ✗ ${name}`);
    console.error(`    ${err.message}`);
  }
}

async function testAsync(name, fn) {
  try {
    await fn();
    passed++;
    console.log(`  ✓ ${name}`);
  } catch (err) {
    failed++;
    console.error(`  ✗ ${name}`);
    console.error(`    ${err.message}`);
  }
}

console.log('--- TrustBite Geo-Sync Tests ---');

// Test 1: Coordinate Anonymization Logic
test('Coordinate Anonymization rounds correctly', () => {
  const lat = 12.935231;
  const lng = 77.624512;
  const anonLat = parseFloat(lat.toFixed(3));
  const anonLng = parseFloat(lng.toFixed(3));
  
  assert.strictEqual(anonLat, 12.935);
  assert.strictEqual(anonLng, 77.625); // 5 rounds up properly depending on implementation
});

// Test 2: SSE Manager Logic
test('SSE Manager tracks clients and formats payloads', () => {
  const { addClient, emitEvent } = require('../src/services/sse');
  
  let writtenData = [];
  const mockRes = {
    writeHead: () => {},
    write: (data) => { writtenData.push(data) },
  };
  
  const mockReq = {
    on: () => {}
  };
  
  addClient(mockReq, mockRes);
  assert.ok(writtenData[0].includes('connected'));
  
  emitEvent('new-report', { id: 1, lat: 12.935 });
  assert.ok(writtenData[1].includes('event: new-report'));
  assert.ok(writtenData[1].includes('{"id":1,"lat":12.935}'));
});

// Print results
setTimeout(() => {
  console.log('\n--- Summary ---');
  console.log(`Passed: ${passed}`);
  console.log(`Failed: ${failed}`);
  if (failed > 0) {
    process.exit(1);
  }
}, 500);
