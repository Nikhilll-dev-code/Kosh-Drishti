import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getApiUrl } from '../config/api';
import { motion } from 'framer-motion';
import { IndiaMap } from '../components/IndiaMap';
import { DisclaimerBanner } from '../components/DisclaimerBanner';
import { ALL_INDIAN_STATES, CURRENT_LOK_SABHA_MPS } from '../data/realParliamentData';
import {
  Building2,
  Search,
  Filter,
  ArrowRight,
  Sparkles,
  Users,
  Compass,
  CheckCircle2,
  BookOpen,
  Award,
  Layers,
  FileSpreadsheet,
  ShieldCheck
} from 'lucide-react';

const RUPEE = '\u20B9';

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.08 }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.45, ease: 'easeOut' } }
};

export const Home = () => {
  const navigate = useNavigate();
  const [tableSearch, setTableSearch] = useState('');
  const [selectedZone, setSelectedZone] = useState('All');
  const [summaryData, setSummaryData] = useState(null);
  const [loadingSummary, setLoadingSummary] = useState(true);

  useEffect(() => {
    fetch(getApiUrl('/api/dashboard/summary'))
      .then(res => res.json())
      .then(data => {
        setSummaryData(data);
        setLoadingSummary(false);
      })
      .catch(err => {
        console.warn('Dashboard summary fetch failed:', err.message);
        setLoadingSummary(false);
      });
  }, []);

  const filteredStates = ALL_INDIAN_STATES.filter((st) =>
    st.state.toLowerCase().includes(tableSearch.toLowerCase())
  );

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-10"
    >
      {/* Disclaimer Banner */}
      <motion.div variants={itemVariants}>
        <DisclaimerBanner />
      </motion.div>

      {/* Hero Section */}
      <motion.div
        variants={itemVariants}
        className="relative bg-gradient-to-br from-ledger-navy via-[#162A45] to-[#0E1B2D] text-white rounded-3xl p-6 sm:p-10 shadow-2xl border border-slate-700/80 overflow-hidden"
      >
        <div className="absolute -right-20 -top-20 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute -left-20 -bottom-20 w-96 h-96 bg-sky-500/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="relative z-10 max-w-3xl space-y-4">
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-amber-500/20 border border-amber-500/30 text-amber-300 text-xs font-mono font-medium"
          >
            <Award className="w-3.5 h-3.5 text-amber-400" />
            SMART INDIA HACKATHON 2026 &middot; PROBLEM STATEMENT ID: SIH26102
          </motion.div>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-serif font-bold text-white tracking-tight leading-tight">
            The Public <span className="text-amber-400 italic">Parliamentary</span> Ledger
          </h1>

          <p className="text-sm sm:text-base text-slate-300 font-sans leading-relaxed">
            Kosh-Drishti provides a transparent, auditable national platform for the Members of Parliament Local Area Development Scheme (MPLADS). Explore all 543 Lok Sabha constituencies, review current elected MPs, inspect public work sanctions, and verify statutory compliance across all 28 States and 8 Union Territories.
          </p>

          {/* Quick jump pills */}
          <div className="pt-2 flex flex-wrap items-center gap-2.5 text-xs font-sans">
            <a
              href="#heatmap-section"
              className="px-4 py-2 bg-amber-500 text-ledger-navy font-bold rounded-xl hover:bg-amber-400 transition-all shadow-md shadow-amber-500/20 flex items-center gap-1.5"
            >
              Explore National Map &darr;
            </a>
            <a
              href="#states-directory"
              className="px-4 py-2 bg-slate-800 text-slate-200 border border-slate-700 rounded-xl hover:bg-slate-700 transition-all flex items-center gap-1.5"
            >
              State-Wise MP Directory &darr;
            </a>
            <Link
              to="/works"
              className="px-4 py-2 bg-slate-800/80 text-amber-300 border border-amber-500/30 rounded-xl hover:bg-slate-700 transition-all flex items-center gap-1.5"
            >
              Works Directory &rarr;
            </Link>
            <Link
              to="/methodology"
              className="px-4 py-2 bg-slate-800/80 text-slate-200 border border-slate-700 rounded-xl hover:bg-slate-700 transition-all flex items-center gap-1.5"
            >
              <BookOpen className="w-3.5 h-3.5 text-amber-400" /> Audit Methodology
            </Link>
          </div>
        </div>
      </motion.div>

      {/* Live Backend Audit Pipeline Metrics Banner */}
      {summaryData && (
        <motion.div variants={itemVariants} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
            <div>
              <h2 className="text-lg font-serif font-bold text-slate-900 flex items-center gap-2">
                <FileSpreadsheet className="w-5 h-5 text-amber-600" /> Real Dataset &amp; Audit Pipeline Summary
              </h2>
              <p className="text-xs text-slate-500 font-sans">
                Live metrics processed from MoSPI MPLADS dataset (<span className="font-mono text-slate-700">raw_mplads_data.csv</span>) &amp; IsolationForest Anomaly Engine
              </p>
            </div>
            <span className="inline-flex items-center gap-1 px-3 py-1 bg-emerald-50 text-emerald-700 text-xs font-mono font-semibold rounded-full border border-emerald-200">
              <CheckCircle2 className="w-3.5 h-3.5" /> Pipeline Active
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
              <div className="text-[11px] font-mono text-slate-500 uppercase">Real Constituencies</div>
              <div className="text-xl font-bold font-mono text-slate-900 mt-1">{summaryData.total_constituencies || 558}</div>
              <div className="text-[10px] text-emerald-600 font-medium">MoSPI Real Data</div>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
              <div className="text-[11px] font-mono text-slate-500 uppercase">Total GOI Released</div>
              <div className="text-xl font-bold font-mono text-slate-900 mt-1">{RUPEE}{summaryData.total_fund_received_cr || 0} Cr</div>
              <div className="text-[10px] text-slate-500">GOI Allocation</div>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
              <div className="text-[11px] font-mono text-slate-500 uppercase">Actual Expenditure</div>
              <div className="text-xl font-bold font-mono text-emerald-700 mt-1">{RUPEE}{summaryData.total_actual_expenditure_cr || 0} Cr</div>
              <div className="text-[10px] text-emerald-600 font-medium">{summaryData.overall_utilization_pct || 0}% Utilized</div>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
              <div className="text-[11px] font-mono text-slate-500 uppercase">High Risk Works</div>
              <div className="text-xl font-bold font-mono text-rose-600 mt-1">{summaryData.risk_distribution?.high || 0}</div>
              <div className="text-[10px] text-rose-500 font-medium">Risk Score ≥ 65</div>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
              <div className="text-[11px] font-mono text-slate-500 uppercase">ML Anomalies</div>
              <div className="text-xl font-bold font-mono text-amber-600 mt-1">{summaryData.anomaly_count || 0}</div>
              <div className="text-[10px] text-amber-600 font-medium">IsolationForest &ge; 0.5</div>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
              <div className="text-[11px] font-mono text-slate-500 uppercase">Active Cases</div>
              <div className="text-xl font-bold font-mono text-indigo-600 mt-1">{summaryData.total_cases || 0}</div>
              <div className="text-[10px] text-indigo-500 font-medium">Audit Queue</div>
            </div>
          </div>
        </motion.div>
      )}

      {/* National Parliamentary Stats Ribbon */}
      <motion.div
        variants={itemVariants}
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
      >
        <motion.div
          whileHover={{ y: -3 }}
          className="bg-white p-5 rounded-2xl border border-ledger-line shadow-xs hover:shadow-md transition-all"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-sans text-ink-grey uppercase font-semibold">Total Lok Sabha Seats</span>
            <Users className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-2xl font-mono font-bold text-ledger-navy">
            543 MPs
          </div>
          <div className="text-[11px] text-slate-500 font-sans mt-1">18th Lok Sabha Representatives</div>
        </motion.div>

        <motion.div
          whileHover={{ y: -3 }}
          className="bg-white p-5 rounded-2xl border border-ledger-line shadow-xs hover:shadow-md transition-all"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-sans text-ink-grey uppercase font-semibold">Annual Entitlement Cap</span>
            <Building2 className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-mono font-bold text-amber-700">
            {RUPEE}5.00 Cr / Year
          </div>
          <div className="text-[11px] text-slate-500 font-sans mt-1">{RUPEE}2.5 Cr per installment (BR-01)</div>
        </motion.div>

        <motion.div
          whileHover={{ y: -3 }}
          className="bg-white p-5 rounded-2xl border border-ledger-line shadow-xs hover:shadow-md transition-all"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-sans text-ink-grey uppercase font-semibold">National Coverage</span>
            <Compass className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-mono font-bold text-emerald-700">
            28 States &middot; 8 UTs
          </div>
          <div className="text-[11px] text-slate-500 font-sans mt-1">100% Pan-India Territorial Coverage</div>
        </motion.div>

        <motion.div
          whileHover={{ y: -3 }}
          className="bg-white p-5 rounded-2xl border border-ledger-line shadow-xs hover:shadow-md transition-all"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-sans text-ink-grey uppercase font-semibold">SC/ST Spend Mandate</span>
            <ShieldCheck className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="text-2xl font-mono font-bold text-ledger-navy">
            15% SC &middot; 7.5% ST
          </div>
          <div className="text-[11px] text-slate-500 font-sans mt-1">Statutory Social Justice Norm (BR-03)</div>
        </motion.div>
      </motion.div>

      {/* State-Level Geographic Map Section */}
      <motion.section id="heatmap-section" variants={itemVariants} className="space-y-4">
        <IndiaMap />
      </motion.section>

      {/* State-Wise Directory Section */}
      <motion.section id="states-directory" variants={itemVariants} className="space-y-4">
        <div className="bg-white rounded-2xl border border-ledger-line shadow-xs overflow-hidden">
          <div className="p-6 border-b border-ledger-line bg-slate-50 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h2 className="font-serif font-bold text-xl text-ledger-navy">
                State &amp; Union Territory Directory (All 28 States &amp; 8 UTs)
              </h2>
              <p className="text-xs text-slate-600 font-sans mt-0.5">
                Select any State or Territory to view the complete roster of elected MPs and their local area development initiatives.
              </p>
            </div>

            <div className="relative max-w-xs w-full">
              <input
                type="text"
                placeholder="Search state name or capital..."
                value={tableSearch}
                onChange={(e) => setTableSearch(e.target.value)}
                className="w-full p-2.5 pl-8 text-xs border border-slate-300 rounded-xl bg-white font-sans focus:outline-none focus:ring-1 focus:ring-amber-500 shadow-xs"
              />
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-3" />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm font-sans">
              <thead className="bg-slate-100 text-slate-700 font-mono text-xs uppercase border-b border-ledger-line">
                <tr>
                  <th className="py-3.5 px-4">State / Union Territory</th>
                  <th className="py-3.5 px-4">Capital / HQ</th>
                  <th className="py-3.5 px-4">Lok Sabha Parliamentary Seats</th>
                  <th className="py-3.5 px-4">Active Term</th>
                  <th className="py-3.5 px-4 text-right">Explore Directory</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ledger-line">
                {filteredStates.map((st, idx) => (
                  <motion.tr
                    key={idx}
                    whileHover={{ backgroundColor: '#F8FAFC' }}
                    className="transition-colors group"
                  >
                    <td className="py-3.5 px-4 font-semibold text-ledger-navy">
                      <Link
                        to={`/states/${encodeURIComponent(st.state)}`}
                        className="hover:text-amber-600 transition-colors"
                      >
                        {st.state}
                      </Link>
                    </td>
                    <td className="py-3.5 px-4 text-slate-600 font-medium">{st.capital}</td>
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-800">
                      {st.mps_count} Constituencies
                    </td>
                    <td className="py-3.5 px-4 font-mono text-xs text-slate-500">
                      <span className="px-2 py-0.5 bg-slate-100 rounded border border-slate-200">
                        {st.lok_sabha_term}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <Link
                        to={`/states/${encodeURIComponent(st.state)}`}
                        className="text-xs font-bold text-ledger-navy group-hover:text-amber-600 transition-colors inline-flex items-center gap-1"
                      >
                        View MPs &rarr;
                      </Link>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </motion.section>
    </motion.div>
  );
};