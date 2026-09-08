const store = require('../models/store');

/**
 * Category Cost Benchmarks (INR) for MPLADS work categories
 */
const CATEGORY_BENCHMARKS = {
  'Community Infrastructures': 1500000, // 15 Lakhs
  'Education': 2000000,                  // 20 Lakhs
  'Public Health': 2500000,              // 25 Lakhs
  'Water Supply & Sanitation': 1000000,  // 10 Lakhs
  'Roads & Bridges': 3000000,            // 30 Lakhs
  'Default': 1500000                     // 15 Lakhs
};

/**
 * Calculates days between two date strings safely
 */
function calculateDaysDifference(dateStr1, dateStr2) {
  if (!dateStr1 || !dateStr2) return 0;
  const d1 = new Date(dateStr1);
  const d2 = new Date(dateStr2);
  if (isNaN(d1.getTime()) || isNaN(d2.getTime())) return 0;
  const diffMs = Math.abs(d2.getTime() - d1.getTime());
  return Math.floor(diffMs / (1000 * 60 * 60 * 24));
}

/**
 * Computes IA Concentration for a work's implementing agency within its constituency
 */
function computeIAConcentration(work, allWorks) {
  if (!work.implementing_agency || !work.constituency) return 0.1;
  const constituencyWorks = allWorks.filter(w => w.constituency === work.constituency);
  if (constituencyWorks.length <= 1) return 0.2;
  const iaCount = constituencyWorks.filter(w => w.implementing_agency === work.implementing_agency).length;
  return iaCount / constituencyWorks.length;
}

/**
 * Extracts 7 numerical features from a single work item for IsolationForest
 * Returns: { work_id, feature_vector: [f1..f7], feature_map: { ... }, data_scope: 'DEMO_SEED_WORK' }
 */
function extractWorkFeatures(work, allWorks = [], duplicateSimScore = 0.0) {
  const config = store.getRuleConfig() || {};
  const keywords = config.r3_ineligible_keywords || [
    'temple', 'mosque', 'church', 'gurudwara', 'religious', 'shrine',
    'land purchase', 'commercial complex', 'private building', 'club'
  ];

  const amount = parseFloat(work.sanctioned_amount || work.proposed_cost || 0);

  // 1. Proposed Cost Scaled [0.0, 1.0] (Scaled relative to 1 Cr ₹10,000,000 ceiling)
  const f1_cost_scaled = Math.min(Math.max(amount / 10000000, 0), 1.0);

  // 2. UC Lag Days Ratio [0.0, 1.0] (Normalized relative to 365 days)
  let lagDays = 0;
  if (work.recommendation_date && work.uc_date) {
    lagDays = calculateDaysDifference(work.recommendation_date, work.uc_date);
  } else if (work.uc_lag_days !== undefined) {
    lagDays = parseInt(work.uc_lag_days, 10) || 0;
  }
  const f2_uc_lag_ratio = Math.min(Math.max(lagDays / 365, 0), 1.0);

  // 3. IA Concentration Ratio [0.0, 1.0]
  const f3_ia_concentration = Math.min(Math.max(computeIAConcentration(work, allWorks), 0), 1.0);

  // 4. Duplicate Similarity Score [0.0, 1.0]
  const f4_duplicate_sim = Math.min(Math.max(duplicateSimScore, 0), 1.0);

  // 5. Tender Bypass Proximity Flag [0 or 1] (Within 5% below ₹25L/₹50L threshold)
  const tenderThreshold = config.r2_tender_threshold || 2500000;
  const isTenderNear = (amount >= tenderThreshold * 0.90 && amount < tenderThreshold);
  const f5_tender_bypass = isTenderNear ? 1.0 : 0.0;

  // 6. Ineligible Category Flag [0 or 1]
  const titleLower = (work.title || '').toLowerCase();
  const catLower = (work.category || '').toLowerCase();
  const isIneligible = keywords.some(kw => titleLower.includes(kw) || catLower.includes(kw));
  const f6_ineligible_flag = isIneligible ? 1.0 : 0.0;

  // 7. Cost Benchmark Deviation Ratio [0.0, 1.0]
  const benchmark = CATEGORY_BENCHMARKS[work.category] || CATEGORY_BENCHMARKS['Default'];
  const benchmarkRatio = amount > 0 ? (amount / benchmark) : 1.0;
  const f7_benchmark_deviation = Math.min(Math.max(benchmarkRatio / 2.0, 0), 1.0);

  const featureVector = [
    Math.round(f1_cost_scaled * 1000) / 1000,
    Math.round(f2_uc_lag_ratio * 1000) / 1000,
    Math.round(f3_ia_concentration * 1000) / 1000,
    Math.round(f4_duplicate_sim * 1000) / 1000,
    f5_tender_bypass,
    f6_ineligible_flag,
    Math.round(f7_benchmark_deviation * 1000) / 1000
  ];

  return {
    work_id: work.work_id,
    feature_vector: featureVector,
    feature_map: {
      proposed_cost_scaled: featureVector[0],
      uc_lag_days_ratio: featureVector[1],
      ia_concentration_ratio: featureVector[2],
      duplicate_similarity_score: featureVector[3],
      tender_bypass_proximity: featureVector[4],
      ineligible_category_flag: featureVector[5],
      cost_benchmark_deviation: featureVector[6]
    },
    data_scope: work.source || 'DEMO_SEED_WORK'
  };
}

