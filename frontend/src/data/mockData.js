// Comprehensive Mock Dataset for Kosh-Drishti (SIH26102)
// Provides realistic state aggregates, MP data, flagged works, rules R1-R6, and confirmed cases

export const MOCK_SUMMARY = {
  total_sanctioned: 39540000000, // ₹3,954 Cr
  unspent_funds: 8420000000,    // ₹842 Cr
  flagged_works_count: 342,
  top_risk_state: 'Gujarat',
  sc_st_compliance_avg: 88.4,
  total_works: 18450,
  active_mps: 543,
  state_aggregates: [
    { state: 'Gujarat', avg_risk: 78, risk_level: 'High', work_count: 1420, total_sanctioned: 3200000000, flagged_count: 48, utilization_pct: 62 },
    { state: 'Uttar Pradesh', avg_risk: 74, risk_level: 'High', work_count: 3850, total_sanctioned: 8400000000, flagged_count: 72, utilization_pct: 58 },
    { state: 'Bihar', avg_risk: 71, risk_level: 'High', work_count: 2100, total_sanctioned: 4100000000, flagged_count: 39, utilization_pct: 54 },
    { state: 'Maharashtra', avg_risk: 66, risk_level: 'High', work_count: 2450, total_sanctioned: 5200000000, flagged_count: 41, utilization_pct: 71 },
    { state: 'Madhya Pradesh', avg_risk: 63, risk_level: 'Medium', work_count: 1680, total_sanctioned: 3600000000, flagged_count: 27, utilization_pct: 68 },
    { state: 'Rajasthan', avg_risk: 59, risk_level: 'Medium', work_count: 1540, total_sanctioned: 3100000000, flagged_count: 22, utilization_pct: 74 },
    { state: 'Karnataka', avg_risk: 54, risk_level: 'Medium', work_count: 1380, total_sanctioned: 2900000000, flagged_count: 19, utilization_pct: 77 },
    { state: 'West Bengal', avg_risk: 52, risk_level: 'Medium', work_count: 1920, total_sanctioned: 4200000000, flagged_count: 24, utilization_pct: 79 },
    { state: 'Andhra Pradesh', avg_risk: 48, risk_level: 'Medium', work_count: 1250, total_sanctioned: 2600000000, flagged_count: 14, utilization_pct: 82 },
    { state: 'Telangana', avg_risk: 45, risk_level: 'Medium', work_count: 980, total_sanctioned: 2100000000, flagged_count: 11, utilization_pct: 83 },
    { state: 'Odisha', avg_risk: 43, risk_level: 'Medium', work_count: 1120, total_sanctioned: 2400000000, flagged_count: 10, utilization_pct: 81 },
    { state: 'Punjab', avg_risk: 38, risk_level: 'Low', work_count: 760, total_sanctioned: 1600000000, flagged_count: 5, utilization_pct: 86 },
    { state: 'Haryana', avg_risk: 34, risk_level: 'Low', work_count: 620, total_sanctioned: 1300000000, flagged_count: 4, utilization_pct: 89 },
    { state: 'Tamil Nadu', avg_risk: 28, risk_level: 'Low', work_count: 2100, total_sanctioned: 4400000000, flagged_count: 6, utilization_pct: 93 },
    { state: 'Kerala', avg_risk: 24, risk_level: 'Low', work_count: 1050, total_sanctioned: 2200000000, flagged_count: 3, utilization_pct: 95 },
    { state: 'Assam', avg_risk: 46, risk_level: 'Medium', work_count: 720, total_sanctioned: 1500000000, flagged_count: 8, utilization_pct: 76 },
    { state: 'Jharkhand', avg_risk: 61, risk_level: 'Medium', work_count: 890, total_sanctioned: 1900000000, flagged_count: 15, utilization_pct: 64 },
    { state: 'Chhattisgarh', avg_risk: 49, risk_level: 'Medium', work_count: 680, total_sanctioned: 1450000000, flagged_count: 7, utilization_pct: 80 },
    { state: 'Himachal Pradesh', avg_risk: 22, risk_level: 'Low', work_count: 310, total_sanctioned: 650000000, flagged_count: 1, utilization_pct: 94 },
    { state: 'Uttarakhand', avg_risk: 31, risk_level: 'Low', work_count: 380, total_sanctioned: 780000000, flagged_count: 2, utilization_pct: 91 },
    { state: 'Delhi', avg_risk: 42, risk_level: 'Medium', work_count: 450, total_sanctioned: 950000000, flagged_count: 5, utilization_pct: 84 },
    { state: 'Jammu and Kashmir', avg_risk: 51, risk_level: 'Medium', work_count: 340, total_sanctioned: 720000000, flagged_count: 4, utilization_pct: 73 },
    { state: 'Goa', avg_risk: 19, risk_level: 'Low', work_count: 140, total_sanctioned: 300000000, flagged_count: 0, utilization_pct: 96 }
  ]
};

