const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const authMiddleware = require('../middleware/auth');
const Document = require('../models/Document');
const { parseFile } = require('../utils/fileParser');
const { chunkText } = require('../utils/chunker');
const { simplifyText, extractVocabulary, generateComprehensionQuestions } = require('../services/gemini');

const router = express.Router();

// Prefetch specific chunks by index (on-demand lookahead)
async function prefetchChunks(docId, indexes) {
  for (const idx of indexes) {
    try {
      const doc = await Document.findById(docId);
      if (!doc || !doc.chunks[idx] || doc.chunks[idx].processed) continue;
      const text = doc.chunks[idx].originalText;
      const [simplified, vocabulary, questions] = await Promise.all([
        simplifyText(text).catch(() => text),
        extractVocabulary(text).catch(() => []),
        generateComprehensionQuestions(text).catch(() => [])
      ]);
      doc.chunks[idx].simplifiedText = simplified;
      doc.chunks[idx].vocabulary = vocabulary;
      doc.chunks[idx].comprehensionQuestions = questions;
      doc.chunks[idx].processed = true;
      doc.processedChunks = Math.min(doc.totalChunks, (doc.processedChunks || 0) + 1);
      await doc.save();
    } catch (err) {
      console.warn(`Prefetch chunk ${idx} failed:`, err.message);
    }
  }
}


const uploadsDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename: (req, file, cb) => {
    const unique = uuidv4();
    cb(null, `${unique}${path.extname(file.originalname)}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 20 * 1024 * 1024 }, // 20MB
  fileFilter: (req, file, cb) => {
    const allowed = ['.pdf', '.docx', '.txt'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowed.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Only PDF, DOCX, and TXT files are supported'));
    }
  }
});

// Process chunks in background
async function processChunksBackground(docId, chunks) {
  const preProcessCount = Math.min(5, chunks.length);

  for (let i = 0; i < preProcessCount; i++) {
    try {
      const doc = await Document.findById(docId);
      if (!doc) break;

      const [simplified, vocabulary, questions] = await Promise.all([
        simplifyText(chunks[i]).catch(() => chunks[i]),
        extractVocabulary(chunks[i]).catch(() => []),
        generateComprehensionQuestions(chunks[i]).catch(() => [])
      ]);

      await Document.updateOne(
        { _id: docId },
        { 
          $set: { 
            [`chunks.${i}.simplifiedText`]: simplified,
            [`chunks.${i}.vocabulary`]: vocabulary,
            [`chunks.${i}.comprehensionQuestions`]: questions,
            [`chunks.${i}.processed`]: true 
          },
          $inc: { processedChunks: 1 }
        }
      );
    } catch (err) {
      console.error(`Error processing chunk ${i}:`, err.message);
      try {
        await Document.updateOne(
          { _id: docId },
          { 
            $set: { 
              [`chunks.${i}.simplifiedText`]: chunks[i],
              [`chunks.${i}.processed`]: true,
              [`chunks.${i}.processingError`]: true 
            },
            $inc: { processedChunks: 1 }
          }
        );
      } catch (saveErr) {
        console.error('Error saving fallback chunk:', saveErr.message);
      }
    }
  }

  // Process remaining chunks lazily (mark as not processed, processed on demand)
  try {
    const doc = await Document.findById(docId);
    if (doc && doc.status !== 'ready') {
      doc.status = 'ready';
      await doc.save();
    }
  } catch (e) {
    console.error('Failed to mark document as ready after background processing:', e.message);
  }
}

// Upload document — with multer error handling wrapper
router.post('/upload', authMiddleware, (req, res, next) => {
  upload.single('document')(req, res, (err) => {
    if (err) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ error: 'File too large. Maximum size is 20 MB.' });
      }
      return res.status(400).json({ error: err.message || 'File upload error' });
    }
    next();
  });
}, async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }

  let doc;
  try {
    const title = req.body.title || req.file.originalname.replace(/\.[^/.]+$/, '');
    const rawText = await parseFile(req.file.path, req.file.mimetype);

    if (!rawText || rawText.trim().length < 10) {
      fs.unlink(req.file.path, () => {});
      return res.status(400).json({ error: 'Could not extract text from this file. Please check the file is not empty or scanned.' });
    }

    const chunkSize = parseInt(req.body.chunkSize) || 600;
    const rawChunks = chunkText(rawText, chunkSize);

    const chunkDocs = rawChunks.map((text, index) => ({
      index,
      originalText: text,
      simplifiedText: '',
      vocabulary: [],
      comprehensionQuestions: [],
      processed: false,
      processingError: false
    }));

    doc = new Document({
      userId: req.userId,
      title,
      fileName: req.file.originalname,
      fileType: req.file.mimetype,
      totalChunks: rawChunks.length,
      chunks: chunkDocs,
      processedChunks: 0,
      status: 'processing'
    });
    await doc.save();

    // Clean up uploaded file
    fs.unlink(req.file.path, () => {});

    // Process first 5 chunks asynchronously
    if (process.env.GEMINI_API_KEY) {
      processChunksBackground(doc._id, rawChunks);
    } else {
      try {
        // No API key — mark all as processed with original text
        await Document.updateOne(
          { _id: doc._id },
          {
            $set: {
              status: 'ready',
              processedChunks: rawChunks.length,
              "chunks.$[].processed": true
            }
          }
        );
        // also set simplified text
        const updatedDoc = await Document.findById(doc._id);
        if (updatedDoc) {
          updatedDoc.chunks.forEach(chunk => chunk.simplifiedText = chunk.originalText);
          await updatedDoc.save();
        }
      } catch (err) {
        console.error("Fallback processing error:", err);
      }
    }

    // Return doc immediately
    return res.status(201).json({
      document: {
        _id: doc._id,
        title: doc.title,
        totalChunks: doc.totalChunks,
        status: doc.status,
        processedChunks: 0
      }
    });

  } catch (err) {
    if (req.file) fs.unlink(req.file.path, () => {});
    if (doc && doc._id) await Document.findByIdAndDelete(doc._id).catch(() => {});
    console.error('Upload error:', err);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Upload failed: ' + err.message });
    }
  }
});

// Get all documents for user
router.get('/', authMiddleware, async (req, res) => {
  try {
    const documents = await Document.find({ userId: req.userId })
      .select('title fileName totalChunks processedChunks status createdAt lastReadAt')
      .sort({ createdAt: -1 });
    res.json({ documents });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get document metadata
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const doc = await Document.findOne({ _id: req.params.id, userId: req.userId })
      .select('-chunks');
    if (!doc) return res.status(404).json({ error: 'Document not found' });
    res.json({ document: doc });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get a specific chunk (and trigger on-demand processing if needed)
router.get('/:id/chunk/:index', authMiddleware, async (req, res) => {
  try {
    const chunkIndex = parseInt(req.params.index);
    if (isNaN(chunkIndex)) return res.status(400).json({ error: 'Invalid chunk index' });

    const doc = await Document.findOne({ _id: req.params.id, userId: req.userId });
    if (!doc) return res.status(404).json({ error: 'Document not found' });

    if (chunkIndex < 0 || chunkIndex >= doc.chunks.length) {
      return res.status(404).json({ error: 'Chunk not found' });
    }

    const chunk = doc.chunks[chunkIndex];

    // On-demand processing if not yet done
    if (!chunk.processed && process.env.GEMINI_API_KEY) {
      try {
        const [simplified, vocabulary, questions] = await Promise.all([
          simplifyText(chunk.originalText).catch(() => chunk.originalText),
          extractVocabulary(chunk.originalText).catch(() => []),
          generateComprehensionQuestions(chunk.originalText).catch(() => [])
        ]);
        doc.chunks[chunkIndex].simplifiedText = simplified;
        doc.chunks[chunkIndex].vocabulary = vocabulary;
        doc.chunks[chunkIndex].comprehensionQuestions = questions;
        doc.chunks[chunkIndex].processed = true;
        doc.processedChunks = Math.min(doc.totalChunks, (doc.processedChunks || 0) + 1);
        await doc.save();
      } catch (processErr) {
        console.error('On-demand chunk processing error:', processErr.message);
        doc.chunks[chunkIndex].simplifiedText = chunk.originalText;
        doc.chunks[chunkIndex].processed = true;
        doc.chunks[chunkIndex].processingError = true;
        await doc.save();
      }
    } else if (!chunk.processed) {
      // No API key fallback
      doc.chunks[chunkIndex].simplifiedText = chunk.originalText;
      doc.chunks[chunkIndex].processed = true;
      await doc.save();
    }

    // Pre-process next 2 chunks in background (fire and forget)
    const nextIndexes = [chunkIndex + 1, chunkIndex + 2].filter(i => i < doc.chunks.length && !doc.chunks[i].processed);
    if (nextIndexes.length > 0 && process.env.GEMINI_API_KEY) {
      prefetchChunks(doc._id, nextIndexes).catch(e => console.warn('Prefetch error:', e.message));
    }

    // Update lastReadAt
    doc.lastReadAt = new Date();
    await doc.save();

    const updatedChunk = doc.chunks[chunkIndex];
    res.json({
      chunk: {
        index: updatedChunk.index,
        originalText: updatedChunk.originalText,
        simplifiedText: updatedChunk.simplifiedText || updatedChunk.originalText,
        vocabulary: updatedChunk.vocabulary || [],
        comprehensionQuestions: updatedChunk.comprehensionQuestions || [],
        processed: updatedChunk.processed,
        processingError: updatedChunk.processingError
      },
      totalChunks: doc.totalChunks
    });
  } catch (err) {
    console.error('Chunk fetch error:', err);
    res.status(500).json({ error: err.message });
  }
});

// Delete document
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const doc = await Document.findOneAndDelete({ _id: req.params.id, userId: req.userId });
    if (!doc) return res.status(404).json({ error: 'Document not found' });
    res.json({ message: 'Document deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Resimplify a chunk
router.post('/:id/chunk/:index/resimplify', authMiddleware, async (req, res) => {
  try {
    const chunkIndex = parseInt(req.params.index);
    if (isNaN(chunkIndex)) return res.status(400).json({ error: 'Invalid chunk index' });

    const doc = await Document.findOne({ _id: req.params.id, userId: req.userId });
    if (!doc) return res.status(404).json({ error: 'Document not found' });

    if (chunkIndex < 0 || chunkIndex >= doc.chunks.length) {
      return res.status(404).json({ error: 'Chunk not found' });
    }

    const { resimplifyChunk } = require('../services/gemini');
    const chunk = doc.chunks[chunkIndex];
    const newText = await resimplifyChunk(chunk.originalText, 'easier').catch(() => chunk.simplifiedText || chunk.originalText);
    doc.chunks[chunkIndex].simplifiedText = newText;
    await doc.save();
    res.json({ simplifiedText: newText });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
