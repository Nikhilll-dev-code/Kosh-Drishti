# Kosh-Drishti (कोश-दृष्टि) — Project Explanation

> **Simple English explanation for anyone joining the team**
> SIH Problem Statement ID: 26102 | Organization: MoSPI

---

## 1. Project Overview

### What is Kosh-Drishti?

**Kosh-Drishti** means "Treasury Vision" in Sanskrit. It is a web-based software tool built for Smart India Hackathon 2026 (SIH26102).

The project was built for the **Ministry of Statistics and Programme Implementation (MoSPI)**, Department of Data Informatics & Innovation Division (DIID).

### Which problem does it solve?

The government runs a scheme called **MPLADS** (Members of Parliament Local Area Development Scheme). Every elected MP gets a certain amount of money every year to build local infrastructure — roads, schools, community halls, water supply systems, etc.

The problem is: **how do you check that this money is actually being spent correctly across hundreds of constituencies?**

Manually checking everything is very hard. There are 543 Lok Sabha + many Rajya Sabha constituencies. Each has many individual works. A lot of paperwork. A lot of numbers.

Kosh-Drishti helps by:
1. Automatically scanning available financial data to find **unusual patterns**.
2. Applying **specific audit rules** to flag concerning work records.
3. Generating an easy-to-read explanation for each flagged item.
4. Letting an auditor **review and decide** what to do next.

### The core idea

> **"Kosh-Drishti does not replace an auditor. It helps the auditor decide where to look first."**

The full process follows this flow:

```
Detect → Explain → Prioritize → Investigate → Act
```

1. **Detect** — Find unusual patterns in financial data and individual work records.
2. **Explain** — Tell the auditor *why* something looks unusual, with specific numbers.
3. **Prioritize** — Give each work a risk score from 0 to 100 so auditors focus on high-risk items first.
4. **Investigate** — The auditor reviews the actual documents and records.
5. **Act** — The auditor decides: no issue, minor irregularity, or escalate for further action.

---

## 2. The Problem in Simple Words

### What is MPLADS?

Every elected Member of Parliament (MP) in India receives funds every year (currently ₹5 crore per year per MP) to recommend development works in their constituency.

The process is:
```
Government releases funds to MP
       ↓
MP recommends specific development works
       ↓
District Authority (DA) sanctions and executes the works
       ↓
Contractors/agencies build the work
       ↓
DA submits Utilization Certificate (UC) confirming completion
       ↓
CAG / MoSPI audit the implementation
```

### Why is it hard to monitor?

- There are hundreds of constituencies.
- Each constituency has dozens or hundreds of individual works.
- Each work has financial records, completion documents, contractor details, timelines, etc.
- Manually checking every single record is practically impossible.

### What kinds of problems can occur?

Some problems that past CAG audits have found include:

| Problem | What it means |
|---------|---------------|
| Unusual spending | Funds spent far above or below normal rates for that type of work |
| Low utilization | MP's funds received but not actually spent on works |
| High unspent balance | Large amounts of money sitting unused |
| Delayed works | Works recommended long ago but still not completed |
| Unusual work costs | A work costs far more than expected for its category |
| Possible duplicate works | Two very similar works recommended around the same time |
| Potentially ineligible categories | Work recommended for things not allowed by MPLADS rules |
| Tender warning signals | Works above the tender threshold without proper tender documentation |
| Agency concentration | One implementing agency getting most of the works in a constituency |

### ⚠️ Important

**A risk signal or anomaly flag is NOT automatic proof of fraud.**

It simply means: "This item looks different from the norm. A human should check it."

Many flagged items may turn out to be completely legitimate once an auditor reviews the actual documents.

---

## 3. Our Two-Level Approach

Kosh-Drishti works at two levels. This distinction is very important to understand.

---

### Level 1 — 557 Real Constituency Financial Records

We currently have **557 real/public constituency-level financial records** from MoSPI/MPLADS data.

**One row = one constituency's overall financial summary.**

