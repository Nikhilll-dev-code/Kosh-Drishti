/**
 * Modular Multi-Field Duplicate Detection Service for MPLADS Work Titles & Projects
 */

function tokenizeText(text) {
  if (!text) return new Set();
  const normalized = String(text)
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .trim();
  
  const tokens = normalized
    .split(/\s+/)
    .filter(t => t.length > 2);
  
  return new Set(tokens);
}

function computeTokenJaccard(text1, text2) {
  const set1 = tokenizeText(text1);
  const set2 = tokenizeText(text2);
  
  if (set1.size === 0 || set2.size === 0) return 0;
  
  let intersectionCount = 0;
  for (const token of set1) {
    if (set2.has(token)) {
      intersectionCount++;
    }
  }
  
  const unionCount = new Set([...set1, ...set2]).size;
  return unionCount > 0 ? intersectionCount / unionCount : 0;
}

function computeCostSimilarity(cost1, cost2) {
  const c1 = parseFloat(cost1 || 0);
  const c2 = parseFloat(cost2 || 0);
  
  if (c1 <= 0 || c2 <= 0) return 0;
  const maxC = Math.max(c1, c2);
  const diff = Math.abs(c1 - c2);
  return Math.max(0, 1 - (diff / maxC));
}

function findMaxDuplicateMatch(targetWork, candidateWorks = []) {
  if (!targetWork || candidateWorks.length === 0) {
    return {
      similarityScore: 0,
      confidence: 'LOW',
      matchingWorkId: null,
      matchingTitle: null,
      matchingFields: [],
      method: 'TOKEN_JACCARD_MULTIFIELD',
      explanation: 'No duplicate candidate works available for comparison'
    };
  }

  let maxScore = 0;
  let bestMatch = null;
  let bestTitleSim = 0;
  let bestCostSim = 0;

  for (const candidate of candidateWorks) {
    if (candidate.work_id === targetWork.work_id) continue;

    // Title text similarity
    const titleSim = computeTokenJaccard(targetWork.title || targetWork.description, candidate.title || candidate.description);

    // Cost similarity
    const costSim = computeCostSimilarity(targetWork.sanctioned_amount || targetWork.proposed_cost, candidate.sanctioned_amount || candidate.proposed_cost);

    // Category similarity bonus
    const catSim = (targetWork.category && candidate.category && targetWork.category === candidate.category) ? 1.0 : 0.0;

    // Constituency match bonus
    const constSim = (targetWork.constituency && candidate.constituency && targetWork.constituency === candidate.constituency) ? 1.0 : 0.0;

    // Multi-field blended similarity score
    const blendedScore = (titleSim * 0.60) + (costSim * 0.25) + (catSim * 0.10) + (constSim * 0.05);

    if (blendedScore > maxScore) {
      maxScore = blendedScore;
      bestMatch = candidate;
      bestTitleSim = titleSim;
      bestCostSim = costSim;
    }
  }

  if (maxScore > 0 && bestMatch) {
    const roundedScore = Math.round(maxScore * 100) / 100;
    const confidence = roundedScore >= 0.85 ? 'HIGH' : roundedScore >= 0.60 ? 'MEDIUM' : 'LOW';

    return {
      similarityScore: roundedScore,
      confidence: confidence,
      matchingWorkId: bestMatch.work_id,
      matchingTitle: bestMatch.title || bestMatch.description,
      matchingFields: ['title', 'sanctioned_amount', 'category', 'constituency'],
      titleJaccardScore: Math.round(bestTitleSim * 100) / 100,
      costSimilarityScore: Math.round(bestCostSim * 100) / 100,
      method: 'TOKEN_JACCARD_MULTIFIELD',
      explanation: `Multi-field similarity (${Math.round(roundedScore * 100)}%) detected matching work ID ${bestMatch.work_id} ("${bestMatch.title || bestMatch.description}")`
    };
  }

  return {
    similarityScore: 0,
    confidence: 'LOW',
    matchingWorkId: null,
    matchingTitle: null,
    matchingFields: [],
    method: 'TOKEN_JACCARD_MULTIFIELD',
    explanation: 'No duplicate work titles or financial parameters detected in constituency'
  };
}

module.exports = {
  tokenizeText,
  computeTokenJaccard,
  computeCostSimilarity,
  findMaxDuplicateMatch
};
