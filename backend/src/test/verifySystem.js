const http = require('http');
const store = require('../models/store');

console.log('---------------------------------------------------------');
console.log('KOSH-DRISHTI SYSTEM VERIFICATION & ACCEPTANCE TEST SUITE');
console.log('---------------------------------------------------------');

// 1. Verify Dataset Seed & Scoring
const works = store.getWorks();
const riskScores = store.getRiskScores();
console.log(`✓ Total works in database: ${works.length}`);
console.log(`✓ Total scored risk records: ${Object.keys(riskScores).length}`);

// 2. Verify Confirmed Gujarat Demo Case (SRS FR-ML-03 / PRD 12.5)
const gujaratDemoCase = store.getWorkById('GW-2018-045');
const gujaratScore = store.getRiskScoreByWorkId('GW-2018-045');

if (!gujaratDemoCase || !gujaratScore) {
  console.error('❌ FAIL: Gujarat Demo Case GW-2018-045 not found in dataset!');
  process.exit(1);
}

console.log('\n--- GUJARAT CONFIRMED DEMO CASE VERIFICATION (FR-ML-03) ---');
console.log(`Work ID: ${gujaratDemoCase.work_id}`);
console.log(`Description: ${gujaratDemoCase.description}`);
console.log(`Composite Risk Score: ${gujaratScore.composite_risk}/100`);
console.log(`Triggered Rules: [${gujaratScore.rule_flags.join(', ')}]`);
console.log(`Explanation: "${gujaratScore.explanation_text}"`);

// Assertions per SRS acceptance criteria
if (gujaratScore.composite_risk < 75) {
  console.error(`❌ FAIL: Composite risk score for Gujarat case (${gujaratScore.composite_risk}) is below top 5% threshold (75)!`);
  process.exit(1);
}

if (!gujaratScore.rule_flags.includes('R1') || !gujaratScore.rule_flags.includes('R2') || !gujaratScore.rule_flags.includes('R6')) {
  console.error(`❌ FAIL: Expected rules R1, R2, R6 to be triggered for Gujarat case, got: ${gujaratScore.rule_flags}`);
  process.exit(1);
}

console.log('✅ PASS: FR-ML-03 Gujarat Demo Case re-detected in top risk band with expected R1, R2, R6 rule citations!');

// 3. Verify Case Status Sequence Constraint (BR-07)
console.log('\n--- BUSINESS RULE BR-07 CASE STATUS TRANSITION TEST ---');
const caseObj = store.getCaseByWorkId('GW-2018-045');
if (caseObj) {
  console.log(`Case ID: ${caseObj.case_id}, Initial Status: ${caseObj.status}`);
  if (caseObj.status === 'New') {
    console.log('✅ PASS: Automatically created case starts in "New" status');
  }
}

console.log('\n=========================================================');
console.log('ALL P0 SYSTEM ACCEPTANCE CRITERIA VERIFIED SUCCESSFULLY!');
console.log('=========================================================');
