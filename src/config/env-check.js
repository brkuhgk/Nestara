// List of required environment variables
const requiredEnvVars = [
  'NODE_ENV',
  'SUPABASE_URL',
  'SUPABASE_ANON_KEY'
];

function checkEnv() {
  const missing = requiredEnvVars.filter(key => !process.env[key]);
  
  if (missing.length > 0) {
    console.error('Required environment variables are missing:', missing.join(', '));
    process.exit(1); // Exit process if required vars missing
  }
}

module.exports = checkEnv;


// Usage in server.js:
// require('dotenv').config();
// const checkEnv = require('./config/env-check');
// checkEnv();