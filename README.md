# Kosh-Drishti (कोश-दृष्टि)

> **AI-assisted anomaly screening tool for MPLAD Scheme fund utilization**  
> Smart India Hackathon 2026 · Problem Statement ID: SIH26102  
> Organization: MoSPI — Data Informatics & Innovation Division (DIID)

---

## Problem Statement

India's Members of Parliament Local Area Development Scheme (MPLADS) allocates roughly ₹5 crore per MP per year for local infrastructure. With hundreds of constituencies, thousands of individual works, and large amounts of financial data, manually identifying unusual patterns is impractical.

SIH26102 asks for an AI-powered system to detect anomalies, fraud signals, and inefficiencies in MPLADS implementation.

---

## What the Project Does

Kosh-Drishti ingests available MPLADS financial data, identifies unusual patterns using machine learning and deterministic rules, explains findings in plain language, and presents a prioritized queue for auditors to investigate.

> **Core idea: Kosh-Drishti does not replace an auditor. It helps the auditor decide where to look first.**

```
Detect → Explain → Prioritize → Investigate → Act
```

---

## Architecture

```
Public MPLADS Financial Data (557 Constituency Records)
               ↓
    Backend (Node.js + Express, port 5000)
               ↓ Feature extraction (7 financial ratios)
    ML Service (Python FastAPI, port 8000)
               ↓ IsolationForest — trained on 557 real observations
    Anomaly Score per Constituency
               ↓
    Dashboard / State Map / Constituency Analytics

Synthetic Demo Work Records (12 records)
               ↓
    Rule Engine R1–R6 (deterministic)
               ↓ 85% rule score + 15% ML signal
    Composite Risk Score (0–100)
               ↓ score ≥ 40
    Investigation Case (auto-created)
               ↓
    Auditor Case Queue
               ↓
    Groq LLM Explanation (plain-language, using pre-computed evidence)
               ↓
    Human Auditor Reviews → Final Decision
```

**Frontend** (React + Vite, port 5173) communicates with the backend via REST API calls proxied through Vite.

---

## Data

| Dataset | Count | Type | Used For |
|---------|-------|------|----------|
| Constituency Financial Records | **557** | ✅ Real / Public (MoSPI MPLADS) | Dashboard totals, map risk coloring, ML anomaly detection |
| Demo Work Records | **12** | ⚠️ Synthetic Demonstration Data | R1–R6 rule demonstration, risk scoring, case management |

> The 12 demo work records are **NOT official government records**.  
> They are synthetic examples created to demonstrate the work-level audit pipeline.  
> They are labeled `source: "DEMO_SEED_WORK"` in the database.

---

## AI / ML

**Isolation Forest** (scikit-learn) is the primary ML model.

- Trained on **557 real constituency financial records**
- Input: 7 normalized financial ratios per constituency (utilization ratio, unspent ratio, recommendation ratio, work sanction ratio, expenditure-to-available, recommendation-to-received, unspent-to-entitlement)
- Output: Anomaly score per constituency from 0.05 (normal) to 0.95 (most unusual)
- Higher score = more unusual compared to the other constituencies in the dataset

The model is an **unsupervised anomaly detector**, not a fraud classifier. It identifies unusual patterns without labelled fraud examples.

**Groq LLM** (llama-3.3-70b-versatile) is used **only for explanation** — it converts already-computed rule evidence into a readable audit summary. It does not score, detect, or classify.

---

## R1–R6 Rule Engine

Six deterministic rules applied to each work record:

| Code | Rule Name | Threshold | Weight |
|------|-----------|-----------|--------|
| R1 | Ineligible Work Category | Prohibited keyword match | 35 pts |
| R2 | Duplicate Work Recommendation | ≥85% Token Jaccard similarity | 30 pts |
| R3 | Excessive Delay / UC Lag | >225 days from recommendation to UC | 30 pts |
| R4 | Tender Threshold / Missing Tender Signal | Near/above ₹25L without tender ID | 20 pts |
| R5 | Implementing Agency Over-Concentration | >35% agency work share in constituency | 15 pts |
| R6 | Cost Benchmark Anomaly | >1.5× category cost benchmark | 20 pts |

**Risk Score Formula:**
```
Rule Score Capped   = min(sum of triggered rule weights, 100)
Rule Contribution   = round(Rule Score Capped × 0.85)
ML Contribution     = round(Anomaly Score × 100 × 0.15)
Composite Risk      = min(100, Rule Contribution + ML Contribution)
```

Risk tiers: HIGH ≥ 65 · MEDIUM ≥ 40 · LOW < 40

---

## Project Structure

