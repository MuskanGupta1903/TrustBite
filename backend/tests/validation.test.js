// TrustBite — Backend Validation Tests
// Tests the input validation, community intelligence, and risk engine logic

require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });

const { validateInput, computeImageHash, validateFileType, SCREENING_STATUSES } = require('../src/services/inputValidator');
const { synthesizeRisk } = require('../src/services/riskEngine');

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

function assertEqual(actual, expected, msg = '') {
  if (actual !== expected) {
    throw new Error(`Expected "${expected}" but got "${actual}" ${msg}`);
  }
}

function assertNotEqual(actual, notExpected, msg = '') {
  if (actual === notExpected) {
    throw new Error(`Should NOT be "${notExpected}" ${msg}`);
  }
}

function assertTrue(value, msg = '') {
  if (!value) {
    throw new Error(`Expected truthy value ${msg}`);
  }
}

// ─── INPUT VALIDATION TESTS ───
console.log('\n=== Input Validation Tests ===\n');

test('NON_FOOD: certificate should be rejected', () => {
  const geminiResult = {
    foodStatus: 'NON_FOOD',
    detectedCategory: 'NON_FOOD',
    detectedItem: 'Certificate',
    screeningStatus: 'NON_FOOD',
    imageQuality: { status: 'GOOD', issues: [] },
  };
  const result = validateInput(geminiResult, 'dairy', '');
  assertEqual(result.inputStatus, 'NON_FOOD');
  assertNotEqual(result.screeningStatus, 'NO_OBVIOUS_VISUAL_CONCERN', 'Non-food must NOT be marked as no concern');
});

test('NON_FOOD: laptop should be rejected', () => {
  const geminiResult = {
    foodStatus: 'NON_FOOD',
    detectedCategory: 'NON_FOOD',
    detectedItem: 'Laptop',
    screeningStatus: 'NON_FOOD',
    imageQuality: { status: 'GOOD', issues: [] },
  };
  const result = validateInput(geminiResult, 'dairy', '');
  assertEqual(result.inputStatus, 'NON_FOOD');
});

test('NON_FOOD: car should be rejected', () => {
  const geminiResult = {
    foodStatus: 'NON_FOOD',
    detectedCategory: 'NON_FOOD',
    detectedItem: 'Car',
    screeningStatus: 'NON_FOOD',
    imageQuality: { status: 'GOOD', issues: [] },
  };
  const result = validateInput(geminiResult, 'produce', '');
  assertEqual(result.inputStatus, 'NON_FOOD');
});

test('NON_FOOD: person should be rejected', () => {
  const geminiResult = {
    foodStatus: 'NON_FOOD',
    detectedCategory: 'NON_FOOD',
    detectedItem: 'Person',
    screeningStatus: 'NON_FOOD',
    imageQuality: { status: 'GOOD', issues: [] },
  };
  const result = validateInput(geminiResult, 'dairy', '');
  assertEqual(result.inputStatus, 'NON_FOOD');
});

test('UNSUPPORTED_FOOD: pizza should be flagged', () => {
  const geminiResult = {
    foodStatus: 'FOOD',
    detectedCategory: 'OTHER_FOOD',
    detectedItem: 'Pizza',
    screeningStatus: 'UNSUPPORTED_FOOD',
    imageQuality: { status: 'GOOD', issues: [] },
  };
  const result = validateInput(geminiResult, 'dairy', '');
  assertEqual(result.inputStatus, 'UNSUPPORTED_FOOD');
});

test('CATEGORY_MISMATCH: dairy selected + apple detected', () => {
  const geminiResult = {
    foodStatus: 'FOOD',
    detectedCategory: 'PRODUCE',
    detectedItem: 'Apple',
    screeningStatus: 'NO_OBVIOUS_VISUAL_CONCERN',
    imageQuality: { status: 'GOOD', issues: [] },
  };
  const result = validateInput(geminiResult, 'dairy', '');
  assertEqual(result.inputStatus, 'CATEGORY_MISMATCH');
  assertTrue(result.categoryMismatch !== null, 'Should have mismatch details');
});

test('CATEGORY_MISMATCH: produce selected + milk detected', () => {
  const geminiResult = {
    foodStatus: 'FOOD',
    detectedCategory: 'DAIRY',
    detectedItem: 'Milk',
    screeningStatus: 'NO_OBVIOUS_VISUAL_CONCERN',
    imageQuality: { status: 'GOOD', issues: [] },
  };
  const result = validateInput(geminiResult, 'produce', '');
  assertEqual(result.inputStatus, 'CATEGORY_MISMATCH');
});

