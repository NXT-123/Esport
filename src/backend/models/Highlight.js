const mongoose = require('mongoose');

const highlightSchema = new mongoose.Schema({
    title: {
        type: String,
        required: [true, 'Highlight title is required'],
        trim: true,
        maxlength: [200, 'Title cannot exceed 200 characters']
    },
    description: {
        type: String,
        required: [true, 'Highlight description is required'],
        maxlength: [1000, 'Description cannot exceed 1000 characters']
    },
    url: {
        type: String,
        required: [true, 'Highlight URL is required'],
        validate: {
            validator: function(v) {
                return /^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/.test(v);
            },
            message: 'Please provide a valid URL'
        }
    },
    tournamentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Tournament',
        required: [true, 'Tournament ID is required']
    },
    matchId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Match'
    },
    type: {
        type: String,
        enum: ['video', 'image', 'article', 'stream', 'clip'],
        default: 'video'
    },
    // Video/Stream specific fields
    duration: {
        type: Number, // in seconds
        default: 0
    },
    thumbnail: {
        type: String,
        default: ''
    },
    // Metadata
    platform: {
        type: String,
        enum: ['youtube', 'twitch', 'facebook', 'twitter', 'instagram', 'custom'],
        default: 'custom'
    },
    externalId: {
        type: String, // ID from external platform
        default: ''
    },
    // Engagement metrics
    views: {
        type: Number,
        default: 0
    },
    likes: {
        type: Number,
        default: 0
    },
    shares: {
        type: Number,
        default: 0
    },
    // Content information
    tags: [{
        type: String,
        trim: true
    }],
    // Author/Creator information
    creatorId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    creatorName: {
        type: String,
        trim: true
    },
    // Timing information
    publishedAt: {
        type: Date,
        default: Date.now
    },
    featuredUntil: {
        type: Date
    },
    // Status and visibility
    status: {
        type: String,
        enum: ['draft', 'published', 'archived', 'removed'],
        default: 'published'
    },
    isFeatured: {
        type: Boolean,
        default: false
    },
    isPublic: {
        type: Boolean,
        default: true
    },
    // Additional metadata for different content types
    metadata: {
        resolution: String,
        fileSize: Number,
        codec: String,
        frameRate: Number,
        aspectRatio: String,
        language: String,
        subtitles: Boolean
    }
}, {
    timestamps: true
});

// Indexes for better query performance
highlightSchema.index({ tournamentId: 1, publishedAt: -1 });
highlightSchema.index({ matchId: 1 });
highlightSchema.index({ status: 1, isFeatured: -1 });
highlightSchema.index({ type: 1 });
highlightSchema.index({ platform: 1, externalId: 1 });

// Instance methods from class diagram
highlightSchema.methods.updateStatus = function(newStatus) {
    this.status = newStatus;
    return this.save();
};

highlightSchema.methods.editDetails = function(updateData) {
    Object.assign(this, updateData);
    return this.save();
};

highlightSchema.methods.attachToMatch = function(matchId) {
    this.matchId = matchId;
    return this.save();
};

highlightSchema.methods.incrementViews = function() {
    this.views += 1;
    return this.save();
};

highlightSchema.methods.toggleLike = function() {
    this.likes += 1;
    return this.save();
};

highlightSchema.methods.incrementShares = function() {
    this.shares += 1;
    return this.save();
};

highlightSchema.methods.setFeatured = function(featured = true, featuredUntil = null) {
    this.isFeatured = featured;
    if (featuredUntil) {
        this.featuredUntil = featuredUntil;
    }
    return this.save();
};

highlightSchema.methods.addTag = function(tag) {
    if (!this.tags.includes(tag)) {
        this.tags.push(tag);
        return this.save();
    }
    return this;
};

highlightSchema.methods.removeTag = function(tag) {
    this.tags = this.tags.filter(t => t !== tag);
    return this.save();
};

highlightSchema.methods.updateMetadata = function(metadata) {
    this.metadata = { ...this.metadata, ...metadata };
    return this.save();
};

// Static methods
highlightSchema.statics.findByTournament = function(tournamentId) {
    return this.find({ 
        tournamentId,
        status: 'published',
        isPublic: true 
    }).sort({ publishedAt: -1 });
};

highlightSchema.statics.findByMatch = function(matchId) {
    return this.find({ 
        matchId,
        status: 'published',
        isPublic: true 
    }).sort({ publishedAt: -1 });
};

highlightSchema.statics.findFeatured = function() {
    const now = new Date();
    return this.find({ 
        status: 'published',
        isPublic: true,
        isFeatured: true,
        $or: [
            { featuredUntil: { $exists: false } },
            { featuredUntil: null },
            { featuredUntil: { $gte: now } }
        ]
    }).sort({ publishedAt: -1 });
};

highlightSchema.statics.findByType = function(type) {
    return this.find({ 
        type,
        status: 'published',
        isPublic: true 
    }).sort({ publishedAt: -1 });
};

highlightSchema.statics.findByPlatform = function(platform) {
    return this.find({ 
        platform,
        status: 'published',
        isPublic: true 
    }).sort({ publishedAt: -1 });
};

highlightSchema.statics.findPopular = function(limit = 10) {
    return this.find({ 
        status: 'published',
        isPublic: true 
    }).sort({ 
        views: -1, 
        likes: -1,
        publishedAt: -1 
    }).limit(limit);
};

highlightSchema.statics.searchByTitle = function(searchTerm) {
    return this.find({
        status: 'published',
        isPublic: true,
        title: { $regex: searchTerm, $options: 'i' }
    }).sort({ publishedAt: -1 });
};

highlightSchema.statics.findByTags = function(tags) {
    return this.find({
        status: 'published',
        isPublic: true,
        tags: { $in: tags }
    }).sort({ publishedAt: -1 });
};

module.exports = mongoose.model('Highlight', highlightSchema);