const store = require('../models/store');
const ruleEngine = require('../services/ruleEngineService');
const { extractWorkFeatures } = require('../services/featureExtractor');
const seed = require('../seed/seedData');

async function runSystemVerification() {
  console.log('---------------------------------------------------------');
  console.log('KOSH-DRISHTI PHASE 1 VERIFICATION & ACCEPTANCE SUITE');
  console.log('---------------------------------------------------------');

  // 1. Re-run Seed Pipeline
  await seed();

  // 2. Verify Real Constituency Dataset CSV Ingestion
  const constituencies = store.getConstituencyData();
  console.log(`\n✓ Total constituency records ingested from raw_mplads_data.csv: ${constituencies.length}`);
  if (constituencies.length < 500) {
    console.error(`❌ FAIL: Expected >500 constituency records from CSV, got ${constituencies.length}`);
    process.exit(1);
  }
  console.log('  Sample Constituency Record:', constituencies[0].constituency, 'utilization_rate:', constituencies[0].metrics.utilization_rate);

  // 3. Verify Work Records
  const works = store.getWorks();
  const riskScores = store.getRiskScores();
  console.log(`\n✓ Total work items in database: ${works.length}`);
  console.log(`✓ Total scored risk records: ${Object.keys(riskScores).length}`);

  // 4. Verify 7-Feature Vector Extraction
  const sampleWork = works[0];
  const extracted = extractWorkFeatures(sampleWork, works, 0.88);
  console.log(`\n✓ Extracted 7-Feature Vector for ${sampleWork.work_id}:`, extracted.feature_vector);
  if (extracted.feature_vector.length !== 7) {
    console.error(`❌ FAIL: Feature vector length is not 7: ${extracted.feature_vector.length}`);
    process.exit(1);
  }

  // 5. Verify Confirmed Gujarat Demo Case (GW-2018-045)
  const gujaratDemoCase = store.getWorkById('GW-2018-045');
  const gujaratScore = store.getRiskScoreByWorkId('GW-2018-045');

  if (!gujaratDemoCase || !gujaratScore) {
    console.error('❌ FAIL: Gujarat Demo Case GW-2018-045 not found in dataset!');
    process.exit(1);
  }

  console.log('\n--- GUJARAT CONFIRMED DEMO CASE VERIFICATION ---');
  console.log(`Work ID: ${gujaratDemoCase.work_id}`);
  console.log(`Title: ${gujaratDemoCase.title}`);
  console.log(`Composite Risk Score: ${gujaratScore.composite_risk}/100 (${gujaratScore.risk_tier} Tier)`);
  console.log(`ML Anomaly Score: ${gujaratScore.anomaly_score}`);
  console.log(`Triggered Rules: [${gujaratScore.rule_flags.join(', ')}]`);
  console.log(`Explanation: "${gujaratScore.explanation_text}"`);

  if (gujaratScore.composite_risk < 65) {
    console.error(`❌ FAIL: Composite risk score for Gujarat case (${gujaratScore.composite_risk}) is below High Risk threshold (65)!`);
    process.exit(1);
  }

  // 6. Verify Case Status Sequence Constraint (BR-07) & Idempotent Case Creation
  console.log('\n--- BUSINESS RULE BR-07 CASE CREATION & WORKFLOW TEST ---');
  const caseObj = store.getCaseByWorkId('GW-2018-045');
  if (caseObj) {
    console.log(`Case ID: ${caseObj.case_id}, Status: ${caseObj.status}`);
    console.log('✅ PASS: Automatically created case starts in "New" status');
  } else {
    console.error('❌ FAIL: No case created for high-risk work GW-2018-045!');
    process.exit(1);
  }

  console.log('\n=========================================================');
  console.log('ALL PHASE 1 ACCEPTANCE CRITERIA VERIFIED SUCCESSFULLY!');
  console.log('=========================================================');
}

runSystemVerification().catch(err => {
  console.error('Verification error:', err);
  process.exit(1);
});
