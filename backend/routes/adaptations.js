const express = require('express');
const authMiddleware = require('../middleware/auth');
const { computeAdaptations } = require('../services/adaptiveEngine');
const Session = require('../models/Session');
const router = express.Router();

// Process behavioral data and return adaptations
router.post('/process', authMiddleware, async (req, res) => {
  try {
    const { behavioralData, currentSettings, sessionId, chunkIndex } = req.body;

    const result = computeAdaptations(behavioralData, currentSettings);

    // Log adaptation to session if changed
    if (result.changed && sessionId) {
      Session.findOneAndUpdate(
        { _id: sessionId, userId: req.userId },
        {
        $push: {
          adaptationHistory: {
            chunkIndex,
            adaptations: result.adaptations,
            reason: result.reasons.join('; '),
            timestamp: new Date()
          }
        },
        currentSettings: result.adaptations,
        lastActiveAt: new Date()
      }).catch(err => console.error('Adaptation log error:', err));
    }

    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
