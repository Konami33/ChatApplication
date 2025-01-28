const User = require('../models/User');
const getUser = async (req, res) => {
    const { username } = req.params;

    try {
        const user = await User.findUserByUsername(username);

        if (!user) {
            return res.status(404).json({
                error: 'User not found'
            });
        }

        res.status(200).json(user);
    } catch (error) {
        res.status(500).json({
            error: error.message
        });
    }
};

module.exports = { getUser };