Think of it like a bank statement for the entire constituency.

#### What the columns mean

| Column Name | Simple Meaning |
|-------------|----------------|
| `Entitlement` | Total funds the MP is entitled to receive |
| `FundReceivedGOI` | How much money was actually released by the Government |
| `AmountAvailable` | Total money available (received + previous balance) |
| `WorksRecommCost` | Total estimated cost of all works the MP recommended |
| `WSCost` | Final sanctioned cost of approved works |
| `ActualExpenditureIncurred` | How much was actually spent |
| `UtilizationOverRelease` | What percentage of released funds were utilized |
| `UnspentBalance` | Money that was available but not spent |

#### Simple example

> Constituency X received ₹5 crore. Works were recommended. But only ₹1 crore was actually spent. ₹4 crore is sitting unused.
>
> The financial utilization ratio = 1/5 = **20%**
>
> If most other constituencies show 70–80% utilization, then 20% is unusual and may deserve attention.

#### What the ML model does at Level 1

The system computes **7 normalized financial ratios** from these columns for all 557 constituencies and feeds them to an **Isolation Forest** model (a machine learning algorithm).

The model identifies constituencies whose **combination of financial ratios** looks very different from the rest.

In plain English:
> "The model looks for constituencies whose financial pattern is unusual compared with the other 556."

It does **not** classify constituencies as fraudulent. It **ranks** them by how unusual their financial pattern is.

---

### Level 2 — 12 Synthetic Demonstration Work Records

At the work level, the prototype contains **12 synthetic work records**.

> ⚠️ **These are NOT real government work records.**
>
> They are **Synthetic Demonstration Data** created specifically for this prototype to show what work-level anomaly detection would look like when authorized detailed data is available.

They are clearly labeled in the code and database with `source: "DEMO_SEED_WORK"`.

#### Why do they exist?

The 557 constituency records contain aggregate financial totals. They do not contain individual work details (no work titles, dates, implementing agencies, costs per work, etc.).

To demonstrate the **work-level audit pipeline** — the detailed rule checks, risk scoring, and case management — the prototype uses these 12 synthetic records.

Each record represents one individual project and contains:

| Field | Example |
|-------|---------|
| `work_id` | `GW-2018-045` |
| `title` | Community center renovation |
| `category` | Community Infrastructures |
| `constituency` | Vadodara, Gujarat |
| `sanctioned_amount` | ₹45.20 Lakhs |
| `recommendation_date` | 2021-06-15 |
| `uc_date` | 2022-07-12 |
| `uc_lag_days` | 355 |
| `tender_id` | (blank) |
| `implementing_agency` | IA-GJ-COOP-01 |

---

## 4. Important Limitation of the 557 Records

> **This section is very important. Please read it carefully.**

The 557 records give us the **big picture** of each constituency's financial health.

However, they are **aggregate summaries**. They cannot directly reveal:

- Whether a specific bill was submitted twice (duplicate billing)
- Whether a vendor invoiced for goods that were never delivered
- Whether the same payment was made to two different vendors for the same work
- Whether a physical work actually exists on the ground
- Whether completion photographs are genuine
- Whether quantities were inflated on a specific invoice

#### Example to make this clear

> A constituency received ₹5 crore and spent ₹4.5 crore.
>
> The financial numbers look completely normal — 90% utilization.
>
> But theoretically, a specific contractor could have submitted the same bill twice for ₹20 lakh and both were paid.
>
> The aggregate numbers (₹4.5 crore spent) would not reveal this.
>
> Only **work-level and payment-level data** with individual bill records would reveal that specific duplicate payment.

#### This is not a failure of the architecture

This is a **limitation of the currently available data**.

The 557 records are what is currently publicly available at the aggregate level.

If MoSPI provides authorized access to detailed work-level data, individual bills, payment records, and supporting documents — **the Kosh-Drishti architecture can be extended** to analyze all of that and detect document-level fraud patterns.

---

## 5. Level 2 — Detailed Work Analysis (Demonstration)

