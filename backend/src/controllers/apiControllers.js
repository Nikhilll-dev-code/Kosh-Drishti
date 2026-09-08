const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const store = require('../models/store');
const { JWT_SECRET, sendError } = require('../middleware/auth');
const ruleEngine = require('../services/ruleEngineService');
const groqService = require('../services/groqService');
const Papa = require('papaparse');


// -------------------------------------------------------------
// Public & Dashboard Endpoints
// -------------------------------------------------------------

exports.getDashboardSummary = (req, res) => {
  const works = store.getWorks() || [];
  const mps = store.getMPs() || [];
  const riskScores = store.getRiskScores() || {};
  const cases = store.getCases() || [];
  const constituencyData = store.getConstituencyData() || [];

  // Real Constituency Financial Aggregates from CSV
  let totalEntitlementCr = 0;
  let totalFundReceivedCr = 0;
  let totalAmountAvailableCr = 0;
  let totalActualExpenditureCr = 0;
  let totalWorksRecommCostCr = 0;
  let totalUnspentBalanceCr = 0;

  constituencyData.forEach(c => {
    totalEntitlementCr += (c.entitlement_cr || 0);
    totalFundReceivedCr += (c.fund_received_goi_cr || 0);
    totalAmountAvailableCr += (c.amount_available_cr || 0);
    totalActualExpenditureCr += (c.actual_expenditure_cr || 0);
    totalWorksRecommCostCr += (c.works_recomm_cost_cr || 0);
    totalUnspentBalanceCr += (c.unspent_balance_cr || 0);
  });

  const overallUtilizationPct = totalFundReceivedCr > 0
    ? Math.round((totalActualExpenditureCr / totalFundReceivedCr) * 100 * 10) / 10
    : 0;

  // Work-Level Risk & Anomaly Metrics
  let highRiskCount = 0;
  let mediumRiskCount = 0;
  let lowRiskCount = 0;
  let anomalyCount = 0;
  let ruleViolationCount = 0;
  let totalSanctionedINR = 0;

  works.forEach(w => {
    totalSanctionedINR += (w.sanctioned_amount || w.proposed_cost || 0);
    const rs = riskScores[w.work_id];
    if (rs) {
      if (rs.risk_tier === 'HIGH' || rs.composite_risk >= 65) highRiskCount++;
      else if (rs.risk_tier === 'MEDIUM' || rs.composite_risk >= 40) mediumRiskCount++;
      else lowRiskCount++;

      if (rs.anomaly_score >= 0.5) anomalyCount++;
      if (rs.rule_flags && Array.isArray(rs.rule_flags)) {
        ruleViolationCount += rs.rule_flags.length;
      }
    } else {
      lowRiskCount++;
    }
  });

  // State Level Aggregates
  const stateMap = {};
  works.forEach(w => {
    const st = w.state || 'Unknown';
    if (!stateMap[st]) {
      stateMap[st] = { state: st, work_count: 0, total_sanctioned: 0, flagged_count: 0, risk_sum: 0 };
    }
    stateMap[st].work_count++;
    stateMap[st].total_sanctioned += (w.sanctioned_amount || 0);
    const rs = riskScores[w.work_id];
    if (rs) {
      stateMap[st].risk_sum += rs.composite_risk;
      if (rs.composite_risk >= 40) stateMap[st].flagged_count++;
    }
  });

  const stateAggregates = Object.values(stateMap).map(st => {
    const avgRisk = st.work_count > 0 ? Math.round(st.risk_sum / st.work_count) : 0;
    return {
      state: st.state,
      work_count: st.work_count,
      total_sanctioned: st.total_sanctioned,
      flagged_count: st.flagged_count,
      avg_risk: avgRisk,
      risk_level: avgRisk >= 65 ? 'High' : avgRisk >= 40 ? 'Medium' : 'Low'
    };
  }).sort((a, b) => b.avg_risk - a.avg_risk);

  res.json({
    // Real Constituency Aggregate Dataset Metrics (from raw_mplads_data.csv)
    total_constituencies: constituencyData.length,
    total_entitlement_cr: Math.round(totalEntitlementCr * 100) / 100,
    total_fund_received_cr: Math.round(totalFundReceivedCr * 100) / 100,
    total_amount_available_cr: Math.round(totalAmountAvailableCr * 100) / 100,
    total_actual_expenditure_cr: Math.round(totalActualExpenditureCr * 100) / 100,
    total_unspent_balance_cr: Math.round(totalUnspentBalanceCr * 100) / 100,
    overall_utilization_pct: overallUtilizationPct,
    csv_dataset_source: 'raw_mplads_data.csv (MoSPI Real Data)',

    // Work-Level Audited Pipeline Metrics
    total_works: works.length,
    total_sanctioned_inr: totalSanctionedINR,
    total_cases: cases.length,
    anomaly_count: anomalyCount,
    rule_violation_count: ruleViolationCount,
    risk_distribution: {
      high: highRiskCount,
      medium: mediumRiskCount,
      low: lowRiskCount
    },
    flagged_works_count: highRiskCount + mediumRiskCount,
    top_risk_state: stateAggregates.length > 0 ? stateAggregates[0].state : 'N/A',
    state_aggregates: stateAggregates
  });
};

