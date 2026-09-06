import React from 'react';

const RULE_DESCRIPTIONS = {
  R1: 'R1: Duplicate Billing — High text & amount similarity with prior work by same IA across financial years',
  R2: 'R2: Tender Bypass — Sanctioned amount exceeds statutory cutoff without linked tender ID',
  R3: 'R3: Ineligible Category — Work description classifies under prohibited asset list (religious/private)',
  R4: 'R4: Chronic Under-utilization — Constituency utilization in bottom national decile for 2+ consecutive years',
  R5: 'R5: SC/ST Norm Violation — Constituency failed mandatory 15% SC / 7.5% ST annual spend quotas',
  R6: 'R6: Late / Missing UC — Utilization Certificate missing or submitted past 30-day statutory timeline'
};

export const RuleBadge = ({ code }) => {
  const desc = RULE_DESCRIPTIONS[code] || `Rule ${code}`;

  return (
    <span
      title={desc}
      className="cursor-help inline-block px-2 py-0.5 text-xs font-mono font-semibold bg-slate-800 text-white rounded border border-slate-700 hover:bg-slate-700 transition-colors shadow-sm"
    >
      [{code}]
    </span>
  );
};