The 12 synthetic work records are used to demonstrate the **work-level audit pipeline**.

These records were deliberately designed to include a range of scenarios:

1. A work that is a **duplicate** of another work in the same constituency
2. A work with a **prohibited category** in its title (e.g., religious structure)
3. A work with a **very long UC submission delay**
4. A work with a **cost just below the tender threshold** without a tender ID
5. A work implemented by an **agency with a high concentration** of works in the constituency
6. A work with a **cost far above** the expected benchmark for its category
7. A **normal, low-risk work** that demonstrates the system correctly does NOT flag everything

---

## 6. R1–R6 Rules

These are the six deterministic audit rules applied to each work record.

**Deterministic** means: the same input always gives the same output. No randomness.

---

### R1 — Ineligible Work Category (Weight: 35 points)

**What it checks:** Whether the work title or category contains keywords from a prohibited list.

**Why it matters:** MPLADS guidelines (Para 3.3) explicitly prohibit certain types of works — for example, religious structures (temples, mosques, churches), private land purchase, commercial complexes, and clubs.

**Simple example:** If a work is titled "Construction of temple hall at village X", it would trigger R1 because "temple" is on the prohibited keyword list.

**Important:** This is a keyword match. It flags words that *appear* to describe something prohibited. A human must verify whether the work actually is ineligible or if the naming was just imprecise.

---

### R2 — Duplicate Work Recommendation (Weight: 30 points)

**What it checks:** Whether a work looks very similar to another work in the same constituency — based on title, cost, category, and location — using a mathematical similarity measure called Token Jaccard Similarity.

**Simple example:** If Work A is "Community hall renovation at Amreli Block 2" for ₹45 lakh, and Work B is "Community centre renovation at Amreli Block 2" for ₹45 lakh, the similarity score would be very high (~100%).

A similarity score ≥ 85% triggers R2.

**Important:** High similarity is a **possible duplicate signal**, not proof of fraud. Two genuinely different phases of the same project can look similar. A human must verify.

---

### R3 — Excessive Delay / UC Lag (Weight: 30 points)

**What it checks:** How long it took from the work's recommendation date to when the Utilization Certificate (UC) was filed.

**Threshold:** More than **225 days** (180 days statutory deadline + 45 days grace period).

**Simple example:** If a work was recommended on 1 January and the UC was filed on 1 December (almost 11 months later), the lag is ~330 days, which exceeds 225 days and triggers R3.

**Why it matters:** Delays in UC filing can indicate that funds were released but the work was never completed, or that the completion documentation is problematic.

---

### R4 — Tender Threshold / Missing Tender Signal (Weight: 20 points)

**What it checks:** Whether a work's cost is close to or above ₹25 Lakhs without a recorded tender ID.

MPLADS rules require competitive tendering for works above ₹25 Lakhs. Works structured just below this threshold without proper tendering documentation can be a warning signal.

**Simple example:** A work costs ₹24.5 Lakh (just below the ₹25 Lakh threshold) with no tender ID → triggers R4.

> ⚠️ **Important limitation:** This prototype checks **individual works** against the threshold. It does **not** detect sophisticated split billing where a large project is broken into multiple smaller works each just below the threshold. Detecting that pattern requires cross-work procurement analysis that is beyond the current dataset.

---

### R5 — Implementing Agency Over-Concentration (Weight: 15 points)

**What it checks:** Whether one single implementing agency (contractor/government body) is doing more than 35% of all works in a constituency.

**Why it matters:** If 8 out of 10 works in a constituency all go to the same agency, that concentration may indicate unfair allocation or lack of competitive selection.

**Threshold:** Triggered when one agency holds >35% of works, and there are at least 3 works total in the constituency.

---

### R6 — Cost Benchmark Anomaly (Weight: 20 points)

**What it checks:** Whether a work's cost is more than **1.5 times** the expected benchmark for its category.

**Category benchmarks used:**

