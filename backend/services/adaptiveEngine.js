/**
 * Rule-based adaptive engine.
 * Takes behavioral signals and returns adaptation recommendations.
 */

function computeAdaptations(behavioralData, currentSettings) {
  const {
    timeOnChunk = 0,        // seconds
    rereadCount = 0,
    focusLossCount = 0,
    comprehensionScore = -1, // -1 = not yet answered, 0-100 = score
    eyeConfidence = 1
  } = behavioralData;

  const adaptations = { ...currentSettings };
  const reasons = [];
  let changed = false;

  // Difficulty score: weighted combination
  const difficultyScore = 
    (timeOnChunk > 120 ? 2 : timeOnChunk > 60 ? 1 : 0) +
    (rereadCount > 3 ? 2 : rereadCount > 1 ? 1 : 0) +
    (focusLossCount > 3 ? 2 : focusLossCount > 1 ? 1 : 0) +
    (comprehensionScore >= 0 && comprehensionScore < 50 ? 2 : 0);

  // Ease score: student is comfortable
  const easeScore =
    (timeOnChunk < 30 && timeOnChunk > 0 ? 1 : 0) +
    (rereadCount === 0 ? 1 : 0) +
    (focusLossCount === 0 ? 1 : 0) +
    (comprehensionScore >= 80 ? 1 : 0);

  if (difficultyScore >= 3) {
    // High difficulty — increase accessibility
    if (adaptations.fontSize < 26) {
      adaptations.fontSize = Math.min(26, adaptations.fontSize + 2);
      reasons.push('Increased font size for easier reading');
      changed = true;
    }
    if (adaptations.lineSpacing < 2.5) {
      adaptations.lineSpacing = Math.min(2.5, parseFloat((adaptations.lineSpacing + 0.2).toFixed(1)));
      reasons.push('Increased line spacing');
      changed = true;
    }
    if (adaptations.chunkSize > 300) {
      adaptations.chunkSize = Math.max(300, adaptations.chunkSize - 100);
      reasons.push('Reduced chunk size for smaller reading portions');
      changed = true;
    }
    if (!adaptations.resimplify) {
      adaptations.resimplify = true;
      reasons.push('Requested re-simplification of this chunk');
      changed = true;
    }
  } else if (difficultyScore >= 2) {
    // Moderate difficulty
    if (adaptations.fontSize < 24) {
      adaptations.fontSize = Math.min(24, adaptations.fontSize + 1);
      reasons.push('Slightly increased font size');
      changed = true;
    }
  }

  if (focusLossCount >= 3) {
    adaptations.focusMode = true;
    reasons.push('Enabled focus mode due to attention loss');
    changed = true;
  } else if (focusLossCount === 0 && easeScore >= 3) {
    adaptations.focusMode = false;
  }

  if (easeScore >= 3 && difficultyScore === 0) {
    // Student is comfortable — increase challenge slightly
    if (adaptations.chunkSize < 800) {
      adaptations.chunkSize = Math.min(800, adaptations.chunkSize + 50);
      reasons.push('Slightly increased chunk size — great progress!');
      changed = true;
    }
  }

  return {
    changed,
    adaptations,
    reasons,
    difficultyScore,
    easeScore
  };
}

module.exports = { computeAdaptations };
