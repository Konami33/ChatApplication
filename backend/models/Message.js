const { pool } = require('../config/db');

const Message = {
    async create(roomId, userId, message) {
        try {
            const result = await pool.query(
                `INSERT INTO messages (room_id, user_id, message) 
                 VALUES ($1, $2, $3) 
                 RETURNING id, room_id, user_id, message, created_at`,
                [roomId, userId, message]
            );
            return result.rows[0];
        } catch (error) {
            console.error('Error creating message:', error);
            throw error;
        }
    },
    
    async getMessagesByRoomId(roomId) {
        try {
            const result = await pool.query(
                `SELECT 
                    m.id,
                    m.room_id,
                    m.user_id,
                    m.message,
                    m.created_at,
                    u.username
                FROM messages m
                JOIN users u ON m.user_id = u.id
                WHERE m.room_id = $1 
                ORDER BY m.created_at ASC`,
                [roomId]
            );
            return result.rows;
        } catch (error) {
            console.error('Error getting messages:', error);
            throw error;
        }
    },
};

module.exports = Message;