```
SIH2k26/
├── backend/
│   ├── data/
│   │   └── db.json                  # Runtime JSON database (auto-generated)
│   ├── src/
│   │   ├── controllers/
│   │   │   └── apiControllers.js    # All 30 API handler functions
│   │   ├── middleware/
│   │   │   └── auth.js              # JWT authentication & role checks
│   │   ├── models/
│   │   │   └── store.js             # JSON store singleton
│   │   ├── routes/
│   │   │   └── apiRoutes.js         # API route definitions
│   │   ├── seed/
│   │   │   ├── seedData.js          # 12 demo works + MP records + users
│   │   │   └── raw_mplads_data.csv  # 557 real constituency records
│   │   ├── services/
│   │   │   ├── ruleEngineService.js     # R1–R6 + scoring pipeline
│   │   │   ├── featureExtractor.js      # Feature vectors for ML
│   │   │   ├── duplicateDetectionService.js  # Token Jaccard similarity
│   │   │   ├── groqService.js           # Groq LLM explanation
│   │   │   ├── mlService.js             # HTTP client to ML service
│   │   │   └── ingestService.js         # CSV parsing
│   │   ├── test/
│   │   │   └── verifySystem.js      # Acceptance test suite
│   │   └── server.js                # Express entry point (port 5000)
│   ├── .env.example                 # Environment variable template
│   └── package.json
│
├── frontend/
│   ├── public/
│   │   └── maps/                    # India GeoJSON map files
│   ├── src/
│   │   ├── components/              # IndiaMap, RiskChip, RuleBadge, ExportModal, etc.
│   │   ├── context/                 # React context (Toast, Auth)
│   │   ├── data/
│   │   │   └── realParliamentData.js  # 18th Lok Sabha reference data
│   │   ├── pages/                   # Home, StateView, MPProfile, WorksList,
│   │   │                            # WorkDetail, CaseQueue, AdminPanel,
│   │   │                            # Login, Methodology
│   │   └── App.jsx                  # React Router routes
│   ├── vite.config.js               # Dev proxy → backend port 5000
│   └── package.json
│
├── ml_service/
│   ├── app/
│   │   ├── isolation_forest.py      # AnomalyScorer class (IsolationForest)
│   │   ├── explainer.py             # Python-side LLM/template explainer
│   │   └── main.py                  # FastAPI entry point (port 8000)
│   ├── .env.example                 # Environment variable template
│   └── requirements.txt
│
├── docs/
│   └── PROJECT_EXPLANATION.md       # Full plain-English project explanation
│
├── API.md                           # API endpoint documentation
├── README.md                        # This file
└── .gitignore
```

---

## Requirements

| Tool | Version | Required For |
|------|---------|-------------|
| Node.js | ≥ 18.0.0 | Backend + Frontend |
| npm | ≥ 9.0.0 | Package management |
| Python | ≥ 3.10 | ML Service |
| pip | Latest | Python packages |

---

## Environment Variables

### `backend/.env`

