const express = require('express');
const { getRooms, sendMessage, getMessagesByRoomId, createRoom, getRoomUsers, getRoomById, joinRoom } = require('../controllers/chatController');
const authenticate = require('../utils/authMiddleware');

const router = express.Router();

router.get('/rooms', authenticate, getRooms);

router.post('/message', authenticate, sendMessage);

router.get('/rooms/:roomId/messages', authenticate, getMessagesByRoomId);

router.post('/rooms', authenticate, createRoom);

router.get('/rooms/:roomId/users', authenticate, getRoomUsers);

router.get('/rooms/:roomId', authenticate, getRoomById);

router.post('/rooms/:roomId/join', authenticate, joinRoom);

module.exports = router;