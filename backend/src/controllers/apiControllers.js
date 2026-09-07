const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const store = require('../models/store');
const { JWT_SECRET, sendError } = require('../middleware/auth');
const ruleEngine = require('../services/ruleEngineService');
const Papa = require('papaparse');

// -------------------------------------------------------------
// Public & Dashboard Endpoints
// -------------------------------------------------------------

exports.getDashboardSummary = (req, res) => {
  const works = store.getWorks();
  const mps = store.getMPs();
  const riskScores = store.getRiskScores();

  let totalSanctioned = 0;
  let totalUtilized = 0;
  let totalEntitlement = 0;

  mps.forEach(m => {
    totalEntitlement += (m.total_entitlement || 500000000);
    totalUtilized += (m.total_utilized || 0);
  });

  works.forEach(w => {
    totalSanctioned += (w.sanctioned_amount || 0);
  });

  const unspentFunds = Math.max(0, totalEntitlement - totalUtilized);

  // Group by state for choropleth heat-map
  const stateMap = {};
  works.forEach(w => {
    const st = w.state || 'Unknown';
    if (!stateMap[st]) {
      stateMap[st] = {
        state: st,
        work_count: 0,
        total_sanctioned: 0,
        flagged_count: 0,
        risk_sum: 0
      };
    }
    stateMap[st].work_count++;
    stateMap[st].total_sanctioned += w.sanctioned_amount || 0;

    const rs = riskScores[w.work_id];
    if (rs) {
      stateMap[st].risk_sum += rs.composite_risk;
      if (rs.composite_risk >= 50) {
        stateMap[st].flagged_count++;
      }
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

  const flaggedWorksCount = Object.values(riskScores).filter(rs => rs.composite_risk >= 50).length;

  res.json({
    total_entitlement: totalEntitlement,
    total_sanctioned: totalSanctioned,
    total_utilized: totalUtilized,
    unspent_funds: unspentFunds,
    total_works: works.length,
    flagged_works_count: flaggedWorksCount,
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

  const works = store.getWorks().filter(w => w.mp_id === mp_id);
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

exports.getWorkDetail = (req, res) => {
  const { work_id } = req.params;
  const work = store.getWorkById(work_id);
  if (!work) {
    return sendError(res, 404, 'ERR-VAL-03', 'Work record not found.');
  }

  const mp = store.getMPById(work.mp_id);
  const riskScore = store.getRiskScoreByWorkId(work_id) || {
    composite_risk: 0,
    rule_flags: [],
    anomaly_score: 0.05,
    explanation_text: 'No anomaly indicators flagged for this work.'
  };

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

exports.triggerScoringPipeline = (req, res) => {
  const result = ruleEngine.runFullScoringPipeline();
  res.json({ message: 'Scoring pipeline completed successfully.', scored_count: result.scored_count });
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
