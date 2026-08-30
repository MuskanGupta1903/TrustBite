const fs = require('fs');
const path = require('path');

async function testScan(imagePath, category, itemName = '') {
  console.log(`\n--- Testing: ${path.basename(imagePath)} (Category: ${category}) ---`);
  
  if (!fs.existsSync(imagePath)) {
    console.error(`File not found: ${imagePath}`);
    return;
  }

  const formData = new FormData();
  
  // We need to use Node's Blob/File equivalent to append the file correctly to FormData
  const fileBuffer = fs.readFileSync(imagePath);
  const blob = new Blob([fileBuffer], { type: 'image/jpeg' });
  formData.append('photo', blob, path.basename(imagePath));
  
  formData.append('category', category);
  if (itemName) formData.append('itemName', itemName);
  formData.append('lat', '22.5');
  formData.append('lng', '78.9');

  try {
    const response = await fetch('http://localhost:3001/api/scan', {
      method: 'POST',
      body: formData,
    });
    
    const data = await response.json();
    console.log('Result Status:', data.validation?.input_status);
    console.log('Screening Status:', data.screening?.status);
    console.log('Risk Level:', data.result?.riskLevel);
    console.log('Reasoning:', data.result?.reasoning);
  } catch (error) {
    console.error('Fetch error:', error.message);
  }
}

async function runTests() {
  const artifactDir = '/Users/vaibhav/.gemini/antigravity-ide/brain/07b44741-844d-4d5d-84f0-683904893170';
  
  // Need to find the exact filenames since they have timestamps
  const files = fs.readdirSync(artifactDir);
  const certFile = files.find(f => f.startsWith('test_certificate') && f.endsWith('.jpg'));
  const milkFile = files.find(f => f.startsWith('test_milk') && f.endsWith('.jpg'));
  const appleFile = files.find(f => f.startsWith('test_apple') && f.endsWith('.jpg'));
  const laptopFile = files.find(f => f.startsWith('test_laptop') && f.endsWith('.jpg'));
  
  // Test 1: Certificate (NON_FOOD)
  if (certFile) await testScan(path.join(artifactDir, certFile), 'dairy');
  
  // Test 2: Laptop (NON_FOOD)
  if (laptopFile) await testScan(path.join(artifactDir, laptopFile), 'dairy');
  
  // Test 4: Apple under Dairy (CATEGORY_MISMATCH)
  if (appleFile) await testScan(path.join(artifactDir, appleFile), 'dairy', 'Apple');
  
  // Test 5: Milk under Produce (CATEGORY_MISMATCH)
  if (milkFile) await testScan(path.join(artifactDir, milkFile), 'produce', 'Milk');
  
  // Test 6: Valid Milk
  if (milkFile) await testScan(path.join(artifactDir, milkFile), 'dairy', 'Milk');
}

runTests();
