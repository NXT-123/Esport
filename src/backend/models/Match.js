const mongoose = require('mongoose');

const matchSchema = new mongoose.Schema({
    tournamentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Tournament',
        required: [true, 'Tournament ID is required']
    },
    teamAId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Competitor',
        required: [true, 'Team A ID is required']
    },
    teamBId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Competitor',
        required: [true, 'Team B ID is required']
    },
    scheduleAt: {
        type: Date,
        required: [true, 'Schedule date is required']
    },
    result: {
        type: String,
        default: '',
        maxlength: [200, 'Result cannot exceed 200 characters']
    },
    score: {
        teamA: {
            type: Number,
            default: 0,
            min: [0, 'Score cannot be negative']
        },
        teamB: {
            type: Number,
            default: 0,
            min: [0, 'Score cannot be negative']
        }
    },
    status: {
        type: String,
        enum: ['scheduled', 'ongoing', 'completed', 'cancelled', 'postponed'],
        default: 'scheduled'
    },
    round: {
        type: Number,
        default: 1,
        min: [1, 'Round must be at least 1']
    },
    bracket: {
        type: String,
        enum: ['winners', 'losers', 'finals', 'group'],
        default: 'winners'
    },
    // Match metadata
    duration: {
        type: Number, // in minutes
        default: 0
    },
    startTime: {
        type: Date
    },
    endTime: {
        type: Date
    },
    // Winner information
    winnerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Competitor'
    },
    // Match format specific data
    bestOf: {
        type: Number,
        default: 1,
        min: [1, 'Best of must be at least 1']
    },
    games: [{
        gameNumber: Number,
        teamAScore: Number,
        teamBScore: Number,
        winner: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Competitor'
        },
        duration: Number, // in minutes
        notes: String
    }],
    // Additional information
    streamUrl: {
        type: String,
        default: ''
    },
    notes: {
        type: String,
        maxlength: [1000, 'Notes cannot exceed 1000 characters']
    },
    // Referee information
    refereeId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }
}, {
    timestamps: true
});

// Indexes for better query performance
matchSchema.index({ tournamentId: 1, scheduleAt: 1 });
matchSchema.index({ teamAId: 1 });
matchSchema.index({ teamBId: 1 });
matchSchema.index({ status: 1 });

// Validation to ensure teams are different
matchSchema.pre('save', function(next) {
    if (this.teamAId.equals(this.teamBId)) {
        return next(new Error('Team A and Team B cannot be the same'));
    }
    
    if (this.endTime && this.startTime && this.endTime <= this.startTime) {
        return next(new Error('End time must be after start time'));
    }
    
    next();
});

// Instance methods from class diagram
matchSchema.methods.setResult = function(result, scoreA, scoreB) {
    this.result = result;
    this.score.teamA = scoreA;
    this.score.teamB = scoreB;
    
    // Determine winner
    if (scoreA > scoreB) {
        this.winnerId = this.teamAId;
    } else if (scoreB > scoreA) {
        this.winnerId = this.teamBId;
    }
    
    this.status = 'completed';
    this.endTime = new Date();
    
    return this.save();
};

matchSchema.methods.rescheduleNewDate = function(newDate) {
    this.scheduleAt = newDate;
    this.status = 'scheduled';
    return this.save();
};

matchSchema.methods.getTeams = function() {
    return this.populate(['teamAId', 'teamBId']);
};

matchSchema.methods.start = function() {
    this.status = 'ongoing';
    this.startTime = new Date();
    return this.save();
};

matchSchema.methods.cancel = function(reason = '') {
    this.status = 'cancelled';
    this.notes = reason;
    return this.save();
};

matchSchema.methods.postpone = function(reason = '') {
    this.status = 'postponed';
    this.notes = reason;
    return this.save();
};

matchSchema.methods.addGame = function(gameData) {
    this.games.push(gameData);
    
    // Check if match is complete based on best-of format
    const requiredWins = Math.ceil(this.bestOf / 2);
    const teamAWins = this.games.filter(game => game.winner && game.winner.equals(this.teamAId)).length;
    const teamBWins = this.games.filter(game => game.winner && game.winner.equals(this.teamBId)).length;
    
    if (teamAWins >= requiredWins) {
        this.winnerId = this.teamAId;
        this.status = 'completed';
        this.endTime = new Date();
    } else if (teamBWins >= requiredWins) {
        this.winnerId = this.teamBId;
        this.status = 'completed';
        this.endTime = new Date();
    }
    
    return this.save();
};

// Static methods
matchSchema.statics.findByTournament = function(tournamentId) {
    return this.find({ tournamentId })
        .populate('teamAId teamBId', 'name logo')
        .sort({ scheduleAt: 1 });
};

matchSchema.statics.findByCompetitor = function(competitorId) {
    return this.find({
        $or: [
            { teamAId: competitorId },
            { teamBId: competitorId }
        ]
    }).populate('tournamentId', 'name status');
};

matchSchema.statics.findUpcoming = function() {
    return this.find({
        status: 'scheduled',
        scheduleAt: { $gte: new Date() }
    }).sort({ scheduleAt: 1 });
};

matchSchema.statics.findOngoing = function() {
    return this.find({ status: 'ongoing' });
};

module.exports = mongoose.model('Match', matchSchema);