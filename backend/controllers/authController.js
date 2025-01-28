const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../models/User');


const signup = async (req, res) => {
    const { username, password } = req.body;
    try {
        const user = await User.createUser(username, password);
        res.status(201).json({user});
    } catch (error) {
        res.status(500).json({
            error: error.message
        });
    }
};


const login = async (req, res) => {
    const { username, password } = req.body;
    try {
        const user = await User.findUserByUsername(username);

        if(!user) {
            return res.status(404).json({
                error: 'User not found'
            });
        }

        const isMatch = await bcrypt.compare(password, user.password);

        if(!isMatch) {
            return res.status(400).json({
                error: 'Invalid credentials'
            });
        }

        const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, { expiresIn: '1h' });
        res.json({ token, message: 'Login successful' });

    } catch (error) {
        res.status(500).json({
            error: error.message
        });
    }
};

module.exports = { signup, login };