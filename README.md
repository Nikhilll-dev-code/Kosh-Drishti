# Kosh-Drishti (कौश-दृष्टि) — SIH26102

> **AI-Powered Anomaly & Fraud Detection Platform for MPLAD Scheme Implementation**  
> *Smart India Hackathon 2026 | Problem Statement ID: SIH26102 | Ministry of Statistics and Programme Implementation (MoSPI)*

---

## 📌 Executive Overview

**Kosh-Drishti** ("Treasury Vision") is an explainable, evidence-backed fraud and anomaly detection platform designed for fund utilization under the **Members of Parliament Local Area Development Scheme (MPLADS)**.

Every year, roughly **₹4,000 Crore** is allocated across ~800 MPs (Lok Sabha + Rajya Sabha) for local community infrastructure. Historical Comptroller and Auditor General of India (CAG) audits have highlighted recurring failure modes:
1. **Duplicate Billing**: The same renovation or work claimed across multiple financial years for the same asset.
2. **Tender Bypass**: High-value works executed without compulsory competitive tendering.
3. **Ineligible Categories**: Funds spent on prohibited categories (e.g., religious structures, private land).
4. **Chronic Under-Utilization**: Allocation funds lying unspent for consecutive years.
5. **SC/ST Quota Violations**: Failure to meet mandatory $15\%$ SC and $7.5\%$ ST annual spend quotas.
6. **Delayed / Missing Utilization Certificates (UC)**: UCs filed months past the statutory 30-day norm.

Kosh-Drishti ingests public fund-utilization datasets, evaluates a deterministic **CAG-grounded rule engine (R1–R6)**, applies an **Isolation Forest ML anomaly scorer**, blends them into a **0–100 Composite Risk Score**, and generates plain-language explanations with full guideline citations.

---

## 🚀 Key Features

- **Interactive Choropleth Risk Map**: National view of India with state-level aggregate risk shading (Verified Green $\rightarrow$ Signal Saffron $\rightarrow$ Alert Rust).
- **Multi-Level Drilldown**: National Map $\rightarrow$ State Overview $\rightarrow$ MP Profile $\rightarrow$ Work Audit Detail.
- **Confirmed Demo Case Validation (`GW-2018-045`)**: Re-detects the documented Gujarat Panchayat renovation duplicate billing case, scoring **96/100** (top $5\%$ risk band) and triggering rules `[R1, R2, R5, R6]`.
- **Evidence-Backed Plain-Language Explanations**: Translates complex rule hits into clear auditor justification paragraphs citing exact MPLADS Guidelines clauses, with an offline template fallback engine (`FR-EXP-02`).
- **Role-Based Access Control (RBAC)**:
  - **Public Viewer**: Read-only access to maps, leaderboards, MP profiles, work details, and PDF/CSV exports.
  - **Auditor / DA Officer**: Case management queue, status sequence workflow (`New` $\rightarrow$ `Under Review` $\rightarrow$ `Resolved` / `Escalated` enforcing `BR-07`), and append-only investigation notes (`FR-CASE-02`).
  - **Administrator**: User registration approvals, rule threshold tuning (`FR-RULE-07`), batch CSV ingestion (`FR-ING-01`), and immutable audit trail logs.

---

## 🛠 System Architecture & Technology Stack

```
SIH2k26/
├── backend/                  # Express REST API (Auth, RBAC, Rule Engine, Case Management)
│   ├── src/
│   │   ├── controllers/      # Route logic for Dashboard, Works, MPs, Cases, Auth, Admin
│   │   ├── middleware/       # JWT Auth & Role permission checks
│   │   ├── models/           # Persistent store & JSON database manager
│   │   ├── services/         # Rule engine (R1-R6) & scoring coordinator
│   │   ├── seed/             # Seeder script including Gujarat demo case
│   │   └── server.js         # API Server entrypoint (Port 5000)
│   ├── package.json
│   └── .env.example
├── ml_service/               # Python FastAPI ML Scorer & LLM Explainer Service
│   ├── app/
│   │   ├── isolation_forest.py # IsolationForest anomaly model
│   │   ├── explainer.py       # Plain-language explainer & template fallback
│   │   └── main.py            # FastAPI service (Port 8000)
│   └── requirements.txt
├── frontend/                 # React (Vite) Public & Auditor Web Dashboard
│   ├── src/
│   │   ├── components/       # IndiaMap, RiskChip, RuleBadge, DisclaimerBanner, TopBar, Breadcrumb
│   │   ├── pages/            # Home, StateView, MPProfile, WorkDetail, CaseQueue, AdminPanel, Login
│   │   └── App.jsx
│   ├── package.json
│   └── tailwind.config.js
├── README.md
└── .gitignore
```

---

## ⚡ Quick Start Guide

### Prerequisites
- **Node.js**: v18.0.0 or higher
- **npm**: v9.0.0 or higher
- **Python** (optional for standalone ML service): 3.10+

### 1. Install Dependencies & Build Frontend

```bash
# Install backend dependencies
cd backend
npm install

# Install frontend dependencies and build production bundle
cd ../frontend
npm install
npm run build
```

### 2. Start Backend API & Serves App

```bash
cd ../backend
npm start
```

Open your browser at **`http://localhost:5000`** to access the dashboard.

---

## 🔑 Demo Account Credentials

| Persona / Role | Email | Password | Allowed Capabilities |
| :--- | :--- | :--- | :--- |
| **Administrator** | `admin@koshdrishti.gov.in` | `Admin@12345` | Full system access, threshold tuning, user approvals, audit log |
| **Auditor (Rekha)** | `rekha@da.gov.in` | `Auditor@12345` | Case queue management, status updates, append-only notes, export PDF/CSV |
| **Public Viewer** | *No Login Required* | N/A | Read-only national map, MP profile, work detail, PDF/CSV export |

---

## 📊 Rule Engine Checks (R1–R6) Reference

| Rule Code | Rule Title | Trigger Condition | Guideline Citation |
| :--- | :--- | :--- | :--- |
| **`R1`** | Duplicate Billing | Similarity $\ge 85\%$ & matching amount for same IA | CAG 2018 Gujarat Audit Finding |
| **`R2`** | Tender Bypass | Sanctioned amount $\ge ₹25\text{ Lakhs}$ without tender ID | MPLADS Guidelines §7.2 |
| **`R3`** | Ineligible Category | Description contains prohibited asset terms | MPLADS Guidelines Para 3.3 |
| **`R4`** | Chronic Under-Utilization | Constituency in bottom utilization decile for 2+ yrs | Scheme Financial Norms |
| **`R5`** | SC/ST Norm Violation | Spend $< 15\%$ SC or $< 7.5\%$ ST annual target | MPLADS Guidelines Para 2.4 |
| **`R6`** | Late / Missing UC | UC filed $> 30$ days post-completion or missing past grace | MPLADS Guidelines Para 6.4 |

---

## 📜 License

Built for **Smart India Hackathon 2026 (SIH26102)** by **Team Kosh-Drishti**, Geethanjali College of Engineering and Technology (GCET), Hyderabad.
