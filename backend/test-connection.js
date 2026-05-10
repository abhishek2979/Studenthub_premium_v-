/**
 * Run this to verify your backend + MongoDB are working BEFORE
 * trying to register from the browser:
 *
 *   node test-connection.js
 */
require('dotenv').config();
const mongoose = require('mongoose');

(async () => {
  console.log('\n🔍 Testing MongoDB connection...');
  console.log('   URI:', process.env.MONGO_URI?.replace(/:\/\/.*@/, '://***@'));
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ MongoDB connected successfully!\n');
    process.exit(0);
  } catch (err) {
    console.error('❌ MongoDB connection failed:', err.message);
    console.error('\n👉 Most likely fix: Go to MongoDB Atlas →');
    console.error('   Network Access → Add IP Address → Allow Access from Anywhere (0.0.0.0/0)');
    process.exit(1);
  }
})();
