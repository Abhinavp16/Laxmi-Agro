const mongoose = require('mongoose');

const mandatoryUpdateMessage = 'A new version of Laxmi Agro is required. Please update the app to continue.';

const mobilePlatformSchema = new mongoose.Schema({
  enabled: { type: Boolean, default: false },
  latestVersion: { type: String, trim: true, maxlength: 50, default: '' },
  latestBuildNumber: { type: Number, min: 0, default: 0 },
  storeUrl: {
    type: String,
    trim: true,
    required: true,
    enum: [
      'https://play.google.com/store/apps/details?id=com.laxmiagro.app',
      'https://apps.apple.com/in/app/laxmi-agro/id6804305521',
    ],
  },
  title: { type: String, trim: true, maxlength: 200, default: 'Update Required' },
  message: { type: String, trim: true, maxlength: 1000, default: mandatoryUpdateMessage },
}, { _id: false });

const settingsSchema = new mongoose.Schema({
  _id: {
    type: String,
    default: 'app_settings',
  },

  businessName: {
    type: String,
    default: 'Laxmi Agro',
  },
  businessPhone: String,
  businessEmail: String,
  businessAddress: String,

  upiId: {
    type: String,
    required: true,
  },
  upiDisplayName: {
    type: String,
    required: true,
  },

  minOrderAmount: {
    type: Number,
    default: 0,
  },
  defaultBulkMinQuantity: {
    type: Number,
    default: 10,
  },
  negotiationExpiryDays: {
    type: Number,
    default: 7,
  },
  lowStockThreshold: {
    type: Number,
    default: 5,
  },

  features: {
    negotiationsEnabled: { type: Boolean, default: true },
    guestCheckout: { type: Boolean, default: false },
    maintenanceMode: { type: Boolean, default: false },
  },

  mobileApp: {
    android: {
      type: mobilePlatformSchema,
      default: () => ({
        storeUrl: 'https://play.google.com/store/apps/details?id=com.laxmiagro.app',
      }),
    },
    ios: {
      type: mobilePlatformSchema,
      default: () => ({
        storeUrl: 'https://apps.apple.com/in/app/laxmi-agro/id6804305521',
      }),
    },
  },

  heroBanners: [{
    title: { type: String, default: '' },
    subtitle: String,
    tag: String,
    imageUrl: String,
    // Video banners (hero only): button + link only, no title/desc overlay.
    mediaType: {
      type: String,
      enum: ['image', 'video_upload', 'youtube'],
      default: 'image',
    },
    videoUrl: String,
    linkUrl: String,
    buttonText: { type: String, default: 'Shop Now' },
    buttonIcon: { type: String, default: 'ArrowRight' },
    isActive: { type: Boolean, default: true },
    order: { type: Number, default: 0 },
  }],

  promoBanners: [{
    title: { type: String, required: true },
    subtitle: String,
    tag: String,
    imageUrl: String,
    linkUrl: String,
    buttonText: { type: String, default: 'Shop Now' },
    buttonIcon: { type: String, default: 'ArrowRight' },
    isActive: { type: Boolean, default: true },
    order: { type: Number, default: 0 },
  }],

  socialLinks: {
    whatsapp: String,
    instagram: String,
    facebook: String,
  },
  checkout: {
    mode: {
      type: String,
      enum: ['payment', 'whatsapp'],
      default: 'whatsapp',
    },
    orderWhatsappNumber: {
      type: String,
      default: '',
    },
    requireLoginForCheckout: {
      type: Boolean,
      default: true,
    },
    createOrderBeforeRedirect: {
      type: Boolean,
      default: true,
    },
    allowNegotiationCheckout: {
      type: Boolean,
      default: true,
    },
  },


  // Bank Transfer Details
  bankName: String,
  bankAccountNumber: String,
  bankIfscCode: String,
  bankAccountHolderName: String,
  bankTransferEnabled: {
    type: Boolean,
    default: true,
  },
}, {
  timestamps: true,
});

settingsSchema.statics.getSettings = async function () {
  let settings = await this.findById('app_settings');
  
  if (!settings) {
    settings = await this.create({
      _id: 'app_settings',
      businessPhone: '+91 9179110159',
      businessEmail: 'ashirvadmarketing62@gmail.com',
      businessAddress: 'Station Road, Opp. Surja Devi Shukla Complex, Raipur (C.G.)',
      upiId: process.env.DEFAULT_UPI_ID || 'laxmiagro@ybl',
      upiDisplayName: process.env.DEFAULT_UPI_NAME || 'Laxmi Agro Payments',
      checkout: {
        mode: 'whatsapp',
        orderWhatsappNumber: process.env.PUBLIC_ORDER_WHATSAPP_NUMBER || '919179110159',
        requireLoginForCheckout: true,
        createOrderBeforeRedirect: true,
        allowNegotiationCheckout: true,
      },
    });
  }
  
  return settings;
};

module.exports = mongoose.model('Settings', settingsSchema);
