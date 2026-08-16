require('dotenv').config();

const mongoose = require('mongoose');
const connectDB = require('../src/config/database');
const User = require('../src/models/User');
const { USER_ROLES } = require('../src/utils/constants');

async function clearStaffPasswordChangeFlags() {
  try {
    await connectDB();

    const result = await User.updateMany(
      { role: USER_ROLES.STAFF, mustChangePassword: true },
      { $set: { mustChangePassword: false } }
    );

    console.log(`Cleared forced-password-change flags for ${result.modifiedCount} staff account(s).`);
  } finally {
    await mongoose.connection.close();
  }
}

clearStaffPasswordChangeFlags().catch((error) => {
  console.error('Unable to clear staff password-change flags:', error.message);
  process.exitCode = 1;
});
