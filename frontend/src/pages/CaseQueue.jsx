import React, { useEffect, useState, useContext } from 'react';
import { Link } from 'react-router-dom';
import { getApiUrl } from '../config/api';
import { motion } from 'framer-motion';
import { AuthContext } from '../context/AuthContext';
import { Breadcrumb } from '../components/Breadcrumb';
import { DisclaimerBanner } from '../components/DisclaimerBanner';
import {
  CheckSquare,
  ArrowRight,
  Filter,
  Search,
  FolderOpen
} from 'lucide-react';

const containerVariants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.06 } }
};

const itemVariants = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.35 } }
};

export const CaseQueue = () => {
  const { user, token } = useContext(AuthContext);
  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchCases();
  }, [statusFilter]);

  const fetchCases = () => {
    let url = `/api/cases?`;
    if (statusFilter !== 'All') url += `status=${statusFilter}&`;

    fetch(getApiUrl(url), { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => res.json())
      .then((d) => {
        let list = Array.isArray(d) ? d : [];
        if (statusFilter !== 'All') {
          list = list.filter((c) => c.status === statusFilter);
        }
        setCases(list);
        setLoading(false);
      })
      .catch(() => {
        setCases([]);
        setLoading(false);
      });
  };

  const filteredCases = cases.filter(
    (c) =>
      c.work_id?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.case_id?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.state?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6"
    >
      <Breadcrumb items={[{ label: 'Auditor Case Queue' }]} />

      <DisclaimerBanner />

      {/* Workspace Header */}
      <motion.div
        variants={itemVariants}
        className="bg-white p-6 sm:p-8 rounded-2xl border border-ledger-line shadow-xs space-y-4"
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <span className="text-[11px] font-mono font-bold text-amber-700 uppercase tracking-wide">
              AUDIT CASE TRIAGE DESK
            </span>
            <h1 className="text-2xl sm:text-3xl font-serif font-bold text-ledger-navy flex items-center gap-2.5 mt-0.5">
              <CheckSquare className="w-7 h-7 text-amber-600" />
              Auditor Case Queue &amp; Investigation Workspace
            </h1>
            <p className="text-xs text-slate-600 font-sans mt-1">
              Active audit docket for <span className="font-semibold text-slate-900">{user?.name || 'Rekha Sharma'}</span> ({user?.role || 'Auditor'} &middot; {user?.department || 'District Authority'}).
            </p>
          </div>

          <div className="relative max-w-xs w-full">
            <input
              type="text"
              placeholder="Search case ID or work..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full p-2.5 pl-8 text-xs border border-slate-300 rounded-xl bg-slate-50 font-sans focus:ring-1 focus:ring-amber-500 focus:outline-none shadow-xs"
            />
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-3" />
          </div>
        </div>

        {/* Status Filter Tabs */}
        <div className="flex flex-wrap gap-2 pt-3 border-t border-slate-100 text-xs">
          {['All', 'New', 'Under Review', 'Escalated', 'Resolved'].map((tab) => (
            <button
              key={tab}
              onClick={() => setStatusFilter(tab)}
              className={`px-3.5 py-1.5 rounded-lg font-mono font-semibold transition-all ${
                statusFilter === tab
                  ? 'bg-ledger-navy text-white shadow-xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </motion.div>

      {/* Cases Table */}
      <motion.div
        variants={itemVariants}
        className="bg-white rounded-2xl border border-ledger-line shadow-xs overflow-hidden"
      >
        <div className="p-5 border-b border-ledger-line bg-slate-50 flex items-center justify-between">
          <h2 className="font-serif font-bold text-base text-ledger-navy">
            Flagged Cases ({filteredCases.length})
          </h2>
          <span className="text-xs font-mono text-slate-500">
            Case Status Filter: {statusFilter}
          </span>
        </div>

        {filteredCases.length === 0 ? (
          <div className="py-16 px-6 text-center space-y-3">
            <div className="w-12 h-12 bg-slate-100 text-slate-400 rounded-full flex items-center justify-center mx-auto">
              <FolderOpen className="w-6 h-6" />
            </div>
            <div className="font-serif font-bold text-base text-slate-700">
              No Cases in Queue
            </div>
            <p className="text-xs text-slate-500 font-sans max-w-md mx-auto">
              No audit cases currently match the selected status filter. New cases will appear here automatically upon dataset ingestion.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm font-sans">
              <thead className="bg-slate-100 text-slate-700 font-mono text-xs uppercase border-b border-ledger-line">
                <tr>
                  <th className="py-3 px-4">Case ID</th>
                  <th className="py-3 px-4">Work ID</th>
                  <th className="py-3 px-4">State</th>
                  <th className="py-3 px-4">Sanctioned Amount</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ledger-line">
                {filteredCases.map((c, idx) => (
                  <tr key={idx} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-ledger-navy">{c.case_id}</td>
                    <td className="py-3 px-4 font-mono font-semibold text-slate-800">{c.work_id}</td>
                    <td className="py-3 px-4 text-slate-700 font-medium">{c.state}</td>
                    <td className="py-3 px-4 font-mono font-medium">
                      ₹{((c.sanctioned_amount || 0) / 100000).toFixed(2)} Lakhs
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`inline-block px-2.5 py-1 rounded text-[11px] font-mono font-bold border ${
                          c.status === 'New'
                            ? 'bg-amber-50 text-amber-800 border-amber-300'
                            : c.status === 'Under Review'
                            ? 'bg-indigo-50 text-indigo-800 border-indigo-300'
                            : c.status === 'Escalated'
                            ? 'bg-red-50 text-alert-rust border-red-300'
                            : 'bg-emerald-50 text-emerald-800 border-emerald-300'
                        }`}
                      >
                        {c.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <Link
                        to={`/works/${c.work_id}`}
                        className="text-xs font-semibold text-ledger-navy hover:text-amber-600 transition-colors inline-flex items-center gap-1"
                      >
                        Review Case <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
};
