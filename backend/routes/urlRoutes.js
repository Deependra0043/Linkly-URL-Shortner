const express = require('express');
const { createUrl, getUrls, updateUrl, deleteUrl } = require('../controllers/urlController');
const { protect } = require('../middleware/authMiddleware');
const { apiLimiter } = require('../middleware/rateLimiter');

const router = express.Router();

// Cascade protection rules — every route below this line requires an active session token
router.use(protect);
router.use(apiLimiter);

router.route('/')
  .post(createUrl)   // Create shortened map
  .get(getUrls);     // Read/Paginate list records

router.route('/:id')
  .patch(updateUrl)  // Modify target URL mapping
  .delete(deleteUrl); // Purge mapping node completely

module.exports = router;