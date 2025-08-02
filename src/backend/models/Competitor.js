const mongoose = require('mongoose');

const competitorSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Competitor name is required'],
        trim: true,
        maxlength: [100, 'Competitor name cannot exceed 100 characters']
    },
    logo: {
        type: String,
        default: ''
    },
    tournamentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Tournament',
        required: [true, 'Tournament ID is required']
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'User ID is required']
    },
    registrationDate: {
        type: Date,
        default: Date.now
    },
    isActive: {
        type: Boolean,
        default: true
    },
    // Tournament-specific data
    seed: {
        type: Number,
        default: 0
    },
    wins: {
        type: Number,
        default: 0
    },
    losses: {
        type: Number,
        default: 0
    },
    points: {
        type: Number,
        default: 0
    },
    // Team information (if team-based tournament)
    teamMembers: [{
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        role: {
            type: String,
            default: 'member'
        },
        joinDate: {
            type: Date,
            default: Date.now
        }
    }],
    // Contact information
    contactInfo: {
        email: String,
        phone: String,
        discord: String
    },
    // Additional metadata
    notes: {
        type: String,
        maxlength: [500, 'Notes cannot exceed 500 characters']
    }
}, {
    timestamps: true
});

// Compound index to ensure unique competitor per tournament per user
competitorSchema.index({ tournamentId: 1, userId: 1 }, { unique: true });

// Instance methods from class diagram
competitorSchema.methods.updateLogout = function(logoutData) {
    Object.assign(this, logoutData);
    return this.save();
};

competitorSchema.methods.assignToTournament = function(tournamentId) {
    this.tournamentId = tournamentId;
    return this.save();
};

competitorSchema.methods.getMatches = function() {
    return mongoose.model('Match').find({
        $or: [
            { teamAId: this._id },
            { teamBId: this._id }
        ]
    }).populate('tournamentId');
};

competitorSchema.methods.addTeamMember = function(userId, role = 'member') {
    const existingMember = this.teamMembers.find(member => 
        member.userId.equals(userId)
    );
    
    if (!existingMember) {
        this.teamMembers.push({ userId, role });
        return this.save();
    }
    return this;
};

competitorSchema.methods.removeTeamMember = function(userId) {
    this.teamMembers = this.teamMembers.filter(member => 
        !member.userId.equals(userId)
    );
    return this.save();
};

competitorSchema.methods.updateStats = function(win = false) {
    if (win) {
        this.wins += 1;
        this.points += 3; // Default scoring system
    } else {
        this.losses += 1;
    }
    return this.save();
};

// Static methods
competitorSchema.statics.findByTournament = function(tournamentId) {
    return this.find({ tournamentId, isActive: true })
        .populate('userId', 'fullName email avatar')
        .populate('teamMembers.userId', 'fullName email');
};

competitorSchema.statics.findByUser = function(userId) {
    return this.find({ userId, isActive: true })
        .populate('tournamentId', 'name status startDate endDate');
};

module.exports = mongoose.model('Competitor', competitorSchema);