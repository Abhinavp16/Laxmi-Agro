const logger = require('../utils/logger');
const { Product, Category } = require('../models');
const { PRODUCT_STATUS } = require('../utils/constants');
const { HINDI_NAME_SWEEP_MINUTES, HINDI_NAME_SWEEP_BATCH } = require('../utils/hindiNames');
const { fillHindiNames } = require('./hindiNameService');

// Every HINDI_NAME_SWEEP_MINUTES, fill Hindi names that are still empty or
// broken (e.g. the conversion service was down when the item was saved).
async function runHindiNameSweep() {
  const [products, categories] = await Promise.all([
    fillHindiNames(Product, {
      mode: 'repair',
      limit: HINDI_NAME_SWEEP_BATCH,
      extraFilter: { status: { $ne: PRODUCT_STATUS.ARCHIVED } },
    }),
    fillHindiNames(Category, { mode: 'repair', limit: HINDI_NAME_SWEEP_BATCH }),
  ]);
  if (products.updated || categories.updated) {
    logger.info(`[HindiNames] sweep filled ${products.updated} products, ${categories.updated} categories`);
  }
  return { products, categories };
}

let sweepHandle = null;

function startHindiNameScheduler() {
  if (sweepHandle) return sweepHandle;
  const run = () => runHindiNameSweep().catch((error) => logger.error('Hindi name sweep failed:', error));
  sweepHandle = setInterval(run, HINDI_NAME_SWEEP_MINUTES * 60 * 1000);
  // First run shortly after start-up, so it doesn't compete with boot work.
  setTimeout(run, 60 * 1000).unref?.();
  return sweepHandle;
}

module.exports = { startHindiNameScheduler, runHindiNameSweep };
