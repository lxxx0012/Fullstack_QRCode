// server.js
require('dotenv').config(); // This MUST be at the very top

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const authRoutes = require('./routes/authRoutes'); // Import auth routes
// We will add other routes here later (e.g., eventRoutes)

// Make sure you have bcryptjs and jsonwebtoken installed:
// npm install bcryptjs jsonwebtoken
// Also make sure shortid is installed:
// npm install shortid

const app = express();
const PORT = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGO_URI; // Correctly getting from .env
const BASE_URL = process.env.BASE_URL || `mongodb+srv://root:root@cluster0.lpozpyk.mongodb.net/`; // Use PORT variable for BASE_URL

// Middleware
app.use(cors()); // Enable CORS for all routes (adjust for production)
app.use(express.json()); // Body parser for JSON requests

// --- MongoDB Connection ---
mongoose.connect(MONGODB_URI) // MONGODB_URI should now be defined from .env
    .then(() => console.log('MongoDB connected successfully!'))
    .catch(err => console.error('MongoDB connection error:', err));

// --- Routes ---
// Basic QR code generation route (from previous steps)
const QrLink = require('./models/QrLink'); // Assuming QrLink.js is in models folder now
const shortid = require('shortid'); // Make sure shortid is installed via npm

// Re-include your existing QR generation and redirection routes from previous `server.js`
app.post('/api/generate-dynamic-qr', async (req, res) => {
    const { originalContent } = req.body;
    if (!originalContent) {
        return res.status(400).json({ error: 'Original content is required.' });
    }
    try {
        const shortCode = shortid.generate();
        const newQrLink = new QrLink({ shortCode, originalContent });
        await newQrLink.save();
        // CORRECTED: Template literal syntax for shortUrl
        const shortUrl = `${BASE_URL}/s/${shortCode}`;
        res.status(201).json({ shortUrl, shortCode });
    } catch (error) {
        console.error('Error generating dynamic QR link:', error);
        res.status(500).json({ error: 'Failed to generate dynamic QR link.' });
    }
});

app.get('/s/:shortCode', async (req, res) => {
    const { shortCode } = req.params;
    try {
        const qrLink = await QrLink.findOne({ shortCode });
        if (!qrLink) {
            return res.status(404).send('QR Link not found.');
        }
        // Corrected: use dot notation for scanCount, assuming it's initialized in model
        qrLink.visits = (qrLink.visits || 0) + 1; // Assuming 'visits' is the field name now, consistent with QrLink.js
        qrLink.lastScannedAt = new Date(); // Add this field to your QrLink model if you want to track it
        await qrLink.save();
        res.redirect(qrLink.originalContent);
    } catch (error) {
        console.error('Error retrieving QR link:', error);
        res.status(500).send('Server error.');
    }
});

app.put('/api/update-dynamic-qr/:shortCode', async (req, res) => {
    const { shortCode } = req.params;
    const { newContent } = req.body;
    if (!newContent) {
        return res.status(400).json({ error: 'New content is required.' });
    }
    try {
        const updatedQrLink = await QrLink.findOneAndUpdate(
            { shortCode },
            { originalContent: newContent },
            { new: true }
        );
        if (!updatedQrLink) {
            return res.status(404).json({ error: 'Dynamic QR link not found.' });
        }
        res.json({ message: 'QR content updated successfully!', updatedQrLink });
    } catch (error) {
        console.error('Error updating dynamic QR link:', error);
        res.status(500).json({ error: 'Failed to update dynamic QR link.' });
    }
});


// Use Auth routes
app.use('/api/auth', authRoutes); // All routes in authRoutes.js will be prefixed with /api/auth

// Start the server
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`); // Log the actual base URL
});