const Message = require('../models/Message');
const Room = require('../models/Room');

const getRooms = async (req, res) => {
    try {
        const rooms = await Room.findAll();
        res.status(200).json(rooms);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const sendMessage = async (req, res) => {

    const { roomId, userId, message } = req.body;

    try {
        const result = await Message.create(roomId, userId, message);

        res.status(201).json({
            message: 'Message sent',
            data: result.rows[0]
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const getMessagesByRoomId = async (req, res) => {
    const { roomId } = req.params;
    try {
        const messages = await Message.getMessagesByRoomId(roomId);
        res.status(200).json(messages);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

module.exports = { getRooms, sendMessage, getMessagesByRoomId };