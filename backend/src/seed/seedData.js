const bcrypt = require('bcryptjs');
const store = require('../models/store');
const ruleEngine = require('../services/ruleEngineService');

async function seed() {
  console.log('Seeding Kosh-Drishti dataset...');

  // Ensure default rule thresholds
  store.data.ruleConfig.r2_tender_threshold = 2500000; // 25 Lakhs INR

  // 1. Seed MPs
  const mps = [
    {
      mp_id: 'MP-GJ-01',
      name: 'Pareshbhai Dhanani',
      constituency: 'Amreli',
      state: 'Gujarat',
      party: 'INC',
      lok_sabha_term: '17th Lok Sabha',
      total_entitlement: 250000000,
      total_released: 250000000,
      total_utilized: 185000000,
      sc_st_spend_pct: { sc: 14.2, st: 6.8 }
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
      total_utilized: 95000000, // Chronic under-utilization
      sc_st_spend_pct: { sc: 13.0, st: 5.5 }
    }
  ];

  // 2. Seed Works (Including confirmed Gujarat demo case GW-2018-045)
  const works = [
    // Confirmed Demo Case (Gujarat Cooperative Society Duplicate Renovation Claim)
    {
      work_id: 'GW-2018-045',
      mp_id: 'MP-GJ-01',
      district_id: 'DIST-GJ-AMR',
      ia_id: 'IA-GJ-COOP-01',
      description: 'Panchayat Bhavan building structural renovation and community center expansion at Amreli Panchayat Samiti block 2',
      category: 'Community Infrastructure',
      sanctioned_amount: 4520000, // ₹45.20 Lakhs
      expenditure: 4520000,
      sanction_date: '2023-04-10',
      completion_date: '2023-11-20',
      uc_filed_date: '2024-03-30', // Delayed > 120 days past completion! (R6)
      sc_st_tag: 'None',
      tender_id: '', // Missing tender link on high amount! (R2)
      state: 'Gujarat',
      financial_year: '2023-24'
    },
    {
      work_id: 'GW-2017-088',
      mp_id: 'MP-GJ-01',
      district_id: 'DIST-GJ-AMR',
      ia_id: 'IA-GJ-COOP-01',
      description: 'Panchayat Bhavan building structural renovation and community center expansion at Amreli Panchayat Samiti block 2', // Exact duplicate description! (R1)
      category: 'Community Infrastructure',
      sanctioned_amount: 4520000,
      expenditure: 4520000,
      sanction_date: '2022-05-15',
      completion_date: '2022-12-10',
      uc_filed_date: '2023-01-05',
      sc_st_tag: 'None',
      tender_id: 'TND-GJ-8871',
      state: 'Gujarat',
      financial_year: '2022-23'
    },
    // Ineligible category example (Temple renovation R3)
    {
      work_id: 'GW-2023-102',
      mp_id: 'MP-GJ-01',
      district_id: 'DIST-GJ-AMR',
      ia_id: 'IA-GJ-COOP-02',
      description: 'Construction of boundary wall and decorative hall for local Hanuman Temple complex',
      category: 'Religious Structure',
      sanctioned_amount: 1800000,
      expenditure: 1800000,
      sanction_date: '2023-08-01',
      completion_date: '2024-01-10',
      uc_filed_date: null, // UC missing past grace period (R6)
      sc_st_tag: 'None',
      tender_id: 'TND-GJ-902',
      state: 'Gujarat',
      financial_year: '2023-24'
    },
    // Normal compliant works
    {
      work_id: 'AP-2023-001',
      mp_id: 'MP-AP-02',
      district_id: 'DIST-AP-KDP',
      ia_id: 'IA-AP-PR-01',
      description: 'Installation of RO drinking water plant at Zilla Parishad High School, Kadapa',
      category: 'Drinking Water',
      sanctioned_amount: 850000,
      expenditure: 850000,
      sanction_date: '2023-06-10',
      completion_date: '2023-09-15',
      uc_filed_date: '2023-10-05', // Filed within 20 days (Compliant)
      sc_st_tag: 'SC',
      tender_id: 'TND-AP-4412',
      state: 'Andhra Pradesh',
      financial_year: '2023-24'
    },
    {
      work_id: 'AP-2023-002',
      mp_id: 'MP-AP-02',
      district_id: 'DIST-AP-KDP',
      ia_id: 'IA-AP-PR-01',
      description: 'Construction of additional classrooms for Government Primary School in SC Colony',
      category: 'Education',
      sanctioned_amount: 2200000,
      expenditure: 2150000,
      sanction_date: '2023-07-20',
      completion_date: '2024-02-15',
      uc_filed_date: '2024-03-01',
      sc_st_tag: 'SC',
      tender_id: 'TND-AP-5510',
      state: 'Andhra Pradesh',
      financial_year: '2023-24'
    },
    // High amount tender bypass work
    {
      work_id: 'MH-2023-011',
      mp_id: 'MP-MH-03',
      district_id: 'DIST-MH-NSK',
      ia_id: 'IA-MH-PWD-01',
      description: 'Construction of asphalt road connecting Trimbakeshwar village to state highway',
      category: 'Roads & Bridges',
      sanctioned_amount: 12500000, // ₹1.25 Crore
      expenditure: 12500000,
      sanction_date: '2023-03-12',
      completion_date: '2023-10-01',
      uc_filed_date: null, // UC missing (R6)
      sc_st_tag: 'ST',
      tender_id: '', // Missing tender link on > 50 Lakh work! (R2)
      state: 'Maharashtra',
      financial_year: '2023-24'
    },
    {
      work_id: 'UP-2023-055',
      mp_id: 'MP-UP-04',
      district_id: 'DIST-UP-STP',
      ia_id: 'IA-UP-RES-01',
      description: 'Solar street light illumination installation across 15 Gram Panchayats',
      category: 'Rural Electrification',
      sanctioned_amount: 3500000,
      expenditure: 3500000,
      sanction_date: '2023-05-01',
      completion_date: '2023-08-20',
      uc_filed_date: '2023-09-10',
      sc_st_tag: 'SC',
      tender_id: 'TND-UP-1092',
      state: 'Uttar Pradesh',
      financial_year: '2023-24'
    },
    {
      work_id: 'TN-2023-089',
      mp_id: 'MP-TN-05',
      district_id: 'DIST-TN-CHN',
      ia_id: 'IA-TN-CORP-01',
      description: 'Modernization of community e-learning hall and digital library setup',
      category: 'Education',
      sanctioned_amount: 1500000,
      expenditure: 1500000,
      sanction_date: '2023-09-10',
      completion_date: '2024-01-05',
      uc_filed_date: '2024-01-25',
      sc_st_tag: 'None',
      tender_id: 'TND-TN-7718',
      state: 'Tamil Nadu',
      financial_year: '2023-24'
    },
    {
      work_id: 'RJ-2023-004',
      mp_id: 'MP-RJ-06',
      district_id: 'DIST-RJ-BHL',
      ia_id: 'IA-RJ-ZILA-01',
      description: 'Deepening and desilting of community water harvesting pond at Bhilwara block',
      category: 'Irrigation & Water',
      sanctioned_amount: 6000000,
      expenditure: 6000000,
      sanction_date: '2023-02-10',
      completion_date: '2023-07-30',
      uc_filed_date: '2023-11-15', // Delayed UC > 90 days (R6)
      sc_st_tag: 'ST',
      tender_id: '', // Missing tender (R2)
      state: 'Rajasthan',
      financial_year: '2023-24'
    }
  ];

  // 3. Seed Users (Admin, Data Curator, Auditor personas per SRS PRD)
  const salt = await bcrypt.genSalt(10);
  const hashedAdminPass = await bcrypt.hash('Admin@12345', salt);
  const hashedAuditorPass = await bcrypt.hash('Auditor@12345', salt);

  const users = [
    {
      user_id: 'USR-ADMIN-01',
      name: 'Basina Surya Sashank (Admin)',
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
      status: 'Pending', // Pending approval queue demo
      created_at: new Date().toISOString()
    }
  ];

  store.saveMPs(mps);
  store.saveWorks(works);
  store.saveUsers(users);

  // Run full scoring pipeline
  ruleEngine.runFullScoringPipeline();
  console.log('Seeding & scoring completed successfully!');
}

seed();
