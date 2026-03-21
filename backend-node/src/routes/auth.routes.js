const express = require('express');
const { signup, login, getMe } = require('../controllers/auth.controller');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

router.post('/signup', signup);
router.post('/login', login);
router.get('/me', authMiddleware, getMe);

module.exports = router;