| Category | Benchmark |
|----------|-----------|
| Community Infrastructures | ₹15 Lakhs |
| Education | ₹20 Lakhs |
| Public Health | ₹25 Lakhs |
| Water Supply & Sanitation | ₹10 Lakhs |
| Roads & Bridges | ₹30 Lakhs |

**Simple example:** A community infrastructure work costs ₹32 Lakh. The benchmark is ₹15 Lakh. 1.5× benchmark = ₹22.5 Lakh. Since ₹32L > ₹22.5L, R6 triggers.

**Important:** Benchmarks are standard reference estimates. Large or complex works may legitimately exceed these. A human must verify.

---

## 7. How the Risk Score Works

Every work record gets a **Composite Risk Score** from 0 to 100.

Here is the exact formula used in the code:

**Step 1 — Add up triggered rule weights:**
```
Rule Score = sum of weights of all triggered rules
```
Example: R2 (30) + R3 (30) + R4 (20) + R5 (15) + R6 (20) = **115 points**

**Step 2 — Cap the rule score at 100:**
```
Rule Score Capped = min(Rule Score, 100)
= min(115, 100) = 100
```

**Step 3 — Apply rule weight (85%):**
```
Rule Contribution = round(Rule Score Capped × 0.85)
= round(100 × 0.85) = 85 points
```

**Step 4 — Add ML contribution (15%):**
```
ML Contribution = round(Anomaly Score × 100 × 0.15)
```
The Anomaly Score comes from the Isolation Forest model (0.05 to 0.95).

Example: Anomaly Score = 0.52 → ML Contribution = round(0.52 × 100 × 0.15) = **8 points**

**Step 5 — Final composite score:**
```
Composite Risk = min(100, max(0, Rule Contribution + ML Contribution))
= min(100, 85 + 8) = 93
```

**Risk Tiers:**

| Score | Tier | Meaning |
|-------|------|---------|
| 65–100 | 🔴 HIGH | High priority — investigate first |
| 40–64 | 🟡 MEDIUM | Notable signals — review soon |
| 0–39 | 🟢 LOW | No significant flags |

**What a high score means:**
> A high score means the work has **more risk signals** and deserves **higher investigation priority**.

**What a high score does NOT mean:**
> It does NOT mean the work is definitely fraudulent.

---

## 8. What Happens After the Risk Score?

```
Work Record
     ↓
R1–R6 Rule Checks
     ↓
Risk Score Calculated (0–100)
     ↓
If Risk Score ≥ 40:
     ↓
   Investigation Case Created automatically
     ↓
   Auditor reviews the Case Queue
     ↓
   Auditor examines actual records/documents/evidence
     ↓
   Auditor decides:
     ├── No issue found → Case Resolved
     ├── Irregularity confirmed → Case Escalated
     └── Needs more information → Status: Under Review
```

**The system does NOT make the final fraud determination.**

Only the human auditor — after reviewing actual physical evidence, documents, and records — decides whether a genuine problem exists.

---

## 9. What Is the AI Actually Doing?

Let's be very clear about what the AI/ML does:

### For 557 constituency records:
- **Isolation Forest** (machine learning algorithm) analyzes 7 financial ratios per constituency.
- It identifies which constituencies have **unusual combinations** of financial patterns.
- Output: An anomaly score per constituency (0.05 = normal, 0.95 = most unusual).
- This feeds into the map coloring and constituency risk dashboard.

### For detailed work records (12 synthetic):
- **R1–R6** rules are deterministic checks — no machine learning involved.
- They produce specific, explainable evidence ("Work lag = 355 days, threshold = 225 days").
- **Groq LLM (Llama 3.3 70B)** then takes the rule evidence and converts it into a plain-language paragraph for the auditor.

### The complete AI picture:
```
Machine Learning (Isolation Forest)
  → Identifies unusual financial patterns in real data
  → Produces anomaly scores

Deterministic Rules (R1–R6)
  → Checks specific audit criteria on work records
  → Produces specific evidence with exact numbers

Groq LLM
  → Takes already-computed evidence and scores
  → Writes them as a readable audit explanation
  → Does NOT invent new facts or change risk scores

Human Auditor
  → Reviews everything
  → Makes the final decision
```

