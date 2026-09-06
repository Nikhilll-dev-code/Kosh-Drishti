import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { IndiaMap } from '../components/IndiaMap';
import { DisclaimerBanner } from '../components/DisclaimerBanner';
import { ShieldAlert, IndianRupee, AlertTriangle, CheckCircle2, ArrowRight, Filter } from 'lucide-react';

export const Home = () => {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [yearFilter, setYearFilter] = useState('2023-24');
  const [categoryFilter, setCategoryFilter] = useState('All');

  useEffect(() => {
    fetch('/api/dashboard/summary')
      .then(res => res.json())
      .then(data => {
        setSummary(data);
        setLoading(false);
      })
      .catch(err => {
        console.error('Error fetching dashboard summary:', err);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-pulse space-y-6">
        <div className="h-10 bg-slate-200 rounded w-1/3"></div>
        <div className="h-96 bg-slate-300 rounded-lg"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <DisclaimerBanner />

      {/* Header & Filter Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-serif font-bold text-ledger-navy">
            Where Did Your MP's Fund Actually Go?
          </h1>
          <p className="text-sm text-slate-600 font-sans mt-1">
            Evidence-backed anomaly & fraud early warning system for Members of Parliament Local Area Development Scheme.
          </p>
        </div>

        <div className="flex items-center gap-3 bg-white p-2 rounded-md border border-ledger-line shadow-2xs">
          <Filter className="w-4 h-4 text-slate-500" />
          <select
            value={yearFilter}
            onChange={e => setYearFilter(e.target.value)}
            className="text-xs font-mono font-medium text-slate-800 bg-slate-50 border border-slate-300 rounded px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-amber-500"
          >
            <option value="2023-24">FY 2023-24</option>
            <option value="2022-23">FY 2022-23</option>
            <option value="2021-22">FY 2021-22</option>
          </select>

          <select
            value={categoryFilter}
            onChange={e => setCategoryFilter(e.target.value)}
            className="text-xs font-sans font-medium text-slate-800 bg-slate-50 border border-slate-300 rounded px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-amber-500"
          >
            <option value="All">All Categories</option>
            <option value="Drinking Water">Drinking Water</option>
            <option value="Education">Education</option>
            <option value="Roads & Bridges">Roads & Bridges</option>
            <option value="Community Infrastructure">Community Infrastructure</option>
          </select>
        </div>
      </div>

      {/* Hero Interactive India Choropleth Map */}
      <div className="mb-8">
        <IndiaMap stateAggregates={summary?.state_aggregates || []} />
      </div>

      {/* National KPI Summary Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-white p-5 rounded-lg border border-ledger-line shadow-xs">
          <div className="text-xs text-slate-500 font-sans font-medium mb-1 flex items-center gap-1.5">
            <IndianRupee className="w-4 h-4 text-emerald-600" /> Total Sanctioned Value
          </div>
          <div className="text-2xl font-mono font-bold text-ledger-navy">
            ₹{((summary?.total_sanctioned || 0) / 10000000).toFixed(2)} Cr
          </div>
          <div className="text-[11px] text-slate-500 mt-1 font-sans">
            Across {summary?.total_works || 0} registered works
          </div>
        </div>

        <div className="bg-white p-5 rounded-lg border border-ledger-line shadow-xs">
          <div className="text-xs text-slate-500 font-sans font-medium mb-1 flex items-center gap-1.5">
            <AlertTriangle className="w-4 h-4 text-amber-600" /> Unspent Entitlement
          </div>
          <div className="text-2xl font-mono font-bold text-amber-700">
            ₹{((summary?.unspent_funds || 0) / 10000000).toFixed(2)} Cr
          </div>
          <div className="text-[11px] text-slate-500 mt-1 font-sans">
            Non-lapsable funds lying unutilized
          </div>
        </div>

        <div className="bg-white p-5 rounded-lg border border-ledger-line shadow-xs">
          <div className="text-xs text-slate-500 font-sans font-medium mb-1 flex items-center gap-1.5">
            <ShieldAlert className="w-4 h-4 text-rose-600" /> High-Risk Flagged Works
          </div>
          <div className="text-2xl font-mono font-bold text-rose-700">
            {summary?.flagged_works_count || 0}
          </div>
          <div className="text-[11px] text-slate-500 mt-1 font-sans">
            Triggering R1–R6 rules or ML anomaly
          </div>
        </div>

        <div className="bg-white p-5 rounded-lg border border-ledger-line shadow-xs">
          <div className="text-xs text-slate-500 font-sans font-medium mb-1 flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-indigo-600" /> Top Audit Priority State
          </div>
          <div className="text-xl font-serif font-bold text-ledger-navy truncate">
            {summary?.top_risk_state || 'Gujarat'}
          </div>
          <Link to={`/states/${summary?.top_risk_state}`} className="text-xs text-indigo-600 hover:underline font-sans font-medium flex items-center gap-1 mt-1">
            Explore state breakdown <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
      </div>

      {/* State Risk Leaderboard */}
      <div className="bg-white rounded-lg border border-ledger-line shadow-xs overflow-hidden">
        <div className="p-4 border-b border-ledger-line bg-slate-50 flex items-center justify-between">
          <h2 className="font-serif font-semibold text-lg text-ledger-navy">
            State-Wise Compliance & Risk Ranking
          </h2>
          <span className="text-xs text-slate-500 font-mono">Sorted by Composite Risk Descending</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm font-sans">
            <thead className="bg-slate-100 text-slate-700 font-mono text-xs uppercase border-b border-ledger-line">
              <tr>
                <th className="py-3 px-4">State</th>
                <th className="py-3 px-4">Sanctioned Works</th>
                <th className="py-3 px-4">Total Sanctioned</th>
                <th className="py-3 px-4">High Risk Flags</th>
                <th className="py-3 px-4">Avg Composite Risk</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ledger-line">
              {summary?.state_aggregates?.map((st, idx) => (
                <tr key={idx} className="hover:bg-slate-50 transition-colors">
                  <td className="py-3 px-4 font-semibold text-ledger-navy">{st.state}</td>
                  <td className="py-3 px-4 font-mono">{st.work_count}</td>
                  <td className="py-3 px-4 font-mono">₹{(st.total_sanctioned / 100000).toFixed(2)} Lakhs</td>
                  <td className="py-3 px-4 font-mono font-semibold text-rose-700">{st.flagged_count}</td>
                  <td className="py-3 px-4">
                    <span className={`inline-flex items-center gap-1 font-mono font-medium px-2 py-0.5 rounded text-xs border ${
                      st.avg_risk >= 65 ? 'bg-rose-50 text-rose-800 border-rose-300' :
                      st.avg_risk >= 40 ? 'bg-amber-50 text-amber-800 border-amber-300' :
                      'bg-emerald-50 text-emerald-800 border-emerald-300'
                    }`}>
                      {st.avg_risk}/100 — {st.risk_level}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <Link
                      to={`/states/${encodeURIComponent(st.state)}`}
                      className="text-xs font-semibold text-ledger-navy hover:text-amber-600 transition-colors inline-flex items-center gap-1"
                    >
                      View MPs <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
