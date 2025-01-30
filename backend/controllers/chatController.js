const Message = require('../models/Message');
const Room = require('../models/Room');
const User = require('../models/User');

const getRooms = async (req, res) => {
    try {
        const userId = req.user.userId;
        const rooms = await Room.getUserRooms(userId);
        res.json(rooms);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const sendMessage = async (req, res) => {
    const { roomId, message } = req.body;
    const userId = req.user.userId;

    try {
        // Verify room exists and user is a member
        const room = await Room.findById(roomId);
        if (!room) {
            return res.status(404).json({ error: 'Room not found' });
        }

        // Verify user is member of room
        const roomUsers = await Room.getRoomUsers(roomId);
        const isMember = roomUsers.some(user => user.id === userId);
        if (!isMember) {
            return res.status(403).json({ error: 'User is not a member of this room' });
        }

        // Create message
        const newMessage = await Message.create(roomId, userId, message);
        
        // Get user information
        const user = await User.findById(userId);
        const messageWithUser = {
            ...newMessage,
            username: user.username
        };

        res.status(201).json(messageWithUser);
    } catch (error) {
        console.error('Error sending message:', error);
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

const createRoom = async (req, res) => {
    const { name } = req.body;
    const userId = req.user.userId;

    try {
        if (!name || name.trim().length === 0) {
            return res.status(400).json({ error: 'Room name is required' });
        }

        const room = await Room.create(name.trim(), userId);
        res.status(201).json(room);
    } catch (error) {
        console.error('Error creating room:', error);
        res.status(500).json({ error: error.message });
    }
};

const getRoomUsers = async (req, res) => {
    const { roomId } = req.params;
    try {
        const users = await Room.getRoomUsers(roomId);
        res.status(200).json(users);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const getRoomById = async (req, res) => {
    const { roomId } = req.params;
    try {
        const room = await Room.findById(roomId);
        if (!room) {
            return res.status(404).json({ error: 'Room not found' });
        }
        res.status(200).json(room);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const joinRoom = async (req, res) => {
    const { roomId } = req.params;
    const userId = req.user.userId;
    
    try {
        await Room.addUserToRoom(roomId, userId);
        const room = await Room.findById(roomId);
        res.json(room);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

module.exports = { getRooms, sendMessage, getMessagesByRoomId, createRoom, getRoomUsers, getRoomById, joinRoom };