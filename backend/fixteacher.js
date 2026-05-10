require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');
const bcrypt = require('bcryptjs');

mongoose.connect(process.env.MONGO_URI).then(async () => {
  const hash = await bcrypt.hash('Teacher@123', 10);
  await User.updateOne(
    { email: 'abhi@gmail.com' },
    { $set: { password: hash } }
  );
  console.log('Password set successfully!');
  process.exit(0);
});