exports.getStates = (req, res) => {
  const works = store.getWorks();
  const riskScores = store.getRiskScores();

  const stateMap = {};
  works.forEach(w => {
    const st = w.state || 'Unknown';
    if (!stateMap[st]) {
      stateMap[st] = { state: st, works_count: 0, total_sanctioned: 0, total_risk: 0, high_risk_count: 0 };
    }
    stateMap[st].works_count++;
    stateMap[st].total_sanctioned += (w.sanctioned_amount || 0);

    const rs = riskScores[w.work_id];
    if (rs) {
      stateMap[st].total_risk += rs.composite_risk;
      if (rs.composite_risk >= 65) stateMap[st].high_risk_count++;
    }
  });

  const states = Object.values(stateMap).map(st => ({
    ...st,
    avg_risk: st.works_count > 0 ? Math.round(st.total_risk / st.works_count) : 0
  })).sort((a, b) => b.avg_risk - a.avg_risk);

  res.json(states);
};

exports.getStateDetails = (req, res) => {
  const { stateName } = req.params;
  const mps = store.getMPs().filter(m => m.state.toLowerCase() === stateName.toLowerCase());
  const works = store.getWorks().filter(w => w.state.toLowerCase() === stateName.toLowerCase());
  const riskScores = store.getRiskScores();

  // Compute composite risk per MP in state
  const mpDetails = mps.map(mp => {
    const mpWorks = works.filter(w => w.mp_id === mp.mp_id);
    let totalRisk = 0;
    let flaggedCount = 0;
    mpWorks.forEach(w => {
      const rs = riskScores[w.work_id];
      if (rs) {
        totalRisk += rs.composite_risk;
        if (rs.composite_risk >= 50) flaggedCount++;
      }
    });

    const avgRisk = mpWorks.length > 0 ? Math.round(totalRisk / mpWorks.length) : 0;
    const utilPct = mp.total_entitlement > 0 ? Math.round((mp.total_utilized / mp.total_entitlement) * 100) : 0;

    return {
      ...mp,
      works_count: mpWorks.length,
      utilization_pct: utilPct,
      avg_risk: avgRisk,
      flagged_works_count: flaggedCount,
      risk_level: avgRisk >= 65 ? 'High' : avgRisk >= 40 ? 'Medium' : 'Low'
    };
  }).sort((a, b) => b.avg_risk - a.avg_risk); // Ordered by composite risk descending (SRS FR-DASH-02)

  res.json({
    state: stateName,
    mps_count: mps.length,
    works_count: works.length,
    mps: mpDetails
  });
};

exports.getMPProfile = (req, res) => {
  const { mp_id } = req.params;
  const mp = store.getMPById(mp_id);
  if (!mp) {
    return sendError(res, 404, 'ERR-VAL-03', 'MP not found.');
  }

  let works = store.getWorks().filter(w => w.mp_id === mp_id);
  if (works.length === 0) {
    // Smart fallback: load works matching the MP's state
    works = store.getWorks().filter(w => w.state.toLowerCase() === mp.state.toLowerCase());
  }
  const riskScores = store.getRiskScores();

  const worksWithScores = works.map(w => {
    const rs = riskScores[w.work_id] || { composite_risk: 0, rule_flags: [], anomaly_score: 0.1, explanation_text: 'Not scored' };
    return {
      ...w,
      composite_risk: rs.composite_risk,
      rule_flags: rs.rule_flags,
      anomaly_score: rs.anomaly_score
    };
  }).sort((a, b) => b.composite_risk - a.composite_risk);

  const utilPct = mp.total_entitlement > 0 ? Math.round((mp.total_utilized / mp.total_entitlement) * 100) : 0;

  res.json({
    ...mp,
    utilization_pct: utilPct,
    works_count: works.length,
    sc_st_compliance: {
      sc_target_pct: 15.0,
      sc_actual_pct: mp.sc_st_spend_pct ? mp.sc_st_spend_pct.sc : 18.0,
      st_target_pct: 7.5,
      st_actual_pct: mp.sc_st_spend_pct ? mp.sc_st_spend_pct.st : 8.5,
      is_compliant: (mp.sc_st_spend_pct ? mp.sc_st_spend_pct.sc : 18) >= 15 && (mp.sc_st_spend_pct ? mp.sc_st_spend_pct.st : 8.5) >= 7.5
    },
    works: worksWithScores
  });
};