test('LOW_IMAGE_QUALITY: unusable image rejected', () => {
  const geminiResult = {
    foodStatus: 'FOOD',
    detectedCategory: 'DAIRY',
    detectedItem: 'Milk',
    screeningStatus: 'LOW_IMAGE_QUALITY',
    imageQuality: { status: 'UNUSABLE', issues: ['extremely blurry', 'too dark'] },
  };
  const result = validateInput(geminiResult, 'dairy', '');
  assertEqual(result.inputStatus, 'LOW_IMAGE_QUALITY');
});

test('LOW_IMAGE_QUALITY: poor image rejected', () => {
  const geminiResult = {
    foodStatus: 'FOOD',
    detectedCategory: 'DAIRY',
    detectedItem: 'Paneer',
    screeningStatus: 'NO_OBVIOUS_VISUAL_CONCERN',
    imageQuality: { status: 'POOR', issues: ['blurry'] },
  };
  const result = validateInput(geminiResult, 'dairy', '');
  assertEqual(result.inputStatus, 'LOW_IMAGE_QUALITY');
});

test('VALID_FOOD: milk with no concern should pass', () => {
  const geminiResult = {
    foodStatus: 'FOOD',
    detectedCategory: 'DAIRY',
    detectedItem: 'Milk',
    screeningStatus: 'NO_OBVIOUS_VISUAL_CONCERN',
    visualConcern: 'NONE',
    imageQuality: { status: 'GOOD', issues: [] },
    visualObservations: ['White color, normal consistency'],
    reasoning: 'No visible abnormalities detected.',
  };
  const result = validateInput(geminiResult, 'dairy', 'Milk');
  assertEqual(result.inputStatus, 'VALID_FOOD');
  assertEqual(result.screeningStatus, 'NO_OBVIOUS_VISUAL_CONCERN');
});

test('VALID_FOOD: apple with concern should pass with concern status', () => {
  const geminiResult = {
    foodStatus: 'FOOD',
    detectedCategory: 'PRODUCE',
    detectedItem: 'Apple',
    screeningStatus: 'POSSIBLE_VISUAL_CONCERN',
    visualConcern: 'POSSIBLE',
    imageQuality: { status: 'GOOD', issues: [] },
    visualObservations: ['Unnatural gloss', 'Uniform coloring'],
    reasoning: 'Possible wax coating detected.',
  };
  const result = validateInput(geminiResult, 'produce', 'Apple');
  assertEqual(result.inputStatus, 'VALID_FOOD');
  assertEqual(result.screeningStatus, 'POSSIBLE_VISUAL_CONCERN');
});

test('UNCERTAIN: ambiguous image returns INSUFFICIENT_EVIDENCE', () => {
  const geminiResult = {
    foodStatus: 'UNCERTAIN',
    detectedCategory: 'UNKNOWN',
    detectedItem: 'Unknown',
    screeningStatus: 'INSUFFICIENT_EVIDENCE',
    imageQuality: { status: 'GOOD', issues: [] },
  };
  const result = validateInput(geminiResult, 'dairy', '');
  assertEqual(result.inputStatus, 'INSUFFICIENT_EVIDENCE');
});

test('AI_FAILED: failed AI call returns error state, not VALID_FOOD', () => {
  const geminiResult = {
    foodStatus: 'UNCERTAIN',
    detectedCategory: 'UNKNOWN',
    detectedItem: 'Unknown',
    screeningStatus: 'AI_SERVICE_UNAVAILABLE',
    errorType: 'AI_SERVICE_UNAVAILABLE',
  };
  const result = validateInput(geminiResult, 'dairy', '');
  assertEqual(result.inputStatus, 'AI_SERVICE_UNAVAILABLE');
  assertEqual(result.screeningStatus, 'AI_SERVICE_UNAVAILABLE');
  assertNotEqual(result.signalLevel, 'low');
});

// ─── RISK ENGINE TESTS ───
console.log('\n=== Risk Engine Tests ===\n');

test('Zero signals = low risk', () => {
  const validation = { inputStatus: 'VALID_FOOD', screeningStatus: 'NO_OBVIOUS_VISUAL_CONCERN', visualObservations: [] };
  const sensory = {};
  const community = { nearby_reports_7d: 0, nearby_reports_24h: 0, trend: 'STABLE', anomaly_detected: false };
  const result = synthesizeRisk(validation, sensory, community);
  assertEqual(result.signal_level, 'low');
});

test('Visual concern alone = moderate', () => {
  const validation = { inputStatus: 'VALID_FOOD', screeningStatus: 'POSSIBLE_VISUAL_CONCERN', visualObservations: ['Discoloration'] };
  const sensory = {};
  const community = { nearby_reports_7d: 0, nearby_reports_24h: 0, trend: 'STABLE', anomaly_detected: false };
  const result = synthesizeRisk(validation, sensory, community);
  assertEqual(result.signal_level, 'moderate');
  assertTrue(result.contributing_factors.length > 0, 'Should have at least one factor');
});

