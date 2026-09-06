import React, { useEffect, useState, useContext } from 'react';
import { useParams, Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { Breadcrumb } from '../components/Breadcrumb';
import { DisclaimerBanner } from '../components/DisclaimerBanner';
import { RiskChip } from '../components/RiskChip';
import { RuleBadge } from '../components/RuleBadge';
import { ShieldAlert, FileText, Download, CheckSquare, MessageSquare, Clock, Send, AlertCircle, CheckCircle2 } from 'lucide-react';

export const WorkDetail = () => {
  const { work_id } = useParams();
  const { user, token, isAuthenticated } = useContext(AuthContext);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  // Case management form states
  const [caseStatus, setCaseStatus] = useState('New');
  const [newNote, setNewNote] = useState('');
  const [actionMsg, setActionMsg] = useState('');
  const [actionError, setActionError] = useState('');

  useEffect(() => {
    fetchWorkDetail();
  }, [work_id]);

  const fetchWorkDetail = () => {
    fetch(`/api/works/${work_id}`)
      .then(res => res.json())
      .then(d => {
        setData(d);
        if (d.case_info) {
          setCaseStatus(d.case_info.status);
        }
        setLoading(false);
      })
      .catch(err => {
        console.error('Error fetching work details:', err);
        setLoading(false);
      });
  };

  const handleStatusChange = async (e) => {
    const nextStatus = e.target.value;
    setActionError('');
    setActionMsg('');

    if (!data.case_info) return;

    try {
      const res = await fetch(`/api/cases/${data.case_info.case_id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ new_status: nextStatus })
      });

      const json = await res.json();
      if (!res.ok) {
        setActionError(json.message || 'Error updating status.');
      } else {
        setActionMsg(json.message);
        setCaseStatus(nextStatus);
        fetchWorkDetail();
      }
    } catch (err) {
      setActionError('Network error updating case status.');
    }
  };

  const handleAddNote = async (e) => {
    e.preventDefault();
    if (!newNote.trim()) return;

    setActionError('');
    setActionMsg('');

    if (!data.case_info) return;

    try {
      const res = await fetch(`/api/cases/${data.case_info.case_id}/notes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ note_text: newNote.trim() })
      });

      const json = await res.json();
      if (!res.ok) {
        setActionError(json.message || 'Error adding note.');
      } else {
        setActionMsg('Investigation note appended successfully.');
        setNewNote('');
        fetchWorkDetail();
      }
    } catch (err) {
      setActionError('Network error adding note.');
    }
  };

  const exportCSV = () => {
    const w = data.work;
    const rs = data.risk_score;
    const csvContent = "data:text/csv;charset=utf-8," +
      "Work ID,MP ID,State,Description,Sanctioned Amount,Completion Date,UC Filed Date,Composite Risk,Triggered Rules,Explanation\n" +
      `"${w.work_id}","${w.mp_id}","${w.state}","${w.description.replace(/"/g, '""')}",${w.sanctioned_amount},"${w.completion_date || ''}","${w.uc_filed_date || ''}",${rs.composite_risk},"${(rs.rule_flags || []).join(';')}","${rs.explanation_text.replace(/"/g, '""')}"`;

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Kosh-Drishti-Case-${w.work_id}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportPDF = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8 animate-pulse space-y-4">
        <div className="h-6 bg-slate-200 w-1/3 rounded"></div>
        <div className="h-64 bg-slate-200 rounded"></div>
      </div>
    );
  }

  const { work, mp, risk_score, case_info } = data;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Breadcrumb
        items={[
          { label: work.state, link: `/states/${encodeURIComponent(work.state)}` },
          { label: mp ? mp.name : work.mp_id, link: `/mps/${work.mp_id}` },
          { label: `Work #${work.work_id}` }
        ]}
      />

      {/* Persistent Disclaimer Banner (SRS FR-DASH-04) */}
      <DisclaimerBanner />

      {/* Action Header bar with Export PDF/CSV buttons */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <span className="text-xs font-mono font-bold text-slate-500 uppercase tracking-wide">Work Audit Record</span>
          <h1 className="text-2xl font-serif font-bold text-ledger-navy flex items-center gap-3">
            {work.work_id}
            <RiskChip score={risk_score.composite_risk} />
          </h1>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={exportCSV}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold bg-white text-slate-700 border border-ledger-line rounded hover:bg-slate-50 transition-colors shadow-2xs"
          >
            <Download className="w-4 h-4 text-slate-500" />
            Export CSV
          </button>
          <button
            onClick={exportPDF}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold bg-ledger-navy text-white rounded hover:bg-slate-800 transition-colors shadow-2xs"
          >
            <FileText className="w-4 h-4 text-amber-400" />
            Export PDF Case Report
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Risk Score, Explanation, Raw Data */}
        <div className="lg:col-span-2 space-y-6">
          {/* Risk Breakdown Card */}
          <div className="bg-white p-6 rounded-lg border border-ledger-line shadow-xs">
            <div className="flex items-center justify-between border-b border-ledger-line pb-4 mb-4">
              <div>
                <h2 className="font-serif font-bold text-lg text-ledger-navy">Composite Risk Score & Rule Hits</h2>
                <div className="text-xs text-slate-500 font-sans mt-0.5">Calculated via CAG-Grounded Rule Engine + Isolation Forest ML Scorer</div>
              </div>
              <div className="text-right">
                <div className="text-3xl font-mono font-bold text-ledger-navy">{risk_score.composite_risk}<span className="text-sm text-slate-400">/100</span></div>
                <div className="text-[11px] font-mono text-slate-500">Anomaly Score: {risk_score.anomaly_score}</div>
              </div>
            </div>

            {/* Triggered Rules Badges */}
            <div className="mb-5">
              <div className="text-xs font-semibold text-slate-600 mb-2">Triggered Violation Rules (R1–R6):</div>
              <div className="flex flex-wrap gap-2">
                {risk_score.rule_flags && risk_score.rule_flags.length > 0 ? (
                  risk_score.rule_flags.map((code, idx) => (
                    <RuleBadge key={idx} code={code} />
                  ))
                ) : (
                  <span className="text-xs font-mono text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded border border-emerald-200">
                    No rules triggered (Compliant)
                  </span>
                )}
              </div>
            </div>

            {/* Evidence-Backed Plain-Language Explanation */}
            <div className="bg-slate-50 p-4 rounded border border-slate-200">
              <div className="text-xs font-semibold text-ledger-navy mb-1.5 flex items-center gap-1.5">
                <ShieldAlert className="w-4 h-4 text-amber-600" /> Plain-Language Evidence & Citation Paragraph:
              </div>
              <p className="text-sm text-slate-800 font-sans leading-relaxed">
                "{risk_score.explanation_text}"
              </p>
            </div>
          </div>

          {/* Raw Work Attributes Table */}
          <div className="bg-white rounded-lg border border-ledger-line shadow-xs overflow-hidden">
            <div className="p-4 border-b border-ledger-line bg-slate-50">
              <h2 className="font-serif font-semibold text-lg text-ledger-navy">Raw Work Record & Metadata</h2>
            </div>
            <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-sans">
              <div>
                <span className="text-slate-500 block">Sanctioned Amount:</span>
                <span className="font-mono font-bold text-sm text-ledger-navy">₹{(work.sanctioned_amount / 100000).toFixed(2)} Lakhs (₹{work.sanctioned_amount.toLocaleString()})</span>
              </div>
              <div>
                <span className="text-slate-500 block">Category:</span>
                <span className="font-semibold text-slate-800">{work.category}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Implementing Agency (IA):</span>
                <span className="font-semibold text-slate-800">{work.ia_id}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Tender Reference ID:</span>
                <span className="font-mono font-semibold text-slate-800">{work.tender_id || <span className="text-rose-600 font-bold">None (Missing)</span>}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Sanction Date:</span>
                <span className="font-mono">{work.sanction_date}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Completion Date:</span>
                <span className="font-mono">{work.completion_date || 'In Progress'}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Utilization Certificate (UC) Date:</span>
                <span className="font-mono">{work.uc_filed_date || <span className="text-rose-600 font-bold">Not Filed</span>}</span>
              </div>
              <div>
                <span className="text-slate-500 block">SC/ST Area Tag:</span>
                <span className="font-mono font-semibold">{work.sc_st_tag}</span>
              </div>
              <div className="sm:col-span-2">
                <span className="text-slate-500 block">Full Description:</span>
                <p className="mt-1 p-2 bg-slate-50 rounded border border-slate-200 text-slate-800 font-sans">
                  {work.description}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Auditor Case Management & Notes Workflow */}
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-lg border border-ledger-line shadow-xs">
            <div className="flex items-center gap-2 border-b border-ledger-line pb-3 mb-4">
              <CheckSquare className="w-5 h-5 text-ledger-navy" />
              <h2 className="font-serif font-bold text-lg text-ledger-navy">Auditor Case Workflow</h2>
            </div>

            {actionError && (
              <div className="p-3 mb-4 bg-rose-50 text-rose-800 text-xs rounded border border-rose-200 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                {actionError}
              </div>
            )}
            {actionMsg && (
              <div className="p-3 mb-4 bg-emerald-50 text-emerald-800 text-xs rounded border border-emerald-200 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                {actionMsg}
              </div>
            )}

            {case_info ? (
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Current Case Status:</label>
                  {isAuthenticated && (user?.role === 'Auditor' || user?.role === 'Administrator') ? (
                    <select
                      value={caseStatus}
                      onChange={handleStatusChange}
                      className="w-full text-xs font-semibold text-slate-800 bg-slate-50 border border-slate-300 rounded p-2 focus:ring-1 focus:ring-amber-500"
                    >
                      <option value="New">New (Pending Initial Review)</option>
                      <option value="Under Review">Under Review (Inspection Ordered)</option>
                      <option value="Resolved">Resolved (Cleared)</option>
                      <option value="Escalated">Escalated (Escalated for Full Audit)</option>
                    </select>
                  ) : (
                    <span className="inline-block px-3 py-1 bg-slate-100 text-slate-800 rounded font-mono font-bold text-xs border border-slate-300">
                      {case_info.status}
                    </span>
                  )}
                  <p className="text-[11px] text-slate-500 mt-1">
                    Sequence constraint (BR-07): New → Under Review → Resolved / Escalated.
                  </p>
                </div>

                <div>
                  <span className="text-xs font-semibold text-slate-700 block mb-1">Assigned Auditor:</span>
                  <span className="text-xs font-mono bg-slate-50 px-2.5 py-1 rounded border border-slate-200 block text-slate-800">
                    {case_info.assigned_auditor_name || 'Unassigned'}
                  </span>
                </div>

                {/* Notes History (Append-Only per SRS FR-CASE-02) */}
                <div className="pt-3 border-t border-ledger-line">
                  <div className="text-xs font-semibold text-slate-700 mb-2 flex items-center justify-between">
                    <span>Investigation Notes History ({case_info.notes?.length || 0}):</span>
                    <span className="text-[10px] text-slate-400 font-mono">Append-Only</span>
                  </div>

                  <div className="space-y-2.5 max-h-60 overflow-y-auto pr-1">
                    {case_info.notes?.map((n, idx) => (
                      <div key={idx} className="bg-slate-50 p-2.5 rounded border border-slate-200 text-xs">
                        <div className="flex items-center justify-between text-[10px] text-slate-500 mb-1 font-mono">
                          <span className="font-semibold text-slate-700">{n.author_name}</span>
                          <span>{new Date(n.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                        <p className="text-slate-800 font-sans">{n.text}</p>
                      </div>
                    ))}
                  </div>

                  {/* Add Note Form */}
                  {isAuthenticated && (user?.role === 'Auditor' || user?.role === 'Administrator') ? (
                    <form onSubmit={handleAddNote} className="mt-4 pt-3 border-t border-slate-200">
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Append Audit Note:</label>
                      <textarea
                        rows="3"
                        value={newNote}
                        onChange={(e) => setNewNote(e.target.value)}
                        placeholder="Type field inspection findings or evidence note..."
                        className="w-full text-xs font-sans p-2 border border-slate-300 rounded focus:ring-1 focus:ring-amber-500 focus:outline-none"
                      ></textarea>
                      <button
                        type="submit"
                        className="mt-2 w-full flex items-center justify-center gap-1.5 text-xs font-semibold bg-ledger-navy text-white py-1.5 rounded hover:bg-slate-800 transition-colors shadow-2xs"
                      >
                        <Send className="w-3.5 h-3.5" /> Append Note
                      </button>
                    </form>
                  ) : (
                    <div className="mt-4 p-3 bg-slate-100 rounded text-center text-xs text-slate-600">
                      <Link to="/login" className="text-amber-700 font-semibold hover:underline">Log in as Auditor</Link> to append investigation notes.
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="text-xs text-slate-500 text-center py-6">
                No case record opened for this work. (Composite risk is below review threshold).
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
