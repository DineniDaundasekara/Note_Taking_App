const express = require('express');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const { protect } = require('../middleware/auth');

const router = express.Router();
router.use(protect);

router.get('/', (req, res) => res.json({ user: req.user }));

router.put('/', [
    body('name').optional().trim().notEmpty().isLength({ max: 50 }),
    body('bio').optional().isLength({ max: 200 }),
    body('preferences').optional().isObject()
], async (req, res, next) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) return res.status(400).json({ message: errors.array()[0].msg });

        const { name, bio, preferences } = req.body;
        const update = {};
        if (name !== undefined) update.name = name;
        if (bio !== undefined) update.bio = bio;
        if (preferences) {
            if (preferences.defaultNoteColor !== undefined) update['preferences.defaultNoteColor'] = preferences.defaultNoteColor;
            if (preferences.viewMode !== undefined) update['preferences.viewMode'] = preferences.viewMode;
            if (preferences.sortBy !== undefined) update['preferences.sortBy'] = preferences.sortBy;
        }

        const user = await User.findByIdAndUpdate(req.user._id, update, { new: true, runValidators: true });
        res.json({ message: 'Profile updated', user });
    } catch (error) { next(error); }
});

router.put('/password', [
    body('currentPassword').notEmpty().withMessage('Current password required'),
    body('newPassword').isLength({ min: 6 }).withMessage('New password must be at least 6 characters')
], async (req, res, next) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) return res.status(400).json({ message: errors.array()[0].msg });

        const user = await User.findById(req.user._id).select('+password');
        const { currentPassword, newPassword } = req.body;

        if (!(await user.comparePassword(currentPassword))) {
            return res.status(400).json({ message: 'Current password is incorrect' });
        }
        user.password = newPassword;
        await user.save();
        res.json({ message: 'Password changed successfully' });
    } catch (error) { next(error); }
});

module.exports = router;