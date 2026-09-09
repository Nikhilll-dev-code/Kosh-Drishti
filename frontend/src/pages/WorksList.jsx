import React, { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { getApiUrl } from '../config/api';
import { motion } from 'framer-motion';
import { Breadcrumb } from '../components/Breadcrumb';
import { DisclaimerBanner } from '../components/DisclaimerBanner';
import { ALL_INDIAN_STATES } from '../data/realParliamentData';
import {
  ArrowRight,
  Filter,
  Search,
  ChevronLeft,
  ChevronRight,
  FileSpreadsheet,
  Download,
  Building2,
  FolderOpen
} from 'lucide-react';

const containerVariants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.05 } }
};

const itemVariants = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.3 } }
};

export const WorksList = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [works, setWorks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, limit: 50, total: 0, total_pages: 1 });

  const searchQuery = searchParams.get('search') || '';
  const [localSearch, setLocalSearch] = useState(searchQuery);
  const [stateFilter, setStateFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');

  useEffect(() => {
    fetchWorks();
  }, [searchQuery, stateFilter, categoryFilter, pagination.page]);

  const fetchWorks = () => {
    let url = `/api/works?page=${pagination.page}&limit=50&`;
    if (searchQuery) url += `search=${encodeURIComponent(searchQuery)}&`;
    if (stateFilter) url += `state=${encodeURIComponent(stateFilter)}&`;
    if (categoryFilter) url += `category=${encodeURIComponent(categoryFilter)}&`;

    fetch(getApiUrl(url))
      .then((res) => res.json())
      .then((d) => {
        setWorks(d?.works || []);
        setPagination({
          page: d?.page || 1,
          limit: d?.limit || 50,
          total: d?.total || 0,
          total_pages: d?.total_pages || 1
        });
        setLoading(false);
      })
      .catch(() => {
        setWorks([]);
        setLoading(false);
      });
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setSearchParams(localSearch.trim() ? { search: localSearch.trim() } : {});
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6"
    >
      <Breadcrumb items={[{ label: 'All MPLADS Works Directory' }]} />

      <DisclaimerBanner />

      {/* Header & Filter Controls */}
      <motion.div
        variants={itemVariants}
        className="bg-white p-6 sm:p-8 rounded-2xl border border-ledger-line shadow-xs space-y-4"
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <span className="text-[11px] font-mono font-bold text-slate-500 uppercase tracking-wide">
              PARLIAMENTARY EXPENDITURE DIRECTORY
            </span>
            <h1 className="text-2xl sm:text-3xl font-serif font-bold text-ledger-navy mt-0.5">
              MPLADS Sanctioned Works Directory
            </h1>
            <p className="text-xs text-slate-600 font-sans mt-1">
              Search and filter across parliamentary constituencies (SRS FR-DASH-06).
            </p>
          </div>

          <form onSubmit={handleSearchSubmit} className="relative max-w-sm w-full">
            <input
              type="text"
              placeholder="Search work ID, MP, district, description..."
              value={localSearch}
              onChange={(e) => setLocalSearch(e.target.value)}
              className="w-full p-2.5 pl-9 text-xs border border-slate-300 rounded-xl bg-slate-50 font-sans focus:ring-1 focus:ring-amber-500 focus:outline-none"
            />
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          </form>
        </div>

        {/* Filter Bar */}
        <div className="flex flex-wrap items-center gap-3 pt-3 border-t border-slate-100 text-xs font-sans">
          <div className="flex items-center gap-1.5 text-slate-700">
            <Filter className="w-4 h-4 text-slate-500" />
            <span className="font-semibold">Filter:</span>
          </div>

          <select
            value={stateFilter}
            onChange={(e) => setStateFilter(e.target.value)}
            className="p-2 border border-slate-300 rounded-lg bg-slate-50 font-sans text-xs focus:ring-1 focus:ring-amber-500"
          >
            <option value="">All States / UTs</option>
            {ALL_INDIAN_STATES.map((s) => (
              <option key={s.state} value={s.state}>{s.state}</option>
            ))}
          </select>

          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="p-2 border border-slate-300 rounded-lg bg-slate-50 font-sans text-xs focus:ring-1 focus:ring-amber-500"
          >
            <option value="">All Categories</option>
            <option value="Drinking Water">Drinking Water</option>
            <option value="Education">Education</option>
            <option value="Roads & Bridges">Roads &amp; Bridges</option>
            <option value="Community Infrastructure">Community Infrastructure</option>
          </select>

          {(stateFilter || categoryFilter || searchQuery) && (
            <button
              onClick={() => {
                setStateFilter('');
                setCategoryFilter('');
                setLocalSearch('');
                setSearchParams({});
              }}
              className="text-xs text-amber-700 hover:underline font-semibold ml-auto"
            >
              Reset Filters
            </button>
          )}
        </div>
      </motion.div>

      {/* Works Table */}
      <motion.div
        variants={itemVariants}
        className="bg-white rounded-2xl border border-ledger-line shadow-xs overflow-hidden"
      >
        <div className="p-5 border-b border-ledger-line bg-slate-50 flex items-center justify-between">
          <h2 className="font-serif font-bold text-base text-ledger-navy">
            Registered Works Ledger ({pagination.total} Records)
          </h2>
          <span className="text-xs font-mono text-slate-500">
            Page {pagination.page} of {pagination.total_pages}
          </span>
        </div>

        {works.length === 0 ? (
          <div className="py-16 px-6 text-center space-y-3">
            <div className="w-12 h-12 bg-slate-100 text-slate-400 rounded-full flex items-center justify-center mx-auto">
              <FolderOpen className="w-6 h-6" />
            </div>
            <div className="font-serif font-bold text-base text-slate-700">
              {loading ? 'Connecting to Works Database...' : 'No Work Sanctions Available'}
            </div>
            <p className="text-xs text-slate-500 font-sans max-w-md mx-auto">
              {loading
                ? 'Retrieving live records...'
                : 'Upload or refresh the public MPLADS dataset via the Admin Data Ingestion Panel to populate records.'}
            </p>
            {!loading && (
              <div className="pt-2">
                <Link
                  to="/admin"
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-ledger-navy text-white text-xs font-semibold rounded-lg hover:bg-slate-800 transition-colors"
                >
                  Go to Data Ingestion &rarr;
                </Link>
              </div>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm font-sans">
              <thead className="bg-slate-100 text-slate-700 font-mono text-xs uppercase border-b border-ledger-line">
                <tr>
                  <th className="py-3 px-4">Work ID</th>
                  <th className="py-3 px-4">State</th>
                  <th className="py-3 px-4">Title / Description</th>
                  <th className="py-3 px-4">Sanctioned Amount</th>
                  <th className="py-3 px-4">Risk &amp; ML Status</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ledger-line">
                {works.map((w, idx) => {
                  const riskTier = w.risk_tier || (w.composite_risk >= 65 ? 'HIGH' : w.composite_risk >= 40 ? 'MEDIUM' : 'LOW');
                  const badgeStyle = riskTier === 'HIGH'
                    ? 'bg-rose-100 text-rose-800 border-rose-200'
                    : riskTier === 'MEDIUM'
                    ? 'bg-amber-100 text-amber-800 border-amber-200'
                    : 'bg-emerald-100 text-emerald-800 border-emerald-200';

                  return (
                    <tr key={idx} className="hover:bg-slate-50 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-ledger-navy">
                        <div>{w.work_id}</div>
                        <span className="text-[9px] px-1.5 py-0.5 rounded bg-slate-100 font-mono text-slate-500 border border-slate-200">
                          {w.source === 'DEMO_SEED_WORK' ? 'DEMO SEED' : 'WORK ITEM'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-700 font-medium">{w.state}</td>
                      <td className="py-3 px-4 max-w-xs text-slate-800 truncate" title={w.title || w.description}>
                        <div className="font-semibold text-slate-900 truncate">{w.title || w.description}</div>
                        <div className="text-[11px] text-slate-500">{w.category}</div>
                      </td>
                      <td className="py-3 px-4 font-mono font-medium">
                        ₹{(((w.sanctioned_amount || w.proposed_cost || 0)) / 100000).toFixed(2)} Lakhs
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1.5">
                          <span className={`px-2 py-0.5 text-xs font-mono font-bold rounded-md border ${badgeStyle}`}>
                            {riskTier} ({w.composite_risk || 0})
                          </span>
                          {w.anomaly_score >= 0.5 && (
                            <span className="px-1.5 py-0.5 text-[10px] bg-amber-50 text-amber-700 border border-amber-300 font-mono rounded" title="IsolationForest Outlier Flag">
                              ML Outlier
                            </span>
                          )}
                        </div>
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
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Controls */}
        {pagination.total > 0 && (
          <div className="p-4 bg-slate-50 border-t border-ledger-line flex items-center justify-between">
            <button
              disabled={pagination.page <= 1}
              onClick={() => setPagination((prev) => ({ ...prev, page: prev.page - 1 }))}
              className={`flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-lg border ${
                pagination.page <= 1
                  ? 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed'
                  : 'bg-white text-ledger-navy border-slate-300 hover:bg-slate-100'
              }`}
            >
              <ChevronLeft className="w-4 h-4" /> Previous
            </button>

            <span className="text-xs font-mono text-slate-600">
              Showing page {pagination.page} of {pagination.total_pages}
            </span>

            <button
              disabled={pagination.page >= pagination.total_pages}
              onClick={() => setPagination((prev) => ({ ...prev, page: prev.page + 1 }))}
              className={`flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-lg border ${
                pagination.page >= pagination.total_pages
                  ? 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed'
                  : 'bg-white text-ledger-navy border-slate-300 hover:bg-slate-100'
              }`}
            >
              Next <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
};
