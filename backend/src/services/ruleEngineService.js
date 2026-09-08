const store = require('../models/store');
const { extractWorkFeatures, extractConstituencyFeatures, CATEGORY_BENCHMARKS } = require('./featureExtractor');
const { findMaxDuplicateMatch } = require('./duplicateDetectionService');
const { fetchMLAnomalyScores } = require('./mlService');

const RULE_SPECS = {
  R1: { id: 'R1', name: 'Ineligible Work Category', weight: 35, severity: 'HIGH' },
  R2: { id: 'R2', name: 'Duplicate Work Recommendation', weight: 30, severity: 'HIGH' },
  R3: { id: 'R3', name: 'Excessive Delay / UC Lag', weight: 30, severity: 'HIGH' },
  R4: { id: 'R4', name: 'Tender Threshold / Missing Tender Signal', weight: 20, severity: 'MEDIUM' },
  R5: { id: 'R5', name: 'IA Over-Concentration', weight: 15, severity: 'MEDIUM' },
  R6: { id: 'R6', name: 'Cost Benchmark Anomaly', weight: 20, severity: 'MEDIUM' }
};

function evaluateRulesDetailed(work, allWorks = [], config = {}) {
  const ruleResults = [];

  const amount = parseFloat(work.sanctioned_amount || work.proposed_cost || 0);
  const tenderThreshold = config.r2_tender_threshold || 2500000;
  const keywords = config.r3_ineligible_keywords || [
    'temple', 'mosque', 'church', 'gurudwara', 'religious', 'shrine',
    'land purchase', 'commercial complex', 'private building', 'club'
  ];

  // R1: Ineligible Work Category
  const titleLower = (work.title || work.description || '').toLowerCase();
  const catLower = (work.category || '').toLowerCase();
  const matchedKeyword = keywords.find(kw => titleLower.includes(kw) || catLower.includes(kw));
  const r1Triggered = Boolean(matchedKeyword);

  ruleResults.push({
    ruleId: 'R1',
    ruleName: RULE_SPECS.R1.name,
    triggered: r1Triggered,
    severity: RULE_SPECS.R1.severity,
    weight: RULE_SPECS.R1.weight,
    value: matchedKeyword ? `Contains '${matchedKeyword}'` : 'Compliant',
    threshold: 'Prohibited keyword list (MPLADS Para 3.3)',
    evidence: r1Triggered
      ? `Work title or category contains prohibited term '${matchedKeyword}', violating statutory negative list guidelines.`
      : 'Work category is compliant with permitted MPLADS guidelines.'
  });

  // R2: Duplicate Work Recommendation
  const dupMatch = findMaxDuplicateMatch(work, allWorks);
  const dupThreshold = config.r1_duplicate_similarity_threshold || 0.85;
  const r2Triggered = dupMatch.similarityScore >= dupThreshold;

  ruleResults.push({
    ruleId: 'R2',
    ruleName: RULE_SPECS.R2.name,
    triggered: r2Triggered,
    severity: RULE_SPECS.R2.severity,
    weight: RULE_SPECS.R2.weight,
    value: `${Math.round(dupMatch.similarityScore * 100)}% similarity`,
    threshold: `${Math.round(dupThreshold * 100)}% similarity`,
    matchingWorkId: dupMatch.matchingWorkId,
    evidence: r2Triggered
      ? `High similarity (${Math.round(dupMatch.similarityScore * 100)}%) detected with existing work ${dupMatch.matchingWorkId} ("${dupMatch.matchingTitle}").`
      : 'No duplicate work title or asset match found.'
  });

  // R3: Excessive Delay / UC Lag
  let daysLag = 0;
  let r3Triggered = false;
  const gracePeriod = config.r6_uc_grace_days || 45;

  if (work.recommendation_date && work.uc_date) {
    const d1 = new Date(work.recommendation_date);
    const d2 = new Date(work.uc_date);
    if (!isNaN(d1.getTime()) && !isNaN(d2.getTime())) {
      daysLag = Math.floor((d2 - d1) / (1000 * 60 * 60 * 24));
    }
  } else if (work.uc_lag_days) {
    daysLag = parseInt(work.uc_lag_days, 10);
  }

  if (daysLag > (180 + gracePeriod)) {
    r3Triggered = true;
  }

  ruleResults.push({
    ruleId: 'R3',
    ruleName: RULE_SPECS.R3.name,
    triggered: r3Triggered,
    severity: RULE_SPECS.R3.severity,
    weight: RULE_SPECS.R3.weight,
    value: `${daysLag} days lag`,
    threshold: `${180 + gracePeriod} days max`,
    evidence: r3Triggered
      ? `Utilization Certificate (UC) submission lag of ${daysLag} days exceeds maximum threshold of ${180 + gracePeriod} days.`
      : `UC submission lag of ${daysLag} days is within acceptable timeline limits.`
  });

  // R4: Tender Threshold / Missing Tender Signal
  const tenderNear = (amount >= (tenderThreshold * 0.90) && amount < tenderThreshold);
  const r4Triggered = tenderNear || (amount >= tenderThreshold && (!work.tender_id || work.tender_id.trim() === ''));

  ruleResults.push({
    ruleId: 'R4',
    ruleName: RULE_SPECS.R4.name,
    triggered: r4Triggered,
    severity: RULE_SPECS.R4.severity,
    weight: RULE_SPECS.R4.weight,
    value: `₹${(amount / 100000).toFixed(2)} Lakhs`,
    threshold: `₹${(tenderThreshold / 100000).toFixed(2)} Lakhs limit`,
    evidence: r4Triggered
      ? `Work cost ₹${(amount / 100000).toFixed(2)} Lakhs approaches or exceeds the tender threshold (₹${(tenderThreshold / 100000).toFixed(2)} Lakhs) without attached tender ID.`
      : 'Tender procurement threshold requirements satisfied.'
  });

  // R5: IA Over-Concentration
  const constituencyWorks = allWorks.filter(w => w.constituency === work.constituency);
  const totalCount = constituencyWorks.length || 1;
  const iaName = work.implementing_agency || work.ia_id;
  const iaCount = constituencyWorks.filter(w => (w.implementing_agency || w.ia_id) === iaName).length;
  const iaRatio = iaCount / totalCount;
  const r5Triggered = iaRatio > 0.35 && totalCount >= 3;

  ruleResults.push({
    ruleId: 'R5',
    ruleName: RULE_SPECS.R5.name,
    triggered: r5Triggered,
    severity: RULE_SPECS.R5.severity,
    weight: RULE_SPECS.R5.weight,
    value: `${Math.round(iaRatio * 100)}% work share (${iaCount}/${totalCount})`,
    threshold: '35% max agency share',
    evidence: r5Triggered
      ? `Implementing Agency '${iaName}' holds ${Math.round(iaRatio * 100)}% of works in constituency, exceeding concentration benchmark of 35%.`
      : `Agency concentration (${Math.round(iaRatio * 100)}%) is within normal diversification limits.`
  });

  // R6: Cost Benchmark Anomaly
  const categoryBenchmark = CATEGORY_BENCHMARKS[work.category] || CATEGORY_BENCHMARKS['Default'];
  const r6Triggered = amount > (categoryBenchmark * 1.5);

  ruleResults.push({
    ruleId: 'R6',
    ruleName: RULE_SPECS.R6.name,
    triggered: r6Triggered,
    severity: RULE_SPECS.R6.severity,
    weight: RULE_SPECS.R6.weight,
    value: `₹${(amount / 100000).toFixed(2)} Lakhs`,
    threshold: `₹${((categoryBenchmark * 1.5) / 100000).toFixed(2)} Lakhs (1.5x avg)`,
    evidence: r6Triggered
      ? `Sanctioned cost ₹${(amount / 100000).toFixed(2)} Lakhs exceeds 1.5x expected category benchmark of ₹${(categoryBenchmark / 100000).toFixed(2)} Lakhs.`
      : 'Sanctioned cost is within standard benchmark expectations.'
  });

  return ruleResults;
}

