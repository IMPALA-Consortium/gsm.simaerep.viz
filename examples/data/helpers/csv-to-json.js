/**
 * CSV to JSON converter for example data
 * Usage: node examples/data/helpers/csv-to-json.js
 */

const fs = require('fs');
const path = require('path');

function csvToJson(csvFilePath) {
  const csvData = fs.readFileSync(csvFilePath, 'utf8');
  const lines = csvData.split('\n').filter(line => line.trim());
  
  if (lines.length === 0) {
    return [];
  }
  
  // Parse header
  const headers = lines[0].split(',').map(h => h.trim());
  
  // Parse rows
  const jsonData = [];
  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',').map(v => v.trim());
    const obj = {};
    
    headers.forEach((header, index) => {
      let value = values[index];
      
      // Convert numbers, but preserve GroupID as string
      if (header !== 'GroupID' && !isNaN(value) && value !== '') {
        value = Number(value);
      }
      
      obj[header] = value;
    });
    
    jsonData.push(obj);
  }
  
  return jsonData;
}

function convertFile(csvFileName, jsonFileName) {
  const dataDir = path.join(__dirname, '..');
  const csvPath = path.join(dataDir, csvFileName);
  const jsonPath = path.join(dataDir, jsonFileName);
  
  console.log(`Converting ${csvFileName} to ${jsonFileName}...`);
  
  try {
    const jsonData = csvToJson(csvPath);
    fs.writeFileSync(jsonPath, JSON.stringify(jsonData, null, 2));
    console.log(`✓ Created ${jsonFileName} with ${jsonData.length} records`);
  } catch (error) {
    console.error(`✗ Error converting ${csvFileName}:`, error.message);
  }
}

// Convert all CSV files in the data directory
const dataDir = path.join(__dirname, '..');
const files = fs.readdirSync(dataDir);

files.forEach(file => {
  if (file.endsWith('.csv')) {
    const jsonFileName = file.replace('.csv', '.json');
    convertFile(file, jsonFileName);
  }
});

// Also convert CSV files in csv subdirectory
const csvDir = path.join(dataDir, 'csv');
if (fs.existsSync(csvDir)) {
  const csvFiles = fs.readdirSync(csvDir);
  csvFiles.forEach(file => {
    if (file.endsWith('.csv')) {
      const csvPath = path.join('csv', file);
      const jsonFileName = file.replace('.csv', '.json');
      const jsonPath = path.join('csv', jsonFileName);
      
      console.log(`Converting csv/${file} to csv/${jsonFileName}...`);
      
      try {
        const fullCsvPath = path.join(csvDir, file);
        const fullJsonPath = path.join(csvDir, jsonFileName);
        const jsonData = csvToJson(fullCsvPath);
        fs.writeFileSync(fullJsonPath, JSON.stringify(jsonData, null, 2));
        console.log(`✓ Created csv/${jsonFileName} with ${jsonData.length} records`);
      } catch (error) {
        console.error(`✗ Error converting csv/${file}:`, error.message);
      }
    }
  });
}

console.log('\nDone!');