---

## 10. Groq / LLM Explanation

The system uses **Groq API** (model: `llama-3.3-70b-versatile`) to generate plain-language audit explanations.

### Where it is called
In `backend/src/services/groqService.js`, triggered when a `POST /api/explain` request is made (typically when a user opens a Work Detail page for the first time).

### What information is sent to Groq
- Work ID, title, category, constituency, state
- Sanctioned amount
- All triggered rule flags (e.g., R2, R3, R4)
- The specific evidence for each rule (e.g., "UC lag = 355 days")
- The composite risk score and ML anomaly score

### What Groq returns
A 3-section plain-language explanation:
1. **Plain Language Summary** — What the risk signals mean in simple terms
2. **Key Risk Drivers** — The specific rule findings that caused the score
3. **Recommended Action** — Suggested next steps for the auditor

### What Groq does NOT do
- It does NOT calculate the risk score (that is done by the rule engine)
- It does NOT invent new evidence (it only explains what the rule engine already found)
- It does NOT access external systems or government databases

### If Groq is not available
If no Groq API key is configured, or if the API call fails, the system automatically uses a **deterministic template fallback** that generates a similar explanation using fixed text patterns. The application works fully without Groq.

---

## 11. Complete System Architecture

### Three-service architecture:

```
┌─────────────────────────────────────────────────────────────┐
│              FRONTEND (React + Vite)                        │
│              Running on port 5173                           │
│                                                             │
│  Home  →  State  →  MP Profile  →  Work Detail  →  Cases   │
│  Admin Panel  →  Methodology  →  Login                      │
└──────────────────────┬──────────────────────────────────────┘
                       │ HTTP REST API calls
                       ↓
┌─────────────────────────────────────────────────────────────┐
│              BACKEND (Node.js + Express)                    │
│              Running on port 5000                           │
│                                                             │
│  Routes → Controllers → Services                            │
│  ├── ruleEngineService.js  (R1–R6 rule checks)              │
│  ├── featureExtractor.js   (7-feature ML vectors)           │
│  ├── duplicateDetectionService.js  (Jaccard similarity)     │
│  ├── groqService.js        (LLM explanation)                │
│  ├── mlService.js          (HTTP client to ML service)      │
│  └── ingestService.js      (CSV parsing)                    │
│                                                             │
│  Data: backend/data/db.json  (flat-file JSON store)         │
│  Seed: backend/src/seed/raw_mplads_data.csv (557 records)   │
└──────────────────────┬──────────────────────────────────────┘
                       │ HTTP POST /score
                       ↓
┌─────────────────────────────────────────────────────────────┐
│              ML SERVICE (Python FastAPI)                    │
│              Running on port 8000                           │
│                                                             │
│  POST /score  → IsolationForest.fit_predict(features)       │
│  GET  /health → Service status check                        │
│  POST /explain → Template/LLM explanation (Python side)     │
└─────────────────────────────────────────────────────────────┘
```

### Data flow for 557 real constituency records:

```
raw_mplads_data.csv (557 real constituency records)
       ↓ Parsed at backend startup
db.json (stored in memory + file)
       ↓ Feature extraction (7 financial ratios per constituency)
HTTP POST to ML service /score (557 feature vectors)
       ↓ IsolationForest trains on 557 population
Anomaly score per constituency (0.05 – 0.95)
       ↓ Stored back in db.json
Dashboard  →  State Risk Map  →  Constituency Analytics
```

### Data flow for work-level audit:

```
12 Synthetic Demo Work Records (in db.json)
       ↓
R1–R6 Rule Engine evaluation
       ↓
Feature extraction → ML service → Work anomaly score
       ↓ 85% Rules + 15% ML
Composite Risk Score (0–100)
       ↓ If score ≥ 40
Investigation Case created automatically
       ↓
Auditor reviews Case Queue
       ↓
Groq LLM explanation generated for Work Detail page
       ↓
Auditor investigates → Status updated → Notes added
```

