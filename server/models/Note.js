const mongoose = require('mongoose');

const collaboratorSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  permission: {
    type: String,
    enum: ['read', 'write'],
    default: 'read'
  },
  addedAt: {
    type: Date,
    default: Date.now
  }
});

const noteSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Title is required'],
    trim: true,
    maxlength: [200, 'Title cannot exceed 200 characters']
  },
  content: {
    type: String,
    default: ''
  },
  contentText: {
    type: String,
    default: ''
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  collaborators: [collaboratorSchema],
  tags: [{
    type: String,
    trim: true,
    lowercase: true,
    maxlength: [30, 'Tag cannot exceed 30 characters']
  }],
  color: {
    type: String,
    default: '#ffffff',
    match: [/^#[0-9A-Fa-f]{6}$/, 'Please provide a valid hex color']
  },
  isPinned: { type: Boolean, default: false },
  isArchived: { type: Boolean, default: false },
  lastEditedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, { timestamps: true });

noteSchema.index({ title: 'text', contentText: 'text', tags: 'text' });
noteSchema.index({ owner: 1, createdAt: -1 });
noteSchema.index({ 'collaborators.user': 1 });

noteSchema.methods.hasAccess = function(userId) {
  if (this.owner.toString() === userId.toString()) return 'owner';
  const collab = this.collaborators.find(c => c.user.toString() === userId.toString());
  return collab ? collab.permission : null;
};

module.exports = mongoose.model('Note', noteSchema);