const mongoose = require('mongoose');

const competitorSchema = new mongoose.Schema({
    _id: { type: mongoose.Schema.Types.ObjectId, default: () => new mongoose.Types.ObjectId() },
    name: { type: String, required: true },
    logoUrl: { type: String },
    tournamentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Tournament', required: true },
}, { timestamps: true });

module.exports = mongoose.model('Competitor', competitorSchema);