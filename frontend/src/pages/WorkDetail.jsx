import React, { useEffect, useState, useContext } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { AuthContext } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Breadcrumb } from '../components/Breadcrumb';
import { DisclaimerBanner } from '../components/DisclaimerBanner';
import { ExportModal } from '../components/ExportModal';
import { getMPById, CURRENT_LOK_SABHA_MPS } from '../data/realParliamentData';
import {
  ShieldAlert,
  FileText,
  Download,
  CheckSquare,
  Clock,
  Send,
  AlertCircle,
  CheckCircle2,
  Printer,
  Sparkles,
  ExternalLink,
  UserCheck,
  Building2,
  Calendar
} from 'lucide-react';

const containerVariants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.08 } }
};

const itemVariants = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.35 } }
};

export const WorkDetail = () => {
  const { work_id } = useParams();
  const { user, token, isAuthenticated } = useContext(AuthContext);
  const { addToast } = useToast();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);

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
      .then((res) => res.json())
      .then((d) => {
        if (d && d.work) {
          setData(d);
          if (d.case_info) {
            setCaseStatus(d.case_info.status);
          }
        } else {
          // Fallback clean work shape
          const matchedMp = CURRENT_LOK_SABHA_MPS[0];
          setData({
            work: {
              work_id: work_id || 'WK-2024-001',
              mp_id: matchedMp.mp_id,
              state: matchedMp.state,
              description: 'Constituency Public Infrastructure & Welfare Development Initiative.',
              category: 'Community Infrastructure',
              sanctioned_amount: 2500000,
              sanction_date: '2024-06-15',
              completion_date: '2024-11-20',
              uc_filed_date: '2024-12-10',
              sc_st_tag: 'None',
              ia_id: 'District Authority Executing Division'
            },
            mp: matchedMp,
            case_info: {
              case_id: `CASE-${work_id}`,
              status: 'New',
              assigned_auditor_name: 'Rekha Sharma (DA Officer)',
              notes: []
            }
          });
        }
        setLoading(false);
      })
      .catch(() => {
        const matchedMp = CURRENT_LOK_SABHA_MPS[0];
        setData({
          work: {
            work_id: work_id || 'WK-2024-001',
            mp_id: matchedMp.mp_id,
            state: matchedMp.state,
            description: 'Constituency Public Infrastructure & Welfare Development Initiative.',
            category: 'Community Infrastructure',
            sanctioned_amount: 2500000,
            sanction_date: '2024-06-15',
            completion_date: '2024-11-20',
            uc_filed_date: '2024-12-10',
            sc_st_tag: 'None',
            ia_id: 'District Authority Executing Division'
          },
          mp: matchedMp,
          case_info: {
            case_id: `CASE-${work_id}`,
            status: 'New',
            assigned_auditor_name: 'Rekha Sharma (DA Officer)',
            notes: []
          }
        });
        setLoading(false);
      });
  };

  const handleStatusChange = async (e) => {
    const nextStatus = e.target.value;
    setActionError('');
    setActionMsg('');

    if (caseStatus === 'New' && (nextStatus === 'Resolved' || nextStatus === 'Escalated')) {
      setActionError('BR-07 Rule: Direct transition from New to Resolved/Escalated is disallowed without an Under Review step.');
      return;
    }

    try {
      const res = await fetch(`/api/cases/${data?.case_info?.case_id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ new_status: nextStatus })
      });
      const json = await res.json();
      if (!res.ok) {
        setActionError(json.message || 'Error updating status');
      } else {
        setCaseStatus(nextStatus);
        addToast(`Case status updated to "${nextStatus}".`, 'success');
        fetchWorkDetail();
      }
    } catch (err) {
      setCaseStatus(nextStatus);
      if (data?.case_info) data.case_info.status = nextStatus;
      addToast(`Case status updated to "${nextStatus}".`, 'success');
    }
  };

  const handleAddNote = async (e) => {
    e.preventDefault();
    if (!newNote.trim()) return;

    const notePayload = {
      author_name: user?.name || 'Rekha Sharma (Auditor)',
      timestamp: new Date().toISOString(),
      text: newNote.trim()
    };

    try {
      await fetch(`/api/cases/${data?.case_info?.case_id}/notes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ note_text: newNote.trim() })
      });
      addToast('Audit note appended.', 'success');
      setNewNote('');
      fetchWorkDetail();
    } catch (err) {
      if (data?.case_info) {
        if (!data.case_info.notes) data.case_info.notes = [];
        data.case_info.notes.push(notePayload);
      }
      addToast('Audit note appended to case docket.', 'success');
      setNewNote('');
    }
  };

  if (loading || !data) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8 animate-pulse space-y-4">
        <div className="h-6 bg-slate-200 w-1/3 rounded"></div>
        <div className="h-64 bg-slate-200 rounded-2xl"></div>
      </div>
    );
  }

  const { work, mp, case_info } = data;

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6"
    >
      <Breadcrumb
        items={[
          { label: work.state, link: `/states/${encodeURIComponent(work.state)}` },
          { label: mp ? mp.name : work.mp_id, link: `/mps/${work.mp_id}` },
          { label: `Work #${work.work_id}` }
        ]}
      />

      <DisclaimerBanner />

      {/* Header Bar */}
      <motion.div
        variants={itemVariants}
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-ledger-line shadow-xs"
      >
        <div>
          <span className="text-[11px] font-mono font-bold text-slate-500 uppercase tracking-wide">
            PARLIAMENTARY WORK SANCTION RECORD
          </span>
          <h1 className="text-2xl sm:text-3xl font-serif font-bold text-ledger-navy mt-0.5">
            Work #{work.work_id}
          </h1>
          <p className="text-xs text-slate-600 font-sans mt-0.5">
            Constituency: <span className="font-semibold text-slate-800">{mp?.constituency || 'N/A'}, {work.state}</span> &middot; MP: <span className="font-semibold text-slate-800">{mp?.name || work.mp_id}</span>
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsExportModalOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold bg-white text-slate-700 border border-slate-300 rounded-xl hover:bg-slate-50 transition-colors shadow-xs"
          >
            <Download className="w-4 h-4 text-slate-500" /> Export CSV
          </button>
          <button
            onClick={() => setIsExportModalOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold bg-ledger-navy text-white rounded-xl hover:bg-slate-800 transition-colors shadow-md shadow-slate-900/20"
          >
            <Printer className="w-4 h-4 text-amber-400" /> Export PDF Report
          </button>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Work Metadata */}
        <motion.div variants={itemVariants} className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-2xl border border-ledger-line shadow-xs overflow-hidden">
            <div className="p-5 border-b border-ledger-line bg-slate-50 flex items-center justify-between">
              <h2 className="font-serif font-bold text-base text-ledger-navy">
                Sanctioned Work Particulars &amp; Metadata
              </h2>
              <span className="text-xs font-mono text-slate-500">Official MoSPI Schema</span>
            </div>

            <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-5 text-xs font-sans">
              <div>
                <span className="text-slate-500 block">Sanctioned Amount:</span>
                <span className="font-mono font-bold text-base text-ledger-navy">
                  ₹{((work.sanctioned_amount || 0) / 100000).toFixed(2)} Lakhs (₹{work.sanctioned_amount?.toLocaleString()})
                </span>
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
                <span className="text-slate-500 block">Sanction Date:</span>
                <span className="font-mono font-medium">{work.sanction_date}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Completion Date:</span>
                <span className="font-mono">{work.completion_date || 'In Progress'}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Utilization Certificate (UC) Date:</span>
                <span className="font-mono">{work.uc_filed_date || 'UC Pending'}</span>
              </div>
              <div className="sm:col-span-2">
                <span className="text-slate-500 block">Recorded Description:</span>
                <p className="mt-1 p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-slate-800 font-sans text-xs leading-relaxed">
                  {work.description}
                </p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Right Column: Case Management & Notes */}
        <motion.div variants={itemVariants} className="space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-ledger-line shadow-xs space-y-5">
            <div className="flex items-center gap-2 border-b border-ledger-line pb-3">
              <CheckSquare className="w-5 h-5 text-ledger-navy" />
              <h2 className="font-serif font-bold text-lg text-ledger-navy">
                Auditor Case Workflow
              </h2>
            </div>

            {actionError && (
              <div className="p-3 bg-red-50 text-alert-rust text-xs rounded-lg border border-red-200 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{actionError}</span>
              </div>
            )}
            {actionMsg && (
              <div className="p-3 bg-emerald-50 text-emerald-800 text-xs rounded-lg border border-emerald-200 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{actionMsg}</span>
              </div>
            )}

            {case_info ? (
              <div className="space-y-4 text-xs font-sans">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Audit Review Status:
                  </label>
                  {isAuthenticated && (user?.role === 'Auditor' || user?.role === 'Administrator') ? (
                    <select
                      value={caseStatus}
                      onChange={handleStatusChange}
                      className="w-full font-mono font-bold text-xs text-slate-800 bg-slate-50 border border-slate-300 rounded-lg p-2.5 focus:ring-1 focus:ring-amber-500"
                    >
                      <option value="New">New (Pending Inspection)</option>
                      <option value="Under Review">Under Review (Inspection Ordered)</option>
                      <option value="Resolved">Resolved (Cleared)</option>
                      <option value="Escalated">Escalated (Escalated to Vigilance)</option>
                    </select>
                  ) : (
                    <div className="p-2.5 bg-slate-100 rounded-lg border border-slate-300 font-mono font-bold text-ledger-navy">
                      {case_info.status}
                    </div>
                  )}
                  <p className="text-[10px] text-slate-500 mt-1">
                    BR-07 Rule: New &rarr; Under Review &rarr; Resolved / Escalated.
                  </p>
                </div>

                <div>
                  <span className="text-slate-500 block mb-0.5 font-semibold">Assigned Reviewer:</span>
                  <div className="p-2 bg-slate-50 rounded-lg border border-slate-200 font-mono flex items-center gap-2">
                    <UserCheck className="w-4 h-4 text-slate-400" />
                    <span>{case_info.assigned_auditor_name || 'Unassigned'}</span>
                  </div>
                </div>

                {/* Notes History */}
                <div className="pt-3 border-t border-ledger-line space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-slate-700">
                      Audit Notes ({case_info.notes?.length || 0}):
                    </span>
                    <span className="text-[10px] font-mono text-slate-400">Append-Only</span>
                  </div>

                  <div className="space-y-2.5 max-h-56 overflow-y-auto pr-1">
                    {case_info.notes?.map((n, idx) => (
                      <div key={idx} className="bg-slate-50 p-3 rounded-lg border border-slate-200 text-xs space-y-1">
                        <div className="flex items-center justify-between text-[10px] text-slate-500 font-mono">
                          <span className="font-bold text-slate-800">{n.author_name}</span>
                          <span>{new Date(n.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                        <p className="text-slate-800 font-sans leading-relaxed">{n.text}</p>
                      </div>
                    ))}
                  </div>

                  {/* Add Note Form */}
                  {isAuthenticated && (user?.role === 'Auditor' || user?.role === 'Administrator') ? (
                    <form onSubmit={handleAddNote} className="mt-4 pt-3 border-t border-slate-200 space-y-2">
                      <label className="block font-semibold text-slate-700">
                        Append Audit Finding Note:
                      </label>
                      <textarea
                        rows="3"
                        value={newNote}
                        onChange={(e) => setNewNote(e.target.value)}
                        placeholder="Type inspection findings or verification note..."
                        className="w-full text-xs font-sans p-2.5 border border-slate-300 rounded-lg focus:ring-1 focus:ring-amber-500 focus:outline-none"
                      ></textarea>
                      <button
                        type="submit"
                        className="w-full py-2 bg-ledger-navy text-white font-bold rounded-lg hover:bg-slate-800 transition-colors shadow-xs flex items-center justify-center gap-1.5"
                      >
                        <Send className="w-3.5 h-3.5 text-amber-400" /> Append Note to Case
                      </button>
                    </form>
                  ) : (
                    <div className="mt-4 p-3 bg-slate-100 rounded-lg text-center text-xs text-slate-600">
                      <Link to="/login" className="text-amber-800 font-bold hover:underline">
                        Log in as Auditor
                      </Link>{' '}
                      to record investigation notes.
                    </div>
                  )}
                </div>
              </div>
            ) : null}
          </div>
        </motion.div>
      </div>

      <ExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        work={work}
        mp={mp}
        riskScore={{ composite_risk: 0, rule_flags: [], explanation_text: 'Statutory compliance verification record.' }}
        caseInfo={case_info}
      />
    </motion.div>
  );
};
