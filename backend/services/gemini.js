const { GoogleGenerativeAI } = require('@google/generative-ai');

let genAI = null;

function getGenAI() {
  if (!genAI && process.env.GEMINI_API_KEY) {
    genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  }
  return genAI;
}

async function callGeminiWithRetry(prompt, isJson = false, maxRetries = 3) {
  const ai = getGenAI();
  if (!ai) {
    throw new Error('Gemini API key not configured');
  }

  if (prompt.length > 30000) {
    console.warn(`Prompt truncated from ${prompt.length} to 30000 characters.`);
    prompt = prompt.substring(0, 30000);
  }
  
  const modelConfig = { model: 'gemini-2.5-flash' };
  if (isJson) {
    modelConfig.generationConfig = { responseMimeType: 'application/json' };
  }
  
  const model = ai.getGenerativeModel(modelConfig);

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const result = await model.generateContent(prompt);
      const response = await result.response;
      return response.text();
    } catch (err) {
      if (attempt === maxRetries - 1) throw err;
      const delay = Math.pow(2, attempt) * 1000;
      console.log(`Gemini retry ${attempt + 1} in ${delay}ms...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
}

async function simplifyText(text) {
  const prompt = `You are helping a student with dyslexia or ADHD read this text. Rewrite it in simple, clear language. Use short sentences (under 15 words). Use common words. Keep ALL the important information. Do NOT add headings or bullet points - just clean paragraphs.

Original text:
${text}

Simplified version:`;
  return callGeminiWithRetry(prompt, false);
}

async function extractVocabulary(text) {
  const prompt = `From the text below, identify 3-6 difficult or important words that a student might not know. For each word provide a simple definition and a short example sentence.

Respond ONLY with valid JSON (no markdown, no backticks) in this exact format:
[{"word":"example","definition":"a short simple explanation","example":"A sentence using the word."}]

Text:
${text}

JSON:`;

  const raw = await callGeminiWithRetry(prompt, true);
  try {
    const cleaned = raw.replace(/```json|```/g, '').trim();
    const parsed = JSON.parse(cleaned);
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    console.error('Failed to parse vocabulary JSON:', err.message);
    return [];
  }
}

async function generateComprehensionQuestions(text) {
  const prompt = `Create 2 multiple choice questions to check understanding of this text. Make questions simple and clear.

Respond ONLY with valid JSON (no markdown, no backticks) in this exact format:
[{"question":"What is the main idea?","options":["Option A","Option B","Option C","Option D"],"correctIndex":0}]

Text:
${text}

JSON:`;

  const raw = await callGeminiWithRetry(prompt, true);
  try {
    const cleaned = raw.replace(/```json|```/g, '').trim();
    const parsed = JSON.parse(cleaned);
    return Array.isArray(parsed) ? parsed.slice(0, 2) : [];
  } catch (err) {
    console.error('Failed to parse questions JSON:', err.message);
    return [];
  }
}

async function resimplifyChunk(text, level = 'easier') {
  const prompt = `A student with dyslexia is struggling with this text. Make it ${level === 'easier' ? 'much simpler' : 'simpler'}. Use very short sentences. Replace hard words with easy ones. Keep all the key facts.

Text:
${text}

Even simpler version:`;
  return callGeminiWithRetry(prompt, false);
}

module.exports = {
  simplifyText,
  extractVocabulary,
  generateComprehensionQuestions,
  resimplifyChunk
};
