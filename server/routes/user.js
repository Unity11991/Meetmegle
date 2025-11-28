const express = require('express');
const multer = require('multer');
const path = require('path');
const User = require('../models/User');
const jwt = require('jsonwebtoken');

const router = express.Router();

// Middleware to verify token
const verifyToken = (req, res, next) => {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ message: 'Unauthorized' });

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.userId = decoded.userId;
        next();
    } catch (err) {
        return res.status(403).json({ message: 'Invalid token' });
    }
};

// Multer setup for avatar upload
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        cb(null, `${req.userId}-${Date.now()}${path.extname(file.originalname)}`);
    }
});

const upload = multer({ storage });

// Get Profile
router.get('/profile', verifyToken, async (req, res) => {
    try {
        const user = await User.findById(req.userId).select('-password');
        if (!user) return res.status(404).json({ message: 'User not found' });
        res.json(user);
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
});

// Upload Avatar
router.post('/avatar', verifyToken, upload.single('avatar'), async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ message: 'No file uploaded' });

        const avatarUrl = `/uploads/${req.file.filename}`;

        const user = await User.findByIdAndUpdate(req.userId, { avatarUrl }, { new: true }).select('-password');

        res.json({ message: 'Avatar uploaded', avatarUrl: user.avatarUrl });
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;
