import React from 'react';

export const RiskChip = ({ score }) => {
  let label = 'Low Risk';
  let bgColor = 'bg-emerald-50 text-emerald-800 border-emerald-300';
  let dotColor = 'bg-emerald-600';

  if (score >= 65) {
    label = 'High Risk';
    bgColor = 'bg-rose-50 text-rose-800 border-rose-300';
    dotColor = 'bg-rose-600';
  } else if (score >= 40) {
    label = 'Medium Risk';
    bgColor = 'bg-amber-50 text-amber-800 border-amber-300';
    dotColor = 'bg-amber-600';
  }

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-mono font-medium border ${bgColor}`}>
      <span className={`w-2 h-2 rounded-full ${dotColor}`}></span>
      {score}/100 — {label}
    </span>
  );
};