| Variable | Required | Description |
|----------|----------|-------------|
| `PORT` | No (default: 5000) | Port for Express backend |
| `NODE_ENV` | No (default: development) | Environment mode |
| `JWT_SECRET` | Yes | Secret key for JWT token signing — use a long random string |
| `GROQ_API_KEY` | No | Groq API key for LLM explanations — without this, template fallback is used |
| `ML_SERVICE_URL` | No (default: http://localhost:8000) | URL of the Python ML service |

### `ml_service/.env`

| Variable | Required | Description |
|----------|----------|-------------|
| `GROQ_API_KEY` | No | Groq API key for Python-side explainer (optional) |
| `PORT` | No (default: 8000) | Port for FastAPI ML service |

> Get a free Groq API key at [https://console.groq.com](https://console.groq.com)

**NEVER commit `.env` files to Git.** Only `.env.example` files should be committed.

---

## Installation

### Step 1 — Clone the repository

```powershell
git clone https://github.com/YOUR_USERNAME/Kosh-Drishti.git
cd Kosh-Drishti
```

### Step 2 — Set up the Backend

```powershell
cd backend
npm install
```

Copy the environment template and fill in your values:
```powershell
Copy-Item .env.example .env
# Now open .env and fill in JWT_SECRET and GROQ_API_KEY
```

### Step 3 — Set up the Frontend

```powershell
cd ..\frontend
npm install
```

### Step 4 — Set up the ML Service (Python)

```powershell
cd ..\ml_service

# Create a virtual environment
python -m venv venv

# Activate it (Windows PowerShell)
.\venv\Scripts\Activate.ps1

# Install Python dependencies
pip install -r requirements.txt
```

Copy the environment template:
```powershell
Copy-Item .env.example .env
# Optionally add your GROQ_API_KEY
```

> **Mac/Linux:** Use `source venv/bin/activate` instead of the PowerShell activate command.

---

## Running the Project

Start all three services in separate terminal windows:

**Terminal 1 — Backend API Server**
```powershell
cd backend
node src/server.js
# Server starts on http://localhost:5000
# Database is auto-seeded on first run
```

**Terminal 2 — Python ML Service**
```powershell
cd ml_service
.\venv\Scripts\Activate.ps1
python -m uvicorn app.main:app --host 127.0.0.1 --port 8000
# ML service starts on http://localhost:8000
```

**Terminal 3 — React Frontend (Development)**
```powershell
cd frontend
npm run dev
# Frontend starts on http://localhost:5173
```

Then open your browser at **http://localhost:5173**

> The ML service is optional. If it is offline, the backend automatically uses a heuristic fallback and all features remain available.

---

## Health Checks

| Service | URL | Expected Response |
|---------|-----|-------------------|
| Backend | http://localhost:5000/health | `{ "status": "OK" }` |
| ML Service | http://localhost:8000/health | `{ "status": "UP", "service": "Kosh-Drishti ML Service" }` |

---

## Demo Accounts

| Role | Email | Password | Access |
|------|-------|----------|--------|
| Administrator | `admin@koshdrishti.gov.in` | `Admin@12345` | Full access, user management, config tuning |
| Auditor | `rekha@da.gov.in` | `Auditor@12345` | Case queue, status updates, investigation notes |
| Public Viewer | — (no login) | — | Read-only: map, works, methodology |

---

## Usage — Quick Test Flow

1. Open http://localhost:5173
2. Browse the Home dashboard — observe state risk coloring on India map
3. Click any colored state → view MP list
4. Go to **Works** in the navigation
5. Click on work **`GW-2018-045`** — composite risk 93/100 (HIGH)
6. Review R1–R6 findings, risk score breakdown, Groq AI explanation
7. Log in as Auditor (`rekha@da.gov.in` / `Auditor@12345`)
8. Go to **Cases** — observe auto-generated investigation cases
9. Update a case status to demonstrate the auditor workflow
10. Visit **Methodology** for system documentation

**Run the verification suite:**
```powershell
cd backend
node src/test/verifySystem.js
```

---

## Demo Data — Important Notice

The 12 work records visible in the Works directory are **synthetic demonstration records** created by the development team. They are not official government MPLADS work records.

They are labeled `source: "DEMO_SEED_WORK"` in the database and are used exclusively to demonstrate the work-level audit pipeline (R1–R6 rule checks, risk scoring, case creation, LLM explanation).

The **557 constituency financial records** are real publicly available MPLADS aggregate financial data from MoSPI.

---

## Limitations

**What the current prototype can detect (from 557 real records):**
- Unusual fund utilization ratios
- Unusual unspent balance patterns
- Unusual recommendation-to-expenditure relationships

**What the prototype demonstrates (using 12 synthetic records):**
- Ineligible work categories (R1)
- Possible duplicate work recommendations (R2)
- UC filing delays (R3)
- Tender threshold signals (R4)
- Agency concentration signals (R5)
- Cost benchmark anomalies (R6)

**What the prototype cannot currently verify:**
- Duplicate invoices or bills (requires individual payment data)
- Fake vendors or ghost contractors (requires vendor database)
- Physical existence of works (requires field inspection / geo-tagged evidence)
- Inflated quantities in bills of materials (requires item-level billing data)
- Sophisticated multi-work split billing (requires cross-work procurement linkage)

These limitations are not architectural failures — they reflect what data is currently available. The architecture is designed to support these analyses if authorized detailed data becomes available.

---

## Future Scope

With authorized access to detailed government data:

```
Authorized MPLADS/eSAKSHI detailed data
       ↓
Individual work records + payment/bill data + document evidence
       ↓
Extended Kosh-Drishti analysis
       ↓
Document-level duplicate detection, vendor analysis, geo-verification
       ↓
Deeper risk prioritization + evidence packages
       ↓
Human audit verification + final decision
```

---

## Security

- All secrets belong in `.env` files that are **never committed to Git**
- `.env` is listed in `.gitignore`
- Only `.env.example` (with placeholder values) is committed
- JWT tokens expire after 12 hours
- Passwords are hashed with bcryptjs before storage
- Admin and case management routes require JWT + role authorization

---

## Built By

**Team Kosh-Drishti**  
Geethanjali College of Engineering and Technology (GCET), Hyderabad  
Smart India Hackathon 2026 · SIH Problem Statement ID: 26102  
Organization: Ministry of Statistics and Programme Implementation (MoSPI)
