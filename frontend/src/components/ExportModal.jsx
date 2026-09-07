import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldAlert, Download, Printer, X, CheckCircle2, FileText } from 'lucide-react';
import { useToast } from '../context/ToastContext';

export const ExportModal = ({ isOpen, onClose, work, mp, riskScore, caseInfo }) => {
  const { addToast } = useToast();

  if (!isOpen || !work) return null;

  const handlePrint = () => {
    addToast('Opening Print Preview for Official Audit Dossier...', 'info');
    window.print();
  };

  const handleDownloadCSV = () => {
    const csvContent = "data:text/csv;charset=utf-8," +
      "Work ID,MP ID,MP Name,State,Constituency,Sanctioned Amount,Completion Date,UC Filed Date,Composite Risk,Anomaly Score,Rule Flags,Explanation\n" +
      `"${work.work_id}","${work.mp_id}","${mp?.name || ''}","${work.state}","${mp?.constituency || ''}",${work.sanctioned_amount},"${work.completion_date || ''}","${work.uc_filed_date || ''}",${riskScore?.composite_risk || 0},${riskScore?.anomaly_score || 0},"${(riskScore?.rule_flags || []).join(';') || 'None'}","${(riskScore?.explanation_text || '').replace(/"/g, '""')}"`;

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `KOSH_DRISHTI_AUDIT_REPORT_${work.work_id}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    addToast(`Audit Case ${work.work_id} exported as CSV.`, 'success');
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ duration: 0.2 }}
          className="bg-white rounded-xl shadow-2xl max-w-2xl w-full border border-ledger-line overflow-hidden my-8"
        >
          {/* Header */}
          <div className="bg-ledger-navy text-white p-5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-amber-500 text-ledger-navy rounded-lg">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-serif font-bold text-lg text-amber-300">
                  Official Case Audit Report Preview
                </h3>
                <p className="text-xs text-slate-300 font-mono">
                  SIH26102 &bull; MoSPI MPLADS Forensic Evidence Package
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-slate-300 hover:text-white p-1 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Printable Report Content */}
          <div className="p-6 space-y-5 text-xs font-sans text-slate-800 bg-[#FAFAFA]" id="printable-audit-dossier">
            {/* National Seal & Memo Header */}
            <div className="border-b-2 border-slate-800 pb-4 flex items-center justify-between">
              <div>
                <div className="font-serif font-bold text-base text-slate-900 uppercase">
                  Government of India &middot; MoSPI
                </div>
                <div className="text-[11px] text-slate-600 font-sans">
                  MPLAD Scheme Implementation & Anomaly Screening Division
                </div>
              </div>
              <div className="text-right font-mono text-[11px]">
                <div>Ref: <span className="font-bold">{work.work_id}</span></div>
                <div>Date: {new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</div>
              </div>
            </div>

            {/* Disclaimer */}
            <div className="p-3 bg-amber-50 border border-amber-200 rounded text-amber-900 text-[11px]">
              <span className="font-bold">STATUTORY NOTICE:</span> This screening dossier is generated algorithmically by Kosh-Drishti (SIH26102) via CAG-grounded rule heuristics and unsupervised Isolation Forest ML scoring. It serves as an investigative screening alert, not a legal verdict.
            </div>

            {/* Score & Attributes Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 font-mono">
              <div className="bg-white p-3 rounded border border-slate-200">
                <span className="text-slate-500 text-[10px] block">COMPOSITE RISK</span>
                <span className="text-xl font-bold text-alert-rust">{riskScore?.composite_risk || 0}/100</span>
              </div>
              <div className="bg-white p-3 rounded border border-slate-200">
                <span className="text-slate-500 text-[10px] block">ANOMALY SCORE</span>
                <span className="text-xl font-bold text-slate-800">{riskScore?.anomaly_score || '0.00'}</span>
              </div>
              <div className="bg-white p-3 rounded border border-slate-200">
                <span className="text-slate-500 text-[10px] block">SANCTIONED AMOUNT</span>
                <span className="text-lg font-bold text-ledger-navy">₹{((work.sanctioned_amount || 0)/100000).toFixed(2)} L</span>
              </div>
              <div className="bg-white p-3 rounded border border-slate-200">
                <span className="text-slate-500 text-[10px] block">RULE FLAGS</span>
                <span className="text-sm font-bold text-amber-700">{(riskScore?.rule_flags || []).join(', ') || 'None'}</span>
              </div>
            </div>

            {/* Subject Entity Data */}
            <div className="bg-white p-4 rounded border border-slate-200 space-y-2">
              <div className="font-serif font-bold text-sm text-slate-900 border-b border-slate-100 pb-1">
                Subject Constituency & Work Particulars
              </div>
              <div className="grid grid-cols-2 gap-2 text-[11px]">
                <div><span className="text-slate-500">MP Name:</span> <span className="font-semibold">{mp?.name || work.mp_id}</span></div>
                <div><span className="text-slate-500">Constituency:</span> <span className="font-semibold">{mp?.constituency || 'N/A'}, {work.state}</span></div>
                <div><span className="text-slate-500">Category:</span> <span>{work.category}</span></div>
                <div><span className="text-slate-500">Implementing Agency:</span> <span className="font-mono">{work.ia_id}</span></div>
                <div><span className="text-slate-500">Sanction Date:</span> <span className="font-mono">{work.sanction_date}</span></div>
                <div><span className="text-slate-500">UC Filed Date:</span> <span className="font-mono">{work.uc_filed_date || 'NOT FILED'}</span></div>
              </div>
            </div>

            {/* Plain Language Evidence */}
            <div className="bg-white p-4 rounded border border-slate-200 space-y-1.5">
              <div className="font-serif font-bold text-sm text-slate-900">
                Evidence Synthesis & Guideline Citation
              </div>
              <p className="text-slate-700 font-sans leading-relaxed text-xs">
                {riskScore?.explanation_text || 'No violations noted.'}
              </p>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="bg-slate-100 p-4 border-t border-slate-200 flex items-center justify-between">
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-700 hover:text-slate-900 transition-colors"
            >
              Close
            </button>
            <div className="flex items-center gap-3">
              <button
                onClick={handleDownloadCSV}
                className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold bg-white text-slate-800 border border-slate-300 rounded hover:bg-slate-50 transition-colors shadow-xs"
              >
                <Download className="w-4 h-4 text-slate-600" />
                Download CSV
              </button>
              <button
                onClick={handlePrint}
                className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold bg-ledger-navy text-white rounded hover:bg-slate-800 transition-colors shadow-xs"
              >
                <Printer className="w-4 h-4 text-amber-400" />
                Print / Save PDF Report
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
