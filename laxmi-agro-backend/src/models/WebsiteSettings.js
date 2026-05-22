const mongoose = require('mongoose');

const websiteCategorySchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: String,
  image: String,
  products: [{ type: String }],
  productDetails: { type: [mongoose.Schema.Types.Mixed], default: [] },
  isActive: { type: Boolean, default: true },
  order: { type: Number, default: 0 },
}, { _id: false });

const websiteFeaturedProductSchema = new mongoose.Schema({
  name: { type: String, required: true },
  price: String,
  image: String,
  badge: String,
  specs: [{ type: String }],
  shortDescription: String,
  isActive: { type: Boolean, default: true },
  order: { type: Number, default: 0 },
}, { _id: false });

const websiteHeroCardSchema = new mongoose.Schema({
  image: String,
  order: { type: Number, default: 0 },
}, { _id: false });

const websiteLabelSchema = new mongoose.Schema({
  id: {
    type: String,
    default: () => new mongoose.Types.ObjectId().toString(),
  },
  title: { type: String, required: true },
  sourceType: { type: String, enum: ['image', 'icon'], default: 'image' },
  image: String,
  icon: String,
  isActive: { type: Boolean, default: true },
  order: { type: Number, default: 0 },
}, { _id: false });

const websiteSectionConfigSchema = new mongoose.Schema({
  eyebrow: String,
  title: String,
  description: String,
  sideText: String,
  buttonText: String,
}, { _id: false });

const defaultHeroCards = [
  '/images/Banner/1.jpg',
  '/images/Banner/2.jpg',
  '/images/Banner/3.jpg',
  '/images/Banner/4.jpg',
  '/images/Banner/5.jpg',
].map((image, order) => ({ image, order }));

const websiteSettingsSchema = new mongoose.Schema({
  _id: {
    type: String,
    default: 'website_settings',
  },
  heroCards: {
    type: [websiteHeroCardSchema],
    default: defaultHeroCards,
  },
  labels: {
    type: [websiteLabelSchema],
    default: [],
  },
  productCategories: {
    type: [websiteCategorySchema],
    default: [],
  },
  featuredProducts: {
    type: [websiteFeaturedProductSchema],
    default: [],
  },
  categoriesSection: {
    type: websiteSectionConfigSchema,
    default: {
      eyebrow: 'PRODUCT CATEGORIES',
      title: 'Field Supply Categories',
      description: 'Explore service wire, submersible cable, pipes, sprinkler sets, pump accessories, and related agriculture supply categories.',
      buttonText: 'View Products',
    },
  },
  featuredSection: {
    type: websiteSectionConfigSchema,
    default: {
      eyebrow: 'PRECISION ENGINEERING',
      title: 'Featured Products',
      sideText: 'Featured agriculture supply products selected from the active Laxmi Agro catalogue.',
      buttonText: 'Get Quote',
    },
  },
}, {
  timestamps: true,
});

websiteSettingsSchema.statics.getSettings = async function () {
  let settings = await this.findById('website_settings');

  if (!settings) {
    settings = await this.create({
      _id: 'website_settings',
      heroCards: defaultHeroCards,
      labels: [],
      productCategories: [],
      featuredProducts: [],
      categoriesSection: {
        eyebrow: 'PRODUCT CATEGORIES',
        title: 'Field Supply Categories',
        description: 'Explore service wire, submersible cable, pipes, sprinkler sets, pump accessories, and related agriculture supply categories.',
        buttonText: 'View Products',
      },
      featuredSection: {
        eyebrow: 'PRECISION ENGINEERING',
        title: 'Featured Products',
        sideText: 'Featured agriculture supply products selected from the active Laxmi Agro catalogue.',
        buttonText: 'Get Quote',
      },
    });
  }

  if (!Array.isArray(settings.heroCards) || settings.heroCards.length !== 5) {
    settings.heroCards = defaultHeroCards;
    await settings.save();
  }

  if (!Array.isArray(settings.labels)) {
    settings.labels = [];
    await settings.save();
  }

  if (Array.isArray(settings.labels)) {
    let needsSave = false;
    const nextLabels = settings.labels.map((label = {}) => {
      // Convert to plain object if it's a mongoose document
      const plainLabel = typeof label.toObject === 'function' ? label.toObject() : { ...label };

      // Check if label already has a valid ID
      if (plainLabel.id && String(plainLabel.id).trim()) {
        return plainLabel;
      }

      // Generate ID for labels without one
      needsSave = true;
      return {
        ...plainLabel,
        id: new mongoose.Types.ObjectId().toString(),
      };
    });

    if (needsSave) {
      settings.labels = nextLabels;
      await settings.save();
    }
  }

  return settings;
};

module.exports = mongoose.model('WebsiteSettings', websiteSettingsSchema);
