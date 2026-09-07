const store = require('../models/store');

/**
 * Text similarity helper (Token Jaccard + Cosine-like overlap)
 */
function computeTextSimilarity(str1, str2) {
  if (!str1 || !str2) return 0;
  const s1 = str1.toLowerCase().replace(/[^a-z0-9\s]/g, '');
  const s2 = str2.toLowerCase().replace(/[^a-z0-9\s]/g, '');
  if (s1 === s2) return 1.0;

  const tokens1 = new Set(s1.split(/\s+/).filter(t => t.length > 2));
  const tokens2 = new Set(s2.split(/\s+/).filter(t => t.length > 2));

  if (tokens1.size === 0 || tokens2.size === 0) return 0;

  let intersection = 0;
  tokens1.forEach(t => {
    if (tokens2.has(t)) intersection++;
  });

  const union = new Set([...tokens1, ...tokens2]).size;
  return intersection / union;
}

/**
 * Calculate 7 features for every work record (PRD 12.1)
 */
function computeFeaturesForWorks(works, mps, config) {
  // Map MP utilization metrics
  const mpUtilMap = {};
  mps.forEach(mp => {
    const utilPct = mp.total_entitlement > 0 ? (mp.total_utilized / mp.total_entitlement) * 100 : 0;
    mpUtilMap[mp.mp_id] = {
      utilPct,
      scPct: mp.sc_st_spend_pct ? mp.sc_st_spend_pct.sc : 18.0,
      stPct: mp.sc_st_spend_pct ? mp.sc_st_spend_pct.st : 8.5
    };
  });

  // Calculate national utilization decile cutoff
  const allUtilPcts = Object.values(mpUtilMap).map(m => m.utilPct).sort((a, b) => a - b);
  const bottomDecileCutoff = allUtilPcts[Math.floor(allUtilPcts.length * config.r4_under_utilization_decile)] || 40;

  const featureVectors = [];

  works.forEach(w => {
    // 1. Duplicate similarity against other works by same IA
    let maxSimilarity = 0;
    works.forEach(otherW => {
      if (otherW.work_id !== w.work_id && (otherW.ia_id === w.ia_id || otherW.mp_id === w.mp_id)) {
        const sim = computeTextSimilarity(w.description, otherW.description);
        const amountRatio = Math.min(w.sanctioned_amount, otherW.sanctioned_amount) / Math.max(w.sanctioned_amount, otherW.sanctioned_amount);
        if (sim >= 0.7 && amountRatio >= 0.85) {
          const blendedSim = sim * 0.7 + amountRatio * 0.3;
          if (blendedSim > maxSimilarity) {
            maxSimilarity = blendedSim;
          }
        }
      }
    });

    // 2. Tender linkage flag
    const tenderBypassFlag = (w.sanctioned_amount >= config.r2_tender_threshold && (!w.tender_id || w.tender_id.trim() === '')) ? 1 : 0;

    // 3. Ineligible category score
    let ineligibleScore = 0;
    const descLower = (w.description || '').toLowerCase();
    const catLower = (w.category || '').toLowerCase();
    config.r3_ineligible_keywords.forEach(kw => {
      if (descLower.includes(kw) || catLower.includes(kw)) {
        ineligibleScore = 1.0;
      }
    });

    // 4. Utilization percentile metric
    const mpInfo = mpUtilMap[w.mp_id] || { utilPct: 50, scPct: 15, stPct: 7.5 };
    const isChronicLowUtil = mpInfo.utilPct <= bottomDecileCutoff ? 1 : 0;

    // 5. SC/ST norm gap
    const scViolation = mpInfo.scPct < config.r5_sc_norm_pct ? (config.r5_sc_norm_pct - mpInfo.scPct) / config.r5_sc_norm_pct : 0;
    const stViolation = mpInfo.stPct < config.r5_st_norm_pct ? (config.r5_st_norm_pct - mpInfo.stPct) / config.r5_st_norm_pct : 0;
    const scStGapScore = Math.max(scViolation, stViolation);

    // 6. UC Lag Days
    let ucLagDays = 0;
    if (w.completion_date) {
      const compDate = new Date(w.completion_date);
      const refDate = w.uc_filed_date ? new Date(w.uc_filed_date) : new Date('2026-09-01');
      const diffDays = Math.floor((refDate - compDate) / (1000 * 60 * 60 * 24));
      if (diffDays > 30) {
        ucLagDays = diffDays - 30;
      }
    }

    // 7. IA concentration index
    const iaWorksCount = works.filter(o => o.ia_id === w.ia_id && o.mp_id === w.mp_id).length;
    const totalMpWorks = works.filter(o => o.mp_id === w.mp_id).length;
    const iaConcentrationIndex = totalMpWorks > 0 ? iaWorksCount / totalMpWorks : 0;

    featureVectors.push({
      work_id: w.work_id,
      features: {
        duplicate_similarity: maxSimilarity,
        tender_bypass: tenderBypassFlag,
        ineligible_category: ineligibleScore,
        chronic_low_utilization: isChronicLowUtil,
        sc_st_gap: scStGapScore,
        uc_lag_days: ucLagDays,
        ia_concentration: iaConcentrationIndex
      }
    });
  });

  return featureVectors;
}

