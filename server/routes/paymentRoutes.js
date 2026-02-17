const express = require('express');
const router = express.Router();
const { createPaymentIntent, sendStripeApiKey } = require('../controllers/paymentController');
const { protect } = require('../middleware/authMiddleware');

router.route('/config').get(sendStripeApiKey);
router.route('/create-payment-intent').post(protect, createPaymentIntent);

module.exports = router;
