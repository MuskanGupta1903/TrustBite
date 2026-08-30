const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

async function runTest() {
  const artifactDir = '/Users/vaibhav/.gemini/antigravity-ide/brain/07b44741-844d-4d5d-84f0-683904893170';
  const files = fs.readdirSync(artifactDir);
  const milkFile = files.find(f => f.startsWith('test_milk') && f.endsWith('.jpg'));
  
  const originalBuffer = fs.readFileSync(path.join(artifactDir, milkFile));
  const newBuffer = Buffer.concat([originalBuffer, Buffer.from(crypto.randomBytes(16))]);
  
  const tempFile = '/tmp/milk_unique.jpg';
  fs.writeFileSync(tempFile, newBuffer);

  const formData = new FormData();
  const blob = new Blob([newBuffer], { type: 'image/jpeg' });
  formData.append('photo', blob, 'milk_unique.jpg');
  formData.append('category', 'dairy');
  formData.append('itemName', 'Milk');
  formData.append('lat', '22.5');
  formData.append('lng', '78.9');

  console.log('Sending unique milk image...');
  const response = await fetch('http://localhost:3001/api/scan', { method: 'POST', body: formData });
  const data = await response.json();
  
  console.log('Result Status:', data.validation?.input_status);
  console.log('Screening Status:', data.screening?.status);
  console.log('Risk Level:', data.result?.riskLevel);
  console.log('Reasoning:', data.result?.reasoning);
}

runTest();
