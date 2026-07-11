/**
 * Splits text into chunks of approximately targetWords words,
 * always breaking at sentence boundaries.
 */
function chunkText(text, targetWords = 600) {
  // Normalize whitespace
  const normalized = text.replace(/\r\n/g, '\n').replace(/\n{3,}/g, '\n\n').trim();
  
  // Split into sentences
  const sentenceRegex = /[^.!?]*[.!?]+[\s]*/g;
  const sentences = normalized.match(sentenceRegex) || [normalized];
  
  const chunks = [];
  let current = '';
  let wordCount = 0;

  for (const sentence of sentences) {
    const wordsArray = sentence.trim().split(/\s+/);
    const words = wordsArray.length;
    
    // If a single sentence is larger than targetWords, split it forcefully
    if (words > targetWords) {
      // Push whatever we have so far
      if (current.trim().length > 0) {
        chunks.push(current.trim());
        current = '';
        wordCount = 0;
      }
      
      for (let i = 0; i < wordsArray.length; i += targetWords) {
        const subChunk = wordsArray.slice(i, i + targetWords).join(' ');
        if (i + targetWords >= wordsArray.length) {
          // Last piece goes into current
          current = subChunk;
          wordCount = subChunk.split(/\s+/).length;
        } else {
          chunks.push(subChunk);
        }
      }
      continue;
    }

    if (wordCount + words > targetWords && current.trim().length > 0) {
      chunks.push(current.trim());
      current = sentence.trim();
      wordCount = words;
    } else {
      current += (current ? ' ' : '') + sentence.trim();
      wordCount += words;
    }
  }

  if (current.trim()) {
    chunks.push(current.trim());
  }

  // If no sentences detected, fall back to word-based chunking
  if (chunks.length === 0) {
    const words = normalized.split(/\s+/);
    for (let i = 0; i < words.length; i += targetWords) {
      chunks.push(words.slice(i, i + targetWords).join(' '));
    }
  }

  return chunks.filter(c => c.length > 0);
}

module.exports = { chunkText };
