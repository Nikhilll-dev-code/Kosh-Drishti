import React from 'react';
import { Breadcrumb } from '../components/Breadcrumb';
import { DisclaimerBanner } from '../components/DisclaimerBanner';
import { RuleBadge } from '../components/RuleBadge';
import {
  BookOpen,
  Cpu,
  ShieldCheck,
  Scale,
  FileSpreadsheet,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Layers,
  Sparkles
} from 'lucide-react';

export const Methodology = () => {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <Breadcrumb items={[{ label: 'Audit Methodology & Technical Specifications' }]} />

      <DisclaimerBanner />

      {/* Hero */}
      <div className="bg-gradient-to-r from-ledger-navy to-[#162A45] text-white p-8 rounded-2xl shadow-lg space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 text-xs font-mono border border-amber-500/30">
          <BookOpen className="w-3.5 h-3.5" />
          FORENSIC ARCHITECTURE SPECIFICATIONS
        </div>
        <h1 className="text-3xl sm:text-4xl font-serif font-bold text-white">
          Kosh-Drishti Audit Methodology &amp; Mathematical Model
        </h1>
        <p className="text-sm text-slate-300 font-sans max-w-3xl leading-relaxed">
          Kosh-Drishti merges deterministic CAG performance audit rules with unsupervised machine learning to screen public fund utilization under the Members of Parliament Local Area Development Scheme (MPLADS).
        </p>
      </div>

      {/* Core Principles */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-ledger-line shadow-xs space-y-3">
          <div className="p-3 bg-amber-50 text-amber-700 rounded-xl w-fit">
            <Scale className="w-6 h-6" />
          </div>
          <h2 className="font-serif font-bold text-lg text-ledger-navy">
            Evidence Before Verdict
          </h2>
          <p className="text-xs text-slate-600 font-sans leading-relaxed">
            Every risk score is always paired with exact triggered rule codes and specific statutory guideline citations. No entity is accused without explicit data provenance (SRS BR-05).
          </p>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-ledger-line shadow-xs space-y-3">
          <div className="p-3 bg-emerald-50 text-emerald-700 rounded-xl w-fit">
            <Cpu className="w-6 h-6" />
          </div>
          <h2 className="font-serif font-bold text-lg text-ledger-navy">
            Deterministic + Unsupervised Fusion
          </h2>
          <p className="text-xs text-slate-600 font-sans leading-relaxed">
            Because fraudulent ground-truth labels are scarce in public procurement, we combine deterministic violation rules (R1&ndash;R6) with Isolation Forest vector anomaly scoring.
          </p>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-ledger-line shadow-xs space-y-3">
          <div className="p-3 bg-indigo-50 text-indigo-700 rounded-xl w-fit">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <h2 className="font-serif font-bold text-lg text-ledger-navy">
            Legal &amp; Statutory Grounding
          </h2>
          <p className="text-xs text-slate-600 font-sans leading-relaxed">
            Ground truth is calibrated directly against CAG Performance Audits (Report No. 4 of 2018) and the Ministry of Statistics and Programme Implementation (MoSPI) MPLADS Guidelines.
          </p>
        </div>
      </div>

      {/* The 6 Deterministic Rules Breakdown */}
      <div className="bg-white p-6 sm:p-8 rounded-2xl border border-ledger-line shadow-xs space-y-6">
        <div className="border-b border-ledger-line pb-4">
          <h2 className="font-serif font-bold text-2xl text-ledger-navy">
            The 6 Deterministic Detection Rules (R1–R6)
          </h2>
          <p className="text-xs text-slate-600 font-sans mt-0.5">
            Explicit violation criteria evaluated over every ingested work record.
          </p>
        </div>

        <div className="space-y-4 text-xs font-sans">
          {/* R1 */}
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-serif font-bold text-base text-ledger-navy flex items-center gap-2">
                <RuleBadge code="R1" /> Ineligible Work Category
              </span>
              <span className="font-mono text-[11px] text-slate-500">Weight: 35 pts</span>
            </div>
            <p className="text-slate-700 leading-relaxed">
              <span className="font-semibold">Logic:</span> Evaluates work description against prohibited statutory keywords (e.g. religious structures, private land, commercial complexes, clubs) per Para 3.3 negative list.
            </p>
            <div className="text-[11px] font-mono text-slate-500 bg-white p-2.5 rounded border border-slate-200">
              Citation: MPLADS Guidelines Para 3.3 (Prohibited Asset Categories).
            </div>
          </div>

          {/* R2 */}
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-serif font-bold text-base text-ledger-navy flex items-center gap-2">
                <RuleBadge code="R2" /> Duplicate Work Recommendation
              </span>
              <span className="font-mono text-[11px] text-slate-500">Weight: 30 pts</span>
            </div>
            <p className="text-slate-700 leading-relaxed">
              <span className="font-semibold">Logic:</span> Evaluates multi-field Token Jaccard text &amp; cost similarity across works in the constituency. Flags works with &ge;85% blended similarity matching an existing recommendation.
            </p>
            <div className="text-[11px] font-mono text-slate-500 bg-white p-2.5 rounded border border-slate-200">
              Citation: CAG Audit Report No. 4 of 2018 (Duplicate Sanction Findings).
            </div>
          </div>

          {/* R3 */}
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-serif font-bold text-base text-ledger-navy flex items-center gap-2">
                <RuleBadge code="R3" /> Excessive Delay / UC Lag
              </span>
              <span className="font-mono text-[11px] text-slate-500">Weight: 30 pts</span>
            </div>
            <p className="text-slate-700 leading-relaxed">
              <span className="font-semibold">Logic:</span> Measures timeline lag between work recommendation and Utilization Certificate (UC) filing. Flags works exceeding statutory window limit (&gt;225 days).
            </p>
            <div className="text-[11px] font-mono text-slate-500 bg-white p-2.5 rounded border border-slate-200">
              Citation: MPLADS Guidelines Para 6.4 (Mandatory UC Submission Timelines).
            </div>
          </div>

          {/* R4 */}
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-serif font-bold text-base text-ledger-navy flex items-center gap-2">
                <RuleBadge code="R4" /> Tender Threshold / Missing Tender Signal
              </span>
              <span className="font-mono text-[11px] text-slate-500">Weight: 20 pts</span>
            </div>
            <p className="text-slate-700 leading-relaxed">
              <span className="font-semibold">Logic:</span> Flags single works approaching or exceeding the competitive tender threshold (&ge;₹25 Lakhs) without attached tender ID. <span className="text-slate-500 italic">Note: Prototype screens single-work threshold proximity; multi-work split billing requires cross-work procurement linkage.</span>
            </p>
            <div className="text-[11px] text-slate-500 font-mono bg-white p-2.5 rounded border border-slate-200">
              Citation: MPLADS Procurement Mandate §7.2 (Mandatory E-Tendering Controls).
            </div>
          </div>

          {/* R5 */}
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-serif font-bold text-base text-ledger-navy flex items-center gap-2">
                <RuleBadge code="R5" /> IA Over-Concentration
              </span>
              <span className="font-mono text-[11px] text-slate-500">Weight: 15 pts</span>
            </div>
            <p className="text-slate-700 leading-relaxed">
              <span className="font-semibold">Logic:</span> Evaluates agency work share within a constituency. Flags implementing agencies holding &gt;35% concentration share.
            </p>
            <div className="text-[11px] text-slate-500 font-mono bg-white p-2.5 rounded border border-slate-200">
              Citation: MoSPI Competition &amp; Diversification Directives.
            </div>
          </div>

          {/* R6 */}
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-serif font-bold text-base text-ledger-navy flex items-center gap-2">
                <RuleBadge code="R6" /> Cost Benchmark Anomaly
              </span>
              <span className="font-mono text-[11px] text-slate-500">Weight: 20 pts</span>
            </div>
            <p className="text-slate-700 leading-relaxed">
              <span className="font-semibold">Logic:</span> Compares sanctioned cost against standard category cost benchmarks. Flags works exceeding 1.5x expected benchmark rate.
            </p>
            <div className="text-[11px] text-slate-500 font-mono bg-white p-2.5 rounded border border-slate-200">
              Citation: MoSPI Standard Unit Cost Norms for Public Infrastructure.
            </div>
          </div>
        </div>
      </div>

      {/* Composite Scoring Formula */}
      <div className="bg-white p-6 sm:p-8 rounded-2xl border border-ledger-line shadow-xs space-y-4">
        <h2 className="font-serif font-bold text-2xl text-ledger-navy">
          Composite Risk Mathematical Formula (FR-ML-02)
        </h2>
        <p className="text-xs text-slate-600 font-sans leading-relaxed">
          The final Composite Risk Score $S \in [0, 100]$ is computed deterministically by fusing rule hits with the normalized Isolation Forest anomaly vector:
        </p>

        <div className="p-4 bg-slate-900 text-amber-300 rounded-xl font-mono text-xs sm:text-sm overflow-x-auto">
          <code>
            Composite Risk Score = min(100, 0.65 &times; &sum;(Rule_Weights) + 0.35 &times; (Isolation_Forest_Score &times; 100))
          </code>
        </div>

        <p className="text-xs text-slate-600 font-sans leading-relaxed">
          Identical inputs evaluated twice are guaranteed to produce identical composite scores, satisfying SRS FR-ML-02 audit repeatability standards.
        </p>
      </div>
    </div>
  );
};
