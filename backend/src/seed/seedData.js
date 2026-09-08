const path = require('path');
const bcrypt = require('bcryptjs');
const store = require('../models/store');
const ruleEngine = require('../services/ruleEngineService');
const { ingestMPLADSCSV } = require('../services/ingestService');

async function seed() {
  console.log('[Seed] Seeding Kosh-Drishti dataset...');

  // 1. Ingest Real Constituency CSV Dataset (558 records)
  console.log('[Seed] Parsing real MPLADS constituency dataset...');
  ingestMPLADSCSV();

  // 2. Ensure default rule thresholds & weight splits
  store.data.ruleConfig.r2_tender_threshold = 2500000; // ₹25 Lakhs INR
  store.data.ruleConfig.rule_weight = 0.85;
  store.data.ruleConfig.ml_weight = 0.15;

  // 3. Seed MPs
  const mps = [
    {
      mp_id: 'MP-GJ-01',
      name: 'Ranjanben Bhatt',
      constituency: 'Amreli / Vadodara',
      state: 'Gujarat',
      party: 'BJP',
      lok_sabha_term: '17th Lok Sabha',
      total_entitlement: 250000000,
      total_released: 250000000,
      total_utilized: 185000000,
      sc_st_spend_pct: { sc: 14.2, st: 6.8 }
    },
    {
      mp_id: 'MP-GJ-VADODARA',
      name: 'Hemang Joshi',
      constituency: 'Vadodara',
      state: 'Gujarat',
      party: 'BJP',
      lok_sabha_term: '18th Lok Sabha',
      total_entitlement: 250000000,
      total_released: 250000000,
      total_utilized: 215000000,
      sc_st_spend_pct: { sc: 16.0, st: 8.0 }
    },
    {
      mp_id: 'MP-GJ-NAVSARI',
      name: 'C. R. Patil',
      constituency: 'Navsari',
      state: 'Gujarat',
      party: 'BJP',
      lok_sabha_term: '18th Lok Sabha',
      total_entitlement: 250000000,
      total_released: 250000000,
      total_utilized: 235000000,
      sc_st_spend_pct: { sc: 17.5, st: 8.5 }
    },
    {
      mp_id: 'MP-GJ-GANDHINAGAR',
      name: 'Amit Shah',
      constituency: 'Gandhinagar',
      state: 'Gujarat',
      party: 'BJP',
      lok_sabha_term: '18th Lok Sabha',
      total_entitlement: 250000000,
      total_released: 250000000,
      total_utilized: 240000000,
      sc_st_spend_pct: { sc: 18.0, st: 9.0 }
    },
    {
      mp_id: 'MP-AP-02',
      name: 'Y. S. Avinash Reddy',
      constituency: 'Kadapa',
      state: 'Andhra Pradesh',
      party: 'YSRCP',
      lok_sabha_term: '17th Lok Sabha',
      total_entitlement: 250000000,
      total_released: 250000000,
      total_utilized: 220000000,
      sc_st_spend_pct: { sc: 16.5, st: 8.2 }
    },
    {
      mp_id: 'MP-MH-03',
      name: 'Shedwale Nitin',
      constituency: 'Nashik',
      state: 'Maharashtra',
      party: 'SHS',
      lok_sabha_term: '17th Lok Sabha',
      total_entitlement: 250000000,
      total_released: 200000000,
      total_utilized: 110000000,
      sc_st_spend_pct: { sc: 11.0, st: 4.5 }
    },
    {
      mp_id: 'MP-UP-04',
      name: 'Rajesh Verma',
      constituency: 'Sitapur',
      state: 'Uttar Pradesh',
      party: 'BJP',
      lok_sabha_term: '17th Lok Sabha',
      total_entitlement: 250000000,
      total_released: 250000000,
      total_utilized: 240000000,
      sc_st_spend_pct: { sc: 19.5, st: 9.1 }
    },
    {
      mp_id: 'MP-TN-05',
      name: 'Kalanidhi Veeraswamy',
      constituency: 'Chennai North',
      state: 'Tamil Nadu',
      party: 'DMK',
      lok_sabha_term: '17th Lok Sabha',
      total_entitlement: 250000000,
      total_released: 220000000,
      total_utilized: 195000000,
      sc_st_spend_pct: { sc: 17.0, st: 7.8 }
    },
    {
      mp_id: 'MP-RJ-06',
      name: 'Subhash Chandra Baheria',
      constituency: 'Bhilwara',
      state: 'Rajasthan',
      party: 'BJP',
      lok_sabha_term: '17th Lok Sabha',
      total_entitlement: 250000000,
      total_released: 180000000,
      total_utilized: 95000000,
      sc_st_spend_pct: { sc: 13.0, st: 5.5 }
    }
  ];

  // 4. Seed Works (Marked explicitly as DEMO_SEED_WORK)
  const works = [
    {
      work_id: 'GW-2018-045',
      mp_id: 'MP-GJ-VADODARA',
      district_id: 'DIST-GJ-VAD',
      ia_id: 'IA-GJ-COOP-01',
      implementing_agency: 'IA-GJ-COOP-01',
      constituency: 'Vadodara',
      title: 'Panchayat Bhavan building structural renovation and community center expansion at Amreli Panchayat Samiti block 2',
      description: 'Panchayat Bhavan building structural renovation and community center expansion at Amreli Panchayat Samiti block 2',
      category: 'Community Infrastructure',
      proposed_cost: 4520000,
      sanctioned_amount: 4520000,
      expenditure: 4520000,
      recommendation_date: '2023-04-10',
      sanction_date: '2023-04-10',
      completion_date: '2023-11-20',
      uc_date: '2024-03-30',
      uc_filed_date: '2024-03-30',
      uc_lag_days: 130,
      sc_st_tag: 'None',
      tender_id: '',
      state: 'Gujarat',
      financial_year: '2023-24',
      source: 'DEMO_SEED_WORK'
    },
    {
      work_id: 'GW-2017-088',
      mp_id: 'MP-GJ-VADODARA',
      district_id: 'DIST-GJ-VAD',
      ia_id: 'IA-GJ-COOP-01',
      implementing_agency: 'IA-GJ-COOP-01',
      constituency: 'Vadodara',
      title: 'Panchayat Bhavan building structural renovation and community center expansion at Amreli Panchayat Samiti block 2',
      description: 'Panchayat Bhavan building structural renovation and community center expansion at Amreli Panchayat Samiti block 2',
      category: 'Community Infrastructure',
      proposed_cost: 4520000,
      sanctioned_amount: 4520000,
      expenditure: 4520000,
      recommendation_date: '2022-05-15',
      sanction_date: '2022-05-15',
      completion_date: '2022-12-10',
      uc_date: '2023-01-05',
      uc_filed_date: '2023-01-05',
      uc_lag_days: 26,
      sc_st_tag: 'None',
      tender_id: 'TND-GJ-8871',
      state: 'Gujarat',
      financial_year: '2022-23',
      source: 'DEMO_SEED_WORK'
    },
    {
      work_id: 'GW-2023-102',
      mp_id: 'MP-GJ-VADODARA',
      district_id: 'DIST-GJ-VAD',
      ia_id: 'IA-GJ-COOP-02',
      implementing_agency: 'IA-GJ-COOP-02',
      constituency: 'Vadodara',
      title: 'Construction of boundary wall and decorative hall for local Hanuman Temple complex',
      description: 'Construction of boundary wall and decorative hall for local Hanuman Temple complex',
      category: 'Religious Structure',
      proposed_cost: 1800000,
      sanctioned_amount: 1800000,
      expenditure: 1800000,
      recommendation_date: '2023-08-01',
      sanction_date: '2023-08-01',
      completion_date: '2024-01-10',
      uc_date: null,
      uc_filed_date: null,
      uc_lag_days: 240,
      sc_st_tag: 'None',
      tender_id: 'TND-GJ-902',
      state: 'Gujarat',
      financial_year: '2023-24',
      source: 'DEMO_SEED_WORK'
    },
    {
      work_id: 'GJ-2023-004',
      mp_id: 'MP-GJ-01',
      district_id: 'DIST-GJ-AMR',
      ia_id: 'IA-GJ-PWD-02',
      implementing_agency: 'IA-GJ-PWD-02',
      constituency: 'Amreli',
      title: 'Construction of Government Girls Primary School Science Laboratory & ICT Library',
      description: 'Construction of Government Girls Primary School Science Laboratory & ICT Library',
      category: 'Education',
      proposed_cost: 3200000,
      sanctioned_amount: 3200000,
      expenditure: 3200000,
      recommendation_date: '2023-06-15',
      sanction_date: '2023-06-15',
      completion_date: '2023-12-10',
      uc_date: '2024-01-05',
      uc_filed_date: '2024-01-05',
      uc_lag_days: 26,
      sc_st_tag: 'SC',
      tender_id: 'TND-GJ-4410',
      state: 'Gujarat',
      financial_year: '2023-24',
      source: 'DEMO_SEED_WORK'
    },
    {
      work_id: 'GJ-2023-005',
      mp_id: 'MP-GJ-NAVSARI',
      district_id: 'DIST-GJ-NAV',
      ia_id: 'IA-GJ-WSSB-01',
      implementing_agency: 'IA-GJ-WSSB-01',
      constituency: 'Navsari',
      title: 'Installation of Solar Powered RO Water Filtration Plants in Rural Tribal Blocks',
      description: 'Installation of Solar Powered RO Water Filtration Plants in Rural Tribal Blocks',
      category: 'Drinking Water',
      proposed_cost: 2800000,
      sanctioned_amount: 2800000,
      expenditure: 2800000,
      recommendation_date: '2023-05-20',
      sanction_date: '2023-05-20',
      completion_date: '2023-10-15',
      uc_date: '2023-11-02',
      uc_filed_date: '2023-11-02',
      uc_lag_days: 18,
      sc_st_tag: 'ST',
      tender_id: 'TND-GJ-8812',
      state: 'Gujarat',
      financial_year: '2023-24',
      source: 'DEMO_SEED_WORK'
    },
    {
      work_id: 'GJ-2023-006',
      mp_id: 'MP-GJ-GANDHINAGAR',
      district_id: 'DIST-GJ-GND',
      ia_id: 'IA-GJ-MUN-01',
      implementing_agency: 'IA-GJ-MUN-01',
      constituency: 'Gandhinagar',
      title: 'Upgradation and digitisation of Multi-purpose Community Skill Development Center',
      description: 'Upgradation and digitisation of Multi-purpose Community Skill Development Center',
      category: 'Community Infrastructure',
      proposed_cost: 4900000,
      sanctioned_amount: 4900000,
      expenditure: 4900000,
      recommendation_date: '2023-07-01',
      sanction_date: '2023-07-01',
      completion_date: '2023-11-30',
      uc_date: '2023-12-15',
      uc_filed_date: '2023-12-15',
      uc_lag_days: 15,
      sc_st_tag: 'None',
      tender_id: 'TND-GJ-9910',
      state: 'Gujarat',
      financial_year: '2023-24',
      source: 'DEMO_SEED_WORK'
    },
    {
      work_id: 'AP-2023-001',
      mp_id: 'MP-AP-02',
      district_id: 'DIST-AP-KDP',
      ia_id: 'IA-AP-PR-01',
      implementing_agency: 'IA-AP-PR-01',
      constituency: 'Kadapa',
      title: 'Installation of RO drinking water plant at Zilla Parishad High School, Kadapa',
      description: 'Installation of RO drinking water plant at Zilla Parishad High School, Kadapa',
      category: 'Drinking Water',
      proposed_cost: 850000,
      sanctioned_amount: 850000,
      expenditure: 850000,
      recommendation_date: '2023-06-10',
      sanction_date: '2023-06-10',
      completion_date: '2023-09-15',
      uc_date: '2023-10-05',
      uc_filed_date: '2023-10-05',
      uc_lag_days: 20,
      sc_st_tag: 'SC',
      tender_id: 'TND-AP-4412',
      state: 'Andhra Pradesh',
      financial_year: '2023-24',
      source: 'DEMO_SEED_WORK'
    },
    {
      work_id: 'AP-2023-002',
      mp_id: 'MP-AP-02',
      district_id: 'DIST-AP-KDP',
      ia_id: 'IA-AP-PR-01',
      implementing_agency: 'IA-AP-PR-01',
      constituency: 'Kadapa',
      title: 'Construction of additional classrooms for Government Primary School in SC Colony',
      description: 'Construction of additional classrooms for Government Primary School in SC Colony',
      category: 'Education',
      proposed_cost: 2200000,
      sanctioned_amount: 2200000,
      expenditure: 2150000,
      recommendation_date: '2023-07-20',
      sanction_date: '2023-07-20',
      completion_date: '2024-02-15',
      uc_date: '2024-03-01',
      uc_filed_date: '2024-03-01',
      uc_lag_days: 15,
      sc_st_tag: 'SC',
      tender_id: 'TND-AP-5510',
      state: 'Andhra Pradesh',
      financial_year: '2023-24',
      source: 'DEMO_SEED_WORK'
    },
    {
      work_id: 'MH-2023-011',
      mp_id: 'MP-MH-03',
      district_id: 'DIST-MH-NSK',
      ia_id: 'IA-MH-PWD-01',
      implementing_agency: 'IA-MH-PWD-01',
      constituency: 'Nashik',
      title: 'Construction of asphalt road connecting Trimbakeshwar village to state highway',
      description: 'Construction of asphalt road connecting Trimbakeshwar village to state highway',
      category: 'Roads & Bridges',
      proposed_cost: 12500000,
      sanctioned_amount: 12500000,
      expenditure: 12500000,
      recommendation_date: '2023-03-12',
      sanction_date: '2023-03-12',
      completion_date: '2023-10-01',
      uc_date: null,
      uc_filed_date: null,
      uc_lag_days: 300,
      sc_st_tag: 'ST',
      tender_id: '',
      state: 'Maharashtra',
      financial_year: '2023-24',
      source: 'DEMO_SEED_WORK'
    },
    {
      work_id: 'UP-2023-055',
      mp_id: 'MP-UP-04',
      district_id: 'DIST-UP-STP',
      ia_id: 'IA-UP-RES-01',
      implementing_agency: 'IA-UP-RES-01',
      constituency: 'Sitapur',
      title: 'Solar street light illumination installation across 15 Gram Panchayats',
      description: 'Solar street light illumination installation across 15 Gram Panchayats',
      category: 'Rural Electrification',
      proposed_cost: 3500000,
      sanctioned_amount: 3500000,
      expenditure: 3500000,
      recommendation_date: '2023-05-01',
      sanction_date: '2023-05-01',
      completion_date: '2023-08-20',
      uc_date: '2023-09-10',
      uc_filed_date: '2023-09-10',
      uc_lag_days: 21,
      sc_st_tag: 'SC',
      tender_id: 'TND-UP-1092',
      state: 'Uttar Pradesh',
      financial_year: '2023-24',
      source: 'DEMO_SEED_WORK'
    },
    {
      work_id: 'TN-2023-089',
      mp_id: 'MP-TN-05',
      district_id: 'DIST-TN-CHN',
      ia_id: 'IA-TN-CORP-01',
      implementing_agency: 'IA-TN-CORP-01',
      constituency: 'Chennai North',
      title: 'Modernization of community e-learning hall and digital library setup',
      description: 'Modernization of community e-learning hall and digital library setup',
      category: 'Education',
      proposed_cost: 1500000,
      sanctioned_amount: 1500000,
      expenditure: 1500000,
      recommendation_date: '2023-09-10',
      sanction_date: '2023-09-10',
      completion_date: '2024-01-05',
      uc_date: '2024-01-25',
      uc_filed_date: '2024-01-25',
      uc_lag_days: 20,
      sc_st_tag: 'None',
      tender_id: 'TND-TN-7718',
      state: 'Tamil Nadu',
      financial_year: '2023-24',
      source: 'DEMO_SEED_WORK'
    },
    {
      work_id: 'RJ-2023-004',
      mp_id: 'MP-RJ-06',
      district_id: 'DIST-RJ-BHL',
      ia_id: 'IA-RJ-ZILA-01',
      implementing_agency: 'IA-RJ-ZILA-01',
      constituency: 'Bhilwara',
      title: 'Deepening and desilting of community water harvesting pond at Bhilwara block',
      description: 'Deepening and desilting of community water harvesting pond at Bhilwara block',
      category: 'Drinking Water',
      proposed_cost: 6000000,
      sanctioned_amount: 6000000,
      expenditure: 6000000,
      recommendation_date: '2023-02-10',
      sanction_date: '2023-02-10',
      completion_date: '2023-07-30',
      uc_date: '2023-11-15',
      uc_filed_date: '2023-11-15',
      uc_lag_days: 108,
      sc_st_tag: 'ST',
      tender_id: '',
      state: 'Rajasthan',
      financial_year: '2023-24',
      source: 'DEMO_SEED_WORK'
    }
  ];

  // 5. Seed Users
  const salt = await bcrypt.genSalt(10);
  const hashedAdminPass = await bcrypt.hash('Admin@12345', salt);
  const hashedAuditorPass = await bcrypt.hash('Auditor@12345', salt);

  const users = [
    {
      user_id: 'USR-ADMIN-01',
      name: 'Surya (SIH Lead Admin)',
      email: 'admin@koshdrishti.gov.in',
      password_hash: hashedAdminPass,
      role: 'Administrator',
      status: 'Active',
      created_at: new Date().toISOString()
    },
    {
      user_id: 'USR-AUD-01',
      name: 'Rekha Sharma (DA Officer)',
      email: 'rekha@da.gov.in',
      password_hash: hashedAuditorPass,
      role: 'Auditor',
      status: 'Active',
      created_at: new Date().toISOString()
    },
    {
      user_id: 'USR-CUR-01',
      name: 'Technical Data Curator',
      email: 'curator@koshdrishti.gov.in',
      password_hash: hashedAdminPass,
      role: 'Curator',
      status: 'Active',
      created_at: new Date().toISOString()
    },
    {
      user_id: 'USR-AUD-02',
      name: 'Rajesh Kumar (CAG Field Auditor)',
      email: 'rajesh.cag@cag.gov.in',
      password_hash: hashedAuditorPass,
      role: 'Auditor',
      status: 'Pending',
      created_at: new Date().toISOString()
    }
  ];

  store.saveMPs(mps);
  store.saveWorks(works);
  store.saveUsers(users);

  // 6. Run full scoring pipeline asynchronously
  console.log('[Seed] Running scoring pipeline across work items...');
  await ruleEngine.runFullScoringPipeline();
  console.log('[Seed] Seeding & scoring completed successfully!');
}

module.exports = seed;

if (require.main === module) {
  seed();
}