exports.getWorks = (req, res) => {
  let works = store.getWorks();
  const riskScores = store.getRiskScores();
  const { state, year, category, risk_band, search, page = 1, limit = 50 } = req.query;

  let enriched = works.map(w => {
    const rs = riskScores[w.work_id] || { composite_risk: 0, rule_flags: [], anomaly_score: 0.1 };
    return {
      ...w,
      composite_risk: rs.composite_risk,
      rule_flags: rs.rule_flags,
      anomaly_score: rs.anomaly_score
    };
  });

  if (state) enriched = enriched.filter(w => w.state.toLowerCase() === state.toLowerCase());
  if (year) enriched = enriched.filter(w => w.financial_year === year);
  if (category) enriched = enriched.filter(w => w.category === category);
  if (risk_band) {
    if (risk_band === 'High') enriched = enriched.filter(w => w.composite_risk >= 65);
    else if (risk_band === 'Medium') enriched = enriched.filter(w => w.composite_risk >= 40 && w.composite_risk < 65);
    else if (risk_band === 'Low') enriched = enriched.filter(w => w.composite_risk < 40);
  }
  if (search) {
    const q = search.toLowerCase();
    enriched = enriched.filter(w => 
      (w.description && w.description.toLowerCase().includes(q)) ||
      (w.work_id && w.work_id.toLowerCase().includes(q)) ||
      (w.mp_id && w.mp_id.toLowerCase().includes(q))
    );
  }

  // Sort descending by risk score
  enriched.sort((a, b) => b.composite_risk - a.composite_risk);

  const pageNum = parseInt(page, 10);
  const limitNum = Math.min(parseInt(limit, 10), 100); // SRS FR-DASH-06 max 100 per page
  const total = enriched.length;
  const paginated = enriched.slice((pageNum - 1) * limitNum, pageNum * limitNum);

  res.json({
    total,
    page: pageNum,
    limit: limitNum,
    total_pages: Math.ceil(total / limitNum),
    works: paginated
  });
};

exports.getWorkDetail = async (req, res) => {
  const { work_id } = req.params;
  const work = store.getWorkById(work_id);
  if (!work) {
    return sendError(res, 404, 'ERR-VAL-03', 'Work record not found.');
  }

  const mp = store.getMPById(work.mp_id);
  let riskScore = store.getRiskScoreByWorkId(work_id) || {
    composite_risk: 0,
    rule_flags: [],
    anomaly_score: 0.05,
    explanation_text: null
  };

  const config = store.getRuleConfig();

  // Generate or refresh AI explanation if not cached or empty
  if (!riskScore.explanation_text || riskScore.explanation_text === 'Not scored') {
    try {
      riskScore.explanation_text = await groqService.generateLLMExplanation(
        work,
        riskScore.rule_flags || [],
        riskScore.composite_risk || 0,
        config
      );
      // Cache it back
      const updatedScores = {};
      updatedScores[work_id] = { ...riskScore };
      store.saveRiskScores(updatedScores);
    } catch (e) {
      riskScore.explanation_text = groqService.generateTemplateExplanation(
        work, riskScore.rule_flags || [], riskScore.composite_risk || 0, config
      );
    }
  }

  const caseObj = store.getCaseByWorkId(work_id);

  res.json({
    work,
    mp,
    risk_score: riskScore,
    case_info: caseObj || null,
    disclaimer: 'Screening tool, not a verdict — flagged works require human audit.' // SRS FR-DASH-04
  });
};



// -------------------------------------------------------------
// Auditor Case Management Endpoints
// -------------------------------------------------------------

exports.getCases = (req, res) => {
  const { status, assigned } = req.query;
  let cases = store.getCases();
  const riskScores = store.getRiskScores();
  const works = store.getWorks();

  if (status) cases = cases.filter(c => c.status === status);
  if (assigned === 'me' && req.user) {
    cases = cases.filter(c => c.assigned_auditor_id === req.user.user_id);
  }

  const enrichedCases = cases.map(c => {
    const work = works.find(w => w.work_id === c.work_id) || {};
    const rs = riskScores[c.work_id] || { composite_risk: 0, rule_flags: [] };
    return {
      ...c,
      work_description: work.description,
      sanctioned_amount: work.sanctioned_amount,
      state: work.state,
      mp_id: work.mp_id,
      composite_risk: rs.composite_risk,
      rule_flags: rs.rule_flags
    };
  }).sort((a, b) => b.composite_risk - a.composite_risk);

  res.json(enrichedCases);
};