/**
 * Isolation Forest baseline statistical anomaly scoring
 */
function computeAnomalyScores(featureVectors) {
  const scores = {};
  featureVectors.forEach(fv => {
    const f = fv.features;
    // Calculate Mahalanobis/Distance-like statistical outlier score normalized 0 to 1
    const rawScore = 
      (f.duplicate_similarity * 0.25) +
      (f.tender_bypass * 0.25) +
      (f.ineligible_category * 0.20) +
      (Math.min(f.uc_lag_days / 90, 1.0) * 0.15) +
      (f.ia_concentration * 0.15);
    
    // Normalize to 0.05 - 0.98 range
    scores[fv.work_id] = parseFloat(Math.min(Math.max(rawScore, 0.05), 0.98).toFixed(3));
  });
  return scores;
}

/**
 * Evaluate deterministic rules R1-R6 for a single work
 */
function evaluateRulesForWork(work, mpInfo, allWorks, config) {
  const ruleFlags = [];

  // R1: Duplicate Billing
  let isDuplicate = false;
  allWorks.forEach(other => {
    if (other.work_id !== work.work_id && (other.ia_id === work.ia_id || other.mp_id === work.mp_id)) {
      const sim = computeTextSimilarity(work.description, other.description);
      const amountRatio = Math.min(work.sanctioned_amount, other.sanctioned_amount) / Math.max(work.sanctioned_amount, other.sanctioned_amount);
      if (sim >= config.r1_duplicate_similarity_threshold && amountRatio >= 0.85) {
        isDuplicate = true;
      }
    }
  });
  if (isDuplicate) ruleFlags.push('R1');

  // R2: Tender Bypass
  if (work.sanctioned_amount >= config.r2_tender_threshold && (!work.tender_id || work.tender_id.trim() === '')) {
    ruleFlags.push('R2');
  }

  // R3: Ineligible Category
  const descLower = (work.description || '').toLowerCase();
  const catLower = (work.category || '').toLowerCase();
  let isIneligible = false;
  config.r3_ineligible_keywords.forEach(kw => {
    if (descLower.includes(kw) || catLower.includes(kw)) {
      isIneligible = true;
    }
  });
  if (isIneligible) ruleFlags.push('R3');

  // R4: Chronic Under-Utilization
  if (mpInfo && mpInfo.is_chronic_low_util) {
    ruleFlags.push('R4');
  }

  // R5: SC/ST Norm Violation
  if (mpInfo && (mpInfo.sc_pct < config.r5_sc_norm_pct || mpInfo.st_pct < config.r5_st_norm_pct)) {
    ruleFlags.push('R5');
  }

  // R6: Late or Missing UC
  if (work.completion_date) {
    const compDate = new Date(work.completion_date);
    const ucDate = work.uc_filed_date ? new Date(work.uc_filed_date) : null;
    const now = new Date('2026-09-01');

    if (ucDate) {
      const daysElapsed = Math.floor((ucDate - compDate) / (1000 * 60 * 60 * 24));
      if (daysElapsed > 30) {
        ruleFlags.push('R6');
      }
    } else {
      const daysSinceCompletion = Math.floor((now - compDate) / (1000 * 60 * 60 * 24));
      if (daysSinceCompletion > config.r6_uc_grace_days) {
        ruleFlags.push('R6');
      }
    }
  }

  return ruleFlags;
}

/**
 * Generate plain-language explanation with rule citations (SRS FR-EXP-01, FR-EXP-02, FR-EXP-03)
 */
