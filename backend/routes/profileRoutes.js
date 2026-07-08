const express = require('express');
const User = require('../models/User');
const auth = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/profile
// @desc    Get current user profile
// @access  Private
router.get('/', auth, async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('-password');
        res.json(user);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   PUT /api/profile
// @desc    Update user profile
// @access  Private
router.put('/', auth, async (req, res) => {
    const { name, username, email, phone, location, bio, profilePhoto } = req.body;

    const profileFields = {};
    const fields = ['name', 'username', 'email', 'phone', 'location', 'bio', 'profilePhoto'];
    
    fields.forEach(field => {
        if (req.body[field] !== undefined) {
            profileFields[field] = req.body[field];
        }
    });


    try {
        let user = await User.findById(req.user.id);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Manually assign fields
        Object.keys(profileFields).forEach(field => {
            user[field] = profileFields[field];
        });

        // Use .save() to trigger full Mongoose logic
        const updatedUser = await user.save();
        
        // Remove password before sending
        const userResponse = updatedUser.toObject();
        delete userResponse.password;

        res.json(userResponse);
    } catch (err) {
        console.error('Profile save error:', err.message);
        res.status(500).send('Server Error: ' + err.message);
    }

});


module.exports = router;
