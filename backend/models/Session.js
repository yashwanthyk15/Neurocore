const mongoose = require('mongoose');

const behavioralEventSchema = new mongoose.Schema({
  chunkIndex: Number,
  timeOnChunk: Number,
  rereadCount: Number,
  focusLossCount: Number,
  eyeConfidence: Number,
  comprehensionScore: Number,
  timestamp: { type: Date, default: Date.now }
}, { _id: false });

const adaptationEventSchema = new mongoose.Schema({
  chunkIndex: Number,
  adaptations: {
    fontSize: Number,
    lineSpacing: Number,
    chunkSize: Number,
    focusMode: Boolean,
    resimplify: Boolean,
    colorOverlay: String
  },
  reason: String,
  timestamp: { type: Date, default: Date.now }
}, { _id: false });

const sessionSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  documentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Document', required: true },
  currentChunkIndex: { type: Number, default: 0 },
  completedChunks: [Number],
  behavioralEvents: [behavioralEventSchema],
  adaptationHistory: [adaptationEventSchema],
  currentSettings: {
    fontSize: { type: Number, default: 18 },
    lineSpacing: { type: Number, default: 1.8 },
    chunkSize: { type: Number, default: 600 },
    focusMode: { type: Boolean, default: false },
    colorOverlay: { type: String, default: 'none' }
  },
  startedAt: { type: Date, default: Date.now },
  lastActiveAt: { type: Date, default: Date.now },
  completedAt: Date,
  status: { type: String, enum: ['active', 'paused', 'completed'], default: 'active' }
});

sessionSchema.index({ userId: 1, lastActiveAt: -1 });
sessionSchema.index({ documentId: 1, userId: 1 });

module.exports = mongoose.model('Session', sessionSchema);