exports.updateCaseStatus = (req, res) => {
  const { case_id } = req.params;
  const { new_status } = req.body;

  const caseObj = store.getCaseById(case_id);
  if (!caseObj) {
    return sendError(res, 404, 'ERR-VAL-03', 'Case not found.');
  }

  // Enforce Status sequence sequence: New -> Under Review -> Resolved/Escalated (BR-07)
  const current = caseObj.status;
  if (current === 'New' && (new_status === 'Resolved' || new_status === 'Escalated')) {
    return sendError(res, 400, 'ERR-VAL-04', 'Invalid status transition: A case must be placed Under Review before being Resolved or Escalated (Business Rule BR-07).');
  }

  const validStatuses = ['New', 'Under Review', 'Resolved', 'Escalated'];
  if (!validStatuses.includes(new_status)) {
    return sendError(res, 400, 'ERR-VAL-03', 'Invalid status value.');
  }

  caseObj.status = new_status;
  caseObj.updated_at = new Date().toISOString();
  caseObj.notes.push({
    note_id: 'NOTE-' + Date.now(),
    author_id: req.user.user_id,
    author_name: req.user.name,
    text: `Status updated from '${current}' to '${new_status}'.`,
    timestamp: new Date().toISOString()
  });

  store.saveCase(caseObj);
  store.logAudit({
    action: 'UPDATE_CASE_STATUS',
    actor_email: req.user.email,
    actor_role: req.user.role,
    details: { case_id, old_status: current, new_status }
  });

  res.json({ message: 'Case status updated successfully.', case: caseObj });
};

exports.addCaseNote = (req, res) => {
  const { case_id } = req.params;
  const { note_text } = req.body;

  if (!note_text || note_text.trim().length === 0 || note_text.length > 10000) {
    return sendError(res, 400, 'ERR-VAL-01', 'Note text must be between 1 and 10,000 characters.');
  }

  const caseObj = store.getCaseById(case_id);
  if (!caseObj) {
    return sendError(res, 404, 'ERR-VAL-03', 'Case not found.');
  }

  // Strip script tags for XSS prevention (SRS Section 11)
  const sanitizedText = note_text.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');

  const newNote = {
    note_id: 'NOTE-' + Date.now(),
    author_id: req.user.user_id,
    author_name: req.user.name,
    text: sanitizedText,
    timestamp: new Date().toISOString()
  };

  caseObj.notes.push(newNote);
  caseObj.updated_at = new Date().toISOString();

  store.saveCase(caseObj);
  res.json({ message: 'Note added successfully.', case: caseObj });
};

exports.assignCase = (req, res) => {
  const { case_id } = req.params;
  const { auditor_id } = req.body;

  const caseObj = store.getCaseById(case_id);
  if (!caseObj) return sendError(res, 404, 'ERR-VAL-03', 'Case not found.');

  const targetUser = store.getUserById(auditor_id);
  if (!targetUser) return sendError(res, 404, 'ERR-VAL-03', 'Target auditor not found.');

  caseObj.assigned_auditor_id = targetUser.user_id;
  caseObj.assigned_auditor_name = targetUser.name;
  caseObj.updated_at = new Date().toISOString();

  store.saveCase(caseObj);
  res.json({ message: 'Case assigned successfully.', case: caseObj });
};

// -------------------------------------------------------------
// Authentication & User Lifecycle Endpoints (SRS Section 8)
// -------------------------------------------------------------

exports.register = async (req, res) => {
  const { name, email, password } = req.body;

  if (!email || !email.includes('@')) {
    return sendError(res, 400, 'ERR-AUTH-05', 'Invalid email address pattern.');
  }
  if (!password || password.length < 10 || !/\d/.test(password) || !/[a-zA-Z]/.test(password)) {
    return sendError(res, 400, 'ERR-AUTH-06', 'Password needs at least 10 characters, including a letter and a number.');
  }

  const existing = store.getUserByEmail(email);
  if (existing) {
    return sendError(res, 409, 'ERR-AUTH-05', 'An account with this email already exists.');
  }

  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash(password, salt);

  const newUser = {
    user_id: 'USR-' + Date.now(),
    name: name || 'Auditor User',
    email: email.toLowerCase(),
    password_hash: passwordHash,
    role: 'Auditor',
    status: 'Pending', // New auditor accounts require Admin approval (SRS 8.2)
    created_at: new Date().toISOString()
  };

  store.saveUser(newUser);
  store.logAudit({
    action: 'REGISTER_AUDITOR',
    actor_email: newUser.email,
    actor_role: 'Auditor',
    details: { user_id: newUser.user_id, status: 'Pending' }
  });

  res.status(201).json({
    message: 'Registration submitted. Account is pending Administrator approval.',
    user_id: newUser.user_id,
    status: 'Pending'
  });
};

exports.login = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return sendError(res, 400, 'ERR-AUTH-01', 'Email and password are required.');
  }

  const user = store.getUserByEmail(email);
  if (!user) {
    return sendError(res, 401, 'ERR-AUTH-01', 'Email or password is incorrect.');
  }

  if (user.status === 'Pending') {
    return sendError(res, 403, 'ERR-AUTH-03', 'Your account registration is awaiting Administrator approval.');
  }
  if (user.status === 'Deactivated') {
    return sendError(res, 403, 'ERR-AUTH-03', 'Your account has been deactivated.');
  }

  const isMatch = await bcrypt.compare(password, user.password_hash);
  if (!isMatch) {
    return sendError(res, 401, 'ERR-AUTH-01', 'Email or password is incorrect.');
  }

  const token = jwt.sign(
    { user_id: user.user_id, email: user.email, role: user.role },
    JWT_SECRET,
    { expiresIn: '12h' }
  );

  res.json({
    token,
    user: {
      user_id: user.user_id,
      name: user.name,
      email: user.email,
      role: user.role,
      status: user.status
    }
  });
};

