// server/routes/authRoutes.js
const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController'); // This path assumes 'controllers' is parallel to 'routes'

// Route for user registration
// POST /api/auth/register
router.post('/register', authController.register);

// Route for user login
// POST /api/auth/login
router.post('/login', authController.login);

module.exports = router;