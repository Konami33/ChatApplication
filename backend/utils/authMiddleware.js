const jwt = require('jsonwebtoken');
require('dotenv').config();

/**
 * Middleware to authenticate the user by verifying the JWT token.
 */
const authenticate = (req, res, next) => {
    const authHeader = req.header('Authorization');

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Access denied. No token provided.' });
    }

    // Extract token by removing "Bearer " prefix
    const token = authHeader.split(' ')[1];

    try {
        // Verify the token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded; // Attach the decoded user info to the request
        next(); // Continue to the next middleware or route handler
    } catch (error) {
        res.status(403).json({ error: 'Invalid token.' });
    }
};

module.exports = authenticate;