// -------------------------------------------------------------
// Administrator & Data Curator Endpoints
// -------------------------------------------------------------

exports.getAdminUsers = (req, res) => {
  const users = store.getUsers().map(u => ({
    user_id: u.user_id,
    name: u.name,
    email: u.email,
    role: u.role,
    status: u.status,
    created_at: u.created_at
  }));
  res.json(users);
};

exports.approveUser = (req, res) => {
  const { user_id } = req.params;
  const { action } = req.body; // 'approve' or 'reject' or 'deactivate'

  const user = store.getUserById(user_id);
  if (!user) return sendError(res, 404, 'ERR-VAL-03', 'User not found.');

  const oldStatus = user.status;
  if (action === 'approve') user.status = 'Active';
  else if (action === 'reject') user.status = 'Rejected';
  else if (action === 'deactivate') user.status = 'Deactivated';

  store.saveUser(user);
  store.logAudit({
    action: `USER_${action.toUpperCase()}`,
    actor_email: req.user.email,
    actor_role: req.user.role,
    details: { target_user_id: user_id, target_email: user.email, old_status: oldStatus, new_status: user.status }
  });

  res.json({ message: `User status updated to ${user.status}.`, user });
};

exports.getRuleConfig = (req, res) => {
  res.json(store.getRuleConfig());
};

exports.updateRuleConfig = (req, res) => {
  const { r1_duplicate_similarity_threshold, r2_tender_threshold, r6_uc_grace_days } = req.body;

  if (r2_tender_threshold && (r2_tender_threshold <= 0 || isNaN(r2_tender_threshold))) {
    return sendError(res, 400, 'ERR-VAL-04', 'Tender threshold must be a positive number.');
  }

  store.updateRuleConfig(req.body, req.user.email);
  res.json({ message: 'Rule engine thresholds updated successfully.', config: store.getRuleConfig() });
};

exports.getAuditLogs = (req, res) => {
  res.json(store.getAuditLogs());
};

exports.triggerScoringPipeline = async (req, res) => {
  try {
    const result = await ruleEngine.runFullScoringPipeline();
    res.json({ message: 'Scoring pipeline completed successfully.', scored_count: result.scored_count, ml_model_status: result.ml_model_status });
  } catch (err) {
    sendError(res, 500, 'ERR-SCORE-500', err.message);
  }
};

exports.ingestCSV = (req, res) => {
  if (!req.file) {
    return sendError(res, 400, 'ERR-ING-02', 'Please upload a .csv file under 200MB.');
  }

  const fileContent = req.file.buffer.toString('utf8');
  Papa.parse(fileContent, {
    header: true,
    skipEmptyLines: true,
    complete: (results) => {
      const rows = results.data;
      if (rows.length === 0) {
        return sendError(res, 422, 'ERR-ING-01', 'Uploaded CSV contains no valid data rows.');
      }

      // Validate required column headers per SRS 6.1
      const requiredCols = ['mp_id', 'description', 'sanctioned_amount', 'sanction_date', 'state'];
      const headers = Object.keys(rows[0] || {});
      const missing = requiredCols.filter(col => !headers.includes(col));

      if (missing.length > 0) {
        return sendError(res, 422, 'ERR-ING-01', `This file doesn't match the expected MPLADS data format — missing required columns: ${missing.join(', ')}.`);
      }

      let existingWorks = store.getWorks();
      let addedCount = 0;

      rows.forEach((r, idx) => {
        const workId = r.work_id || `W-${r.state.substring(0,2).toUpperCase()}-${Date.now()}-${idx}`;
        const workObj = {
          work_id: workId,
          mp_id: r.mp_id,
          district_id: r.district_id || 'DIST-01',
          ia_id: r.ia_id || 'IA-01',
          description: r.description,
          category: r.category || 'Infrastructure',
          sanctioned_amount: parseFloat(r.sanctioned_amount) || 100000,
          expenditure: parseFloat(r.expenditure || r.sanctioned_amount),
          sanction_date: r.sanction_date || '2024-01-15',
          completion_date: r.completion_date || null,
          uc_filed_date: r.uc_filed_date || null,
          sc_st_tag: r.sc_st_tag || 'None',
          tender_id: r.tender_id || null,
          state: r.state,
          financial_year: r.financial_year || '2024-25',
          data_quality: 'complete'
        };

        const existingIdx = existingWorks.findIndex(w => w.work_id === workId);
        if (existingIdx >= 0) {
          existingWorks[existingIdx] = workObj;
        } else {
          existingWorks.push(workObj);
          addedCount++;
        }
      });

      store.saveWorks(existingWorks);
      ruleEngine.runFullScoringPipeline();

      store.logAudit({
        action: 'DATASET_INGESTION',
        actor_email: req.user.email,
        actor_role: req.user.role,
        details: { filename: req.file.originalname, rows_processed: rows.length, rows_added: addedCount }
      });

      res.json({
        message: 'Dataset ingested and scored successfully.',
        rows_processed: rows.length,
        rows_added: addedCount
      });
    }
  });
};

