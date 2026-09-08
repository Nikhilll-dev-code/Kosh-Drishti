const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '../../data');
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

class Store {
  constructor() {
    this.dbFile = path.join(DATA_DIR, 'db.json');
    this.data = {
      works: [],
      constituencyData: [],
      mps: [],
      districts: [],
      ias: [],
      riskScores: {},
      cases: [],
      users: [],
      auditLogs: [],
      ruleConfig: {
        r1_duplicate_similarity_threshold: 0.85,
        r2_tender_threshold: 2500000, // 25 Lakhs INR (per MPLADS procurement norm)
        r3_ineligible_keywords: [
          'temple', 'mosque', 'church', 'gurudwara', 'religious', 'shrine',
          'land purchase', 'commercial complex', 'private building', 'club'
        ],
        r4_under_utilization_decile: 0.10,
        r5_sc_norm_pct: 15.0,
        r5_st_norm_pct: 7.5,
        r6_uc_grace_days: 45, // 30 day norm + 15 days buffer
        rule_weight: 0.85,    // Default 85% rule engine contribution
        ml_weight: 0.15       // Default 15% ML anomaly contribution
      }
    };
    this.load();
  }

  load() {
    try {
      if (fs.existsSync(this.dbFile)) {
        const raw = fs.readFileSync(this.dbFile, 'utf8');
        const parsed = JSON.parse(raw);
        this.data = { ...this.data, ...parsed };
      }
    } catch (err) {
      console.error('Error loading database file, initializing fresh store:', err.message);
    }
  }

  save() {
    try {
      fs.writeFileSync(this.dbFile, JSON.stringify(this.data, null, 2), 'utf8');
    } catch (err) {
      console.error('Error saving database file:', err.message);
    }
  }

  // Work operations
  getWorks() {
    return this.data.works;
  }

  getWorkById(id) {
    return this.data.works.find(w => w.work_id === id);
  }

  saveWorks(works) {
    this.data.works = works;
    this.save();
  }

  // Constituency Data operations (Real aggregate CSV dataset)
  getConstituencyData() {
    return this.data.constituencyData || [];
  }

  saveConstituencyData(records) {
    this.data.constituencyData = records;
    this.save();
  }

  // MP operations
  getMPs() {
    return this.data.mps;
  }

  getMPById(id) {
    return this.data.mps.find(m => m.mp_id === id);
  }

  saveMPs(mps) {
    this.data.mps = mps;
    this.save();
  }

  // District operations
  getDistricts() {
    return this.data.districts;
  }

  saveDistricts(districts) {
    this.data.districts = districts;
    this.save();
  }

  // IA operations
  getIAs() {
    return this.data.ias;
  }

  saveIAs(ias) {
    this.data.ias = ias;
    this.save();
  }

  // Risk Score operations
  getRiskScores() {
    return this.data.riskScores;
  }

  getRiskScoreByWorkId(workId) {
    return this.data.riskScores[workId];
  }

  saveRiskScores(scoresObj) {
    this.data.riskScores = { ...this.data.riskScores, ...scoresObj };
    this.save();
  }

  // Case operations
  getCases() {
    return this.data.cases;
  }

  getCaseById(id) {
    return this.data.cases.find(c => c.case_id === id);
  }

  getCaseByWorkId(workId) {
    return this.data.cases.find(c => c.work_id === workId);
  }

  saveCase(caseObj) {
    const idx = this.data.cases.findIndex(c => c.case_id === caseObj.case_id);
    if (idx >= 0) {
      this.data.cases[idx] = caseObj;
    } else {
      this.data.cases.push(caseObj);
    }
    this.save();
  }

  // User operations
  getUsers() {
    return this.data.users;
  }

  getUserById(id) {
    return this.data.users.find(u => u.user_id === id);
  }

  getUserByEmail(email) {
    return this.data.users.find(u => u.email.toLowerCase() === email.toLowerCase());
  }

  saveUser(user) {
    const idx = this.data.users.findIndex(u => u.user_id === user.user_id);
    if (idx >= 0) {
      this.data.users[idx] = user;
    } else {
      this.data.users.push(user);
    }
    this.save();
  }

  saveUsers(users) {
    this.data.users = users;
    this.save();
  }

  // Rule config operations
  getRuleConfig() {
    return this.data.ruleConfig;
  }

  updateRuleConfig(newConfig, actorEmail) {
    const oldConfig = { ...this.data.ruleConfig };
    this.data.ruleConfig = { ...this.data.ruleConfig, ...newConfig };
    this.logAudit({
      action: 'UPDATE_RULE_THRESHOLDS',
      actor_email: actorEmail,
      actor_role: 'Administrator',
      details: { old: oldConfig, updated: this.data.ruleConfig }
    });
    this.save();
  }

  // Audit Log operations
  getAuditLogs() {
    return this.data.auditLogs;
  }

  logAudit({ action, actor_email, actor_role, details }) {
    const logEntry = {
      log_id: 'LOG-' + Date.now() + '-' + Math.floor(Math.random() * 1000),
      action,
      actor_email: actor_email || 'system',
      actor_role: actor_role || 'System',
      details: details || {},
      timestamp: new Date().toISOString()
    };
    this.data.auditLogs.unshift(logEntry);
    this.save();
  }
}

module.exports = new Store();
