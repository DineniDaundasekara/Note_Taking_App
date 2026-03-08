const express = require('express');
const { body, validationResult } = require('express-validator');
const Note = require('../models/Note');
const User = require('../models/User');
const { protect } = require('../middleware/auth');

const router = express.Router();
router.use(protect);

const stripHtml = (html) => html ? html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim() : '';

function buildSort(sort = '-updatedAt') {
  if (sort.startsWith('-')) return { [sort.slice(1)]: -1 };
  return { [sort]: 1 };
}

// GET all notes
router.get('/', async (req, res, next) => {
  try {
    console.log('[DEBUG] GET /notes query:', req.query);
    res.set('Cache-Control', 'no-store');
    const { search, tag, archived = 'false', pinned, favorite, priority, status, sort = '-updatedAt', overdue } = req.query;

    let filter = {
      $or: [{ owner: req.user._id }, { 'collaborators.user': req.user._id }],
      isArchived: archived === 'true' ? true : { $ne: true }
    };

    if (pinned === 'true') filter.isPinned = true;
    if (favorite === 'true') filter.isFavorite = true;
    if (tag) filter.tags = tag.toLowerCase();
    if (priority) filter.priority = priority;
    if (status) filter.status = status;
    if (overdue === 'true') filter.dueDate = { $lt: new Date(), $ne: null };

    console.log('[DEBUG] GET /notes filter:', JSON.stringify(filter, null, 2));

    let notes;
    if (search && search.trim()) {
      notes = await Note.find({ ...filter, $text: { $search: search } })
        .populate('owner', 'name email avatar')
        .populate('collaborators.user', 'name email avatar')
        .populate('lastEditedBy', 'name')
        .sort({ score: { $meta: 'textScore' } });
    } else {
      notes = await Note.find(filter)
        .populate('owner', 'name email avatar')
        .populate('collaborators.user', 'name email avatar')
        .populate('lastEditedBy', 'name')
        .sort(buildSort(sort));
    }
    res.json({ notes, total: notes.length });
  } catch (error) { next(error); }
});

// GET stats
router.get('/stats', async (req, res, next) => {
  try {
    const userId = req.user._id;
    res.set('Cache-Control', 'no-store');
    const baseFilter = { $or: [{ owner: userId }, { 'collaborators.user': userId }], isArchived: { $ne: true } };
    const overdueQuery = { ...baseFilter, dueDate: { $lt: new Date(), $ne: null } };
    console.log('[DEBUG] stats overdueQuery:', JSON.stringify(overdueQuery, null, 2));

    const [total, pinned, overdueCount, favorites, byPriority, recent] = await Promise.all([
      Note.countDocuments(baseFilter),
      Note.countDocuments({ ...baseFilter, isPinned: true }),
      Note.countDocuments(overdueQuery),
      Note.countDocuments({ ...baseFilter, isFavorite: true }),
      Note.aggregate([
        { $match: { $or: [{ owner: userId }, { 'collaborators.user': userId }], isArchived: { $ne: true } } },
        { $group: { _id: '$priority', count: { $sum: 1 } } }
      ]),
      Note.find(baseFilter).sort({ createdAt: -1 }).limit(5).select('title createdAt color priority')
    ]);

    const priorityMap = { none: 0, low: 0, medium: 0, high: 0 };
    byPriority.forEach(p => { priorityMap[p._id] = p.count; });

    res.json({ total, pinned, favorites, overdue: overdueCount, byPriority: priorityMap, recent });
  } catch (error) { next(error); }
});

// POST create note
router.post('/', [
  body('title').trim().notEmpty().withMessage('Title is required').isLength({ max: 200 }),
  body('description').optional().isLength({ max: 500 }),
  body('color').optional().matches(/^#[0-9A-Fa-f]{6}$/),
  body('priority').optional().isIn(['none', 'low', 'medium', 'high']),
  body('status').optional().isIn(['active', 'draft', 'completed']),
], async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ message: errors.array()[0].msg });

    const { title, description = '', content = '', tags = [], color, priority, status, dueDate, checklist, isPinned } = req.body;

    const note = await Note.create({
      title, description, content,
      contentText: stripHtml(content),
      owner: req.user._id,
      lastEditedBy: req.user._id,
      tags: [...new Set(tags.map(t => t.toLowerCase().trim()).filter(Boolean))],
      color: color || '#ffffff',
      priority: priority || 'none',
      status: status || 'active',
      dueDate: dueDate || null,
      checklist: checklist || [],
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

    await Note.findByIdAndUpdate(req.params.id, { $inc: { viewCount: 1 } });
    res.json({ note, access });
  } catch (error) { next(error); }
});