test('Visual + sensory = elevated', () => {
  const validation = { inputStatus: 'VALID_FOOD', screeningStatus: 'POSSIBLE_VISUAL_CONCERN', visualObservations: ['Thin consistency'] };
  const sensory = { smell: 'yes', lumpy: 'yes' };
  const community = { nearby_reports_7d: 0, nearby_reports_24h: 0, trend: 'STABLE', anomaly_detected: false };
  const result = synthesizeRisk(validation, sensory, community);
  assertTrue(result.signal_level === 'elevated' || result.signal_level === 'high', 'Should be elevated or high');
});

test('Visual + sensory + community = high', () => {
  const validation = { inputStatus: 'VALID_FOOD', screeningStatus: 'LIKELY_VISUAL_CONCERN', visualObservations: ['Yellowish tint'] };
  const sensory = { smell: 'yes' };
  const community = { nearby_reports_7d: 10, nearby_reports_24h: 5, similar_category_reports: 8, radius_km: 3, trend: 'INCREASING', trend_description: 'Reports increasing', anomaly_detected: false };
  const result = synthesizeRisk(validation, sensory, community);
  assertEqual(result.signal_level, 'high');
  assertTrue(result.contributing_factors.length >= 3, 'Should have multiple factors');
});

test('Community spike with anomaly = contributes factors', () => {
  const validation = { inputStatus: 'VALID_FOOD', screeningStatus: 'NO_OBVIOUS_VISUAL_CONCERN', visualObservations: [] };
  const sensory = {};
  const community = { nearby_reports_7d: 15, nearby_reports_24h: 8, similar_category_reports: 12, radius_km: 3, trend: 'UNUSUAL_SPIKE', trend_description: 'Unusual spike', anomaly_detected: true, anomaly_description: '8 reports vs baseline of 1.5/day' };
  const result = synthesizeRisk(validation, sensory, community);
  assertTrue(result.signal_level !== 'low', 'Community spike should elevate signal');
  assertTrue(result.contributing_factors.some(f => f.source === 'community'), 'Should include community factor');
  assertTrue(result.contributing_factors.some(f => f.source === 'anomaly'), 'Should include anomaly factor');
});

test('Evidence provenance is correct', () => {
  const validation = { inputStatus: 'VALID_FOOD', screeningStatus: 'POSSIBLE_VISUAL_CONCERN', visualObservations: ['test'] };
  const sensory = { smell: 'yes' };
  const community = { nearby_reports_7d: 5, nearby_reports_24h: 2, similar_category_reports: 3, radius_km: 3, trend: 'STABLE', anomaly_detected: false };
  const result = synthesizeRisk(validation, sensory, community);
  
  const sources = result.contributing_factors.map(f => f.source);
  assertTrue(sources.includes('visual'), 'Should have visual source');
  assertTrue(sources.includes('user'), 'Should have user source');
  assertTrue(sources.includes('community'), 'Should have community source');
  
  // Check icons
  const visualFactor = result.contributing_factors.find(f => f.source === 'visual');
  assertEqual(visualFactor.icon, '📷');
  const userFactor = result.contributing_factors.find(f => f.source === 'user');
  assertEqual(userFactor.icon, '🗣️');
  const communityFactor = result.contributing_factors.find(f => f.source === 'community');
  assertEqual(communityFactor.icon, '📍');
});

// ─── FILE VALIDATION TESTS ───
console.log('\n=== File Validation Tests ===\n');

test('Valid JPEG file accepted', () => {
  const result = validateFileType({ mimetype: 'image/jpeg', size: 1024 * 1024 });
  assertTrue(result.valid);
});

test('Valid PNG file accepted', () => {
  const result = validateFileType({ mimetype: 'image/png', size: 1024 * 1024 });
  assertTrue(result.valid);
});

test('Invalid file type rejected', () => {
  const result = validateFileType({ mimetype: 'application/pdf', size: 1024 });
  assertTrue(!result.valid);
  assertTrue(result.reason.includes('Unsupported'));
});

test('Oversized file rejected', () => {
  const result = validateFileType({ mimetype: 'image/jpeg', size: 15 * 1024 * 1024 });
  assertTrue(!result.valid);
  assertTrue(result.reason.includes('10MB'));
});

test('Null file rejected', () => {
  const result = validateFileType(null);
  assertTrue(!result.valid);
});

// ─── RESULTS ───
console.log(`\n${'='.repeat(40)}`);
console.log(`Results: ${passed} passed, ${failed} failed out of ${passed + failed} tests`);
console.log(`${'='.repeat(40)}\n`);

if (failed > 0) {
  process.exit(1);
}
