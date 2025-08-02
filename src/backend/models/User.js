const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const validator = require('validator');

const userSchema = new mongoose.Schema({
    email: {
        type: String,
        required: [true, 'Email is required'],
        unique: true,
        lowercase: true,
        validate: [validator.isEmail, 'Please provide a valid email']
    },
    fullName: {
        type: String,
        required: [true, 'Full name is required'],
        trim: true,
        maxlength: [100, 'Full name cannot exceed 100 characters']
    },
    role: {
        type: String,
        enum: ['user', 'organizer', 'admin'],
        default: 'user'
    },
    avatar: {
        type: String,
        default: ''
    },
    favorites: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Tournament'
    }],
    password: {
        type: String,
        required: [true, 'Password is required'],
        minlength: [6, 'Password must be at least 6 characters'],
        select: false
    },
    isActive: {
        type: Boolean,
        default: true
    },
    lastLogin: {
        type: Date
    }
}, {
    timestamps: true
});

// Encrypt password before saving
userSchema.pre('save', async function(next) {
    if (!this.isModified('password')) return next();
    
    this.password = await bcrypt.hash(this.password, 12);
    next();
});

// Compare password method
userSchema.methods.comparePassword = async function(candidatePassword) {
    return await bcrypt.compare(candidatePassword, this.password);
};

// Instance methods from class diagram
userSchema.methods.addToFavorites = function(tournamentId) {
    if (!this.favorites.includes(tournamentId)) {
        this.favorites.push(tournamentId);
        return this.save();
    }
    return this;
};

userSchema.methods.removeFavorites = function(tournamentId) {
    this.favorites = this.favorites.filter(id => !id.equals(tournamentId));
    return this.save();
};

userSchema.methods.updateProfile = function(updateData) {
    Object.assign(this, updateData);
    return this.save();
};

userSchema.methods.getFavoriteTournaments = function() {
    return this.populate('favorites');
};

module.exports = mongoose.model('User', userSchema);