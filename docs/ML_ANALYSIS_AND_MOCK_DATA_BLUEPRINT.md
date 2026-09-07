# Kosh-Drishti (SIH26102) — ML Analysis, Rule Engine & Data Blueprint

**Document Version:** 1.0  
**Problem Statement:** SIH26102 — AI-Powered Anomaly & Fraud Detection in MPLAD Scheme Implementation  
**Intended Use:** Reference architecture and complete reproduction guide for Backend & ML Engineering Workstreams.

---

## 1. System Architecture Overview

Kosh-Drishti uses a hybrid **Deterministic Rule Engine (R1–R6) + Unsupervised Isolation Forest Anomaly Detection + LLM Plain-Language Explainability** pipeline.

```
+-----------------------------------------------------------------------------------+
|                            Public MPLADS Dataset (CSV)                            |
+-----------------------------------------------------------------------------------+
                                         |
                                         v
+-----------------------------------------------------------------------------------+
|                        Feature Engineering Pipeline (7 Features)                  |
|  1. TF-IDF Text Vectors       2. Work Amount (INR)       3. Tender Exemption Delta|
|  4. Ineligible Category Vector 5. MP Utilization Decile   6. SC/ST Spend Ratio     |
|  7. Utilization Certificate (UC) Delay (Days)                                     |
+-----------------------------------------------------------------------------------+
                      /                                           \
                     /                                             \
                    v                                               v
+----------------------------------------+     +------------------------------------+
| Deterministic CAG Rule Engine (R1-R6)  |     |   Isolation Forest Anomaly Model   |
| R1: Duplicate Billing (>=90% sim)      |     | Contamination: 0.05                |
| R2: Tender Bypass (>=₹50L no tender)   |     | N_estimators: 100                  |
| R3: Ineligible Category (YAKE NLP)     |     | Output: Normalized Anomaly Score   |
| R4: Chronic Under-utilization (<=10%)  |     |         (0.000 to 1.000)           |
| R5: SC/ST Norm Violation (<15%/<7.5%)  |     +------------------------------------+
| R6: Missing / Late UC (>30 Days)       |                      |
+----------------------------------------+                      |
                    \                                           /
                     \                                         /
                      v                                       v
+-----------------------------------------------------------------------------------+
|                          Composite Risk Score Blender                             |
|          S = min(100, 0.65 * Sum(Rule_Weights) + 0.35 * (Anomaly_Score * 100))    |
+-----------------------------------------------------------------------------------+
                                         |
                                         v
+-----------------------------------------------------------------------------------+
|                  Plain-Language Explainability (Groq LLaMA / Fallback)            |
|       Synthesizes exact guideline clause citations (§3.12, §4.4, Annexure-II)     |
+-----------------------------------------------------------------------------------+
```

---

## 2. Feature Engineering Specifications

For every sanctioned work record, compute the following standardized feature vector:

| Feature Name | Type | Description / Normalization | Used In |
|---|---|---|---|
| `text_tfidf_vector` | Sparse Vector (500-dim) | TF-IDF bi-gram representation of `description` | Rule R1, ML Model |
| `sanctioned_amount_log` | Float | $\log_{10}(\text{sanctioned\_amount} + 1)$ | Rule R2, ML Model |
| `has_tender_id` | Binary (0 / 1) | 0 if null or missing, 1 if valid tender reference | Rule R2, ML Model |
| `ineligible_kw_score` | Float (0.0 to 1.0) | Cosine similarity against Annexure-II prohibited keywords | Rule R3 |
| `mp_utilization_decile` | Integer (1 to 10) | Relative decile of MP total spend vs entitlement | Rule R4 |
| `sc_st_spend_ratio` | Float (0.0 to 1.0) | Cumulative SC/ST spend / Total annual spend | Rule R5 |
| `uc_delay_days` | Integer | $\max(0, \text{uc\_filed\_date} - \text{completion\_date})$ | Rule R6, ML Model |

---

## 3. The 6 Deterministic CAG Rules (R1–R6)

### Rule R1 — Duplicate Billing Detection
- **Trigger Condition:** Two or more works associated with the same Implementing Agency (`ia_id`) or asset coordinate have description cosine similarity $\ge 90\%$ and identical/near-identical sanctioned amounts across different financial years.
- **CAG Reference:** Report No. 4 of 2018 §4.3 (Repeated financial sanctions for identical physical infrastructure).
- **Rule Weight:** 35 points.

### Rule R2 — Tender Bypass Flag
- **Trigger Condition:** `sanctioned_amount` $\ge \text{CONFIG\_TENDER\_THRESHOLD}$ (Default: ₹50,00,000 / ₹50 Lakhs) AND `tender_id` IS NULL.
- **Statutory Reference:** General Financial Rules (GFR) 2017 Rule 144 & MPLADS Guidelines §3.12 (Mandatory e-tendering on CPPP).
- **Rule Weight:** 30 points.

### Rule R3 — Ineligible Category Classification
- **Trigger Condition:** Work description contains keyphrases matching prohibited works list (e.g., religious structures, private trusts, commercial memorials) via YAKE keyphrase extraction.
- **Statutory Reference:** MPLADS Guidelines §2.4 Annexure-II (List of Ineligible / Prohibited Works).
- **Rule Weight:** 40 points.

### Rule R4 — Chronic Under-Utilization
- **Trigger Condition:** MP or District Authority fund utilization rate resides in the lowest 10th percentile nationally for 2 or more consecutive financial years.
- **Statutory Reference:** MoSPI Master Circular on Scheme Fund Flow §5.1.
- **Rule Weight:** 20 points.