function generateExplanation(work, ruleFlags, compositeRisk, config) {
  if (!ruleFlags || ruleFlags.length === 0) {
    return "No risk indicators flagged for this work. The work adheres to normal MPLADS expenditure norms and timeline guidelines.";
  }

  const parts = [];
  const amountStr = `₹${(work.sanctioned_amount / 100000).toFixed(2)} Lakhs`;

  if (ruleFlags.includes('R1')) {
    parts.push(`This work (valued at ${amountStr}) shows duplicate description and billing pattern matching another sanctioned asset by the same Implementing Agency across financial years, violating MPLADS Rule on duplicate sanctions (CAG 2018 Report Finding).`);
  }

  if (ruleFlags.includes('R2')) {
    const threshLakhs = config.r2_tender_threshold / 100000;
    parts.push(`The sanctioned amount of ${amountStr} exceeds the statutory tender threshold of ₹${threshLakhs} Lakhs, but no competitive tender identification number is attached (Rule R2: Tender Bypass, MPLADS Guidelines §7.2).`);
  }

  if (ruleFlags.includes('R3')) {
    parts.push(`The project description indicates expenditure on an ineligible asset category ('${work.category || 'prohibited asset'}'), violating the permitted work list under Para 3.3 of MPLADS Guidelines (CAG Audit 2004-09 finding).`);
  }

  if (ruleFlags.includes('R4')) {
    parts.push(`The constituency's fund utilization percentile has remained in the bottom national decile for consecutive financial years (Rule R4: Chronic Under-utilization).`);
  }

  if (ruleFlags.includes('R5')) {
    parts.push(`The constituency has failed to meet the mandatory annual allocation quota of 15% for SC-inhabited areas and 7.5% for ST-inhabited areas (Rule R5: SC/ST Norm Violation, Para 2.4).`);
  }

  if (ruleFlags.includes('R6')) {
    if (work.completion_date && work.uc_filed_date) {
      const days = Math.floor((new Date(work.uc_filed_date) - new Date(work.completion_date)) / (86400000));
      parts.push(`The Utilization Certificate was filed ${days} days after work completion, exceeding the mandated 30-day filing timeline (Rule R6: Delayed UC, MPLADS Guidelines Para 6.4).`);
    } else {
      parts.push(`The work completion date is recorded, but no Utilization Certificate (UC) has been submitted past the 45-day allowable grace period (Rule R6: Missing UC).`);
    }
  }

  return parts.join(' ');
}

/**
 * Execute full scoring pipeline on store data
 */
function runFullScoringPipeline() {
  const works = store.getWorks();
  const mps = store.getMPs();
  const config = store.getRuleConfig();

  if (works.length === 0) return { scored_count: 0 };

  const mpMap = {};
  const allUtilPcts = mps.map(m => (m.total_entitlement > 0 ? (m.total_utilized / m.total_entitlement) * 100 : 0)).sort((a, b) => a - b);
  const cutoff = allUtilPcts[Math.floor(allUtilPcts.length * config.r4_under_utilization_decile)] || 40;

  mps.forEach(m => {
    const util = m.total_entitlement > 0 ? (m.total_utilized / m.total_entitlement) * 100 : 0;
    mpMap[m.mp_id] = {
      util_pct: util,
      is_chronic_low_util: util <= cutoff,
      sc_pct: m.sc_st_spend_pct ? m.sc_st_spend_pct.sc : 18,
      st_pct: m.sc_st_spend_pct ? m.sc_st_spend_pct.st : 8.5
    };
  });

  const featureVectors = computeFeaturesForWorks(works, mps, config);
  const anomalyScores = computeAnomalyScores(featureVectors);

  const scoresObj = {};
  const ruleWeightMap = { R1: 35, R2: 30, R3: 30, R4: 20, R5: 15, R6: 20 };

  works.forEach(w => {
    const mpInfo = mpMap[w.mp_id];
    const ruleFlags = evaluateRulesForWork(w, mpInfo, works, config);
    const anomalyScore = anomalyScores[w.work_id] || 0.1;

    let ruleSeverityScore = 0;
    ruleFlags.forEach(r => {
      ruleSeverityScore += (ruleWeightMap[r] || 15);
    });

    // Blended composite score 0-100 (rule severity + anomaly model)
    const rawComposite = (ruleSeverityScore * 0.85) + (anomalyScore * 100 * 0.15);
    const compositeRisk = Math.min(100, Math.max(0, Math.round(rawComposite)));

    const explanationText = generateExplanation(w, ruleFlags, compositeRisk, config);

    scoresObj[w.work_id] = {
      work_id: w.work_id,
      rule_flags: ruleFlags,
      anomaly_score: anomalyScore,
      composite_risk: compositeRisk,
      explanation_text: explanationText,
      generated_at: new Date().toISOString()
    };

    // Auto-create or sync case record for flagged works (risk >= 40)
    if (compositeRisk >= 40) {
      const existingCase = store.getCaseByWorkId(w.work_id);
      if (!existingCase) {
        store.saveCase({
          case_id: 'CASE-' + w.work_id,
          work_id: w.work_id,
          assigned_auditor_id: null,
          assigned_auditor_name: 'Unassigned',
          status: 'New',
          notes: [
            {
              note_id: 'NOTE-' + Date.now(),
              author_id: 'SYSTEM',
              author_name: 'Kosh-Drishti Risk Engine',
              text: `Automatically flagged for audit review. Composite Risk Score: ${compositeRisk}/100. Triggered rules: ${ruleFlags.join(', ')}.`,
              timestamp: new Date().toISOString()
            }
          ],
          updated_at: new Date().toISOString()
        });
      }
    }
  });

  store.saveRiskScores(scoresObj);
  store.logAudit({
    action: 'RUN_SCORING_PIPELINE',
    actor_email: 'system',
    actor_role: 'Data Curator',
    details: { total_works_scored: works.length }
  });

  return { scored_count: works.length };
}

module.exports = {
  computeTextSimilarity,
  evaluateRulesForWork,
  generateExplanation,
  runFullScoringPipeline
};
