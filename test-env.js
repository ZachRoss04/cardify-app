// Simple test script to check if .env file loading works
const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');

// Check if .env file exists
const envPath = path.resolve(__dirname, '.env');
console.log('.env file exists:', fs.existsSync(envPath));

// Try to load it
const result = dotenv.config();
console.log('dotenv config result:', result);

// Check if we have the API key
console.log('OPENAI_API_KEY loaded:', process.env.OPENAI_API_KEY ? 'Yes' : 'No');

// List all .env* files in the directory
console.log('\nListing all .env* files in the directory:');
const files = fs.readdirSync(__dirname);
files.filter(file => file.startsWith('.env')).forEach(file => {
  console.log(file);
});
