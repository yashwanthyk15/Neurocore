const express = require('express');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const authMiddleware = require('../middleware/auth');
const router = express.Router();

const generateToken = (userId) => {
  const secret = process.env.JWT_SECRET || (process.env.NODE_ENV === 'production' ? null : 'fallback_secret');
  if (!secret) throw new Error('JWT_SECRET is required in production');
  return jwt.sign({ userId }, secret, { expiresIn: '7d' });
};

// Register
router.post('/register', [
  body('name').trim().isLength({ min: 2 }).withMessage('Name must be at least 2 characters'),
  body('email').isEmail().withMessage('Valid email required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('grade').optional().trim().isLength({ max: 20 }).withMessage('Grade must be under 20 characters')
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ error: errors.array()[0].msg });
  }

  try {
    const { name, email, password, grade } = req.body;
    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(400).json({ error: 'Email already registered' });
    }
    const user = new User({ name, email, password, grade });
    await user.save();
    const token = generateToken(user._id);
    res.status(201).json({ token, user });
  } catch (err) {
    res.status(500).json({ error: 'Registration failed: ' + err.message });
  }
});

// Login
router.post('/login', [
  body('email').isEmail().withMessage('Valid email required'),
  body('password').notEmpty().withMessage('Password required')
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ error: errors.array()[0].msg });
  }

  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }
    const token = generateToken(user._id);
    res.json({ token, user });
  } catch (err) {
    res.status(500).json({ error: 'Login failed: ' + err.message });
  }
});

// Get current user
router.get('/me', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json({ user });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update reading profile
router.patch('/profile', authMiddleware, async (req, res) => {
  try {
    const { readingProfile } = req.body;
    if (!readingProfile) return res.status(400).json({ error: 'readingProfile is required' });

    const allowedFields = ['fontSize', 'lineSpacing', 'chunkSize', 'useDyslexicFont', 'colorOverlay', 'theme', 'highContrast'];
    const sanitizedProfile = {};
    for (const key of allowedFields) {
      if (readingProfile[key] !== undefined) {
        sanitizedProfile[`readingProfile.${key}`] = readingProfile[key];
      }
    }

    const user = await User.findByIdAndUpdate(
      req.userId,
      { $set: sanitizedProfile },
      { new: true }
    );
    res.json({ user });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