// -------------------------------------------------------------
// Constituency Financial Dataset Endpoint (Real MPLADS CSV Data)
// -------------------------------------------------------------

exports.getConstituencies = (req, res) => {
  const data = store.getConstituencyData() || [];
  res.json({
    count: data.length,
    data_source: 'raw_mplads_data.csv (MoSPI Real Data)',
    data_level: 'CONSTITUENCY_AGGREGATE',
    constituencies: data
  });
};

exports.reanalyzeWork = async (req, res) => {
  try {
    const { work_id } = req.params;
    const works = store.getWorks();
    const targetWork = works.find(w => w.work_id === work_id);

    if (!targetWork) {
      return sendError(res, 404, 'ERR-WORK-404', `Work item with ID ${work_id} not found.`);
    }

    const pipelineResult = await ruleEngine.runFullScoringPipeline();
    const updatedRisk = store.getRiskScoreByWorkId(work_id);

    res.json({
      message: `Work ${work_id} re-analyzed successfully.`,
      work_id,
      risk_result: updatedRisk,
      pipeline_status: pipelineResult.ml_model_status
    });
  } catch (err) {
    sendError(res, 500, 'ERR-REANALYZE-500', err.message);
  }
};

// -------------------------------------------------------------
// Final Phase New Controllers: Data Quality, Risk Map & Analytics
// -------------------------------------------------------------

const ingestService = require('../services/ingestService');

exports.importWorks = async (req, res) => {
  try {
    let csvContent = '';
    if (req.file) {
      csvContent = req.file.buffer.toString('utf8');
    } else if (req.body && req.body.csv_data) {
      csvContent = req.body.csv_data;
    } else {
      return sendError(res, 400, 'ERR-IMPORT-01', 'No CSV file or csv_data content provided.');
    }

    const result = ingestService.importWorksCSV(csvContent);
    if (!result.success) {
      return sendError(res, 400, 'ERR-IMPORT-02', result.errors ? result.errors.join('; ') : 'CSV import failed');
    }

    await ruleEngine.runFullScoringPipeline();

    store.logAudit({
      action: 'WORK_CSV_IMPORT',
      actor_email: req.user ? req.user.email : 'system',
      actor_role: req.user ? req.user.role : 'System',
      details: { imported: result.imported, rejected: result.rejected }
    });

    res.json({
      message: 'Work records CSV imported and scored successfully.',
      imported_count: result.imported,
      rejected_count: result.rejected,
      rejected_details: result.rejected_details || [],
      total_works_now: result.total_works_now
    });
  } catch (err) {
    sendError(res, 500, 'ERR-IMPORT-500', err.message);
  }
};

const mlService = require('../services/mlService');

exports.getDataQuality = async (req, res) => {
  const works = store.getWorks() || [];
  const constituencyData = store.getConstituencyData() || [];
  const riskScores = store.getRiskScores() || {};

  const sourceCounts = {
    CONSTITUENCY_AGGREGATE: constituencyData.length,
    DEMO_SEED_WORK: works.filter(w => !w.source || w.source === 'DEMO_SEED_WORK').length,
    WORK_IMPORT: works.filter(w => w.source === 'WORK_IMPORT').length
  };

  let missingFieldsCount = 0;
  works.forEach(w => {
    if (!w.completion_date) missingFieldsCount++;
    if (!w.uc_date && !w.uc_filed_date) missingFieldsCount++;
    if (!w.tender_id) missingFieldsCount++;
  });

  const scoredCount = Object.keys(riskScores).length;
  const mlStatus = await mlService.checkMLServiceHealth();

  res.json({
    total_constituency_records: constituencyData.length,
    total_work_records: works.length,
    records_by_source: sourceCounts,
    data_completeness_pct: works.length > 0 ? Math.round(((works.length * 7 - missingFieldsCount) / (works.length * 7)) * 100) : 100,
    scored_works_count: scoredCount,
    last_ingestion: new Date().toISOString(),
    ml_service_status: mlStatus
  });
};