export const MOCK_MPS = [
  // Gujarat MPs
  {
    mp_id: 'MP-GJ-01',
    name: 'Ranjanben Bhatt',
    constituency: 'Vadodara',
    state: 'Gujarat',
    party: 'BJP',
    lok_sabha_term: '17th Lok Sabha',
    works_count: 38,
    total_entitlement: 250000000, // ₹25 Cr over term
    total_utilized: 155000000,
    utilization_pct: 62.0,
    avg_risk: 87,
    sc_st_compliance: { sc_target_pct: 15.0, sc_actual_pct: 9.2, st_target_pct: 7.5, st_actual_pct: 4.1, is_compliant: false }
  },
  {
    mp_id: 'MP-GJ-02',
    name: 'C. R. Patil',
    constituency: 'Navsari',
    state: 'Gujarat',
    party: 'BJP',
    lok_sabha_term: '17th Lok Sabha',
    works_count: 54,
    total_entitlement: 250000000,
    total_utilized: 215000000,
    utilization_pct: 86.0,
    avg_risk: 44,
    sc_st_compliance: { sc_target_pct: 15.0, sc_actual_pct: 16.4, st_target_pct: 7.5, st_actual_pct: 8.2, is_compliant: true }
  },
  {
    mp_id: 'MP-GJ-03',
    name: 'Amit Shah',
    constituency: 'Gandhinagar',
    state: 'Gujarat',
    party: 'BJP',
    lok_sabha_term: '17th Lok Sabha',
    works_count: 62,
    total_entitlement: 250000000,
    total_utilized: 232000000,
    utilization_pct: 92.8,
    avg_risk: 31,
    sc_st_compliance: { sc_target_pct: 15.0, sc_actual_pct: 17.1, st_target_pct: 7.5, st_actual_pct: 9.0, is_compliant: true }
  },
  // UP MPs
  {
    mp_id: 'MP-UP-01',
    name: 'Rajnath Singh',
    constituency: 'Lucknow',
    state: 'Uttar Pradesh',
    party: 'BJP',
    lok_sabha_term: '17th Lok Sabha',
    works_count: 49,
    total_entitlement: 250000000,
    total_utilized: 210000000,
    utilization_pct: 84.0,
    avg_risk: 36,
    sc_st_compliance: { sc_target_pct: 15.0, sc_actual_pct: 18.2, st_target_pct: 7.5, st_actual_pct: 8.0, is_compliant: true }
  },
  {
    mp_id: 'MP-UP-02',
    name: 'Akhilesh Yadav',
    constituency: 'Azamgarh',
    state: 'Uttar Pradesh',
    party: 'SP',
    lok_sabha_term: '17th Lok Sabha',
    works_count: 34,
    total_entitlement: 250000000,
    total_utilized: 142000000,
    utilization_pct: 56.8,
    avg_risk: 76,
    sc_st_compliance: { sc_target_pct: 15.0, sc_actual_pct: 11.4, st_target_pct: 7.5, st_actual_pct: 5.2, is_compliant: false }
  },
  // Maharashtra MPs
  {
    mp_id: 'MP-MH-01',
    name: 'Nitin Gadkari',
    constituency: 'Nagpur',
    state: 'Maharashtra',
    party: 'BJP',
    lok_sabha_term: '17th Lok Sabha',
    works_count: 58,
    total_entitlement: 250000000,
    total_utilized: 240000000,
    utilization_pct: 96.0,
    avg_risk: 29,
    sc_st_compliance: { sc_target_pct: 15.0, sc_actual_pct: 19.5, st_target_pct: 7.5, st_actual_pct: 11.2, is_compliant: true }
  },
  {
    mp_id: 'MP-MH-02',
    name: 'Supriya Sule',
    constituency: 'Baramati',
    state: 'Maharashtra',
    party: 'NCP',
    lok_sabha_term: '17th Lok Sabha',
    works_count: 42,
    total_entitlement: 250000000,
    total_utilized: 198000000,
    utilization_pct: 79.2,
    avg_risk: 42,
    sc_st_compliance: { sc_target_pct: 15.0, sc_actual_pct: 16.0, st_target_pct: 7.5, st_actual_pct: 8.5, is_compliant: true }
  }
];

