# KOSH-DRISHTI REST API DOCUMENTATION

**Project:** Kosh-Drishti (SIH Problem Statement ID: 26102)  
**Base URL:** `http://localhost:5000/api`  
**Authentication Scheme:** HTTP Bearer Token (`Authorization: Bearer <jwt_token>`)  

---

## 1. PUBLIC DASHBOARD & ANALYTICS ENDPOINTS

### `GET /api/dashboard/summary`
* **Auth:** Optional
* **Purpose:** Fetches national parliamentary summary metrics, real constituency financial totals (from `raw_mplads_data.csv`), work risk distribution counts, anomaly counts, and state-level risk heat-map data.
* **Output:**
  ```json
  {
    "total_constituencies": 557,
    "total_entitlement_cr": 11342.5,
    "total_fund_received_cr": 4812.3,
    "total_actual_expenditure_cr": 5018.9,
    "overall_utilization_pct": 104.3,
    "total_works": 12,
    "anomaly_count": 2,
    "risk_distribution": { "high": 3, "medium": 4, "low": 5 },
    "state_aggregates": [...]
  }
  ```

### `GET /api/constituencies`
* **Auth:** Optional
* **Purpose:** Returns the array of all 557 processed constituency financial records (`CONSTITUENCY_AGGREGATE`).

### `GET /api/data-quality`
* **Auth:** Optional
* **Purpose:** Returns data quality metrics, completeness ratios, record counts by source (`CONSTITUENCY_AGGREGATE`, `DEMO_SEED_WORK`, `WORK_IMPORT`), and ML service health status.

### `GET /api/risk/geography`
* **Auth:** Optional
* **Purpose:** Returns state-level geographic risk scores, risk tiers (`HIGH`, `MEDIUM`, `LOW`), color codes, and case counts for map rendering.

### `GET /api/analytics/financial`
* **Auth:** Optional
* **Purpose:** Computes national financial aggregates and peer-relative financial outliers (utilization anomalies).

### `GET /api/analytics/rules`
* **Auth:** Optional
* **Purpose:** Returns rule trigger frequencies across all evaluated works for Rules R1–R6.

### `GET /api/analytics/agencies`
* **Auth:** Optional
* **Purpose:** Computes Implementing Agency concentration, total works handled, financial value, constituencies served, and average risk score.

---

## 2. WORKS & AUDIT ENDPOINTS

### `GET /api/works`
* **Auth:** Optional
* **Query Params:** `page` (default 1), `limit` (default 50), `search`, `state`, `category`
* **Purpose:** Returns paginated, filtered list of work items with composite risk scores and risk tiers.

### `GET /api/works/:work_id`
* **Auth:** Optional
* **Purpose:** Fetches full work particulars, MP profile, structured rule violations, ML anomaly scores, structured evidence list, case workflow status, and AI explanation.

### `POST /api/works/:work_id/reanalyze`
* **Auth:** Optional
* **Purpose:** Re-runs the feature extraction -> IsolationForest ML -> Rule Engine -> Composite Risk pipeline for the target work item.

### `POST /api/explain`
* **Auth:** Optional
* **Input Body:** `{ "work": {...}, "rule_flags": [...], "composite_risk": 85, "evidence": [...] }`
* **Purpose:** Invokes Groq Cloud LLM (`llama-3.3-70b-versatile`) to generate a plain-language audit explanation based strictly on pre-computed evidence.

---

## 3. AUDITOR CASE MANAGEMENT ENDPOINTS

### `GET /api/cases`
* **Auth:** Optional (Public read access enabled for competition demo)
* **Purpose:** Returns all active audit cases requiring auditor inspection.

### `PATCH /api/cases/:case_id/status`
* **Auth:** Required (Roles: `Auditor`, `Administrator`)
* **Input Body:** `{ "status": "Under Review" }`
* **Purpose:** Updates case status following the state sequence: `New` -> `Under Review` -> `Resolved` | `Escalated`.

### `POST /api/cases/:case_id/notes`
* **Auth:** Required (Roles: `Auditor`, `Administrator`)
* **Input Body:** `{ "text": "Investigation findings..." }`
* **Purpose:** Appends an immutable, timestamped auditor note to the case record.

### `GET /api/cases/:case_id/pdf`
* **Auth:** Optional
* **Purpose:** Generates a structured JSON payload for printing an official PDF Audit Investigation Report.

---

## 4. INGESTION & ADMIN ENDPOINTS

### `POST /api/admin/works/import`
* **Auth:** Required (Roles: `Curator`, `Administrator`)
* **Purpose:** Uploads a CSV file of work records, parses fields, validates headers, tags source as `WORK_IMPORT`, and runs the scoring pipeline.

### `POST /api/admin/re-score`
* **Auth:** Required (Roles: `Curator`, `Administrator`)
* **Purpose:** Re-scores all works in the database through the ML + Rule pipeline.

### `PUT /api/admin/config`
* **Auth:** Required (Role: `Administrator`)
* **Input Body:** `{ "rule_weight": 0.85, "ml_weight": 0.15, "r2_tender_threshold": 2500000 }`
* **Purpose:** Updates system rule thresholds and composite risk weighting parameters.