### Rule R5 — SC/ST Statutory Allocation Norm Violation
- **Trigger Condition:** MP annual cumulative spend for Scheduled Caste (SC) areas is $< 15.0\%$ OR Scheduled Tribe (ST) areas is $< 7.5\%$.
- **Statutory Reference:** MPLADS Guidelines §3.2 (Mandatory Social Justice Allocation Norms & Business Rule BR-03).
- **Rule Weight:** 25 points.

### Rule R6 — Late / Missing Utilization Certificate (UC)
- **Trigger Condition:** `uc_filed_date` is absent $> 30$ days past `completion_date` (plus configurable grace period, default 15 days).
- **Statutory Reference:** MPLADS Guidelines §4.4 & GFR 2017 Rule 238(1) Form GFR 12-A.
- **Rule Weight:** 25 points.

---

## 4. Machine Learning Anomaly Detection Model

### Model Architecture
- **Algorithm:** Isolation Forest (`sklearn.ensemble.IsolationForest`)
- **Hyperparameters:**
  ```python
  from sklearn.ensemble import IsolationForest

  model = IsolationForest(
      n_estimators=100,
      contamination=0.05, # Expecting ~5% high-risk outliers
      random_state=42,
      bootstrap=True
  )
  ```
- **Score Normalization:**
  Raw decision function output is normalized to $[0.000, 1.000]$:
  $$\text{anomaly\_score} = \frac{- \text{decision\_function}(X) - \min}{\max - \min}$$

---

## 5. Composite Risk Score Formula

The unified composite risk score $S \in [0, 100]$ fuses deterministic rule hits with the unsupervised ML anomaly score:

$$S = \min\left(100, \; 0.65 \times \sum_{i \in \text{Triggered Rules}} W_i + 0.35 \times (\text{anomaly\_score} \times 100)\right)$$

### Risk Tier Boundaries
- **Low Risk:** $0 \le S < 40$ (Verified Green)
- **Medium Risk:** $40 \le S < 65$ (Signal Saffron)
- **High Risk:** $65 \le S \le 100$ (Alert Rust &mdash; Requires Auditor Triage)

---

## 6. Ground-Truth Benchmark Case Study (Vadodara Gujarat Demo Case)

- **Work ID:** `GJ-2023-4471`
- **Location:** Ward 12, Vadodara, Gujarat
- **Implementing Agency:** `IA-VAD-COOP-09 (Shri Ganesh Vikas Trust)`
- **Sanctioned Amount:** ₹5,93,00,000 (₹5.93 Crore)
- **Tender Reference:** `NULL` (Bypassed)
- **UC Filed Date:** 61 days post-completion (>30 days norm)
- **Description Match:** 92% similarity to `GJ-2022-1082` (Previous fiscal year)
- **Computed Composite Score:** 89/100 (High Risk)
- **Triggered Flags:** `['R1', 'R2', 'R6']`
- **Plain-Language Summary:**
  *"This work was sanctioned for ₹5.93 Crore with no linked e-tender record on the central procurement portal (Rule R2, MPLADS Guidelines §3.12). Cosine similarity scoring revealed a 92% textual match with prior-year work #GJ-2022-1082 by the same implementing agency (Rule R1). Furthermore, the statutory Utilization Certificate was submitted 61 days post-completion, exceeding the 30-day compliance norm (Rule R6)."*

---

## 7. Data Schemas

### Work Entity Schema
```typescript
interface WorkRecord {
  work_id: string; // Primary key, e.g. "GJ-2023-4471"
  mp_id: string; // Foreign key -> MP
  district_id: string;
  ia_id: string; // Implementing Agency
  description: string;
  category: string;
  sanctioned_amount: number; // INR
  expenditure: number; // INR
  sanction_date: string; // ISO-8601
  completion_date: string | null;
  uc_filed_date: string | null;
  sc_st_tag: "SC" | "ST" | "None";
  tender_id: string | null;
  state: string;
}
```

### Risk Score Entity Schema
```typescript
interface RiskScoreRecord {
  work_id: string;
  composite_risk: number; // 0 to 100
  anomaly_score: number; // 0.0 to 1.0
  rule_flags: Array<"R1" | "R2" | "R3" | "R4" | "R5" | "R6">;
  explanation_text: string;
  generated_at: string;
}
```

### Case Entity Schema
```typescript
interface CaseRecord {
  case_id: string;
  work_id: string;
  status: "New" | "Under Review" | "Resolved" | "Escalated";
  assigned_auditor_id: string;
  assigned_auditor_name: string;
  notes: Array<{
    author_name: string;
    timestamp: string;
    text: string;
  }>;
}
```

---

## 8. Backend / ML Integration Checklist

When connecting the live FastAPI scoring service and Node/Express backend:
1. Load dataset CSV via `POST /api/ingest`.
2. Compute feature matrix in Python ML service (`POST /ml/score`).
3. Store results in MongoDB `works`, `risk_scores`, and `cases` collections.
4. Expose endpoints:
   - `GET /api/dashboard/summary` &rarr; State aggregates & KPI totals
   - `GET /api/states/:stateName` &rarr; State details & MP list
   - `GET /api/mps/:mpId` &rarr; MP dossier & works list
   - `GET /api/works` &rarr; Paginated works query
   - `GET /api/works/:workId` &rarr; Work audit record
   - `PATCH /api/cases/:caseId/status` &rarr; Update status (Enforce BR-07: New &rarr; Under Review &rarr; Resolved/Escalated)
   - `POST /api/cases/:caseId/notes` &rarr; Append audit note