export const MOCK_WORKS = [
  // Confirmed Gujarat Fraud Demo Case (PRD FR-ML-03 / SRS 12.5)
  {
    work_id: 'GJ-2023-4471',
    mp_id: 'MP-GJ-01',
    district_id: 'DIST-VADODARA',
    ia_id: 'IA-VAD-COOP-09 (Shri Ganesh Vikas Trust)',
    description: 'Construction of Community Hall and Paver Block Road Phase II at Ward 12, Vadodara.',
    category: 'Community Infrastructure',
    sanctioned_amount: 59300000, // ₹5.93 Cr
    expenditure: 59300000,
    sanction_date: '2023-04-14',
    completion_date: '2023-11-20',
    uc_filed_date: '2024-01-20', // 61 days post completion (>30 days norm)
    sc_st_tag: 'None',
    tender_id: null, // Tender bypass (>₹50L threshold with no tender)
    state: 'Gujarat',
    risk_score: {
      composite_risk: 89,
      anomaly_score: 0.942,
      rule_flags: ['R1', 'R2', 'R6'],
      explanation_text: 'Flagged under Rule R1 (92% text similarity to prior year work GJ-2022-1082 by same IA), Rule R2 (Sanctioned amount ₹5.93 Cr exceeds tender ceiling of ₹50 Lakhs without e-tender record per MPLADS Guidelines §3.12), and Rule R6 (Utilization Certificate filed 61 days post-completion, exceeding the 30-day statutory mandate per MPLADS Guidelines §4.4).'
    },
    case_info: {
      case_id: 'CASE-2024-001',
      status: 'Under Review',
      assigned_auditor_name: 'Rekha Sharma (DA Officer)',
      notes: [
        {
          author_name: 'System Anomaly Pipeline',
          timestamp: '2024-02-10T10:30:00.000Z',
          text: 'Auto-flagged with composite risk 89/100. High cosine similarity with asset #GJ-2022-1082 and missing CPPP tender ID.'
        },
        {
          author_name: 'Rekha Sharma (Auditor)',
          timestamp: '2024-02-14T14:15:00.000Z',
          text: 'Field inspection scheduled for Ward 12. Cross-checking physical assets against Phase I completion photos.'
        }
      ]
    }
  },
  {
    work_id: 'GJ-2022-1082',
    mp_id: 'MP-GJ-01',
    district_id: 'DIST-VADODARA',
    ia_id: 'IA-VAD-COOP-09 (Shri Ganesh Vikas Trust)',
    description: 'Construction of Community Hall and Paver Block Road at Ward 12, Vadodara.',
    category: 'Community Infrastructure',
    sanctioned_amount: 59300000,
    expenditure: 59300000,
    sanction_date: '2022-03-10',
    completion_date: '2022-09-15',
    uc_filed_date: '2022-10-12',
    sc_st_tag: 'None',
    tender_id: 'TND-2022-991',
    state: 'Gujarat',
    risk_score: {
      composite_risk: 82,
      anomaly_score: 0.884,
      rule_flags: ['R1'],
      explanation_text: 'Flagged under Rule R1 (Duplicate billing signature detected with identical sanctioned amount ₹5.93 Cr and 92% description match to GJ-2023-4471 for same asset location).'
    },
    case_info: {
      case_id: 'CASE-2024-002',
      status: 'New',
      assigned_auditor_name: 'Unassigned',
      notes: []
    }
  },
  {
    work_id: 'UP-2023-8912',
    mp_id: 'MP-UP-02',
    district_id: 'DIST-AZAMGARH',
    ia_id: 'IA-UP-PWD-04',
    description: 'Installation of Solar Street Lighting Systems across Non-Notified Rural Roads.',
    category: 'Rural Electrification',
    sanctioned_amount: 32000000, // ₹3.2 Cr
    expenditure: 32000000,
    sanction_date: '2023-01-18',
    completion_date: '2023-07-22',
    uc_filed_date: null, // UC missing past grace period (>180 days)
    sc_st_tag: 'None',
    tender_id: null,
    state: 'Uttar Pradesh',
    risk_score: {
      composite_risk: 76,
      anomaly_score: 0.791,
      rule_flags: ['R2', 'R6'],
      explanation_text: 'Flagged under Rule R2 (Sanctioned spend of ₹3.20 Cr exceeds tender exemption threshold with no CPPP e-tender reference) and Rule R6 (Utilization Certificate missing past 180-day grace window per MPLADS Guidelines §4.4).'
    },
    case_info: {
      case_id: 'CASE-2024-003',
      status: 'Escalated',
      assigned_auditor_name: 'Rekha Sharma (DA Officer)',
      notes: [
        {
          author_name: 'Rekha Sharma (Auditor)',
          timestamp: '2024-02-18T11:00:00.000Z',
          text: 'Notice sent to Implementing Agency PWD-04. No response received in 14 days. Escalated to State Vigilance Committee.'
        }
      ]
    }
  },
  {
    work_id: 'BR-2023-1104',
    mp_id: 'MP-BR-01',
    district_id: 'DIST-PATNA',
    ia_id: 'IA-BR-DDA-01',
    description: 'Renovation and boundary wall construction for Religious Shrine Premises.',
    category: 'Culture & Heritage',
    sanctioned_amount: 14500000, // ₹1.45 Cr
    expenditure: 14500000,
    sanction_date: '2023-05-10',
    completion_date: '2023-10-15',
    uc_filed_date: '2023-11-05',
    sc_st_tag: 'None',
    tender_id: 'TND-BR-2023-41',
    state: 'Bihar',
    risk_score: {
      composite_risk: 84,
      anomaly_score: 0.865,
      rule_flags: ['R3'],
      explanation_text: 'Flagged under Rule R3 (Ineligible category violation: YAKE NLP keyphrase classification identified expenditure directed toward religious premises, explicitly prohibited under MPLADS Guidelines §2.4 Annexure-II Prohibited Works List).'
    },
    case_info: {
      case_id: 'CASE-2024-004',
      status: 'New',
      assigned_auditor_name: 'Unassigned',
      notes: []
    }
  },
  {
    work_id: 'MH-2023-5520',
    mp_id: 'MP-MH-02',
    district_id: 'DIST-PUNE',
    ia_id: 'IA-MH-ZP-03',
    description: 'Drinking Water Pipeline and Borewell Network for SC Habitat Colaba Colony.',
    category: 'Drinking Water',
    sanctioned_amount: 8500000, // ₹85 Lakhs
    expenditure: 8200000,
    sanction_date: '2023-02-05',
    completion_date: '2023-06-30',
    uc_filed_date: '2023-07-20',
    sc_st_tag: 'SC',
    tender_id: 'TND-MH-2023-891',
    state: 'Maharashtra',
    risk_score: {
      composite_risk: 18,
      anomaly_score: 0.125,
      rule_flags: [],
      explanation_text: 'No anomaly indicators detected. Work is fully compliant with MPLADS Guidelines, SC/ST allocation norms (§3.2), and UC filed within 20 days.'
    },
    case_info: null
  },
  {
    work_id: 'TN-2023-3391',
    mp_id: 'MP-TN-01',
    district_id: 'DIST-CHENNAI',
    ia_id: 'IA-TN-CORP-01',
    description: 'Smart Classroom Infrastructure and Computer Lab Equipment for Government Higher Secondary School.',
    category: 'Education',
    sanctioned_amount: 12000000, // ₹1.2 Cr
    expenditure: 11800000,
    sanction_date: '2023-03-12',
    completion_date: '2023-08-10',
    uc_filed_date: '2023-08-25',
    sc_st_tag: 'ST',
    tender_id: 'TND-TN-2023-094',
    state: 'Tamil Nadu',
    risk_score: {
      composite_risk: 12,
      anomaly_score: 0.082,
      rule_flags: [],
      explanation_text: 'No anomaly indicators detected. Validated against MoSPI guidelines and e-procurement portal.'
    },
    case_info: null
  }
];