exports.getGeographicRisk = (req, res) => {
  const works = store.getWorks() || [];
  const riskScores = store.getRiskScores() || {};
  const constituencyData = store.getConstituencyData() || [];
  const mps = store.getMPs() || [];
  const cases = store.getCases() || [];

  const stateMap = {};

  // Helper to ensure state node exists
  const getOrInitState = (stateName) => {
    const st = stateName || 'General';
    if (!stateMap[st]) {
      stateMap[st] = {
        state: st,
        work_count: 0,
        constituency_count: 0,
        high_risk_count: 0,
        medium_risk_count: 0,
        low_risk_count: 0,
        anomaly_count: 0,
        case_count: 0,
        work_risk_sum: 0,
        constituency_risk_sum: 0
      };
    }
    return stateMap[st];
  };

  // 1. Map 557 Real Constituency ML Anomaly Scores by State
  constituencyData.forEach(c => {
    // Find state from MP list matching constituency or MP name
    const matchedMp = mps.find(m => 
      m.constituency.toLowerCase() === c.constituency.toLowerCase() ||
      m.name.toLowerCase() === c.mp_name.toLowerCase()
    );
    const stateName = c.state || (matchedMp ? matchedMp.state : null) || 'General';
    const node = getOrInitState(stateName);

    node.constituency_count++;
    const constScore = Math.round((c.anomaly_score || 0.15) * 100);
    node.constituency_risk_sum += constScore;

    if (constScore >= 65) node.high_risk_count++;
    else if (constScore >= 40) node.medium_risk_count++;
    else node.low_risk_count++;

    if (c.anomaly_score >= 0.5) node.anomaly_count++;
  });

  // 2. Map Work-Level Scored Audit Items by State
  works.forEach(w => {
    const st = w.state || 'General';
    const node = getOrInitState(st);
    node.work_count++;
    const rs = riskScores[w.work_id];
    if (rs) {
      node.work_risk_sum += rs.composite_risk;
      if (rs.risk_tier === 'HIGH' || rs.composite_risk >= 65) node.high_risk_count++;
      else if (rs.risk_tier === 'MEDIUM' || rs.composite_risk >= 40) node.medium_risk_count++;
      else node.low_risk_count++;

      if (rs.anomaly_score >= 0.5) node.anomaly_count++;
    }
  });

  // 3. Map Audit Cases
  cases.forEach(c => {
    const work = works.find(w => w.work_id === c.work_id);
    if (work && work.state && stateMap[work.state]) {
      stateMap[work.state].case_count++;
    }
  });

  const stateGeography = Object.values(stateMap).map(st => {
    let avgRisk = 0;
    if (st.work_count > 0 && st.constituency_count > 0) {
      const avgWorkRisk = Math.round(st.work_risk_sum / st.work_count);
      const avgConstRisk = Math.round(st.constituency_risk_sum / st.constituency_count);
      avgRisk = Math.round((avgWorkRisk * 0.5) + (avgConstRisk * 0.5));
    } else if (st.constituency_count > 0) {
      avgRisk = Math.round(st.constituency_risk_sum / st.constituency_count);
    } else if (st.work_count > 0) {
      avgRisk = Math.round(st.work_risk_sum / st.work_count);
    }

    const tier = avgRisk >= 65 ? 'HIGH' : avgRisk >= 40 ? 'MEDIUM' : 'LOW';
    const color = tier === 'HIGH' ? '#EF4444' : tier === 'MEDIUM' ? '#F59E0B' : '#10B981';

    return {
      state: st.state,
      risk_score: avgRisk,
      risk_tier: tier,
      color: color,
      work_count: st.work_count,
      constituency_count: st.constituency_count,
      high_risk_count: st.high_risk_count,
      medium_risk_count: st.medium_risk_count,
      low_risk_count: st.low_risk_count,
      anomaly_count: st.anomaly_count,
      case_count: st.case_count
    };
  });

  res.json({
    states_count: stateGeography.length,
    geographic_risk: stateGeography
  });
};

exports.getFinancialAnalytics = (req, res) => {
  const constituencyData = store.getConstituencyData() || [];

  let totalEntitlement = 0;
  let totalReceived = 0;
  let totalAvailable = 0;
  let totalExpenditure = 0;
  let totalUnspent = 0;

  const outliers = [];

  constituencyData.forEach(c => {
    totalEntitlement += (c.entitlement_cr || 0);
    totalReceived += (c.fund_received_goi_cr || 0);
    totalAvailable += (c.amount_available_cr || 0);
    totalExpenditure += (c.actual_expenditure_cr || 0);
    totalUnspent += (c.unspent_balance_cr || 0);

    const utilPct = c.utilization_over_release_pct || 0;
    if (utilPct < 40 || utilPct > 200) {
      outliers.push({
        constituency: c.constituency,
        mp_name: c.mp_name,
        utilization_pct: utilPct,
        unspent_balance_cr: c.unspent_balance_cr,
        pattern: utilPct < 40 ? 'Peer-relative low utilization' : 'Unusual high utilization over release',
        note: 'Requires review per financial peer benchmark'
      });
    }
  });

  res.json({
    totals: {
      entitlement_cr: Math.round(totalEntitlement * 100) / 100,
      fund_received_cr: Math.round(totalReceived * 100) / 100,
      amount_available_cr: Math.round(totalAvailable * 100) / 100,
      actual_expenditure_cr: Math.round(totalExpenditure * 100) / 100,
      unspent_balance_cr: Math.round(totalUnspent * 100) / 100,
      overall_utilization_pct: totalReceived > 0 ? Math.round((totalExpenditure / totalReceived) * 100 * 10) / 10 : 0
    },
    peer_outliers_count: outliers.length,
    peer_outliers: outliers.slice(0, 15)
  });
};

