const express = require('express');
const authMiddleware = require('../middleware/auth');
const Session = require('../models/Session');
const router = express.Router();

// Create or resume session
router.post('/start', authMiddleware, async (req, res) => {
  try {
    const { documentId, currentChunkIndex } = req.body;

    const Document = require('../models/Document');
    const doc = await Document.findOne({ _id: documentId, userId: req.userId });
    if (!doc) return res.status(404).json({ error: 'Document not found or access denied' });

    // Check for existing active session
    let session = await Session.findOne({
      userId: req.userId,
      documentId,
      status: { $in: ['active', 'paused'] }
    });

    if (session) {
      session.status = 'active';
      session.lastActiveAt = new Date();
      await session.save();
      return res.json({ session });
    }

    // Create new session
    session = new Session({
      userId: req.userId,
      documentId,
      currentChunkIndex: currentChunkIndex || 0,
      status: 'active'
    });
    await session.save();
    res.status(201).json({ session });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Save behavioral snapshot
router.post('/:id/snapshot', authMiddleware, async (req, res) => {
  try {
    const { behavioralEvent, currentChunkIndex, currentSettings } = req.body;
    const session = await Session.findOne({ _id: req.params.id, userId: req.userId });
    if (!session) return res.status(404).json({ error: 'Session not found' });

    if (behavioralEvent) {
      session.behavioralEvents.push(behavioralEvent);
      if (session.behavioralEvents.length > 1000) {
        session.behavioralEvents.shift(); // keep array bounded
      }
    }
    if (currentChunkIndex !== undefined) {
      session.currentChunkIndex = currentChunkIndex;
    }
    if (currentSettings) {
      session.currentSettings = currentSettings;
    }
    session.lastActiveAt = new Date();
    await session.save();
    res.json({ saved: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Log adaptation
router.post('/:id/adaptation', authMiddleware, async (req, res) => {
  try {
    const { adaptationEvent } = req.body;
    const session = await Session.findOne({ _id: req.params.id, userId: req.userId });
    if (!session) return res.status(404).json({ error: 'Session not found' });
    session.adaptationHistory.push(adaptationEvent);
    if (session.adaptationHistory.length > 500) {
      session.adaptationHistory.shift(); // keep array bounded
    }
    await session.save();
    res.json({ saved: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Complete session
router.post('/:id/complete', authMiddleware, async (req, res) => {
  try {
    const session = await Session.findOne({ _id: req.params.id, userId: req.userId });
    if (!session) return res.status(404).json({ error: 'Session not found' });
    session.status = 'completed';
    session.completedAt = new Date();
    await session.save();
    res.json({ session });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get user sessions
router.get('/', authMiddleware, async (req, res) => {
  try {
    const sessions = await Session.find({ userId: req.userId })
      .populate('documentId', 'title totalChunks')
      .sort({ lastActiveAt: -1 })
      .limit(20);
    res.json({ sessions });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
