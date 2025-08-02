const mongoose = require('mongoose');

const matchSchema = new mongoose.Schema({
    _id: { type: mongoose.Schema.Types.ObjectId, default: () => new mongoose.Types.ObjectId() },
    tournamentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Tournament', required: true },
    teamAId: { type: mongoose.Schema.Types.ObjectId, ref: 'Competitor', required: true },
    teamBId: { type: mongoose.Schema.Types.ObjectId, ref: 'Competitor', required: true },
    scheduledAt: { type: Date },
    result: { type: String, default: '' },
    score: { type: String, default: '' },
}, { timestamps: true });

module.exports = mongoose.model('Match', matchSchema);