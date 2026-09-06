import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Breadcrumb } from '../components/Breadcrumb';
import { RiskChip } from '../components/RiskChip';
import { RuleBadge } from '../components/RuleBadge';
import { User, CheckCircle2, AlertTriangle, ArrowRight, ShieldAlert } from 'lucide-react';

export const MPProfile = () => {
  const { mp_id } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/mps/${mp_id}`)
      .then(res => res.json())
      .then(d => {
        setData(d);
        setLoading(false);
      })
      .catch(err => {
        console.error('Error fetching MP profile:', err);
        setLoading(false);
      });
  }, [mp_id]);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8 animate-pulse space-y-4">
        <div className="h-6 bg-slate-200 w-1/4 rounded"></div>
        <div className="h-48 bg-slate-200 rounded"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Breadcrumb
        items={[
          { label: data?.state, link: `/states/${encodeURIComponent(data?.state || '')}` },
          { label: `${data?.name} (${data?.constituency})` }
        ]}
      />

      {/* MP Header Card */}
      <div className="bg-white p-6 rounded-lg border border-ledger-line shadow-xs mb-6 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div className="flex items-start gap-4">
          <div className="p-3.5 bg-slate-100 text-ledger-navy rounded-full border border-slate-300">
            <User className="w-8 h-8" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-serif font-bold text-ledger-navy">{data?.name}</h1>
              <span className="text-xs font-mono font-semibold bg-slate-100 text-slate-700 px-2 py-0.5 rounded border border-slate-300">
                {data?.party}
              </span>
            </div>
            <div className="text-sm text-slate-600 font-sans mt-0.5">
              MP for <span className="font-semibold text-slate-800">{data?.constituency}</span>, {data?.state} ({data?.lok_sabha_term})
            </div>

            {/* SC/ST Compliance Strip (BR-03) */}
            <div className="mt-3 flex flex-wrap items-center gap-3 text-xs font-mono">
              <div className="flex items-center gap-1.5 bg-slate-50 px-2.5 py-1 rounded border border-slate-200">
                <span className="text-slate-500">SC Spend:</span>
                <span className={`font-bold ${data?.sc_st_compliance?.sc_actual_pct >= 15 ? 'text-emerald-700' : 'text-rose-700'}`}>
                  {data?.sc_st_compliance?.sc_actual_pct}% (Target 15%)
                </span>
              </div>
              <div className="flex items-center gap-1.5 bg-slate-50 px-2.5 py-1 rounded border border-slate-200">
                <span className="text-slate-500">ST Spend:</span>
                <span className={`font-bold ${data?.sc_st_compliance?.st_actual_pct >= 7.5 ? 'text-emerald-700' : 'text-rose-700'}`}>
                  {data?.sc_st_compliance?.st_actual_pct}% (Target 7.5%)
                </span>
              </div>
              {data?.sc_st_compliance?.is_compliant ? (
                <span className="text-emerald-700 font-sans font-semibold flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> SC/ST Quota Compliant
                </span>
              ) : (
                <span className="text-rose-700 font-sans font-semibold flex items-center gap-1">
                  <AlertTriangle className="w-3.5 h-3.5" /> Rule R5 Quota Violation
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-6 border-t lg:border-t-0 lg:border-l border-slate-200 pt-4 lg:pt-0 lg:pl-6">
          <div>
            <div className="text-xs text-slate-500 font-sans">Total Entitlement</div>
            <div className="text-lg font-mono font-bold text-ledger-navy">₹{((data?.total_entitlement || 0)/10000000).toFixed(2)} Cr</div>
          </div>
          <div>
            <div className="text-xs text-slate-500 font-sans">Total Utilized</div>
            <div className="text-lg font-mono font-bold text-emerald-700">₹{((data?.total_utilized || 0)/10000000).toFixed(2)} Cr</div>
          </div>
          <div>
            <div className="text-xs text-slate-500 font-sans">Utilization %</div>
            <div className="text-lg font-mono font-bold text-ledger-navy">{data?.utilization_pct}%</div>
          </div>
        </div>
      </div>

      {/* Sanctioned Works Table */}
      <div className="bg-white rounded-lg border border-ledger-line shadow-xs overflow-hidden">
        <div className="p-4 border-b border-ledger-line bg-slate-50 flex items-center justify-between">
          <h2 className="font-serif font-semibold text-lg text-ledger-navy">
            Sanctioned Works for {data?.name} ({data?.works_count} Works)
          </h2>
          <span className="text-xs text-slate-500 font-mono">Sorted by Composite Risk Descending</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm font-sans">
            <thead className="bg-slate-100 text-slate-700 font-mono text-xs uppercase border-b border-ledger-line">
              <tr>
                <th className="py-3 px-4">Work ID</th>
                <th className="py-3 px-4">Description</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Amount</th>
                <th className="py-3 px-4">Triggered Rules</th>
                <th className="py-3 px-4">Risk Score</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ledger-line">
              {data?.works?.map((w, idx) => (
                <tr key={idx} className="hover:bg-slate-50 transition-colors">
                  <td className="py-3 px-4 font-mono font-semibold text-ledger-navy">{w.work_id}</td>
                  <td className="py-3 px-4 max-w-xs text-slate-800 truncate" title={w.description}>
                    {w.description}
                  </td>
                  <td className="py-3 px-4 text-xs font-medium text-slate-600">{w.category}</td>
                  <td className="py-3 px-4 font-mono font-medium">₹{(w.sanctioned_amount / 100000).toFixed(2)} Lakhs</td>
                  <td className="py-3 px-4">
                    <div className="flex flex-wrap gap-1">
                      {w.rule_flags && w.rule_flags.length > 0 ? (
                        w.rule_flags.map((rf, rIdx) => <RuleBadge key={rIdx} code={rf} />)
                      ) : (
                        <span className="text-xs text-slate-400 font-mono">None</span>
                      )}
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <RiskChip score={w.composite_risk} />
                  </td>
                  <td className="py-3 px-4 text-right">
                    <Link
                      to={`/works/${w.work_id}`}
                      className="text-xs font-semibold text-ledger-navy hover:text-amber-600 transition-colors inline-flex items-center gap-1"
                    >
                      Audit Details <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
