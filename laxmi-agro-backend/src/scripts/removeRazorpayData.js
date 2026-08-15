require('dotenv').config();

const mongoose = require('mongoose');
const connectDB = require('../config/database');
const { Payment, Settings } = require('../models');

const confirmation = process.env.CONFIRM_RAZORPAY_CLEANUP;

async function removeRazorpayData() {
  if (confirmation !== '1') {
    throw new Error(
      'Refusing to run. Set CONFIRM_RAZORPAY_CLEANUP=1 after confirming that no real Razorpay payments exist.'
    );
  }

  await connectDB();

  const removedPayments = await Payment.deleteMany({ method: 'razorpay' });
  const strippedPaymentMetadata = await Payment.collection.updateMany(
    {},
    {
      $unset: {
        razorpayOrderId: '',
        razorpayPaymentId: '',
        razorpaySignature: '',
      },
    }
  );
  const strippedSettings = await Settings.collection.updateOne(
    { _id: 'app_settings' },
    {
      $unset: {
        razorpayKeyId: '',
        razorpayKeySecret: '',
        razorpayEnabled: '',
      },
    }
  );

  console.log('Razorpay cleanup completed.', {
    removedPaymentRecords: removedPayments.deletedCount,
    paymentRecordsWithMetadataRemoved: strippedPaymentMetadata.modifiedCount,
    settingsRecordsUpdated: strippedSettings.modifiedCount,
  });
}

removeRazorpayData()
  .catch((error) => {
    console.error('Razorpay cleanup failed:', error.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.connection.close();
  });
