const jwt = require('jsonwebtoken');
require('dotenv').config();

/**
 * Middleware to authenticate the user by verifying the JWT token.
 */
const authenticate = (req, res, next) => {
    const token = req.header('Authorization');

    if (!token) {
        return res.status(401).json({ error: 'Access denied. No token provided.' });
    }

    try {
        // Verify the token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded; // Attach the decoded user info to the request
        next(); // Continue to the next middleware or route handler
    } catch (error) {
        res.status(400).json({ error: 'Invalid token.' });
    }
};

module.exports = authenticate;
