const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const { authenticate } = require('../middleware/auth');
const { sendVerificationEmail } = require('../services/emailService');

const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';

/**
 * POST /email/verify-request
 * Request email verification (send verification email)
 */
router.post('/verify-request', authenticate, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (!user.email) {
      return res.status(400).json({ message: 'No email address on file. Please add an email first.' });
    }

    if (user.emailVerified) {
      return res.status(400).json({ message: 'Email is already verified.' });
    }

    // Generate verification token
    const token = crypto.randomBytes(32).toString('hex');
    const expires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    user.emailVerificationToken = token;
    user.emailVerificationExpires = expires;
    await user.save();

    // Send verification email
    const verificationUrl = `${FRONTEND_URL}/verify-email?token=${token}&user=${user._id}`;
    const result = await sendVerificationEmail(user, verificationUrl);

    if (result.success) {
      res.json({ message: 'Verification email sent successfully. Please check your inbox.' });
    } else {
      res.status(500).json({ message: 'Failed to send verification email. Please try again later.' });
    }
  } catch (err) {
    console.error('Verification request error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * GET /email/verify?token=xxx&user=xxx
 * Verify email with token
 */
router.get('/verify', async (req, res) => {
  try {
    const { token, user: userId } = req.query;

    if (!token || !userId) {
      return res.status(400).json({ message: 'Invalid verification link.' });
    }

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    if (user.emailVerified) {
      return res.json({ message: 'Email is already verified.', verified: true });
    }

    if (user.emailVerificationToken !== token) {
      return res.status(400).json({ message: 'Invalid verification token.' });
    }

    if (user.emailVerificationExpires < new Date()) {
      return res.status(400).json({ message: 'Verification link has expired. Please request a new one.' });
    }

    // Mark email as verified
    user.emailVerified = true;
    user.emailVerificationToken = null;
    user.emailVerificationExpires = null;
    await user.save();

    res.json({ message: 'Email verified successfully!', verified: true });
  } catch (err) {
    console.error('Email verification error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * POST /email/update
 * Update or add email address
 */
router.post('/update', authenticate, [
  body('email').isEmail().withMessage('Please provide a valid email address')
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ message: errors.array()[0].msg });
  }

  try {
    const { email } = req.body;
    const normalizedEmail = email.toLowerCase().trim();

    // Check if email is already in use by another user
    const existingUser = await User.findOne({
      email: normalizedEmail,
      _id: { $ne: req.user._id }
    });

    if (existingUser) {
      return res.status(409).json({ message: 'This email address is already in use.' });
    }

    const user = await User.findById(req.user._id);

    // If email hasn't changed and is already verified
    if (user.email === normalizedEmail && user.emailVerified) {
      return res.json({ message: 'Email is already verified.', email: user.email, verified: true });
    }

    // Update email and reset verification status
    user.email = normalizedEmail;
    user.emailVerified = false;

    // Generate new verification token
    const token = crypto.randomBytes(32).toString('hex');
    const expires = new Date(Date.now() + 24 * 60 * 60 * 1000);

    user.emailVerificationToken = token;
    user.emailVerificationExpires = expires;
    await user.save();

    // Send verification email
    const verificationUrl = `${FRONTEND_URL}/verify-email?token=${token}&user=${user._id}`;
    const result = await sendVerificationEmail(user, verificationUrl);

    res.json({
      message: 'Email updated. Please verify your new email address.',
      email: user.email,
      verified: false,
      emailSent: result.success
    });
  } catch (err) {
    console.error('Email update error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * POST /email/notifications/preferences
 * Update email notification preferences
 */
router.post('/notifications/preferences', authenticate, async (req, res) => {
  try {
    const { newTicket, depositUpdates, promotions } = req.body;

    const user = await User.findById(req.user._id);
    user.emailNotifications = {
      newTicket: newTicket !== undefined ? newTicket : user.emailNotifications?.newTicket,
      depositUpdates: depositUpdates !== undefined ? depositUpdates : user.emailNotifications?.depositUpdates,
      promotions: promotions !== undefined ? promotions : user.emailNotifications?.promotions
    };
    await user.save();

    res.json({
      message: 'Notification preferences updated',
      preferences: user.emailNotifications
    });
  } catch (err) {
    console.error('Notification preferences error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