// PUT update note
router.put('/:id', [
  body('title').optional().trim().notEmpty().isLength({ max: 200 }),
  body('description').optional().isLength({ max: 500 }),
  body('color').optional().matches(/^#[0-9A-Fa-f]{6}$/),
  body('priority').optional().isIn(['none', 'low', 'medium', 'high']),
  body('status').optional().isIn(['active', 'draft', 'completed']),
], async (req, res, next) => {
  try {
    const note = await Note.findById(req.params.id);
    if (!note) return res.status(404).json({ message: 'Note not found' });

    const access = note.hasAccess(req.user._id);
    if (!access || access === 'read') return res.status(403).json({ message: 'Insufficient permissions' });

    const { title, description, content, tags, color, priority, status, dueDate, checklist, isPinned, isArchived, isFavorite, coverImage } = req.body;
    const update = { lastEditedBy: req.user._id };

    if (title !== undefined) update.title = title;
    if (description !== undefined) update.description = description;
    if (content !== undefined) { update.content = content; update.contentText = stripHtml(content); }
    if (tags !== undefined) update.tags = [...new Set(tags.map(t => t.toLowerCase().trim()).filter(Boolean))];
    if (color !== undefined) update.color = color;
    if (priority !== undefined) update.priority = priority;
    if (status !== undefined) update.status = status;
    if (dueDate !== undefined) update.dueDate = dueDate || null;
    if (checklist !== undefined) update.checklist = checklist;
    if (coverImage !== undefined) update.coverImage = coverImage;

    if (access === 'owner') {
      if (isPinned !== undefined) update.isPinned = isPinned;
      if (isArchived !== undefined) update.isArchived = isArchived;
      if (isFavorite !== undefined) update.isFavorite = isFavorite;
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
    res.json({ message: 'Note deleted' });
  } catch (error) { next(error); }
});

// POST duplicate
router.post('/:id/duplicate', async (req, res, next) => {
  try {
    const original = await Note.findById(req.params.id);
    if (!original) return res.status(404).json({ message: 'Note not found' });
    if (!original.hasAccess(req.user._id)) return res.status(403).json({ message: 'Access denied' });

    const copy = await Note.create({
      title: `${original.title} (copy)`,
      description: original.description,
      content: original.content,
      contentText: original.contentText,
      owner: req.user._id,
      lastEditedBy: req.user._id,
      tags: original.tags,
      color: original.color,
      priority: original.priority,
      status: 'draft',
      checklist: original.checklist.map(item => ({ text: item.text, completed: false, order: item.order }))
    });

    await copy.populate('owner', 'name email avatar');
    res.status(201).json({ message: 'Note duplicated', note: copy });
  } catch (error) { next(error); }
});

// PATCH checklist item
router.patch('/:id/checklist/:itemId', async (req, res, next) => {
  try {
    const note = await Note.findById(req.params.id);
    if (!note) return res.status(404).json({ message: 'Note not found' });
    const access = note.hasAccess(req.user._id);
    if (!access || access === 'read') return res.status(403).json({ message: 'Insufficient permissions' });

    const item = note.checklist.id(req.params.itemId);
    if (!item) return res.status(404).json({ message: 'Checklist item not found' });

    const { completed, text } = req.body;
    if (completed !== undefined) item.completed = completed;
    if (text !== undefined) item.text = text;

    await note.save();
    res.json({ message: 'Checklist updated', note });
  } catch (error) { next(error); }
});

// POST add collaborator
router.post('/:id/collaborators', [
  body('email').isEmail().normalizeEmail(),
  body('permission').isIn(['read', 'write'])
], async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ message: errors.array()[0].msg });

    const note = await Note.findById(req.params.id);
    if (!note) return res.status(404).json({ message: 'Note not found' });
    if (note.owner.toString() !== req.user._id.toString()) return res.status(403).json({ message: 'Owner only' });

    const { email, permission } = req.body;
    const collabUser = await User.findOne({ email });
    if (!collabUser) return res.status(404).json({ message: 'No user found with that email' });
    if (collabUser._id.toString() === req.user._id.toString()) return res.status(400).json({ message: 'Cannot add yourself' });

    const existing = note.collaborators.find(c => c.user.toString() === collabUser._id.toString());
    if (existing) { existing.permission = permission; }
    else { note.collaborators.push({ user: collabUser._id, permission }); }

    await note.save();
    await note.populate('owner collaborators.user', 'name email avatar');
    res.json({ message: `${collabUser.name} added`, note });
  } catch (error) { next(error); }
});

// PUT update collaborator permission
router.put('/:id/collaborators/:userId', [body('permission').isIn(['read', 'write'])], async (req, res, next) => {
  try {
    const note = await Note.findById(req.params.id);
    if (!note) return res.status(404).json({ message: 'Note not found' });
    if (note.owner.toString() !== req.user._id.toString()) return res.status(403).json({ message: 'Owner only' });

    const collab = note.collaborators.find(c => c.user.toString() === req.params.userId);
    if (!collab) return res.status(404).json({ message: 'Collaborator not found' });
    collab.permission = req.body.permission;
    await note.save();
    await note.populate('owner collaborators.user', 'name email avatar');
    res.json({ message: 'Permission updated', note });
  } catch (error) { next(error); }
});

// DELETE remove collaborator
router.delete('/:id/collaborators/:userId', async (req, res, next) => {
  try {
    const note = await Note.findById(req.params.id);
    if (!note) return res.status(404).json({ message: 'Note not found' });
    if (note.owner.toString() !== req.user._id.toString()) return res.status(403).json({ message: 'Owner only' });
    note.collaborators = note.collaborators.filter(c => c.user.toString() !== req.params.userId);
    await note.save();
    await note.populate('owner collaborators.user', 'name email avatar');
    res.json({ message: 'Collaborator removed', note });
  } catch (error) { next(error); }
});

module.exports = router;