/**
 * Calculates Risk Confidence Score (High, Medium, Low)
 */
function computeRiskConfidence(work, anomalyScore, modelStatus, duplicateSimScore) {
  let score = 0;

  // 1. Data Completeness Check
  if (work.title && work.sanctioned_amount && work.category && work.implementing_agency) score += 40;
  else if (work.title && work.sanctioned_amount) score += 25;

  // 2. ML Service Integration Status
  if (modelStatus === 'ISOLATION_FOREST_ACTIVE' || modelStatus === 'ISOLATION_FOREST_SUCCESS') score += 30;
  else score += 15;

  // 3. Duplicate Precision Evidence
  if (duplicateSimScore >= 0.85) score += 30;
  else if (duplicateSimScore < 0.85) score += 20;

  if (score >= 80) return 'HIGH';
  if (score >= 50) return 'MEDIUM';
  return 'LOW';
}

async function runFullScoringPipeline() {
  const works = store.getWorks();
  const constituencies = store.getConstituencyData() || [];
  const config = store.getRuleConfig() || {};

  // -------------------------------------------------------------
  // LAYER 1: 557 Real MPLADS Constituency Financial ML Scoring
  // -------------------------------------------------------------
  let constituencyModelStatus = 'UNKNOWN';
  if (constituencies.length > 0) {
    const constituencyFeatureItems = constituencies.map(c => {
      const extracted = extractConstituencyFeatures(c);
      return {
        id: extracted.id,
        constituency_id: extracted.constituency_id,
        features: extracted.feature_vector
      };
    });

    const constMlResult = await fetchMLAnomalyScores(constituencyFeatureItems);
    const constScoresMap = constMlResult.scores || {};
    constituencyModelStatus = constMlResult.model_status || 'ISOLATION_FOREST_ACTIVE';

    const updatedConstituencies = constituencies.map(c => {
      const constId = c.constituency_id || `CONST-${c.sl_no}`;
      const score = constScoresMap[constId] !== undefined ? constScoresMap[constId] : 0.15;
      const tier = score >= 0.65 ? 'HIGH' : score >= 0.40 ? 'MEDIUM' : 'LOW';
      return {
        ...c,
        anomaly_score: score,
        risk_tier: tier,
        data_scope: 'REAL_CONSTITUENCY_DATA'
      };
    });

    store.saveConstituencyData(updatedConstituencies);
  }

  // -------------------------------------------------------------
  // LAYER 2: Work-Level Rule Engine & Audit Scoring
  // -------------------------------------------------------------
  if (works.length === 0) {
    return { scored_count: 0, ml_model_status: constituencyModelStatus };
  }

  const ruleWeight = config.rule_weight !== undefined ? config.rule_weight : 0.85;
  const mlWeight = config.ml_weight !== undefined ? config.ml_weight : 0.15;

  const featureItems = works.map(w => {
    const dupMatch = findMaxDuplicateMatch(w, works);
    const extracted = extractWorkFeatures(w, works, dupMatch.similarityScore);
    return {
      work_id: w.work_id,
      features: extracted.feature_vector
    };
  });

  const mlResult = await fetchMLAnomalyScores(featureItems);
  const mlScoresMap = mlResult.scores || {};
  const modelStatus = mlResult.model_status || constituencyModelStatus;

  const scoresObj = {};

  for (const work of works) {
    const detailedRules = evaluateRulesDetailed(work, works, config);
    const triggeredRules = detailedRules.filter(r => r.triggered);
    const triggeredFlags = triggeredRules.map(r => r.ruleId);
    const dupMatch = findMaxDuplicateMatch(work, works);

    let ruleSeveritySum = 0;
    triggeredRules.forEach(r => {
      ruleSeveritySum += r.weight;
    });

    const ruleScoreCapped = Math.min(ruleSeveritySum, 100);
    const anomalyScore = mlScoresMap[work.work_id] !== undefined ? mlScoresMap[work.work_id] : 0.2;

    const ruleContrib = Math.round(ruleScoreCapped * ruleWeight);
    const mlContrib = Math.round(anomalyScore * 100 * mlWeight);
    const compositeRisk = Math.min(100, Math.max(0, ruleContrib + mlContrib));

    let riskTier = 'LOW';
    if (compositeRisk >= 65) riskTier = 'HIGH';
    else if (compositeRisk >= 40) riskTier = 'MEDIUM';

    const confidence = computeRiskConfidence(work, anomalyScore, modelStatus, dupMatch.similarityScore);

    const structuredEvidence = [];

    triggeredRules.forEach(r => {
      structuredEvidence.push({
        type: 'RULE',
        rule: r.ruleId,
        ruleName: r.ruleName,
        severity: r.severity,
        reason: r.evidence,
        value: r.value,
        threshold: r.threshold
      });
    });

    structuredEvidence.push({
      type: 'ML',
      model: 'IsolationForest (Python Microservice)',
      modelStatus: modelStatus,
      anomalyScore: anomalyScore,
      reason: anomalyScore >= 0.5
        ? `ML Isolation Forest flagged anomalous feature vector pattern (Score: ${anomalyScore}).`
        : `Feature vector aligns with normal execution baseline (Anomaly Score: ${anomalyScore}).`
    });

    if (dupMatch.similarityScore >= 0.5) {
      structuredEvidence.push({
        type: 'DUPLICATE',
        confidence: dupMatch.confidence,
        matchingWorkId: dupMatch.matchingWorkId,
        reason: dupMatch.explanation
      });
    }

    const explanationText = generateExplanationText(work, triggeredFlags, compositeRisk, anomalyScore);

    scoresObj[work.work_id] = {
      work_id: work.work_id,
      rule_flags: triggeredFlags,
      detailed_rules: detailedRules,
      anomaly_score: anomalyScore,
      composite_risk: compositeRisk,
      risk_tier: riskTier,
      confidence: confidence,
      signal_contributions: {
        rule_contribution: ruleContrib,
        ml_contribution: mlContrib,
        financial_anomaly: dupMatch.similarityScore >= 0.85 ? 'SUPPORTING_SIGNAL' : 'NORMAL'
      },
      duplicate_match: dupMatch,
      evidence: structuredEvidence,
      explanation_text: explanationText,
      data_scope: work.source || 'DEMO_SEED_WORK',
      generated_at: new Date().toISOString()
    };

    // Idempotent Case Generation & Update
    if (compositeRisk >= 40) {
      const existingCase = store.getCaseByWorkId(work.work_id);
      if (!existingCase) {
        store.saveCase({
          case_id: 'CASE-' + work.work_id,
          work_id: work.work_id,
          assigned_auditor_id: null,
          assigned_auditor_name: 'Unassigned',
          status: 'New',
          risk_tier: riskTier,
          composite_risk: compositeRisk,
          confidence: confidence,
          rule_flags: triggeredFlags,
          evidence_summary: structuredEvidence.map(e => e.reason).join(' | '),
          notes: [
            {
              note_id: 'NOTE-' + Date.now() + '-' + Math.floor(Math.random() * 1000),
              author_id: 'SYSTEM',
              author_name: 'Kosh-Drishti Central Risk Engine',
              text: `Automatically flagged for audit review. Composite Risk: ${compositeRisk}/100 (${riskTier} Tier, ${confidence} Confidence). Triggered rules: ${triggeredFlags.join(', ') || 'None'}. ML Anomaly Score: ${anomalyScore}.`,
              timestamp: new Date().toISOString()
            }
          ],
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });
      } else {
        existingCase.composite_risk = compositeRisk;
        existingCase.risk_tier = riskTier;
        existingCase.confidence = confidence;
        existingCase.rule_flags = triggeredFlags;
        existingCase.evidence_summary = structuredEvidence.map(e => e.reason).join(' | ');
        existingCase.updated_at = new Date().toISOString();
        store.saveCase(existingCase);
      }
    }
  }

  store.saveRiskScores(scoresObj);
  store.logAudit({
    action: 'RUN_FULL_SCORING_PIPELINE',
    actor_email: 'system',
    actor_role: 'Data Curator',
    details: { total_works_scored: works.length, ml_status: modelStatus }
  });

  return {
    scored_count: works.length,
    ml_model_status: modelStatus,
    scores: scoresObj
  };
}

