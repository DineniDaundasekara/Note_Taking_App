const mongoose = require('mongoose');

const checklistSchema = new mongoose.Schema({
  text: { type: String, required: true },
  completed: { type: Boolean, default: false },
  order: { type: Number, default: 0 }
});

const noteSchema = new mongoose.Schema({
  title: { type: String, required: [true, 'Title is required'], maxlength: 200 },
  description: { type: String, maxlength: 500, default: '' },
  content: { type: String, default: '' },
  contentText: { type: String, default: '' },
  owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  collaborators: [{
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    permission: { type: String, enum: ['read', 'write'], default: 'read' }
  }],
  lastEditedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  tags: [String],
  color: { type: String, default: '#ffffff' },
  priority: { type: String, enum: ['none', 'low', 'medium', 'high'], default: 'none' },
  status: { type: String, enum: ['active', 'draft', 'completed'], default: 'active' },
  dueDate: { type: Date, default: null },
  checklist: [checklistSchema],
  isPinned: { type: Boolean, default: false },
  isArchived: { type: Boolean, default: false },
  isFavorite: { type: Boolean, default: false },
  viewCount: { type: Number, default: 0 },
  coverImage: { type: String }
}, { timestamps: true });

// Text index for search
noteSchema.index({ title: 'text', contentText: 'text', tags: 'text' });

// Instance method to check access
noteSchema.methods.hasAccess = function (userId) {
  const getStrId = (val) => (val && val._id ? val._id.toString() : val ? val.toString() : null);
  
  const ownerId = getStrId(this.owner);
  const targetId = userId.toString();

  if (ownerId === targetId) return 'owner';

  const collab = this.collaborators.find(c => getStrId(c.user) === targetId);
  return collab ? collab.permission : null;
};

module.exports = mongoose.model('Note', noteSchema);