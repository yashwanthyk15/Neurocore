const fs = require('fs');
const path = require('path');

async function parseFile(filePath, mimeType) {
  const ext = path.extname(filePath).toLowerCase();

  if (ext === '.pdf' || mimeType === 'application/pdf') {
    return parsePDF(filePath);
  } else if (ext === '.docx' || mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
    return parseDOCX(filePath);
  } else if (ext === '.txt' || mimeType === 'text/plain') {
    return parseTXT(filePath);
  } else {
    throw new Error(`Unsupported file type: ${ext}`);
  }
}

async function parsePDF(filePath) {
  try {
    const pdfParse = require('pdf-parse');
    const dataBuffer = await fs.promises.readFile(filePath);
    const data = await pdfParse(dataBuffer);
    return data.text;
  } catch (err) {
    throw new Error(`Failed to parse PDF: ${err.message}`);
  }
}

async function parseDOCX(filePath) {
  try {
    const mammoth = require('mammoth');
    const result = await mammoth.extractRawText({ path: filePath });
    return result.value;
  } catch (err) {
    throw new Error(`Failed to parse DOCX: ${err.message}`);
  }
}

async function parseTXT(filePath) {
  try {
    return await fs.promises.readFile(filePath, 'utf-8');
  } catch (err) {
    throw new Error(`Failed to read TXT file: ${err.message}`);
  }
}

module.exports = { parseFile };