exports.getRuleAnalytics = (req, res) => {
  const riskScores = store.getRiskScores() || {};
  const ruleCounts = { R1: 0, R2: 0, R3: 0, R4: 0, R5: 0, R6: 0 };

  Object.values(riskScores).forEach(rs => {
    if (rs.rule_flags && Array.isArray(rs.rule_flags)) {
      rs.rule_flags.forEach(rf => {
        if (ruleCounts[rf] !== undefined) ruleCounts[rf]++;
      });
    }
  });

  res.json({
    rule_counts: ruleCounts,
    rule_weights: { R1: 35, R2: 30, R3: 30, R4: 20, R5: 15, R6: 20 }
  });
};

exports.getAgencyAnalytics = (req, res) => {
  const works = store.getWorks() || [];
  const riskScores = store.getRiskScores() || {};

  const agencyMap = {};

  works.forEach(w => {
    const ia = w.implementing_agency || w.ia_id || 'Unknown Agency';
    if (!agencyMap[ia]) {
      agencyMap[ia] = {
        agency_name: ia,
        total_works: 0,
        total_financial_value: 0,
        constituencies: new Set(),
        high_risk_works: 0,
        risk_sum: 0
      };
    }

    agencyMap[ia].total_works++;
    agencyMap[ia].total_financial_value += (w.sanctioned_amount || w.proposed_cost || 0);
    if (w.constituency) agencyMap[ia].constituencies.add(w.constituency);

    const rs = riskScores[w.work_id];
    if (rs) {
      agencyMap[ia].risk_sum += rs.composite_risk;
      if (rs.composite_risk >= 65) agencyMap[ia].high_risk_works++;
    }
  });

  const agencyAnalytics = Object.values(agencyMap).map(a => {
    const avgRisk = a.total_works > 0 ? Math.round(a.risk_sum / a.total_works) : 0;
    return {
      agency_name: a.agency_name,
      total_works: a.total_works,
      total_financial_value: a.total_financial_value,
      constituencies_served: Array.from(a.constituencies),
      constituency_count: a.constituencies.size,
      high_risk_works: a.high_risk_works,
      average_risk: avgRisk,
      concentration_status: a.total_works >= 3 ? 'Agency concentration detected' : 'Normal diversification'
    };
  }).sort((a, b) => b.total_works - a.total_works);

  res.json({
    agency_count: agencyAnalytics.length,
    agencies: agencyAnalytics
  });
};

exports.generateCasePDF = (req, res) => {
  const { case_id } = req.params;
  const caseObj = store.getCaseById(case_id);

  if (!caseObj) {
    return sendError(res, 404, 'ERR-CASE-404', `Case ${case_id} not found.`);
  }

  const work = store.getWorkById(caseObj.work_id);
  const riskScore = store.getRiskScoreByWorkId(caseObj.work_id);

  res.json({
    report_title: 'KOSH-DRISHTI OFFICIAL AUDIT INVESTIGATION REPORT',
    case_id: caseObj.case_id,
    work_id: caseObj.work_id,
    generated_at: new Date().toISOString(),
    disclaimer: 'Risk assessment generated by Kosh-Drishti as an audit decision-support system. Findings require human verification and do not by themselves establish wrongdoing.',
    work_details: work || {},
    risk_assessment: riskScore || {},
    case_status: caseObj.status,
    assigned_auditor: caseObj.assigned_auditor_name || 'Unassigned',
    investigation_notes: caseObj.notes || []
  });
};

exports.explainWork = async (req, res) => {
  const { work, rule_flags, composite_risk, evidence, anomaly_score } = req.body;

  if (!work) {
    return sendError(res, 400, 'ERR-VAL-01', 'Work object is required.');
  }

  try {
    const explanation = await groqService.generateLLMExplanation(
      work,
      rule_flags || [],
      composite_risk || 0,
      evidence || [],
      anomaly_score || 0.2
    );

    res.json({
      work_id: work.work_id,
      explanation,
      source: process.env.GROQ_API_KEY ? 'groq-llm' : 'template-fallback'
    });
  } catch (err) {
    const fallback = groqService.generateTemplateExplanation(work, rule_flags || [], composite_risk || 0);
    res.json({
      work_id: work.work_id,
      explanation: fallback,
      source: 'template-fallback'
    });
  }
};

