const mongoose = require('mongoose');

const vocabularySchema = new mongoose.Schema({
  word: String,
  definition: String,
  example: String
}, { _id: false });

const chunkSchema = new mongoose.Schema({
  index: { type: Number, required: true },
  originalText: { type: String, required: true },
  simplifiedText: { type: String, default: '' },
  vocabulary: [vocabularySchema],
  comprehensionQuestions: [{
    question: String,
    options: [String],
    correctIndex: Number,
    type: { type: String, enum: ['mcq', 'short'], default: 'mcq' }
  }],
  processed: { type: Boolean, default: false },
  processingError: { type: Boolean, default: false }
}, { _id: false });

const documentSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, required: true },
  fileName: { type: String },
  fileType: { type: String },
  totalChunks: { type: Number, default: 0 },
  chunks: [chunkSchema],
  processedChunks: { type: Number, default: 0 },
  status: { type: String, enum: ['uploading', 'processing', 'ready', 'error'], default: 'uploading' },
  createdAt: { type: Date, default: Date.now },
  lastReadAt: { type: Date }
});

documentSchema.index({ userId: 1, createdAt: -1 });

module.exports = mongoose.model('Document', documentSchema);
