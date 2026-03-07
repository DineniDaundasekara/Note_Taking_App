const express = require('express');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const { protect, generateToken } = require('../middleware/auth');

const router = express.Router();

router.post('/register', [
  body('name').trim().notEmpty().withMessage('Name is required').isLength({ max: 50 }),
  body('email').isEmail().withMessage('Valid email required').normalizeEmail(),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters')
], async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ message: errors.array()[0].msg });

    const { name, email, password } = req.body;
    const existing = await User.findOne({ email });
    if (existing) return res.status(409).json({ message: 'An account with this email already exists' });

    const user = await User.create({ name, email, password });
    const token = generateToken(user._id);

    res.status(201).json({
      message: 'Account created successfully', token,
      user: { _id: user._id, name: user.name, email: user.email, avatar: user.avatar, preferences: user.preferences }
    });
  } catch (error) { next(error); }
});

router.post('/login', [
  body('email').isEmail().withMessage('Valid email required').normalizeEmail(),
  body('password').notEmpty().withMessage('Password is required')
], async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ message: errors.array()[0].msg });

    const { email, password } = req.body;
    const user = await User.findOne({ email }).select('+password');
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const token = generateToken(user._id);
    res.json({
      message: 'Login successful', token,
      user: { _id: user._id, name: user.name, email: user.email, avatar: user.avatar, preferences: user.preferences }
    });
  } catch (error) { next(error); }
});

router.get('/me', protect, (req, res) => res.json({ user: req.user }));

module.exports = router;