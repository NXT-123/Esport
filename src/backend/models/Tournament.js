const mongoose = require('mongoose');

const tournamentSchema = new mongoose.Schema({
    _id: { type: mongoose.Schema.Types.ObjectId, default: () => new mongoose.Types.ObjectId() },
    name: { type: String, required: true },
    format: { type: String, required: true },  // "round" hoặc "single"
    description: { type: String },
    organizerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },  // removed required to allow seeding
    teams: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Competitor', default: [] }],
    avatarUrl: { type: String },
    gameName: { type: String },
    numberOfPlayers: { type: Number },
    maxPlayers: { type: Number },
    startDate: { type: Date },
    endDate: { type: Date },
    status: { type: String }, // upcoming│ongoing│completed
}, { timestamps: true });

module.exports = mongoose.model('Tournament', tournamentSchema);