export const MOCK_RULE_CONFIG = {
  r1_similarity_threshold: 90, // %
  r2_tender_threshold: 5000000, // ₹50 Lakhs
  r3_ineligible_categories: ['religious structure', 'private club', 'commercial asset', 'memorial'],
  r4_utilization_decile_cutoff: 10, // bottom 10%
  r5_sc_norm_pct: 15.0,
  r5_st_norm_pct: 7.5,
  r6_uc_grace_days: 30,
  isolation_forest_contamination: 0.05
};

export const MOCK_USERS = [
  { user_id: 'USR-001', name: 'Surya Sashank (Team Lead)', email: 'admin@koshdrishti.gov.in', role: 'Administrator', status: 'Active', department: 'SIH MoSPI Applied AI Hub' },
  { user_id: 'USR-002', name: 'Rekha Sharma', email: 'rekha@da.gov.in', role: 'Auditor', status: 'Active', department: 'District Authority Vadodara' },
  { user_id: 'USR-003', name: 'Vikram Mehta', email: 'vikram.m@cag.gov.in', role: 'Auditor', status: 'Active', department: 'CAG Regional Audit Cell' },
  { user_id: 'USR-004', name: 'Ananya Deshmukh', email: 'ananya.d@thehindu.co.in', role: 'Data Curator', status: 'Active', department: 'Civic Data Watch' },
  { user_id: 'USR-005', name: 'Dr. K. S. Rao', email: 'ksrao@da.ap.gov.in', role: 'Auditor', status: 'Pending', department: 'District Authority Visakhapatnam' },
  { user_id: 'USR-006', name: 'Pooja Verma', email: 'pooja.verma@audit.up.gov.in', role: 'Auditor', status: 'Pending', department: 'UP State Audit Directorate' }
];

