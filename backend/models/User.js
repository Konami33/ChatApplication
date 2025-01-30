const bcrypt = require('bcrypt');
const { pool } = require('../config/db');

const User = {
    async createUser(username, password) {
        const hashedPassword = await bcrypt.hash(password, 10);
        const result = await pool.query(
            'INSERT INTO users (username, password) VALUES ($1, $2) RETURNING *',
            [username, hashedPassword]
        );
    
        return result.rows[0];
    
    },
    
    async findUserByUsername(username) {
        const result = await pool.query(
            'SELECT * FROM users WHERE username = $1',
            [username]
        );
    
        return result.rows[0];
    },
    
    async findById(userId) {
        const result = await pool.query(
            'SELECT id, username FROM users WHERE id = $1',
            [userId]
        );
        return result.rows[0];
    },
};

module.exports = User;