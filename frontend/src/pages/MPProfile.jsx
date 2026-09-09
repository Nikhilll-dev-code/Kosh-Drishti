import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getApiUrl } from '../config/api';
import { motion } from 'framer-motion';
import { Breadcrumb } from '../components/Breadcrumb';
import { DisclaimerBanner } from '../components/DisclaimerBanner';
import { getMPById, CURRENT_LOK_SABHA_MPS } from '../data/realParliamentData';
import {
  User,
  ShieldCheck,
  FileSpreadsheet,
  AlertCircle,
  TrendingUp,
  Wallet,
  Coins,
  CheckCircle2,
  PieChart,
  Layers,
  ArrowRight,
  Info
} from 'lucide-react';

const containerVariants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.08 } }
};

const itemVariants = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.35 } }
};

export const MPProfile = () => {
  const { mp_id } = useParams();
  const [mpData, setMpData] = useState(null);
  const [works, setWorks] = useState([]);
  const [mospiRecord, setMospiRecord] = useState(null);
  const [flaggedCount, setFlaggedCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Find real MP by id or matching constituency
    const matched = getMPById(mp_id) || CURRENT_LOK_SABHA_MPS.find(m => m.mp_id === mp_id) || CURRENT_LOK_SABHA_MPS[0];
    setMpData(matched);

    // Fetch live MP profile & works from API
    fetch(getApiUrl(`/api/mps/${mp_id}`))
      .then((res) => res.json())
      .then((d) => {
        if (d) {
          if (d.works) setWorks(d.works);
          if (d.mospi_financial_record) setMospiRecord(d.mospi_financial_record);
          if (d.flagged_works_count !== undefined) setFlaggedCount(d.flagged_works_count);
          setMpData((prev) => ({ ...prev, ...d }));
        }
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
      });
  }, [mp_id]);

  if (!mpData || loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8 animate-pulse space-y-4">
        <div className="h-6 bg-slate-200 w-1/4 rounded"></div>
        <div className="h-48 bg-slate-200 rounded-xl"></div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="h-32 bg-slate-200 rounded-xl"></div>
          <div className="h-32 bg-slate-200 rounded-xl"></div>
          <div className="h-32 bg-slate-200 rounded-xl"></div>
        </div>
      </div>
    );
  }

  // Calculate highest risk score among works for summary
  const highestRiskWork = works.length > 0
    ? [...works].sort((a, b) => b.composite_risk - a.composite_risk)[0]
    : null;
  const maxRiskScore = highestRiskWork ? highestRiskWork.composite_risk : 15;

  const getRiskTier = (score) => {
    if (score >= 65) return { label: 'HIGH RISK', bg: 'bg-rose-100 text-rose-800 border-rose-300' };
    if (score >= 40) return { label: 'MEDIUM RISK', bg: 'bg-amber-100 text-amber-800 border-amber-300' };
    return { label: 'LOW RISK', bg: 'bg-emerald-100 text-emerald-800 border-emerald-300' };
  };

  const riskTier = getRiskTier(maxRiskScore);

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6"
    >
      <Breadcrumb
        items={[
          { label: mpData.state, link: `/states/${encodeURIComponent(mpData.state || '')}` },
          { label: `${mpData.name} (${mpData.constituency})` }
        ]}
      />

      <DisclaimerBanner />

      {/* MP Profile Header Banner */}
      <motion.div
        variants={itemVariants}
        className="bg-white p-6 sm:p-8 rounded-3xl border border-ledger-line shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-6"
      >
        <div className="flex items-start gap-4">
          <div className="p-4 bg-gradient-to-br from-slate-100 to-slate-200 text-ledger-navy rounded-2xl border border-slate-300 shadow-sm shrink-0">
            <User className="w-10 h-10" />
          </div>
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2.5">
              <h1 className="text-2xl sm:text-3xl font-serif font-bold text-ledger-navy">
                {mpData.name}
              </h1>
              <span className="text-xs font-mono font-bold bg-slate-100 text-slate-800 px-2.5 py-0.5 rounded-md border border-slate-300">
                {mpData.party}
              </span>
              <span className={`text-xs font-mono font-bold px-2.5 py-0.5 rounded-md border ${riskTier.bg}`}>
                {riskTier.label} ({maxRiskScore}/100)
              </span>
            </div>
            <div className="text-xs sm:text-sm text-slate-600 font-sans">
              Elected Member of Parliament for <span className="font-semibold text-slate-900">{mpData.constituency}</span>, {mpData.state} &middot; <span className="font-mono">{mpData.lok_sabha_term}</span>
            </div>

            {/* Scheme Norms Badge */}
            <div className="mt-3 flex flex-wrap items-center gap-3 text-xs font-mono">
              <div className="flex items-center gap-1.5 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span className="text-slate-600">Annual Scheme Entitlement:</span>
                <span className="font-bold text-slate-900">₹5.00 Crore / Year (Statutory Norm)</span>
              </div>
            </div>
          </div>
        </div>

        {/* Dynamic Quick Summary */}
        <div className="border-t lg:border-t-0 lg:border-l border-slate-200 pt-4 lg:pt-0 lg:pl-8 font-mono text-xs space-y-2">
          <div>
            <div className="text-slate-500 text-[10px] uppercase font-bold tracking-wider">Demo Work Records</div>
            <div className="text-xl font-bold text-ledger-navy">{works.length} Works Loaded</div>
          </div>
          <div>
            <div className="text-slate-500 text-[10px] uppercase font-bold tracking-wider">Audit Screening Status</div>
            <div className="text-sm font-bold text-amber-700">{flaggedCount} Flagged (Risk ≥ 40)</div>
          </div>
        </div>
      </motion.div>

      {/* Current MP vs MoSPI Dataset Record Note */}
      {mospiRecord && mospiRecord.mp_name && mospiRecord.mp_name.toLowerCase() !== mpData.name.toLowerCase() && (
        <motion.div
          variants={itemVariants}
          className="bg-amber-50/90 border border-amber-300/80 p-4 sm:p-5 rounded-2xl flex items-start gap-3.5 text-xs text-amber-950 font-sans shadow-xs"
        >
          <Info className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="space-y-1 leading-relaxed">
            <span className="font-bold font-serif text-sm block text-amber-950">
              MoSPI Source Dataset Reference Note
            </span>
            <p>
              The current elected MP for <strong>{mpData.constituency} ({mpData.lok_sabha_term})</strong> is <strong>{mpData.name}</strong>.
              The financial figures presented below are extracted from the official MoSPI aggregate dataset record for <strong>{mospiRecord.mp_name}</strong> ({mospiRecord.constituency}).
              Historical financial figures reflect past fund allocations and expenditures recorded in the source MoSPI database for this constituency pool.
            </p>
          </div>
        </motion.div>
      )}

      {/* Section 1: FUNDING (MoSPI Aggregate Dataset) */}
      {mospiRecord && (
        <motion.div variants={itemVariants} className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-serif font-bold text-lg text-ledger-navy flex items-center gap-2">
              <Wallet className="w-5 h-5 text-emerald-600" />
              Funding Overview
            </h2>
            <span className="text-[11px] font-mono bg-emerald-50 text-emerald-800 border border-emerald-200 px-2.5 py-1 rounded-md">
              MoSPI Real Public Aggregate Dataset
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Total Entitlement */}
            <div className="bg-white p-5 rounded-2xl border border-ledger-line shadow-xs space-y-1">
              <div className="text-xs font-sans text-slate-500 font-medium">Total Entitlement</div>
              <div className="text-2xl font-serif font-bold text-ledger-navy">
                ₹{mospiRecord.entitlement.toFixed(2)} Cr
              </div>
              <div className="text-[11px] text-slate-500 font-sans border-t border-slate-100 pt-1.5 mt-2">
                Cumulative entitlement pool in source dataset
              </div>
            </div>

            {/* GOI Funds Released */}
            <div className="bg-white p-5 rounded-2xl border border-ledger-line shadow-xs space-y-1">
              <div className="text-xs font-sans text-slate-500 font-medium">GOI Funds Released</div>
              <div className="text-2xl font-serif font-bold text-emerald-700">
                ₹{mospiRecord.fund_received_goi.toFixed(2)} Cr
              </div>
              <div className="text-[11px] text-slate-500 font-sans border-t border-slate-100 pt-1.5 mt-2">
                Total funds released by Government of India
              </div>
            </div>

            {/* Amount Available */}
            <div className="bg-white p-5 rounded-2xl border border-ledger-line shadow-xs space-y-1">
              <div className="text-xs font-sans text-slate-500 font-medium">Amount Available</div>
              <div className="text-2xl font-serif font-bold text-sky-700">
                ₹{mospiRecord.amount_available.toFixed(2)} Cr
              </div>
              <div className="text-[11px] text-slate-500 font-sans border-t border-slate-100 pt-1.5 mt-2">
                Total available balance (release + interest)
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Section 2: WORKS & EXPENDITURE (MoSPI Aggregate Dataset) */}
      {mospiRecord && (
        <motion.div variants={itemVariants} className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-serif font-bold text-lg text-ledger-navy flex items-center gap-2">
              <Coins className="w-5 h-5 text-sky-600" />
              Works &amp; Expenditure Breakdown
            </h2>
            <span className="text-[11px] font-mono bg-sky-50 text-sky-800 border border-sky-200 px-2.5 py-1 rounded-md">
              MoSPI Real Public Aggregate Dataset
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Recommended Works Cost */}
            <div className="bg-white p-5 rounded-2xl border border-ledger-line shadow-xs space-y-1">
              <div className="text-xs font-sans text-slate-500 font-medium">Recommended Works Cost</div>
              <div className="text-xl font-serif font-bold text-slate-900">
                ₹{mospiRecord.works_recomm_cost.toFixed(2)} Cr
              </div>
              <div className="text-[11px] text-slate-500 font-sans border-t border-slate-100 pt-1.5 mt-2">
                Total cost of works recommended by MP
              </div>
            </div>

            {/* Sanctioned Works Cost */}
            <div className="bg-white p-5 rounded-2xl border border-ledger-line shadow-xs space-y-1">
              <div className="text-xs font-sans text-slate-500 font-medium">Sanctioned Works Cost</div>
              <div className="text-xl font-serif font-bold text-slate-900">
                ₹{mospiRecord.ws_cost.toFixed(2)} Cr
              </div>
              <div className="text-[11px] text-slate-500 font-sans border-t border-slate-100 pt-1.5 mt-2">
                Total cost sanctioned by District Authority
              </div>
            </div>

            {/* Actual Expenditure */}
            <div className="bg-white p-5 rounded-2xl border border-ledger-line shadow-xs space-y-1">
              <div className="text-xs font-sans text-slate-500 font-medium">Actual Expenditure</div>
              <div className="text-xl font-serif font-bold text-emerald-700">
                ₹{mospiRecord.actual_expenditure.toFixed(2)} Cr
              </div>
              <div className="text-[11px] text-slate-500 font-sans border-t border-slate-100 pt-1.5 mt-2">
                Actual funds disbursed for executed works
              </div>
            </div>

            {/* Unspent Balance */}
            <div className="bg-white p-5 rounded-2xl border border-ledger-line shadow-xs space-y-1">
              <div className="text-xs font-sans text-slate-500 font-medium">Unspent Balance</div>
              <div className="text-xl font-serif font-bold text-amber-700">
                ₹{mospiRecord.unspent_balance.toFixed(2)} Cr
              </div>
              <div className="text-[11px] text-slate-500 font-sans border-t border-slate-100 pt-1.5 mt-2">
                Unutilized funds remaining in constituency pool
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Section 3: UTILIZATION & RISK INDICATORS */}
      {mospiRecord && (
        <motion.div variants={itemVariants} className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-serif font-bold text-lg text-ledger-navy flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-amber-600" />
              Utilization &amp; Risk Indicators
            </h2>
            <span className="text-[11px] font-mono bg-amber-50 text-amber-800 border border-amber-200 px-2.5 py-1 rounded-md">
              Audit Screening Indicators
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Utilization vs GOI Release */}
            <div className="bg-gradient-to-br from-white to-slate-50 p-5 rounded-2xl border border-ledger-line shadow-xs space-y-1">
              <div className="text-xs font-sans text-slate-600 font-semibold flex items-center justify-between">
                <span>Utilization vs GOI Release</span>
                <PieChart className="w-4 h-4 text-slate-400" />
              </div>
              <div className="text-3xl font-serif font-bold text-ledger-navy">
                {mospiRecord.utilization_over_release.toFixed(2)}%
              </div>
              <div className="text-[11px] text-slate-500 font-sans leading-normal border-t border-slate-200/60 pt-2 mt-2">
                Utilization vs GOI Release compares recorded expenditure with GOI funds released in the source dataset.
              </div>
            </div>

            {/* Works Count */}
            <div className="bg-gradient-to-br from-white to-slate-50 p-5 rounded-2xl border border-ledger-line shadow-xs space-y-1">
              <div className="text-xs font-sans text-slate-600 font-semibold flex items-center justify-between">
                <span>Demonstration Works Count</span>
                <Layers className="w-4 h-4 text-slate-400" />
              </div>
              <div className="text-3xl font-serif font-bold text-slate-800">
                {works.length}
              </div>
              <div className="text-[11px] text-slate-500 font-sans leading-normal border-t border-slate-200/60 pt-2 mt-2">
                Demonstration work records loaded for this constituency in prototype database.
              </div>
            </div>

            {/* Flagged Works */}
            <div className="bg-gradient-to-br from-white to-slate-50 p-5 rounded-2xl border border-ledger-line shadow-xs space-y-1">
              <div className="text-xs font-sans text-slate-600 font-semibold flex items-center justify-between">
                <span>Flagged Audit Cases</span>
                <AlertCircle className="w-4 h-4 text-amber-500" />
              </div>
              <div className="text-3xl font-serif font-bold text-amber-700">
                {flaggedCount}
              </div>
              <div className="text-[11px] text-slate-500 font-sans leading-normal border-t border-slate-200/60 pt-2 mt-2">
                Works with composite risk score ≥ 40 requiring human audit verification.
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Sanctioned Works Ledger Table */}
      <motion.div
        variants={itemVariants}
        className="bg-white rounded-2xl border border-ledger-line shadow-xs overflow-hidden"
      >
        <div className="p-6 border-b border-ledger-line bg-slate-50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-serif font-bold text-lg text-ledger-navy">
                Sanctioned Works Ledger for {mpData.name}
              </h2>
              <span className="text-[10px] font-mono font-bold bg-amber-100 text-amber-800 px-2 py-0.5 rounded border border-amber-300">
                Synthetic Demo Data
              </span>
            </div>
            <p className="text-xs text-slate-600 font-sans mt-0.5">
              Demonstration work records demonstrating R1–R6 deterministic rule checks &amp; Isolation Forest ML scoring.
            </p>
          </div>
          <span className="text-xs font-mono text-slate-500 shrink-0">{works.length} Works Recorded</span>
        </div>

        {works.length === 0 ? (
          <div className="py-16 px-6 text-center space-y-3">
            <div className="w-12 h-12 bg-slate-100 text-slate-400 rounded-full flex items-center justify-center mx-auto">
              <FileSpreadsheet className="w-6 h-6" />
            </div>
            <div className="font-serif font-bold text-base text-slate-700">
              No Work Sanction Records Loaded Yet
            </div>
            <p className="text-xs text-slate-500 font-sans max-w-md mx-auto">
              Sanctioned works will appear here automatically when demonstration work CSV records are ingested in the Admin Panel.
            </p>
            <div className="pt-2">
              <Link
                to="/admin"
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-ledger-navy text-white text-xs font-semibold rounded-lg hover:bg-slate-800 transition-colors"
              >
                Go to Ingestion Panel &rarr;
              </Link>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm font-sans">
              <thead className="bg-slate-100 text-slate-700 font-mono text-xs uppercase border-b border-ledger-line">
                <tr>
                  <th className="py-3 px-4">Work ID</th>
                  <th className="py-3 px-4">Description</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Sanctioned Cost</th>
                  <th className="py-3 px-4">Risk Score</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ledger-line">
                {works.map((w, idx) => {
                  const riskInfo = getRiskTier(w.composite_risk || 0);
                  return (
                    <tr key={idx} className="hover:bg-slate-50 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-ledger-navy">
                        <div className="flex items-center gap-2">
                          <span>{w.work_id}</span>
                          <span className="text-[9px] font-mono bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded border border-slate-200">
                            DEMO
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-slate-800 max-w-md">{w.description || w.title}</td>
                      <td className="py-3 px-4 text-xs font-medium text-slate-600">{w.category}</td>
                      <td className="py-3 px-4 font-mono font-medium">₹{((w.sanctioned_amount || w.proposed_cost || 0) / 100000).toFixed(2)} Lakhs</td>
                      <td className="py-3 px-4">
                        <span className={`text-xs font-mono font-bold px-2 py-0.5 rounded border ${riskInfo.bg}`}>
                          {w.composite_risk || 0}/100 ({riskInfo.label})
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <Link
                          to={`/works/${w.work_id}`}
                          className="text-xs font-semibold text-ledger-navy hover:text-amber-600 transition-colors inline-flex items-center gap-1"
                        >
                          Inspect Details &rarr;
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
};