export const MOCK_AUDIT_LOGS = [
  {
    timestamp: '2024-02-28T09:30:00.000Z',
    action: 'RULE_THRESHOLD_UPDATED',
    actor_email: 'admin@koshdrishti.gov.in',
    actor_role: 'Administrator',
    details: { rule: 'R2_TENDER_THRESHOLD', old_val: '₹25,00,000', new_val: '₹50,00,000', reason: 'Aligned to revised GFR 2017 & MoSPI Circular 2023' }
  },
  {
    timestamp: '2024-02-26T15:45:00.000Z',
    action: 'DATASET_INGESTION_COMPLETED',
    actor_email: 'admin@koshdrishti.gov.in',
    actor_role: 'Administrator',
    details: { source_file: 'MPLADS_17th_LokSabha_FY23-24.csv', rows_processed: 18450, anomalies_detected: 342, elapsed_sec: 42.1 }
  },
  {
    timestamp: '2024-02-24T11:20:00.000Z',
    action: 'USER_ACCOUNT_APPROVED',
    actor_email: 'admin@koshdrishti.gov.in',
    actor_role: 'Administrator',
    details: { approved_user: 'rekha@da.gov.in', assigned_role: 'Auditor', jurisdiction: 'Gujarat State DA' }
  },
  {
    timestamp: '2024-02-20T14:10:00.000Z',
    action: 'CASE_STATUS_ESCALATED',
    actor_email: 'rekha@da.gov.in',
    actor_role: 'Auditor',
    details: { case_id: 'CASE-2024-003', work_id: 'UP-2023-8912', transition: 'Under Review -> Escalated', reason: 'Missing UC past 180 days with no IA response' }
  }
];

// Helper to fetch live or return mock seamlessly
export async function fetchWithFallback(url, options = {}, fallbackData = null) {
  try {
    const res = await fetch(url, options);
    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`);
    }
    return await res.json();
  } catch (err) {
    console.info(`[Kosh-Drishti Data Engine] Using offline mock data for ${url}`);
    return fallbackData;
  }
}
