const express = require('express');
const { getRooms, sendMessage, getMessagesByRoomId } = require('../controllers/chatController');
const authenticate = require('../middlewares/authenticate');

const router = express.Router();

router.get('/rooms', authenticate, getRooms);

router.post('/message', authenticate, sendMessage);

router.get('/rooms/:roomId/messages', authenticate, getMessagesByRoomId);

module.exports = router;