/**
 * Extracts 7 normalized financial features from a real constituency aggregate record for IsolationForest
 * 1. utilization_ratio = ActualExpenditureIncurred / FundReceivedGOI
 * 2. unspent_ratio = UnspentBalance / AmountAvailable
 * 3. recommendation_ratio = WorksRecommCost / Entitlement
 * 4. work_sanction_ratio = WSCost / WorksRecommCost
 * 5. expenditure_to_available_ratio = ActualExpenditureIncurred / AmountAvailable
 * 6. recommendation_to_received_ratio = WorksRecommCost / FundReceivedGOI
 * 7. unspent_to_entitlement_ratio = UnspentBalance / Entitlement
 */
function safeDiv(num, den, maxScale = 2.0) {
  const n = parseFloat(num);
  const d = parseFloat(den);
  if (isNaN(n) || isNaN(d) || d <= 0) return 0.0;
  const ratio = Math.max(0, n / d);
  return Math.min(Math.round((ratio / maxScale) * 1000) / 1000, 1.0);
}

function extractConstituencyFeatures(c) {
  const f1 = safeDiv(c.actual_expenditure_cr, c.fund_received_goi_cr, 1.5);
  const f2 = safeDiv(c.unspent_balance_cr, c.amount_available_cr, 1.0);
  const f3 = safeDiv(c.works_recomm_cost_cr, c.entitlement_cr, 2.0);
  const f4 = safeDiv(c.ws_cost_cr, c.works_recomm_cost_cr, 1.5);
  const f5 = safeDiv(c.actual_expenditure_cr, c.amount_available_cr, 1.0);
  const f6 = safeDiv(c.works_recomm_cost_cr, c.fund_received_goi_cr, 2.0);
  const f7 = safeDiv(c.unspent_balance_cr, c.entitlement_cr, 1.0);

  const featureVector = [f1, f2, f3, f4, f5, f6, f7];

  return {
    id: c.constituency_id || `CONST-${c.sl_no}`,
    constituency_id: c.constituency_id || `CONST-${c.sl_no}`,
    constituency: c.constituency,
    mp_name: c.mp_name,
    feature_vector: featureVector,
    feature_map: {
      utilization_ratio: f1,
      unspent_ratio: f2,
      recommendation_ratio: f3,
      work_sanction_ratio: f4,
      expenditure_to_available_ratio: f5,
      recommendation_to_received_ratio: f6,
      unspent_to_entitlement_ratio: f7
    },
    data_scope: 'CONSTITUENCY_AGGREGATE'
  };
}

module.exports = {
  extractWorkFeatures,
  extractConstituencyFeatures,
  CATEGORY_BENCHMARKS
};
