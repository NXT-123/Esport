const mongoose = require('mongoose');

const newsSchema = new mongoose.Schema({
    _id: {
        type: String,
    },
    tournamentId: {
        type: String,
        ref: 'Tournament',
        required: true
    },
    title: {
        type: String,
        required: true,
        trim: true
    },
    content: {
        type: String,
        trim: true
    },
    images: [{
        type: String,
        trim: true
    }],
    authorId: {
        type: String,
        ref: 'User',
        required: true
    },
    status: {
        type: String,
        enum: ['private', 'public'],
        default: 'public'
    },
    publishedAt: {
        type: Date
    }
}, {
    timestamps: true // Tự động tạo createdAt, updatedAt
});

module.exports = mongoose.model('News', newsSchema);