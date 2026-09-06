import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Breadcrumb } from '../components/Breadcrumb';
import { RiskChip } from '../components/RiskChip';
import { ArrowRight, UserCheck, AlertCircle } from 'lucide-react';

export const StateView = () => {
  const { stateName } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/states/${encodeURIComponent(stateName)}`)
      .then(res => res.json())
      .then(d => {
        setData(d);
        setLoading(false);
      })
      .catch(err => {
        console.error('Error fetching state details:', err);
        setLoading(false);
      });
  }, [stateName]);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8 animate-pulse space-y-4">
        <div className="h-6 bg-slate-200 w-1/4 rounded"></div>
        <div className="h-64 bg-slate-200 rounded"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Breadcrumb items={[{ label: stateName }]} />

      <div className="bg-white p-6 rounded-lg border border-ledger-line shadow-xs mb-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-serif font-bold text-ledger-navy">{stateName} — State Overview</h1>
          <p className="text-xs text-slate-600 font-sans mt-1">
            Displaying {data?.mps_count || 0} MPs and {data?.works_count || 0} sanctioned works across the state.
          </p>
        </div>
        <div className="flex items-center gap-4 text-xs font-mono bg-slate-50 p-3 rounded border border-slate-200">
          <div>
            <div className="text-slate-500">Registered MPs</div>
            <div className="text-lg font-bold text-ledger-navy">{data?.mps_count}</div>
          </div>
          <div className="border-l border-slate-300 pl-4">
            <div className="text-slate-500">Sanctioned Works</div>
            <div className="text-lg font-bold text-ledger-navy">{data?.works_count}</div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-ledger-line shadow-xs overflow-hidden">
        <div className="p-4 border-b border-ledger-line bg-slate-50 flex items-center justify-between">
          <h2 className="font-serif font-semibold text-lg text-ledger-navy">
            Members of Parliament (MPs) in {stateName}
          </h2>
          <span className="text-xs text-slate-500 font-mono">Sorted by Composite Risk Descending</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm font-sans">
            <thead className="bg-slate-100 text-slate-700 font-mono text-xs uppercase border-b border-ledger-line">
              <tr>
                <th className="py-3 px-4">MP Name</th>
                <th className="py-3 px-4">Constituency</th>
                <th className="py-3 px-4">Party</th>
                <th className="py-3 px-4">Works Count</th>
                <th className="py-3 px-4">Fund Utilization</th>
                <th className="py-3 px-4">Avg Composite Risk</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ledger-line">
              {data?.mps?.map((mp, idx) => (
                <tr key={idx} className="hover:bg-slate-50 transition-colors">
                  <td className="py-3 px-4 font-semibold text-ledger-navy">{mp.name}</td>
                  <td className="py-3 px-4 font-medium text-slate-700">{mp.constituency}</td>
                  <td className="py-3 px-4 font-mono text-xs text-slate-600">{mp.party}</td>
                  <td className="py-3 px-4 font-mono">{mp.works_count}</td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <div className="w-24 bg-slate-200 rounded-full h-2 overflow-hidden">
                        <div
                          className={`h-full ${mp.utilization_pct < 45 ? 'bg-rose-500' : 'bg-emerald-600'}`}
                          style={{ width: `${Math.min(100, mp.utilization_pct)}%` }}
                        ></div>
                      </div>
                      <span className="font-mono text-xs font-semibold">{mp.utilization_pct}%</span>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <RiskChip score={mp.avg_risk} />
                  </td>
                  <td className="py-3 px-4 text-right">
                    <Link
                      to={`/mps/${mp.mp_id}`}
                      className="text-xs font-semibold text-ledger-navy hover:text-amber-600 transition-colors inline-flex items-center gap-1"
                    >
                      View Works <ArrowRight className="w-3.5 h-3.5" />
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
