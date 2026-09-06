import React, { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Breadcrumb } from '../components/Breadcrumb';
import { RiskChip } from '../components/RiskChip';
import { RuleBadge } from '../components/RuleBadge';
import { ArrowRight, Filter, Search, ChevronLeft, ChevronRight } from 'lucide-react';

export const WorksList = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [works, setWorks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, limit: 50, total: 0, total_pages: 1 });

  const searchQuery = searchParams.get('search') || '';
  const [stateFilter, setStateFilter] = useState('');
  const [riskBand, setRiskBand] = useState('');

  useEffect(() => {
    fetchWorks();
  }, [searchParams, stateFilter, riskBand, pagination.page]);

  const fetchWorks = () => {
    let url = `/api/works?page=${pagination.page}&limit=50&`;
    if (searchQuery) url += `search=${encodeURIComponent(searchQuery)}&`;
    if (stateFilter) url += `state=${encodeURIComponent(stateFilter)}&`;
    if (riskBand) url += `risk_band=${riskBand}&`;

    fetch(url)
      .then(res => res.json())
      .then(d => {
        setWorks(d.works || []);
        setPagination({
          page: d.page,
          limit: d.limit,
          total: d.total,
          total_pages: d.total_pages
        });
        setLoading(false);
      })
      .catch(err => {
        console.error('Error fetching works:', err);
        setLoading(false);
      });
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Breadcrumb items={[{ label: 'All MPLADS Works' }]} />

      <div className="bg-white p-6 rounded-lg border border-ledger-line shadow-xs mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-serif font-bold text-ledger-navy">
            MPLADS Sanctioned Works Directory
          </h1>
          <p className="text-xs text-slate-600 font-sans mt-1">
            Displaying {pagination.total} registered works across all Lok Sabha constituencies. Paginated max 100 rows per page (SRS FR-DASH-06).
          </p>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3">
          <select
            value={riskBand}
            onChange={e => setRiskBand(e.target.value)}
            className="text-xs font-mono text-slate-800 bg-slate-50 border border-slate-300 rounded px-2.5 py-1.5"
          >
            <option value="">All Risk Bands</option>
            <option value="High">High Risk (≥65)</option>
            <option value="Medium">Medium Risk (40-64)</option>
            <option value="Low">Low Risk (&lt;40)</option>
          </select>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-ledger-line shadow-xs overflow-hidden">
        <div className="p-4 border-b border-ledger-line bg-slate-50 flex items-center justify-between">
          <h2 className="font-serif font-semibold text-lg text-ledger-navy">
            Works Listing ({pagination.total})
          </h2>
          <span className="text-xs text-slate-500 font-mono">
            Page {pagination.page} of {pagination.total_pages}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm font-sans">
            <thead className="bg-slate-100 text-slate-700 font-mono text-xs uppercase border-b border-ledger-line">
              <tr>
                <th className="py-3 px-4">Work ID</th>
                <th className="py-3 px-4">State</th>
                <th className="py-3 px-4">Description</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Sanctioned Amount</th>
                <th className="py-3 px-4">Triggered Rules</th>
                <th className="py-3 px-4">Risk Score</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ledger-line">
              {loading ? (
                <tr><td colSpan="8" className="py-8 text-center text-slate-500 text-xs font-mono animate-pulse">Loading works directory...</td></tr>
              ) : works.length === 0 ? (
                <tr><td colSpan="8" className="py-8 text-center text-slate-500 text-xs font-mono">No works match the filter query.</td></tr>
              ) : (
                works.map((w, idx) => (
                  <tr key={idx} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-ledger-navy">{w.work_id}</td>
                    <td className="py-3 px-4 text-slate-700 font-medium">{w.state}</td>
                    <td className="py-3 px-4 max-w-xs text-slate-800 truncate" title={w.description}>
                      {w.description}
                    </td>
                    <td className="py-3 px-4 text-xs font-medium text-slate-600">{w.category}</td>
                    <td className="py-3 px-4 font-mono font-medium">₹{(w.sanctioned_amount / 100000).toFixed(2)} Lakhs</td>
                    <td className="py-3 px-4">
                      <div className="flex flex-wrap gap-1">
                        {w.rule_flags?.map((rf, rIdx) => <RuleBadge key={rIdx} code={rf} />)}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <RiskChip score={w.composite_risk} />
                    </td>
                    <td className="py-3 px-4 text-right">
                      <Link
                        to={`/works/${w.work_id}`}
                        className="text-xs font-semibold text-ledger-navy hover:text-amber-600 transition-colors inline-flex items-center gap-1"
                      >
                        Audit Details <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls (SRS FR-DASH-06) */}
        <div className="p-4 bg-slate-50 border-t border-ledger-line flex items-center justify-between">
          <button
            disabled={pagination.page <= 1}
            onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
            className={`flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded border ${
              pagination.page <= 1 ? 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed' : 'bg-white text-ledger-navy border-ledger-line hover:bg-slate-100'
            }`}
          >
            <ChevronLeft className="w-4 h-4" /> Previous
          </button>

          <span className="text-xs font-mono text-slate-600">
            Showing page {pagination.page} of {pagination.total_pages}
          </span>

          <button
            disabled={pagination.page >= pagination.total_pages}
            onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
            className={`flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded border ${
              pagination.page >= pagination.total_pages ? 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed' : 'bg-white text-ledger-navy border-ledger-line hover:bg-slate-100'
            }`}
          >
            Next <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