---

## 12. Frontend Pages

| Page | URL | Who Uses It | What It Shows |
|------|-----|-------------|---------------|
| **Dashboard / Home** | `/` | Anyone | National India map with state risk coloring, fund totals, high-risk counts |
| **State View** | `/states/:stateName` | Anyone | List of MPs in a state with party filter and search |
| **MP Profile** | `/mps/:mp_id` | Anyone | MP financial summary, list of sanctioned works |
| **Works List** | `/works` | Anyone | All 12 demo works with filters by state, category, risk tier |
| **Work Detail** | `/works/:work_id` | Auditors | Full 12-section audit screen: R1–R6 findings, risk score breakdown, ML score, Groq explanation, case status |
| **Case Queue** | `/cases` | Auditors | All investigation cases sorted by risk, with status tabs |
| **Admin Panel** | `/admin` | Administrators | System health, CSV ingestion, user management, audit log, data quality |
| **Login** | `/login` | Staff | Credential-based login |
| **Methodology** | `/methodology` | Anyone | Documentation of how the system works, R1–R6 explained |

---

## 13. Backend

The backend is built with **Node.js and Express**.

**File: `backend/src/server.js`**
- Entry point, starts on port 5000
- On startup: automatically seeds the database if empty
- Serves the React frontend in production mode

**File: `backend/src/routes/apiRoutes.js`**
- Defines all 30 API endpoints
- Public routes: no authentication needed
- Case management routes: require JWT + Auditor/Administrator role
- Admin routes: require JWT + Administrator role

**File: `backend/src/controllers/apiControllers.js`**
- ~1,031 lines
- All 30 API handler functions
- `getDashboardSummary`, `getGeographicRisk`, `getWorks`, `getWorkById`, `getCases`, `updateCaseStatus`, `getDataQuality`, etc.

**File: `backend/src/services/ruleEngineService.js`**
- `evaluateRulesDetailed(work, allWorks, config)` — runs R1–R6 on a work
- `runFullScoringPipeline()` — scores all works + all 557 constituencies via ML service
- `computeRiskConfidence(...)` — HIGH/MEDIUM/LOW confidence rating

**File: `backend/src/models/store.js`**
- Singleton in-memory JSON store backed by `backend/data/db.json`
- All reads and writes go through this one module

**Authentication:**
- JWT-based (jsonwebtoken library)
- 4 seeded accounts: Administrator, Auditor (Rekha), Auditor (Priya), Curator
- Passwords hashed with bcryptjs
- Token expiry: 12 hours
- The application works in read-only mode without login (public viewer)

---

## 14. ML Service

**Language:** Python 3.10+  
**Framework:** FastAPI with Uvicorn  
**Running on:** Port 8000

### Endpoints

| Endpoint | Method | What it does |
|----------|--------|--------------|
| `/health` | GET | Returns service status, whether model is fitted |
| `/score` | POST | Receives feature vectors, runs IsolationForest, returns anomaly scores |
| `/explain` | POST | Generates explanation (Python-side, not used by main flow) |

### How it works

The backend sends feature vectors in a POST request:
```json
{
  "items": [
    { "id": "CONST-001", "features": [0.65, 0.23, 0.88, ...] },
    { "id": "CONST-002", "features": [0.12, 0.91, 0.33, ...] }
  ]
}
```

The Python service:
1. Converts them to a NumPy array
2. Calls `IsolationForest.fit(X)` and then `decision_function(X)`
3. Inverts and normalizes the raw scores to [0.05, 0.95]
4. Returns the score per ID

If the service is offline or times out (3-second timeout), the backend automatically uses a heuristic weighted-average fallback — **the system continues to work without the ML service**.

---

## 15. Data

