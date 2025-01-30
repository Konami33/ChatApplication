const { pool } = require('../config/db');

const Room = {
    // Create a new chat room
    async create(name, userId) {
        try {
            // Start a transaction
            const client = await pool.connect();
            try {
                await client.query('BEGIN');
                
                // Create the room
                const roomResult = await client.query(
                    'INSERT INTO chat_rooms (name) VALUES ($1) RETURNING *',
                    [name]
                );
                const room = roomResult.rows[0];

                // Add the creator to the room
                await client.query(
                    'INSERT INTO room_users (room_id, user_id) VALUES ($1, $2)',
                    [room.id, userId]
                );

                await client.query('COMMIT');
                return room;
            } catch (error) {
                await client.query('ROLLBACK');
                throw error;
            } finally {
                client.release();
            }
        } catch (error) {
            console.error('Error creating room:', error);
            throw error;
        }
    },

    // Get all chat rooms
    async findAll() {
        const result = await pool.query('SELECT * FROM chat_rooms ORDER BY id ASC');
        return result.rows;
    },

    // Find a chat room by ID
    async findById(roomId) {
        try {
            const result = await pool.query(
                'SELECT * FROM chat_rooms WHERE id = $1',
                [roomId]
            );
            return result.rows[0];
        } catch (error) {
            throw error;
        }
    },

    async addUserToRoom(roomId, userId) {
        try {
            await pool.query(
                'INSERT INTO room_users (room_id, user_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
                [roomId, userId]
            );
        } catch (error) {
            throw error;
        }
    },

    async removeUserFromRoom(roomId, userId) {
        await pool.query(
            'DELETE FROM room_users WHERE room_id = $1 AND user_id = $2',
            [roomId, userId]
        );
    },

    async getRoomUsers(roomId) {
        const result = await pool.query(
            'SELECT users.id, users.username FROM users ' +
            'INNER JOIN room_users ON users.id = room_users.user_id ' +
            'WHERE room_users.room_id = $1',
            [roomId]
        );
        return result.rows;
    },

    async getUserRooms(userId) {
        try {
            const result = await pool.query(
                `SELECT DISTINCT r.* 
                FROM chat_rooms r 
                INNER JOIN room_users ru ON r.id = ru.room_id 
                WHERE ru.user_id = $1`,
                [userId]
            );
            return result.rows;
        } catch (error) {
            throw error;
        }
    }
};

module.exports = Room;