function generateExplanationText(work, ruleFlags, compositeRisk, anomalyScore) {
  if (!ruleFlags || ruleFlags.length === 0) {
    return `Work ID ${work.work_id} shows low overall risk (Composite Score: ${compositeRisk}/100, Anomaly Score: ${anomalyScore}). All evaluated procurement parameters comply with standard MPLADS guidelines.`;
  }
  const parts = [];
  parts.push(`Work ID ${work.work_id} flagged with Composite Risk Score ${compositeRisk}/100 (ML Anomaly Score: ${anomalyScore}).`);
  if (ruleFlags.includes('R1')) parts.push("Triggers Rule R1: Project category matches statutory prohibited list.");
  if (ruleFlags.includes('R2')) parts.push("Triggers Rule R2: High multi-field similarity matching an existing work recommendation.");
  if (ruleFlags.includes('R3')) parts.push("Triggers Rule R3: Utilization Certificate (UC) submission lag exceeds allowed timeline limits.");
  if (ruleFlags.includes('R4')) parts.push("Triggers Rule R4: Sanctioned amount approaches tender ceiling threshold without formal tender linkage.");
  if (ruleFlags.includes('R5')) parts.push("Triggers Rule R5: Implementing Agency holds an over-concentrated share of constituency works.");
  if (ruleFlags.includes('R6')) parts.push("Triggers Rule R6: Proposed cost exceeds 1.5x expected category benchmark.");
  return parts.join(' ');
}

module.exports = {
  evaluateRulesDetailed,
  runFullScoringPipeline,
  generateExplanationText,
  computeRiskConfidence
};
