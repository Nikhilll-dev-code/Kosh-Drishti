import React, { useEffect, useState, useContext } from 'react';
import { Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { Breadcrumb } from '../components/Breadcrumb';
import { RiskChip } from '../components/RiskChip';
import { RuleBadge } from '../components/RuleBadge';
import { CheckSquare, ArrowRight, Filter, ShieldAlert } from 'lucide-react';

export const CaseQueue = () => {
  const { user, token } = useContext(AuthContext);
  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('All');
  const [assignedFilter, setAssignedFilter] = useState('all');

  useEffect(() => {
    fetchCases();
  }, [statusFilter, assignedFilter]);

  const fetchCases = () => {
    let url = `/api/cases?`;
    if (statusFilter !== 'All') url += `status=${statusFilter}&`;
    if (assignedFilter === 'me') url += `assigned=me`;

    fetch(url, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(d => {
        setCases(d);
        setLoading(false);
      })
      .catch(err => {
        console.error('Error fetching cases:', err);
        setLoading(false);
      });
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8 animate-pulse space-y-4">
        <div className="h-6 bg-slate-200 w-1/4 rounded"></div>
        <div className="h-64 bg-slate-200 rounded"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Breadcrumb items={[{ label: 'Auditor Case Queue' }]} />

      <div className="bg-white p-6 rounded-lg border border-ledger-line shadow-xs mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-serif font-bold text-ledger-navy flex items-center gap-2">
            <CheckSquare className="w-6 h-6 text-amber-600" />
            Auditor Case Queue & Investigation Workspace
          </h1>
          <p className="text-xs text-slate-600 font-sans mt-1">
            Manage flagged works requiring formal audit review. Assigned to: <span className="font-semibold">{user?.name}</span> ({user?.role}).
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-slate-50 p-2 rounded border border-slate-200">
            <Filter className="w-4 h-4 text-slate-500" />
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="text-xs font-mono font-medium text-slate-800 bg-white border border-slate-300 rounded px-2 py-1"
            >
              <option value="All">All Statuses</option>
              <option value="New">New</option>
              <option value="Under Review">Under Review</option>
              <option value="Resolved">Resolved</option>
              <option value="Escalated">Escalated</option>
            </select>

            <select
              value={assignedFilter}
              onChange={e => setAssignedFilter(e.target.value)}
              className="text-xs font-sans font-medium text-slate-800 bg-white border border-slate-300 rounded px-2 py-1"
            >
              <option value="all">All Cases</option>
              <option value="me">Assigned to Me</option>
            </select>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-ledger-line shadow-xs overflow-hidden">
        <div className="p-4 border-b border-ledger-line bg-slate-50 flex items-center justify-between">
          <h2 className="font-serif font-semibold text-lg text-ledger-navy">
            Flagged Cases ({cases.length})
          </h2>
          <span className="text-xs text-slate-500 font-mono">Sorted by Composite Risk Descending</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm font-sans">
            <thead className="bg-slate-100 text-slate-700 font-mono text-xs uppercase border-b border-ledger-line">
              <tr>
                <th className="py-3 px-4">Case ID</th>
                <th className="py-3 px-4">Work ID</th>
                <th className="py-3 px-4">State</th>
                <th className="py-3 px-4">Sanctioned Amount</th>
                <th className="py-3 px-4">Triggered Rules</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Risk Score</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ledger-line">
              {cases.length === 0 ? (
                <tr>
                  <td colSpan="8" className="py-8 text-center text-slate-500 text-xs font-mono">
                    No cases match the selected filter.
                  </td>
                </tr>
              ) : (
                cases.map((c, idx) => (
                  <tr key={idx} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-ledger-navy">{c.case_id}</td>
                    <td className="py-3 px-4 font-mono font-semibold text-slate-800">{c.work_id}</td>
                    <td className="py-3 px-4 text-slate-700">{c.state}</td>
                    <td className="py-3 px-4 font-mono font-medium">₹{(c.sanctioned_amount / 100000).toFixed(2)} Lakhs</td>
                    <td className="py-3 px-4">
                      <div className="flex flex-wrap gap-1">
                        {c.rule_flags?.map((rf, rIdx) => <RuleBadge key={rIdx} code={rf} />)}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`inline-block px-2.5 py-0.5 rounded text-xs font-mono font-bold ${
                        c.status === 'New' ? 'bg-amber-100 text-amber-800 border border-amber-300' :
                        c.status === 'Under Review' ? 'bg-indigo-100 text-indigo-800 border border-indigo-300' :
                        c.status === 'Escalated' ? 'bg-rose-100 text-rose-800 border border-rose-300' :
                        'bg-emerald-100 text-emerald-800 border border-emerald-300'
                      }`}>
                        {c.status}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <RiskChip score={c.composite_risk} />
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
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
