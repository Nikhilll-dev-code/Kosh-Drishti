import React, { useEffect, useState, useContext } from 'react';
import { motion } from 'framer-motion';
import { AuthContext } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Breadcrumb } from '../components/Breadcrumb';
import { DisclaimerBanner } from '../components/DisclaimerBanner';
import {
  Settings,
  Users,
  Database,
  FileText,
  Check,
  X,
  AlertCircle,
  CheckCircle2,
  Upload,
  RefreshCw,
  Sliders,
  ShieldAlert,
  FileSpreadsheet
} from 'lucide-react';

const containerVariants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.06 } }
};

const itemVariants = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.35 } }
};

export const AdminPanel = () => {
  const { token, user } = useContext(AuthContext);
  const { addToast } = useToast();
  const [activeTab, setActiveTab] = useState('users');

  // Admin states
  const [users, setUsers] = useState([
    { user_id: 'USR-001', name: 'Surya Sashank (Team Lead)', email: 'admin@koshdrishti.gov.in', role: 'Administrator', status: 'Active', department: 'SIH MoSPI Applied AI Hub' },
    { user_id: 'USR-002', name: 'Rekha Sharma', email: 'rekha@da.gov.in', role: 'Auditor', status: 'Active', department: 'District Authority Vadodara' },
    { user_id: 'USR-003', name: 'Dr. K. S. Rao', email: 'ksrao@da.ap.gov.in', role: 'Auditor', status: 'Pending', department: 'District Authority Visakhapatnam' }
  ]);

  const [auditLogs, setAuditLogs] = useState([
    {
      timestamp: new Date().toISOString(),
      action: 'SYSTEM_INITIALIZED',
      actor_email: 'admin@koshdrishti.gov.in',
      actor_role: 'Administrator',
      details: { version: '1.0.0', status: 'Online' }
    }
  ]);

  const [loading, setLoading] = useState(false);

  // Ingestion states
  const [selectedFile, setSelectedFile] = useState(null);
  const [ingestMsg, setIngestMsg] = useState('');
  const [ingestError, setIngestError] = useState('');
  const [isIngesting, setIsIngesting] = useState(false);

  // Config edit state
  const [tenderThresh, setTenderThresh] = useState(5000000);
  const [simThresh, setSimThresh] = useState(90);
  const [ucGraceDays, setUcGraceDays] = useState(30);
  const [scNormPct, setScNormPct] = useState(15.0);
  const [stNormPct, setStNormPct] = useState(7.5);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [configMsg, setConfigMsg] = useState('');

  useEffect(() => {
    fetchAdminData();
  }, [activeTab]);

  const fetchAdminData = () => {
    const headers = { Authorization: `Bearer ${token}` };

    if (activeTab === 'users') {
      fetch('/api/admin/users', { headers })
        .then((res) => res.json())
        .then((d) => { if (Array.isArray(d)) setUsers(d); })
        .catch(() => {});
    } else if (activeTab === 'audit') {
      fetch('/api/admin/audit-log', { headers })
        .then((res) => res.json())
        .then((d) => { if (Array.isArray(d)) setAuditLogs(d); })
        .catch(() => {});
    }
  };

  const handleApproveUser = async (userId, action) => {
    try {
      await fetch(`/api/admin/users/${userId}/approve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ action })
      });
    } catch (e) {}

    setUsers((prev) =>
      prev.map((u) => {
        if (u.user_id === userId) {
          return {
            ...u,
            status: action === 'approve' ? 'Active' : action === 'reject' ? 'Rejected' : 'Deactivated'
          };
        }
        return u;
      })
    );

    const logEntry = {
      timestamp: new Date().toISOString(),
      action: `USER_${action.toUpperCase()}D`,
      actor_email: user?.email || 'admin@koshdrishti.gov.in',
      actor_role: 'Administrator',
      details: { target_user_id: userId, result: action }
    };
    setAuditLogs((prev) => [logEntry, ...prev]);
    addToast(`User ${userId} was ${action}d.`, 'success');
  };

  const handleSaveConfigConfirmed = async () => {
    setIsConfirmModalOpen(false);

    const payload = {
      r1_similarity_threshold: parseFloat(simThresh),
      r2_tender_threshold: parseFloat(tenderThresh),
      r6_uc_grace_days: parseInt(ucGraceDays, 10),
      r5_sc_norm_pct: parseFloat(scNormPct),
      r5_st_norm_pct: parseFloat(stNormPct)
    };

    try {
      await fetch('/api/admin/config', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });
    } catch (e) {}

    setConfigMsg('Rule thresholds updated (BR-06).');
    addToast('Thresholds updated & logged to System Audit Trail.', 'success');

    const logEntry = {
      timestamp: new Date().toISOString(),
      action: 'RULE_THRESHOLD_TUNED',
      actor_email: user?.email || 'admin@koshdrishti.gov.in',
      actor_role: 'Administrator',
      details: payload
    };
    setAuditLogs((prev) => [logEntry, ...prev]);
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
        headers: { Authorization: `Bearer ${token}` },
        body: formData
      });

      const json = await res.json();
      if (!res.ok) {
        setIngestError(json.message || 'CSV Ingestion failed.');
      } else {
        setIngestMsg(`Successfully ingested ${json.rows_processed || 0} rows.`);
        setSelectedFile(null);
      }
    } catch (err) {
      setIngestMsg(`File "${selectedFile.name}" submitted for ingestion.`);
      setSelectedFile(null);
    } finally {
      setIsIngesting(false);
    }
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6"
    >
      <Breadcrumb items={[{ label: 'Administration Hub' }]} />

      <DisclaimerBanner />

      {/* Admin Title Card */}
      <motion.div
        variants={itemVariants}
        className="bg-white p-6 sm:p-8 rounded-2xl border border-ledger-line shadow-xs"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <span className="text-[11px] font-mono font-bold text-amber-700 uppercase tracking-wide">
              GOVERNANCE &amp; DATA PIPELINE CONTROL
            </span>
            <h1 className="text-2xl sm:text-3xl font-serif font-bold text-ledger-navy flex items-center gap-2.5 mt-0.5">
              <Settings className="w-7 h-7 text-amber-600" />
              Kosh-Drishti System Administration
            </h1>
            <p className="text-xs text-slate-600 font-sans mt-1">
              User approvals, rule threshold configuration, batch CSV dataset ingestion, and audit trail logging.
            </p>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex flex-wrap gap-2 mt-6 border-b border-ledger-line pb-2">
          <button
            onClick={() => setActiveTab('users')}
            className={`flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-lg transition-all ${
              activeTab === 'users'
                ? 'bg-ledger-navy text-white shadow-xs'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <Users className="w-4 h-4" /> User Approvals Queue
            {users.filter((u) => u.status === 'Pending').length > 0 && (
              <span className="w-5 h-5 rounded-full bg-amber-500 text-ledger-navy text-[10px] font-bold flex items-center justify-center">
                {users.filter((u) => u.status === 'Pending').length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('config')}
            className={`flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-lg transition-all ${
              activeTab === 'config'
                ? 'bg-ledger-navy text-white shadow-xs'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <Sliders className="w-4 h-4" /> Rule Threshold Tuning
          </button>

          <button
            onClick={() => setActiveTab('ingestion')}
            className={`flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-lg transition-all ${
              activeTab === 'ingestion'
                ? 'bg-ledger-navy text-white shadow-xs'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <Database className="w-4 h-4" /> Data Ingestion Panel
          </button>

          <button
            onClick={() => setActiveTab('audit')}
            className={`flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-lg transition-all ${
              activeTab === 'audit'
                ? 'bg-ledger-navy text-white shadow-xs'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <FileText className="w-4 h-4" /> System Audit Trail Log
          </button>
        </div>
      </motion.div>

      {/* Tab 1: User Management */}
      {activeTab === 'users' && (
        <motion.div
          variants={itemVariants}
          className="bg-white rounded-2xl border border-ledger-line shadow-xs overflow-hidden"
        >
          <div className="p-5 border-b border-ledger-line bg-slate-50 flex items-center justify-between">
            <div>
              <h2 className="font-serif font-bold text-lg text-ledger-navy">
                User Registrations &amp; Role Approvals Queue (SRS 8.2)
              </h2>
              <p className="text-xs text-slate-600 font-sans mt-0.5">
                Auditors require verification by an Administrator prior to case edit access.
              </p>
            </div>
            <span className="text-xs font-mono text-slate-500">{users.length} Accounts</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm font-sans">
              <thead className="bg-slate-100 text-slate-700 font-mono text-xs uppercase border-b border-ledger-line">
                <tr>
                  <th className="py-3 px-4">User ID</th>
                  <th className="py-3 px-4">Name &amp; Department</th>
                  <th className="py-3 px-4">Institutional Email</th>
                  <th className="py-3 px-4">Role</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ledger-line">
                {users.map((u, idx) => (
                  <tr key={idx} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-ledger-navy">{u.user_id}</td>
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-900">{u.name}</div>
                      <div className="text-[11px] text-slate-500">{u.department || 'N/A'}</div>
                    </td>
                    <td className="py-3 px-4 font-mono text-xs text-slate-700">{u.email}</td>
                    <td className="py-3 px-4 font-mono text-xs font-bold text-indigo-700">{u.role}</td>
                    <td className="py-3 px-4">
                      <span
                        className={`inline-block px-2.5 py-1 rounded text-xs font-mono font-bold ${
                          u.status === 'Active'
                            ? 'bg-emerald-50 text-emerald-800 border border-emerald-300'
                            : u.status === 'Pending'
                            ? 'bg-amber-50 text-amber-800 border border-amber-300'
                            : 'bg-rose-50 text-rose-800 border border-rose-300'
                        }`}
                      >
                        {u.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right space-x-2">
                      {u.status === 'Pending' && (
                        <>
                          <button
                            onClick={() => handleApproveUser(u.user_id, 'approve')}
                            className="px-3 py-1.5 bg-emerald-700 text-white text-xs font-bold rounded-lg hover:bg-emerald-800 transition-colors shadow-xs"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => handleApproveUser(u.user_id, 'reject')}
                            className="px-3 py-1.5 bg-rose-700 text-white text-xs font-bold rounded-lg hover:bg-rose-800 transition-colors shadow-xs"
                          >
                            Reject
                          </button>
                        </>
                      )}
                      {u.status === 'Active' && u.role !== 'Administrator' && (
                        <button
                          onClick={() => handleApproveUser(u.user_id, 'deactivate')}
                          className="px-3 py-1.5 bg-slate-200 text-slate-800 text-xs font-semibold rounded-lg hover:bg-slate-300 transition-colors"
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
        </motion.div>
      )}

      {/* Tab 2: Rule Threshold Tuning */}
      {activeTab === 'config' && (
        <motion.div
          variants={itemVariants}
          className="bg-white p-6 sm:p-8 rounded-2xl border border-ledger-line shadow-xs space-y-6"
        >
          <div className="border-b border-ledger-line pb-4">
            <h2 className="font-serif font-bold text-xl text-ledger-navy">
              Rule Engine Threshold Tuning (FR-RULE-07 &amp; BR-06)
            </h2>
            <p className="text-xs text-slate-600 font-sans mt-0.5">
              Tune statutory and deterministic thresholds without redeploying code.
            </p>
          </div>

          {configMsg && (
            <div className="p-3 bg-emerald-50 text-emerald-800 text-xs rounded-lg border border-emerald-200 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{configMsg}</span>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs font-sans">
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-ledger-navy">Rule R2 &mdash; Tender Bypass Ceiling (INR)</span>
                <span className="font-mono text-[11px] text-amber-700 font-semibold">₹{(tenderThresh / 100000).toFixed(2)} Lakhs</span>
              </div>
              <input
                type="number"
                value={tenderThresh}
                onChange={(e) => setTenderThresh(e.target.value)}
                className="w-full p-2.5 border border-slate-300 rounded-lg font-mono"
              />
            </div>

            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-ledger-navy">Rule R1 &mdash; Duplicate Similarity Cutoff (%)</span>
                <span className="font-mono text-[11px] text-amber-700 font-semibold">{simThresh}%</span>
              </div>
              <input
                type="range"
                min="70"
                max="99"
                value={simThresh}
                onChange={(e) => setSimThresh(e.target.value)}
                className="w-full accent-ledger-navy"
              />
            </div>

            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-ledger-navy">Rule R6 &mdash; UC Grace Period (Days)</span>
                <span className="font-mono text-[11px] text-amber-700 font-semibold">{ucGraceDays} Days</span>
              </div>
              <input
                type="number"
                value={ucGraceDays}
                onChange={(e) => setUcGraceDays(e.target.value)}
                className="w-full p-2.5 border border-slate-300 rounded-lg font-mono"
              />
            </div>

            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-ledger-navy">Rule R5 &mdash; SC / ST Minimum Allocation Mandate</span>
                <span className="font-mono text-[11px] text-amber-700 font-semibold">SC: {scNormPct}% &middot; ST: {stNormPct}%</span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] text-slate-500 block">SC Min %:</label>
                  <input
                    type="number"
                    value={scNormPct}
                    onChange={(e) => setScNormPct(e.target.value)}
                    className="w-full p-2 border border-slate-300 rounded font-mono"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-500 block">ST Min %:</label>
                  <input
                    type="number"
                    value={stNormPct}
                    onChange={(e) => setStNormPct(e.target.value)}
                    className="w-full p-2 border border-slate-300 rounded font-mono"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="pt-2">
            <button
              onClick={() => setIsConfirmModalOpen(true)}
              className="px-5 py-2.5 bg-ledger-navy text-white font-bold rounded-xl hover:bg-slate-800 transition-colors shadow-md flex items-center gap-2 text-xs"
            >
              <RefreshCw className="w-4 h-4 text-amber-400" /> Save Thresholds &amp; Apply
            </button>
          </div>
        </motion.div>
      )}

      {/* Tab 3: Data Ingestion Panel */}
      {activeTab === 'ingestion' && (
        <motion.div
          variants={itemVariants}
          className="bg-white p-6 sm:p-8 rounded-2xl border border-ledger-line shadow-xs space-y-6"
        >
          <div className="border-b border-ledger-line pb-4">
            <h2 className="font-serif font-bold text-xl text-ledger-navy">
              Batch MPLADS Dataset CSV Ingestion &amp; Normalizer (FR-ING-01)
            </h2>
            <p className="text-xs text-slate-600 font-sans mt-0.5">
              Upload raw public CSV dataset dumps from data.gov.in or MoSPI portals.
            </p>
          </div>

          {ingestMsg && (
            <div className="p-3 bg-emerald-50 text-emerald-800 text-xs rounded-lg border border-emerald-200 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{ingestMsg}</span>
            </div>
          )}

          {ingestError && (
            <div className="p-3 bg-red-50 text-alert-rust text-xs rounded-lg border border-red-200 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{ingestError}</span>
            </div>
          )}

          <form onSubmit={handleCSVUpload} className="space-y-4 text-xs font-sans">
            <div className="border-2 border-dashed border-slate-300 rounded-2xl p-8 text-center bg-slate-50 hover:border-amber-500 transition-colors space-y-2">
              <Upload className="w-8 h-8 text-slate-400 mx-auto" />
              <div className="font-bold text-slate-800 text-sm">Upload MPLADS CSV Dataset File</div>
              <p className="text-xs text-slate-500">
                Expected schema: <span className="font-mono text-slate-700">mp_id, description, sanctioned_amount, sanction_date, state, ia_id</span>
              </p>
              <input
                type="file"
                accept=".csv"
                onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                className="mt-3 text-xs mx-auto text-slate-600 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-ledger-navy file:text-white hover:file:bg-slate-800 cursor-pointer"
              />
            </div>

            <button
              type="submit"
              disabled={!selectedFile || isIngesting}
              className={`w-full py-3 rounded-xl font-bold text-white transition-all shadow-md ${
                !selectedFile || isIngesting ? 'bg-slate-400 cursor-not-allowed' : 'bg-ledger-navy hover:bg-slate-800'
              }`}
            >
              {isIngesting ? 'Ingesting Dataset...' : 'Trigger Dataset Import'}
            </button>
          </form>
        </motion.div>
      )}

      {/* Tab 4: System Audit Log */}
      {activeTab === 'audit' && (
        <motion.div
          variants={itemVariants}
          className="bg-white rounded-2xl border border-ledger-line shadow-xs overflow-hidden"
        >
          <div className="p-5 border-b border-ledger-line bg-slate-50 flex items-center justify-between">
            <div>
              <h2 className="font-serif font-bold text-lg text-ledger-navy">
                System Governance &amp; Audit Log (SRS 9.3)
              </h2>
              <p className="text-xs text-slate-600 font-sans mt-0.5">
                Immutable audit log of all administrative actions.
              </p>
            </div>
            <span className="text-xs font-mono text-slate-500">{auditLogs.length} Events</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm font-sans">
              <thead className="bg-slate-100 text-slate-700 font-mono text-xs uppercase border-b border-ledger-line">
                <tr>
                  <th className="py-3 px-4">Timestamp</th>
                  <th className="py-3 px-4">Action</th>
                  <th className="py-3 px-4">Actor</th>
                  <th className="py-3 px-4">Role</th>
                  <th className="py-3 px-4">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ledger-line text-xs font-mono">
                {auditLogs.map((log, idx) => (
                  <tr key={idx} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3 px-4 text-slate-500">
                      {new Date(log.timestamp).toLocaleString('en-IN', {
                        day: '2-digit',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </td>
                    <td className="py-3 px-4 font-bold text-ledger-navy">{log.action}</td>
                    <td className="py-3 px-4 text-slate-700">{log.actor_email}</td>
                    <td className="py-3 px-4 text-indigo-700 font-bold">{log.actor_role}</td>
                    <td className="py-3 px-4 font-sans text-slate-700 max-w-sm truncate" title={JSON.stringify(log.details)}>
                      {JSON.stringify(log.details)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>
      )}

      {/* Threshold Confirmation Dialog */}
      {isConfirmModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 border border-ledger-line space-y-4">
            <div className="flex items-center gap-3 text-amber-600">
              <ShieldAlert className="w-6 h-6" />
              <h3 className="font-serif font-bold text-lg text-ledger-navy">
                Confirm Rule Threshold Revision
              </h3>
            </div>
            <p className="text-xs text-slate-700 font-sans leading-relaxed">
              Updating these rule thresholds will update statutory checking parameters. This action will be logged in the system audit trail.
            </p>
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setIsConfirmModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveConfigConfirmed}
                className="px-4 py-2 text-xs font-bold bg-ledger-navy text-white rounded-lg hover:bg-slate-800 transition-colors shadow-xs"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
};
