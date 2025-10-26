// server/models/QrLink.js
const mongoose = require('mongoose');

const QrLinkSchema = new mongoose.Schema({
    shortCode: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        minlength: 4, // Ensure short codes are at least 4 characters for readability/uniqueness
        maxlength: 10 // A reasonable max length
    },
    originalContent: {
        type: String,
        required: true,
        trim: true
    },
    visits: {
        type: Number,
        default: 0
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User', // Reference to the User who created it (optional, but good for tracking)
        required: false // Set to true if you want to enforce that QrLinks must be created by a logged-in user
    },
    eventType: { // To link QR codes specifically to an event
        type: String, // e.g., 'event'
        enum: ['event', 'custom'], // Can be linked to an event or a general custom QR
        default: 'custom'
    },
    eventRef: { // If eventType is 'event', this stores the event's ID
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Event', // Reference to the Event model
        required: false
    }
}, {
    timestamps: true // Adds createdAt and updatedAt fields
});

module.exports = mongoose.model('QrLink', QrLinkSchema);