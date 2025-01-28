const { pool } = require('../config/db');

const Room = {
    // Create a new chat room
    async create(name) {
        const result = await pool.query('INSERT INTO chat_rooms (name) VALUES ($1) RETURNING *', [name]);
        return result.rows[0];
    },

    // Get all chat rooms
    async findAll() {
        const result = await pool.query('SELECT * FROM chat_rooms ORDER BY id ASC');
        return result.rows;
    },

    // Find a chat room by ID
    async findById(roomId) {
        const result = await pool.query('SELECT * FROM chat_rooms WHERE id = $1', [roomId]);
        return result.rows[0];
    },
};

module.exports = Room;
