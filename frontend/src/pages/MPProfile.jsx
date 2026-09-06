import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Breadcrumb } from '../components/Breadcrumb';
import { DisclaimerBanner } from '../components/DisclaimerBanner';
import { getMPById, CURRENT_LOK_SABHA_MPS } from '../data/realParliamentData';
import {
  User,
  CheckCircle2,
  Building2,
  ArrowRight,
  ShieldCheck,
  Award,
  Calendar,
  Layers,
  FileSpreadsheet,
  AlertCircle
} from 'lucide-react';

const containerVariants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.08 } }
};

const itemVariants = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.35 } }
};

export const MPProfile = () => {
  const { mp_id } = useParams();
  const [mpData, setMpData] = useState(null);
  const [works, setWorks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Find real MP by id or matching constituency
    const matched = getMPById(mp_id) || CURRENT_LOK_SABHA_MPS.find(m => m.mp_id === mp_id) || CURRENT_LOK_SABHA_MPS[0];
    setMpData(matched);

    // Fetch live works from API
    fetch(`/api/mps/${mp_id}`)
      .then((res) => res.json())
      .then((d) => {
        if (d && d.works) {
          setWorks(d.works);
        }
        setLoading(false);
      })
      .catch(() => {
        // No live works loaded yet
        setWorks([]);
        setLoading(false);
      });
  }, [mp_id]);

  if (!mpData) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8 animate-pulse space-y-4">
        <div className="h-6 bg-slate-200 w-1/4 rounded"></div>
        <div className="h-48 bg-slate-200 rounded-xl"></div>
      </div>
    );
  }

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6"
    >
      <Breadcrumb
        items={[
          { label: mpData.state, link: `/states/${encodeURIComponent(mpData.state || '')}` },
          { label: `${mpData.name} (${mpData.constituency})` }
        ]}
      />

      <DisclaimerBanner />

      {/* MP Dossier Header Card */}
      <motion.div
        variants={itemVariants}
        className="bg-white p-6 sm:p-8 rounded-3xl border border-ledger-line shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-6"
      >
        <div className="flex items-start gap-4">
          <div className="p-4 bg-gradient-to-br from-slate-100 to-slate-200 text-ledger-navy rounded-2xl border border-slate-300 shadow-sm">
            <User className="w-10 h-10" />
          </div>
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2.5">
              <h1 className="text-2xl sm:text-3xl font-serif font-bold text-ledger-navy">
                {mpData.name}
              </h1>
              <span className="text-xs font-mono font-bold bg-slate-100 text-slate-800 px-2.5 py-0.5 rounded-md border border-slate-300">
                {mpData.party}
              </span>
            </div>
            <div className="text-xs sm:text-sm text-slate-600 font-sans">
              Elected Member of Parliament for <span className="font-semibold text-slate-900">{mpData.constituency}</span>, {mpData.state} &middot; <span className="font-mono">{mpData.lok_sabha_term}</span>
            </div>

            {/* Statutory Allocation Norms (BR-01 & BR-03) */}
            <div className="mt-4 flex flex-wrap items-center gap-3 text-xs font-mono">
              <div className="flex items-center gap-1.5 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span className="text-slate-600">Annual Entitlement:</span>
                <span className="font-bold text-slate-900">₹5.00 Crore / Year</span>
              </div>
              <div className="flex items-center gap-1.5 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200">
                <span className="text-slate-600">SC Norm:</span>
                <span className="font-bold text-slate-900">15% Min Mandate</span>
              </div>
              <div className="flex items-center gap-1.5 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200">
                <span className="text-slate-600">ST Norm:</span>
                <span className="font-bold text-slate-900">7.5% Min Mandate</span>
              </div>
            </div>
          </div>
        </div>

        {/* Financial Info */}
        <div className="border-t lg:border-t-0 lg:border-l border-slate-200 pt-4 lg:pt-0 lg:pl-8 font-mono text-xs space-y-1">
          <div className="text-slate-500 text-[10px]">CONSTITUENCY ENTITLEMENT POOL</div>
          <div className="text-2xl font-bold text-ledger-navy">₹25.00 Cr</div>
          <div className="text-[10px] text-slate-400">5-Year Parliamentary Term Allocation</div>
        </div>
      </motion.div>

      {/* Sanctioned Works Ledger */}
      <motion.div
        variants={itemVariants}
        className="bg-white rounded-2xl border border-ledger-line shadow-xs overflow-hidden"
      >
        <div className="p-6 border-b border-ledger-line bg-slate-50 flex items-center justify-between">
          <div>
            <h2 className="font-serif font-bold text-lg text-ledger-navy">
              Sanctioned Works Ledger for {mpData.name}
            </h2>
            <p className="text-xs text-slate-600 font-sans mt-0.5">
              Constituency public infrastructure and welfare development projects.
            </p>
          </div>
          <span className="text-xs font-mono text-slate-500">{works.length} Works Recorded</span>
        </div>

        {works.length === 0 ? (
          <div className="py-16 px-6 text-center space-y-3">
            <div className="w-12 h-12 bg-slate-100 text-slate-400 rounded-full flex items-center justify-center mx-auto">
              <FileSpreadsheet className="w-6 h-6" />
            </div>
            <div className="font-serif font-bold text-base text-slate-700">
              No Work Sanction Records Loaded Yet
            </div>
            <p className="text-xs text-slate-500 font-sans max-w-md mx-auto">
              Sanctioned works will appear here automatically when the public MPLADS dataset CSV is ingested into the database via the Data Ingestion Panel in the Admin Hub.
            </p>
            <div className="pt-2">
              <Link
                to="/admin"
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-ledger-navy text-white text-xs font-semibold rounded-lg hover:bg-slate-800 transition-colors"
              >
                Go to Ingestion Panel &rarr;
              </Link>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm font-sans">
              <thead className="bg-slate-100 text-slate-700 font-mono text-xs uppercase border-b border-ledger-line">
                <tr>
                  <th className="py-3 px-4">Work ID</th>
                  <th className="py-3 px-4">Description</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Amount</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ledger-line">
                {works.map((w, idx) => (
                  <tr key={idx} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-ledger-navy">{w.work_id}</td>
                    <td className="py-3 px-4 text-slate-800">{w.description}</td>
                    <td className="py-3 px-4 text-xs font-medium text-slate-600">{w.category}</td>
                    <td className="py-3 px-4 font-mono font-medium">₹{(w.sanctioned_amount / 100000).toFixed(2)} L</td>
                    <td className="py-3 px-4 text-right">
                      <Link
                        to={`/works/${w.work_id}`}
                        className="text-xs font-semibold text-ledger-navy hover:text-amber-600 transition-colors inline-flex items-center gap-1"
                      >
                        Inspect Details &rarr;
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
};
