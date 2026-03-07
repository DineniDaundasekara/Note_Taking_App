const express = require('express');
const { body, validationResult } = require('express-validator');
const Note = require('../models/Note');
const User = require('../models/User');
const { protect } = require('../middleware/auth');

const router = express.Router();
router.use(protect);

const stripHtml = (html) => html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();

function parseSortString(sort) {
  if (sort.startsWith('-')) return { [sort.slice(1)]: -1 };
  return { [sort]: 1 };
}

// GET all notes
router.get('/', async (req, res, next) => {
  try {
    const { search, tag, archived, pinned, sort = '-updatedAt' } = req.query;

    let query = {
      $or: [{ owner: req.user._id }, { 'collaborators.user': req.user._id }],
      isArchived: archived === 'true'
    };

    if (pinned === 'true') query.isPinned = true;
    if (tag) query.tags = tag.toLowerCase();

    let notes;
    if (search) {
      notes = await Note.find({ ...query, $text: { $search: search } })
        .populate('owner', 'name email avatar')
        .populate('collaborators.user', 'name email avatar')
        .populate('lastEditedBy', 'name')
        .sort({ score: { $meta: 'textScore' }, ...parseSortString(sort) });
    } else {
      notes = await Note.find(query)
        .populate('owner', 'name email avatar')
        .populate('collaborators.user', 'name email avatar')
        .populate('lastEditedBy', 'name')
        .sort(parseSortString(sort));
    }

    res.json({ notes, total: notes.length });
  } catch (error) { next(error); }
});

// POST create note
router.post('/', [
  body('title').trim().notEmpty().withMessage('Title is required').isLength({ max: 200 }),
  body('content').optional(),
  body('tags').optional().isArray(),
  body('color').optional().matches(/^#[0-9A-Fa-f]{6}$/)
], async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ message: errors.array()[0].msg });

    const { title, content = '', tags = [], color, isPinned } = req.body;

    const note = await Note.create({
      title, content,
      contentText: stripHtml(content),
      owner: req.user._id,
      lastEditedBy: req.user._id,
      tags: tags.map(t => t.toLowerCase().trim()),
      color: color || '#ffffff',
      isPinned: isPinned || false
    });

    await note.populate('owner', 'name email avatar');
    res.status(201).json({ message: 'Note created', note });
  } catch (error) { next(error); }
});

// GET single note
router.get('/:id', async (req, res, next) => {
  try {
    const note = await Note.findById(req.params.id)
      .populate('owner', 'name email avatar')
      .populate('collaborators.user', 'name email avatar')
      .populate('lastEditedBy', 'name');

    if (!note) return res.status(404).json({ message: 'Note not found' });

    const access = note.hasAccess(req.user._id);
    if (!access) return res.status(403).json({ message: 'Access denied' });

    res.json({ note, access });
  } catch (error) { next(error); }
});

// PUT update note
router.put('/:id', [
  body('title').optional().trim().notEmpty().isLength({ max: 200 }),
  body('color').optional().matches(/^#[0-9A-Fa-f]{6}$/)
], async (req, res, next) => {
  try {
    const note = await Note.findById(req.params.id);
    if (!note) return res.status(404).json({ message: 'Note not found' });

    const access = note.hasAccess(req.user._id);
    if (!access || access === 'read') return res.status(403).json({ message: 'Insufficient permissions' });

    const { title, content, tags, color, isPinned, isArchived } = req.body;
    const update = { lastEditedBy: req.user._id };

    if (title !== undefined) update.title = title;
    if (content !== undefined) { update.content = content; update.contentText = stripHtml(content); }
    if (tags !== undefined) update.tags = tags.map(t => t.toLowerCase().trim());
    if (color !== undefined) update.color = color;
    if (access === 'owner') {
      if (isPinned !== undefined) update.isPinned = isPinned;
      if (isArchived !== undefined) update.isArchived = isArchived;
    }

    const updated = await Note.findByIdAndUpdate(req.params.id, update, { new: true, runValidators: true })
      .populate('owner', 'name email avatar')
      .populate('collaborators.user', 'name email avatar')
      .populate('lastEditedBy', 'name');

    res.json({ message: 'Note updated', note: updated });
  } catch (error) { next(error); }
});

// DELETE note
router.delete('/:id', async (req, res, next) => {
  try {
    const note = await Note.findById(req.params.id);
    if (!note) return res.status(404).json({ message: 'Note not found' });
    if (note.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Only the owner can delete this note' });
    }
    await note.deleteOne();
    res.json({ message: 'Note deleted successfully' });
  } catch (error) { next(error); }
});

// POST add collaborator
router.post('/:id/collaborators', [
  body('email').isEmail().withMessage('Valid email required').normalizeEmail(),
  body('permission').isIn(['read', 'write']).withMessage('Permission must be read or write')
], async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ message: errors.array()[0].msg });

    const note = await Note.findById(req.params.id);
    if (!note) return res.status(404).json({ message: 'Note not found' });
    if (note.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Only the owner can manage collaborators' });
    }

    const { email, permission } = req.body;
    const collaboratorUser = await User.findOne({ email });
    if (!collaboratorUser) return res.status(404).json({ message: 'No user found with that email' });
    if (collaboratorUser._id.toString() === req.user._id.toString()) {
      return res.status(400).json({ message: 'You cannot add yourself as a collaborator' });
    }

    const existingCollab = note.collaborators.find(c => c.user.toString() === collaboratorUser._id.toString());
    if (existingCollab) {
      existingCollab.permission = permission;
    } else {
      note.collaborators.push({ user: collaboratorUser._id, permission });
    }

    await note.save();
    await note.populate('collaborators.user', 'name email avatar');
    res.json({ message: `${collaboratorUser.name} added as collaborator`, note });
  } catch (error) { next(error); }
});

// PUT update collaborator permission
router.put('/:id/collaborators/:userId', [
  body('permission').isIn(['read', 'write'])
], async (req, res, next) => {
  try {
    const note = await Note.findById(req.params.id);
    if (!note) return res.status(404).json({ message: 'Note not found' });
    if (note.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Only the owner can manage collaborators' });
    }

    const collab = note.collaborators.find(c => c.user.toString() === req.params.userId);
    if (!collab) return res.status(404).json({ message: 'Collaborator not found' });

    collab.permission = req.body.permission;
    await note.save();
    await note.populate('collaborators.user', 'name email avatar');
    res.json({ message: 'Permission updated', note });
  } catch (error) { next(error); }
});

// DELETE remove collaborator
router.delete('/:id/collaborators/:userId', async (req, res, next) => {
  try {
    const note = await Note.findById(req.params.id);
    if (!note) return res.status(404).json({ message: 'Note not found' });
    if (note.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Only the owner can manage collaborators' });
    }

    note.collaborators = note.collaborators.filter(c => c.user.toString() !== req.params.userId);
    await note.save();
    await note.populate('collaborators.user', 'name email avatar');
    res.json({ message: 'Collaborator removed', note });
  } catch (error) { next(error); }
});

module.exports = router;