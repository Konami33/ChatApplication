const pool = require('../config/db');

const Message = {
    async create(roomId, userId, message) {
        const result = await pool.query(
            'INSERT INTO messages (room_id, user_id, message) VALUES ($1, $2, $3) RETURNING *',
            [roomId, userId, message]
        );
    
        return result.rows[0];
    },
    
    async getMessagesByRoomId(roomId) {
        const result = await pool.query(
            'SELECT * FROM messages WHERE room_id = $1 ORDER BY created_at ASC',
            [roomId]
        );
    
        return result.rows;
    },
};

module.exports = Message;