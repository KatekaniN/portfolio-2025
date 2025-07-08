const express = require('express');
const router = express.Router();
const chatController = require('../controllers/chatController');

// Chat endpoint
router.post('/', chatController.processChat);

// Get chat history (optional)
router.get('/history', chatController.getChatHistory);

module.exports = router;