| Dataset | Count | Type | Purpose |
|---------|-------|------|---------|
| **Constituency Financial Records** | **557** | ✅ **Real/Public Data** (MoSPI MPLADS) | Financial overview per constituency. Powers dashboard totals, map risk coloring, constituency analytics, and ML anomaly detection. |
| **Demo Work Records** | **12** | ⚠️ **Synthetic Demonstration Data** | Shows the work-level audit pipeline (R1–R6, risk scoring, cases, LLM explanation). NOT official government data. |
| **MP Reference Data** | ~50 entries | Reference (18th Lok Sabha) | MP names and constituency metadata for navigation. |

**Source of 557 records:** The file `backend/src/seed/raw_mplads_data.csv` contains real MPLADS constituency-level aggregate financial data from MoSPI/official sources.

**The 12 demo work records** are hardcoded in `backend/src/seed/seedData.js` and are clearly labeled with `source: "DEMO_SEED_WORK"` in the database.

---

## 16. What the Prototype Can Currently Detect

### From 557 real constituency records:
- Unusually low fund utilization (spending much less than received)
- Unusually high unspent balance
- Unusual ratio of recommended works cost to entitlement
- Unusual relationship between sanctioned and recommended costs
- Unusual expenditure relative to available funds
- Constituencies with unusual combinations of financial indicators

### Demonstrated at work level (using 12 synthetic records):
- **R1:** Works with prohibited/ineligible category keywords
- **R2:** Works that are very similar to existing works (possible duplicate)
- **R3:** Works with excessive UC submission delays
- **R4:** Works near or above tender threshold without tender documentation
- **R5:** Works from agencies with high constituency concentration
- **R6:** Works with costs significantly above category benchmarks

---

## 17. What the Current Prototype Cannot Verify

The following cannot be detected with the current available data:

| Cannot Detect | Why |
|---------------|-----|
| Duplicate bills / invoices | Requires individual payment-level records |
| Fake invoices or vendors | Requires vendor database and invoice records |
| Duplicate payments | Requires payment transaction data |
| Physical existence of a work | Requires field inspection or geo-tagged photos |
| Fake completion photos | Requires image forensics and geo-verification |
| Inflated quantities in bills | Requires item-level bill of quantities data |
| Sophisticated collusion across agencies | Requires multi-entity cross-linkage data |

These require more detailed authorized data and/or human field verification. They are not a failure of the current architecture — they are data availability limitations.

---

## 18. Future / Production Version

If MoSPI or the District Authorities provide authorized access to detailed data, Kosh-Drishti's architecture can be extended to analyze:

```
Authorized MPLADS/eSAKSHI data
       ↓
Constituency financial data (already done)
       ↓
Individual work data (status, location, implementing agency)
       ↓
Individual payment/bill data (vendor, amount, date)
       ↓
Document/photo evidence (completion certificates, photos)
       ↓
Extended Kosh-Drishti analysis
       ↓
Risk prioritization + evidence package
       ↓
Auditor review + field verification
       ↓
Final decision
```

**Important:** All future integrations require authorized data access from the appropriate government authorities. The current prototype does not claim real-time access to government payment databases or official documents.

---

## 19. Demo Flow for Judges

### Suggested demo sequence (10–12 minutes)

1. **Open the Home Dashboard** — Show the India map. Explain that each colored state represents aggregated financial risk from real 557 constituency data.

2. **Click on a colored state** — Navigate to the State View. Show the MP list for that state.

3. **Open an MP Profile** — Show the MP's financial summary and sanctioned works.

4. **Go to Works List** — Show all 12 demo works. Apply a filter for "HIGH" risk. Explain that works are sorted by composite risk score.

5. **Open Work `GW-2018-045`** — This is the flagship demo case. Show:
   - Composite Risk Score: 93/100 (HIGH)
   - Rules triggered: R2 (Duplicate), R3 (UC Lag), R4 (Tender Signal), R5 (Agency Concentration), R6 (Cost Benchmark)
   - Exact evidence values for each rule
   - ML Anomaly Score

