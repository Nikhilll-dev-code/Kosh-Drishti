import React, { useEffect, useState, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { Breadcrumb } from '../components/Breadcrumb';
import { Settings, Users, Database, FileText, Check, X, AlertCircle, CheckCircle2, Upload, RefreshCw } from 'lucide-react';

export const AdminPanel = () => {
  const { token } = useContext(AuthContext);
  const [activeTab, setActiveTab] = useState('users');

  // Admin states
  const [users, setUsers] = useState([]);
  const [ruleConfig, setRuleConfig] = useState(null);
  const [auditLogs, setAuditLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  // Ingestion states
  const [selectedFile, setSelectedFile] = useState(null);
  const [ingestMsg, setIngestMsg] = useState('');
  const [ingestError, setIngestError] = useState('');
  const [isIngesting, setIsIngesting] = useState(false);

  // Config edit state
  const [tenderThresh, setTenderThresh] = useState(5000000);
  const [configMsg, setConfigMsg] = useState('');
  const [configError, setConfigError] = useState('');

  useEffect(() => {
    fetchAdminData();
  }, [activeTab]);

  const fetchAdminData = () => {
    setLoading(true);
    const headers = { 'Authorization': `Bearer ${token}` };

    if (activeTab === 'users') {
      fetch('/api/admin/users', { headers })
        .then(res => res.json())
        .then(d => { setUsers(d); setLoading(false); });
    } else if (activeTab === 'config') {
      fetch('/api/admin/config', { headers })
        .then(res => res.json())
        .then(d => {
          setRuleConfig(d);
          setTenderThresh(d.r2_tender_threshold || 5000000);
          setLoading(false);
        });
    } else if (activeTab === 'audit') {
      fetch('/api/admin/audit-log', { headers })
        .then(res => res.json())
        .then(d => { setAuditLogs(d); setLoading(false); });
    } else {
      setLoading(false);
    }
  };

  const handleApproveUser = async (userId, action) => {
    try {
      const res = await fetch(`/api/admin/users/${userId}/approve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ action })
      });
      if (res.ok) {
        fetchAdminData();
      }
    } catch (err) {
      console.error('Error approving user:', err);
    }
  };

  const handleUpdateConfig = async (e) => {
    e.preventDefault();
    setConfigMsg('');
    setConfigError('');

    try {
      const res = await fetch('/api/admin/config', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          r2_tender_threshold: parseFloat(tenderThresh)
        })
      });

      const json = await res.json();
      if (!res.ok) {
        setConfigError(json.message || 'Error updating config');
      } else {
        setConfigMsg(json.message);
        // Trigger rescore
        fetch('/api/admin/re-score', {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}` }
        });
      }
    } catch (err) {
      setConfigError('Network error updating threshold config');
    }
  };

  const handleCSVUpload = async (e) => {
    e.preventDefault();
    if (!selectedFile) return;

    setIsIngesting(true);
    setIngestMsg('');
    setIngestError('');

    const formData = new FormData();
    formData.append('file', selectedFile);

    try {
      const res = await fetch('/api/ingest', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
      });

      const json = await res.json();
      if (!res.ok) {
        setIngestError(json.message || 'CSV Ingestion failed.');
      } else {
        setIngestMsg(`Successfully ingested ${json.rows_processed} rows (${json.rows_added} new works created).`);
        setSelectedFile(null);
      }
    } catch (err) {
      setIngestError('Network error during CSV ingestion.');
    } finally {
      setIsIngesting(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Breadcrumb items={[{ label: 'System Administration' }]} />

      <div className="bg-white p-6 rounded-lg border border-ledger-line shadow-xs mb-6">
        <h1 className="text-2xl font-serif font-bold text-ledger-navy flex items-center gap-2">
          <Settings className="w-6 h-6 text-amber-600" />
          Kosh-Drishti System Administration & Governance
        </h1>
        <p className="text-xs text-slate-600 font-sans mt-1">
          Manage user registrations, tune rule thresholds, ingest public dataset CSVs, and inspect audit logs.
        </p>

        {/* Tab Buttons */}
        <div className="flex flex-wrap gap-2 mt-6 border-b border-ledger-line pb-2">
          <button
            onClick={() => setActiveTab('users')}
            className={`flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-t transition-colors ${
              activeTab === 'users' ? 'bg-ledger-navy text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <Users className="w-4 h-4" /> User Approvals Queue
          </button>
          <button
            onClick={() => setActiveTab('config')}
            className={`flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-t transition-colors ${
              activeTab === 'config' ? 'bg-ledger-navy text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <Settings className="w-4 h-4" /> Rule Threshold Tuning
          </button>
          <button
            onClick={() => setActiveTab('ingestion')}
            className={`flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-t transition-colors ${
              activeTab === 'ingestion' ? 'bg-ledger-navy text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <Database className="w-4 h-4" /> Data Ingestion Panel
          </button>
          <button
            onClick={() => setActiveTab('audit')}
            className={`flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-t transition-colors ${
              activeTab === 'audit' ? 'bg-ledger-navy text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <FileText className="w-4 h-4" /> System Audit Log
          </button>
        </div>
      </div>

      {/* Tab 1: User Management */}
      {activeTab === 'users' && (
        <div className="bg-white rounded-lg border border-ledger-line shadow-xs overflow-hidden">
          <div className="p-4 border-b border-ledger-line bg-slate-50">
            <h2 className="font-serif font-semibold text-lg text-ledger-navy">User Registrations & Approvals Queue</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm font-sans">
              <thead className="bg-slate-100 text-slate-700 font-mono text-xs uppercase border-b border-ledger-line">
                <tr>
                  <th className="py-3 px-4">User ID</th>
                  <th className="py-3 px-4">Name</th>
                  <th className="py-3 px-4">Email</th>
                  <th className="py-3 px-4">Requested Role</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ledger-line">
                {users.map((u, idx) => (
                  <tr key={idx} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3 px-4 font-mono font-semibold text-ledger-navy">{u.user_id}</td>
                    <td className="py-3 px-4 font-semibold text-slate-800">{u.name}</td>
                    <td className="py-3 px-4 font-mono text-xs">{u.email}</td>
                    <td className="py-3 px-4 font-mono text-xs text-indigo-700 font-bold">{u.role}</td>
                    <td className="py-3 px-4">
                      <span className={`inline-block px-2 py-0.5 rounded text-xs font-mono font-bold ${
                        u.status === 'Active' ? 'bg-emerald-100 text-emerald-800' :
                        u.status === 'Pending' ? 'bg-amber-100 text-amber-800' :
                        'bg-rose-100 text-rose-800'
                      }`}>
                        {u.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right space-x-2">
                      {u.status === 'Pending' && (
                        <>
                          <button
                            onClick={() => handleApproveUser(u.user_id, 'approve')}
                            className="px-2.5 py-1 bg-emerald-700 text-white text-xs font-semibold rounded hover:bg-emerald-800 transition-colors"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => handleApproveUser(u.user_id, 'reject')}
                            className="px-2.5 py-1 bg-rose-700 text-white text-xs font-semibold rounded hover:bg-rose-800 transition-colors"
                          >
                            Reject
                          </button>
                        </>
                      )}
                      {u.status === 'Active' && u.role !== 'Administrator' && (
                        <button
                          onClick={() => handleApproveUser(u.user_id, 'deactivate')}
                          className="px-2.5 py-1 bg-slate-200 text-slate-800 text-xs font-semibold rounded hover:bg-slate-300 transition-colors"
                        >
                          Deactivate
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 2: Rule Threshold Tuning */}
      {activeTab === 'config' && (
        <div className="bg-white p-6 rounded-lg border border-ledger-line shadow-xs">
          <h2 className="font-serif font-bold text-lg text-ledger-navy mb-4">Rule Engine Threshold Tuning (FR-RULE-07)</h2>

          {configMsg && (
            <div className="p-3 mb-4 bg-emerald-50 text-emerald-800 text-xs rounded border border-emerald-200 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              {configMsg}
            </div>
          )}
          {configError && (
            <div className="p-3 mb-4 bg-rose-50 text-rose-800 text-xs rounded border border-rose-200 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              {configError}
            </div>
          )}

          <form onSubmit={handleUpdateConfig} className="max-w-xl space-y-4 text-xs font-sans">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Rule R2 — Tender Bypass Cutoff Amount (INR):
              </label>
              <input
                type="number"
                value={tenderThresh}
                onChange={e => setTenderThresh(e.target.value)}
                className="w-full p-2 border border-slate-300 rounded font-mono focus:ring-1 focus:ring-amber-500"
              />
              <p className="text-[11px] text-slate-500 mt-1">
                Works with sanctioned amount equal to or above this figure with no linked tender ID trigger Rule R2. Current: ₹{(tenderThresh / 100000).toFixed(2)} Lakhs.
              </p>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                className="flex items-center gap-1.5 px-4 py-2 bg-ledger-navy text-white font-semibold rounded hover:bg-slate-800 transition-colors shadow-2xs"
              >
                <RefreshCw className="w-4 h-4 text-amber-400" /> Save & Re-score All Works
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Tab 3: Data Ingestion Panel */}
      {activeTab === 'ingestion' && (
        <div className="bg-white p-6 rounded-lg border border-ledger-line shadow-xs">
          <h2 className="font-serif font-bold text-lg text-ledger-navy mb-4">Batch MPLADS Dataset CSV Ingestion (FR-ING-01)</h2>

          {ingestMsg && (
            <div className="p-3 mb-4 bg-emerald-50 text-emerald-800 text-xs rounded border border-emerald-200 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              {ingestMsg}
            </div>
          )}
          {ingestError && (
            <div className="p-3 mb-4 bg-rose-50 text-rose-800 text-xs rounded border border-rose-200 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              {ingestError}
            </div>
          )}

          <form onSubmit={handleCSVUpload} className="max-w-xl space-y-4 text-xs font-sans">
            <div className="border-2 border-dashed border-slate-300 rounded-lg p-6 text-center hover:border-amber-500 transition-colors bg-slate-50">
              <Upload className="w-8 h-8 text-slate-400 mx-auto mb-2" />
              <div className="font-semibold text-slate-700">Upload Public MPLADS Work CSV File</div>
              <p className="text-[11px] text-slate-500 mt-1">Must contain headers: mp_id, description, sanctioned_amount, sanction_date, state.</p>

              <input
                type="file"
                accept=".csv"
                onChange={e => setSelectedFile(e.target.files[0])}
                className="mt-4 text-xs mx-auto text-slate-600 file:mr-3 file:py-1.5 file:px-3 file:rounded file:border-0 file:text-xs file:font-semibold file:bg-ledger-navy file:text-white hover:file:bg-slate-800"
              />
            </div>

            <button
              type="submit"
              disabled={!selectedFile || isIngesting}
              className={`w-full py-2.5 rounded font-semibold text-white transition-colors ${
                !selectedFile || isIngesting ? 'bg-slate-400 cursor-not-allowed' : 'bg-ledger-navy hover:bg-slate-800'
              }`}
            >
              {isIngesting ? 'Ingesting & Scoring Dataset...' : 'Trigger Dataset Import'}
            </button>
          </form>
        </div>
      )}

      {/* Tab 4: System Audit Log */}
      {activeTab === 'audit' && (
        <div className="bg-white rounded-lg border border-ledger-line shadow-xs overflow-hidden">
          <div className="p-4 border-b border-ledger-line bg-slate-50">
            <h2 className="font-serif font-semibold text-lg text-ledger-navy">System Audit Trail Log</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm font-sans">
              <thead className="bg-slate-100 text-slate-700 font-mono text-xs uppercase border-b border-ledger-line">
                <tr>
                  <th className="py-3 px-4">Timestamp</th>
                  <th className="py-3 px-4">Action</th>
                  <th className="py-3 px-4">Actor Email</th>
                  <th className="py-3 px-4">Role</th>
                  <th className="py-3 px-4">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ledger-line text-xs">
                {auditLogs.map((log, idx) => (
                  <tr key={idx} className="hover:bg-slate-50 transition-colors font-mono">
                    <td className="py-3 px-4 text-slate-500">{new Date(log.timestamp).toLocaleString()}</td>
                    <td className="py-3 px-4 font-bold text-ledger-navy">{log.action}</td>
                    <td className="py-3 px-4">{log.actor_email}</td>
                    <td className="py-3 px-4 text-indigo-700">{log.actor_role}</td>
                    <td className="py-3 px-4 font-sans text-slate-700 truncate max-w-xs">{JSON.stringify(log.details)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
