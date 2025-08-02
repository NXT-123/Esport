const mongoose = require('mongoose');

const tournamentSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Tournament name is required'],
        trim: true,
        maxlength: [200, 'Tournament name cannot exceed 200 characters']
    },
    format: {
        type: String,
        required: [true, 'Tournament format is required'],
        enum: ['single-elimination', 'double-elimination', 'round-robin', 'swiss', 'league']
    },
    status: {
        type: String,
        enum: ['upcoming', 'ongoing', 'completed', 'cancelled'],
        default: 'upcoming'
    },
    description: {
        type: String,
        required: [true, 'Tournament description is required'],
        maxlength: [1000, 'Description cannot exceed 1000 characters']
    },
    gameName: {
        type: String,
        required: [true, 'Game name is required'],
        trim: true
    },
    organizerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'Organizer is required']
    },
    startDate: {
        type: Date,
        required: [true, 'Start date is required']
    },
    endDate: {
        type: Date,
        required: [true, 'End date is required']
    },
    maxPlayers: {
        type: Number,
        required: [true, 'Maximum players is required'],
        min: [2, 'Tournament must have at least 2 players'],
        max: [1000, 'Tournament cannot exceed 1000 players']
    },
    currentPlayers: {
        type: Number,
        default: 0
    },
    registrationDeadline: {
        type: Date,
        required: [true, 'Registration deadline is required']
    },
    prizePool: {
        type: Number,
        default: 0,
        min: [0, 'Prize pool cannot be negative']
    },
    entryFee: {
        type: Number,
        default: 0,
        min: [0, 'Entry fee cannot be negative']
    },
    rules: {
        type: String,
        maxlength: [2000, 'Rules cannot exceed 2000 characters']
    },
    logo: {
        type: String,
        default: ''
    },
    isPublic: {
        type: Boolean,
        default: true
    },
    tags: [{
        type: String,
        trim: true
    }],
    // References to related entities
    competitors: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Competitor'
    }],
    matches: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Match'
    }]
}, {
    timestamps: true
});

// Validate end date is after start date
tournamentSchema.pre('save', function(next) {
    if (this.endDate <= this.startDate) {
        next(new Error('End date must be after start date'));
    }
    if (this.registrationDeadline >= this.startDate) {
        next(new Error('Registration deadline must be before start date'));
    }
    next();
});

// Instance methods from class diagram
tournamentSchema.methods.addTeam = function(competitorId) {
    if (this.currentPlayers >= this.maxPlayers) {
        throw new Error('Tournament is full');
    }
    if (!this.competitors.includes(competitorId)) {
        this.competitors.push(competitorId);
        this.currentPlayers += 1;
        return this.save();
    }
    return this;
};

tournamentSchema.methods.removeTeam = function(competitorId) {
    const index = this.competitors.indexOf(competitorId);
    if (index > -1) {
        this.competitors.splice(index, 1);
        this.currentPlayers = Math.max(0, this.currentPlayers - 1);
        return this.save();
    }
    return this;
};

tournamentSchema.methods.scheduleMatch = function(matchData) {
    // This will be implemented when Match model is created
    return this;
};

tournamentSchema.methods.updateStatus = function(newStatus) {
    this.status = newStatus;
    return this.save();
};

tournamentSchema.methods.isFull = function() {
    return this.currentPlayers >= this.maxPlayers;
};

tournamentSchema.methods.isRegistrationOpen = function() {
    const now = new Date();
    return now < this.registrationDeadline && this.status === 'upcoming' && !this.isFull();
};

// Static methods
tournamentSchema.statics.findByOrganizer = function(organizerId) {
    return this.find({ organizerId }).populate('organizerId', 'fullName email');
};

tournamentSchema.statics.findUpcoming = function() {
    return this.find({ 
        status: 'upcoming',
        startDate: { $gte: new Date() }
    }).sort({ startDate: 1 });
};

tournamentSchema.statics.findOngoing = function() {
    return this.find({ status: 'ongoing' });
};

module.exports = mongoose.model('Tournament', tournamentSchema);