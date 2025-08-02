const mongoose = require('mongoose');

const highlightSchema = new mongoose.Schema({
    _id: {
        type: String,
    },
    tournamentId: {
        type: String,
        ref: 'Tournament',
        required: true
    },
    matchId: {
        type: String,
        ref: 'Match',
        required: true
    },
    title: {
        type: String,
        trim: true
    },
    videoUrl: {
        type: String,
        trim: true
    },
    description: {
        type: String,
        trim: true
    },
    status: {
        type: String,
        enum: ['private', 'public'],
        default: 'public'
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: false // createdAt đã được khai báo riêng
});

module.exports = mongoose.model('Highlight', highlightSchema);