6. **Show the AI Explanation** — Show the Groq LLM-generated audit explanation (or template fallback if no API key).

7. **Show the Case** — Go to Case Queue. Show that a case was auto-created for this high-risk work. Show the status workflow (New → Under Review → Resolved/Escalated).

8. **Open the Methodology Page** — Briefly explain the system's honesty: it is a screening tool, not an automatic fraud verdict.

9. **Open Admin Panel** — Briefly show system health, ML service status, data quality metrics.

---

### Likely Judge Questions & Good Answers

**Q: Where exactly is the AI in this system?**
> A: There are two AI/ML components. First, an Isolation Forest model trained on 557 real constituency financial records identifies unusual financial patterns at the state level — that is what drives the map colors. Second, Groq LLM (Llama 3.3 70B) converts the rule engine's findings into a plain-language explanation for auditors. The rules themselves are deterministic.

**Q: Why only 557 records?**
> A: That is the publicly available constituency-level aggregate financial data from MoSPI. Individual work-level and payment-level data requires authorized government access, which we are demonstrating the architecture for.

**Q: Why only 12 work records?**
> A: Those 12 are synthetic demonstration records we created to show what work-level anomaly detection looks like. They are clearly labeled as synthetic data. In a production deployment with authorized data, the system would process thousands of real work records.

**Q: Are the 12 works real government records?**
> A: No. They are synthetic demonstration records created by us to showcase the rule engine, risk scoring, and case management pipeline. They are labeled "DEMO_SEED_WORK" in the database.

**Q: Can you detect duplicate bills right now?**
> A: Our R2 rule detects works with similar titles and costs, which is a signal to investigate possible duplicate recommendations. However, detecting actual duplicate payment invoices requires access to individual payment records, which we do not currently have. We show the architecture for how that would work if authorized data was available.

**Q: What happens after a case is generated?**
> A: An auditor logs in, reviews the case queue, opens the investigation case, sees all the evidence, adds notes, and updates the status as they investigate. The system provides a workflow: New → Under Review → Escalated or Resolved. The human auditor makes the final determination.

**Q: Does the AI decide whether something is fraud?**
> A: No. The AI and rules identify which items have unusual patterns and need attention. The final decision is always made by the human auditor after reviewing actual documents and records.

**Q: What data would you need for a production deployment?**
> A: Authorized access to individual work records (title, category, contractor, cost, timeline), payment data (individual bills, vendor details, payment dates), and ideally document evidence (completion certificates, photographs). This requires an MoU with MoSPI or the District Authority system.

**Q: Why use AI (Isolation Forest) instead of just using thresholds?**
> A: Simple thresholds like "flag any constituency with utilization below 50%" would produce many false positives. Isolation Forest identifies constituencies whose *combination* of financial ratios is unusual compared to all others — it accounts for the correlation between multiple indicators simultaneously, which is much harder to do with simple rules.

---

## 20. One-Minute Explanation (Memorize This)

> "India's MPLADS scheme gives MPs about ₹5 crore every year to build local infrastructure. With hundreds of constituencies and thousands of works, it is practically impossible to manually check every transaction.
>
> Kosh-Drishti is our solution. It works at two levels.
>
> At the first level, we take 557 real constituency financial records and use a machine learning algorithm called Isolation Forest to find which constituencies have unusual financial patterns — unusually low spending, unusually high unspent balance, unusual ratios.
>
> At the second level, for individual work records, we apply six specific audit rules based on CAG guidelines — checking for potentially ineligible categories, possible duplicate works, UC delays, tender signals, agency concentration, and cost anomalies. Each triggered rule adds to the work's composite risk score from 0 to 100.
>
> High-risk works automatically get an investigation case created. An auditor then reviews the evidence, checks the actual documents, and decides whether there is a real problem.
>
> The key idea is: **Kosh-Drishti does not replace the auditor. It tells the auditor where to look first.** The AI finds patterns. The rules explain why something looks wrong. The auditor makes the final call."
