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
                <RuleBadge code="R1" /> Duplicate Billing Signature
              </span>
              <span className="font-mono text-[11px] text-slate-500">Weight: 35 pts</span>
            </div>
            <p className="text-slate-700 leading-relaxed">
              <span className="font-semibold">Logic:</span> Computes natural language TF-IDF cosine similarity between work descriptions executed by the same Implementing Agency (IA) across multiple financial years. If similarity &ge;90% with identical or near-identical amounts on the same asset coordinate, both works are flagged.
            </p>
            <div className="text-[11px] text-slate-500 font-mono">
              Citation: CAG Report No. 4 of 2018 §4.3 &middot; Prevention of repeated billing for single physical assets.
            </div>
          </div>

          {/* R2 */}
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-serif font-bold text-base text-ledger-navy flex items-center gap-2">
                <RuleBadge code="R2" /> Tender Ceiling Bypass Flag
              </span>
              <span className="font-mono text-[11px] text-slate-500">Weight: 30 pts</span>
            </div>
            <p className="text-slate-700 leading-relaxed">
              <span className="font-semibold">Logic:</span> Flags works with a sanctioned amount exceeding the configured tender threshold (default ₹50 Lakhs) that omit a valid Central Public Procurement Portal (CPPP) or State e-tender identifier.
            </p>
            <div className="text-[11px] text-slate-500 font-mono">
              Citation: MPLADS Guidelines §3.12 &middot; General Financial Rules (GFR) 2017 Rule 144.
            </div>
          </div>

          {/* R3 */}
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-serif font-bold text-base text-ledger-navy flex items-center gap-2">
                <RuleBadge code="R3" /> Ineligible Category Classification
              </span>
              <span className="font-mono text-[11px] text-slate-500">Weight: 40 pts</span>
            </div>
            <p className="text-slate-700 leading-relaxed">
              <span className="font-semibold">Logic:</span> Applies YAKE keyphrase extraction and semantic entity matching to detect expenditure recommended for prohibited items (religious structures, commercial monuments, private trusts).
            </p>
            <div className="text-[11px] text-slate-500 font-mono">
              Citation: MPLADS Guidelines §2.4 Annexure-II &middot; List of Ineligible Works.
            </div>
          </div>

          {/* R4 */}
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-serif font-bold text-base text-ledger-navy flex items-center gap-2">
                <RuleBadge code="R4" /> Chronic Fund Under-Utilization
              </span>
              <span className="font-mono text-[11px] text-slate-500">Weight: 20 pts</span>
            </div>
            <p className="text-slate-700 leading-relaxed">
              <span className="font-semibold">Logic:</span> Computes the multi-year utilization decile for each MP and District Authority. If an entity falls into the lowest 10th percentile nationally for 2 or more consecutive years, Rule R4 triggers.
            </p>
            <div className="text-[11px] text-slate-500 font-mono">
              Citation: MoSPI Master Circular on Scheme Fund Flow §5.1.
            </div>
          </div>

          {/* R5 */}
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-serif font-bold text-base text-ledger-navy flex items-center gap-2">
                <RuleBadge code="R5" /> SC / ST Statutory Allocation Violation
              </span>
              <span className="font-mono text-[11px] text-slate-500">Weight: 25 pts</span>
            </div>
            <p className="text-slate-700 leading-relaxed">
              <span className="font-semibold">Logic:</span> Enforces the statutory mandate that at least 15% of an MP&apos;s annual sanctioned spend must benefit Scheduled Caste (SC) inhabited areas and 7.5% for Scheduled Tribe (ST) areas.
            </p>
            <div className="text-[11px] text-slate-500 font-mono">
              Citation: MPLADS Guidelines §3.2 &middot; Mandatory Social Justice Allocation Norms.
            </div>
          </div>

          {/* R6 */}
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-serif font-bold text-base text-ledger-navy flex items-center gap-2">
                <RuleBadge code="R6" /> Utilization Certificate (UC) Delay
              </span>
              <span className="font-mono text-[11px] text-slate-500">Weight: 25 pts</span>
            </div>
            <p className="text-slate-700 leading-relaxed">
              <span className="font-semibold">Logic:</span> Flags works where the Utilization Certificate is missing past the 30-day statutory window post-completion date (plus a configurable 15-day administrative grace buffer).
            </p>
            <div className="text-[11px] text-slate-500 font-mono">
              Citation: MPLADS Guidelines §4.4 &middot; GFR 2017 Rule 238(1) Form GFR 12-A.
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
