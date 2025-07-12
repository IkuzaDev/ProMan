const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { redirectIfAuth } = require('../middleware/auth');

// Login
router.get('/login', redirectIfAuth, authController.getLogin);
router.post('/login', redirectIfAuth, authController.postLogin);

// Register
router.get('/register', redirectIfAuth, authController.getRegister);
router.post('/register', redirectIfAuth, authController.postRegister);

// Forgot Password
router.get('/forgot-password', redirectIfAuth, authController.getForgotPassword);
router.post('/forgot-password', redirectIfAuth, authController.postForgotPassword);

// Logout
router.get('/logout', authController.logout);

module.exports = router; 