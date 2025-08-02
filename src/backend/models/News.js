const mongoose = require('mongoose');

const newsSchema = new mongoose.Schema({
    title: {
        type: String,
        required: [true, 'News title is required'],
        trim: true,
        maxlength: [200, 'Title cannot exceed 200 characters']
    },
    content: {
        type: String,
        required: [true, 'News content is required'],
        maxlength: [5000, 'Content cannot exceed 5000 characters']
    },
    authorId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'Author is required']
    },
    tournamentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Tournament',
        required: [true, 'Tournament ID is required']
    },
    publishedAt: {
        type: Date,
        default: Date.now
    },
    status: {
        type: String,
        enum: ['draft', 'published', 'archived'],
        default: 'draft'
    },
    images: [{
        url: String,
        caption: String,
        altText: String
    }],
    tags: [{
        type: String,
        trim: true
    }],
    priority: {
        type: String,
        enum: ['low', 'normal', 'high', 'urgent'],
        default: 'normal'
    },
    // SEO and metadata
    slug: {
        type: String,
        unique: true,
        lowercase: true
    },
    metaDescription: {
        type: String,
        maxlength: [160, 'Meta description cannot exceed 160 characters']
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
    // Comments (simplified)
    comments: [{
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        content: {
            type: String,
            maxlength: [500, 'Comment cannot exceed 500 characters']
        },
        createdAt: {
            type: Date,
            default: Date.now
        }
    }],
    // Visibility settings
    isPublic: {
        type: Boolean,
        default: true
    },
    isFeatured: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true
});

// Indexes for better query performance
newsSchema.index({ tournamentId: 1, publishedAt: -1 });
newsSchema.index({ status: 1, publishedAt: -1 });
newsSchema.index({ slug: 1 });
newsSchema.index({ tags: 1 });

// Generate slug before saving
newsSchema.pre('save', function(next) {
    if (this.isModified('title') && !this.slug) {
        this.slug = this.title
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-+|-+$/g, '')
            + '-' + Date.now();
    }
    next();
});

// Instance methods from class diagram
newsSchema.methods.publish = function() {
    this.status = 'published';
    this.publishedAt = new Date();
    return this.save();
};

newsSchema.methods.editTitle = function(newTitle) {
    this.title = newTitle;
    // Regenerate slug if title changes significantly
    this.slug = newTitle
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
        + '-' + this._id;
    return this.save();
};

newsSchema.methods.setVisibility = function(isPublic) {
    this.isPublic = isPublic;
    return this.save();
};

newsSchema.methods.addComment = function(userId, content) {
    this.comments.push({ userId, content });
    return this.save();
};

newsSchema.methods.removeComment = function(commentId) {
    this.comments.id(commentId).remove();
    return this.save();
};

newsSchema.methods.incrementViews = function() {
    this.views += 1;
    return this.save();
};

newsSchema.methods.toggleLike = function() {
    this.likes += 1;
    return this.save();
};

newsSchema.methods.addImage = function(imageData) {
    this.images.push(imageData);
    return this.save();
};

newsSchema.methods.removeImage = function(imageId) {
    this.images.id(imageId).remove();
    return this.save();
};

// Static methods
newsSchema.statics.findPublished = function() {
    return this.find({ 
        status: 'published',
        isPublic: true 
    }).sort({ publishedAt: -1 });
};

newsSchema.statics.findByTournament = function(tournamentId) {
    return this.find({ 
        tournamentId,
        status: 'published',
        isPublic: true 
    }).sort({ publishedAt: -1 });
};

newsSchema.statics.findFeatured = function() {
    return this.find({ 
        status: 'published',
        isPublic: true,
        isFeatured: true 
    }).sort({ publishedAt: -1 });
};

newsSchema.statics.findByAuthor = function(authorId) {
    return this.find({ authorId }).sort({ createdAt: -1 });
};

newsSchema.statics.searchByTitle = function(searchTerm) {
    return this.find({
        status: 'published',
        isPublic: true,
        title: { $regex: searchTerm, $options: 'i' }
    }).sort({ publishedAt: -1 });
};

newsSchema.statics.findByTags = function(tags) {
    return this.find({
        status: 'published',
        isPublic: true,
        tags: { $in: tags }
    }).sort({ publishedAt: -1 });
};

module.exports = mongoose.model('News', newsSchema);