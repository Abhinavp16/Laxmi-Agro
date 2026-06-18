const express = require('express');
const router = express.Router();
const {
  getCategories,
  getCategory,
  createCategory,
  updateCategory,
  deleteCategory,
  generateMissingHindiNames,
} = require('../controllers/categoryController');
const { protect, optionalAuth, authorize } = require('../middlewares/auth');

// Public routes
router.get('/', optionalAuth, getCategories);

// Admin routes
router.post('/hindi-names/generate-missing', protect, authorize('admin'), generateMissingHindiNames);
router.post('/', protect, authorize('admin'), createCategory);
router.put('/:id', protect, authorize('admin'), updateCategory);
router.delete('/:id', protect, authorize('admin'), deleteCategory);

router.get('/:id', getCategory);

module.exports = router;
