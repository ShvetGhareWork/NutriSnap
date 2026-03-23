const express = require('express');
const router = express.Router();
const Razorpay = require('razorpay');
const crypto = require('crypto');
const Payment = require('../models/Payment');
const CoachProfile = require('../models/CoachProfile');

const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// POST /api/payment/create-order
router.post('/create-order', async (req, res) => {
    try {
        const { userId, coachId } = req.body;
        
        // 1. Get coach's fee
        const coachProfile = await CoachProfile.findOne({ user: coachId });
        if (!coachProfile || !coachProfile.paidChatEnabled) {
            return res.status(400).json({ success: false, error: 'Coach does not require payment or profile not found.' });
        }

        const amountInPaise = coachProfile.chatFeeINR * 100; // Razorpay expects amount in paise

        // 2. Create Razorpay order
        const options = {
            amount: amountInPaise,
            currency: 'INR',
            receipt: `receipt_order_${Date.now()}`,
        };

        const order = await razorpay.orders.create(options);

        // 3. Save pending payment to DB
        await Payment.create({
            userId,
            coachId,
            amount: coachProfile.chatFeeINR,
            currency: 'INR',
            razorpayOrderId: order.id,
            status: 'pending',
        });

        res.json({ success: true, order });
    } catch (error) {
        console.error('Razorpay Create Order Error:', error);
        res.status(500).json({ success: false, error: 'Could not create payment order.' });
    }
});

// POST /api/payment/verify
router.post('/verify', async (req, res) => {
    try {
        const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

        // 1. Verification logic
        const hmac = crypto.createHmac('sha256', process.env.RAZORPAY_KEY_SECRET || 'dummy_secret');
        hmac.update(razorpay_order_id + "|" + razorpay_payment_id);
        const generatedSignature = hmac.digest('hex');

        if (generatedSignature === razorpay_signature) {
            // 2. Update payment in DB
            const payment = await Payment.findOneAndUpdate(
                { razorpayOrderId: razorpay_order_id },
                { 
                    razorpayPaymentId: razorpay_payment_id,
                    razorpaySignature: razorpay_signature,
                    status: 'completed'
                },
                { new: true }
            );

            console.log('Payment verified and updated:', payment._id);
            res.json({ success: true, message: 'Payment verified successfully.' });
        } else {
            res.status(400).json({ success: false, error: 'Invalid signature.' });
        }
    } catch (error) {
        console.error('Razorpay Verify Error:', error);
        res.status(500).json({ success: false, error: 'Verification failed.' });
    }
});

module.exports = router;
