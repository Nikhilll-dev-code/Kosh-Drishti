import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Breadcrumb } from '../components/Breadcrumb';
import { DisclaimerBanner } from '../components/DisclaimerBanner';
import { ALL_INDIAN_STATES, getMPsByState, CURRENT_LOK_SABHA_MPS } from '../data/realParliamentData';
import {
  Building2,
  Users,
  ArrowRight,
  Search,
  Compass,
  FileSpreadsheet,
  Award,
  CheckCircle2
} from 'lucide-react';

const containerVariants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.06 } }
};

const itemVariants = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.35 } }
};

export const StateView = () => {
  const { stateName } = useParams();
  const [searchMp, setSearchMp] = useState('');
  const [partyFilter, setPartyFilter] = useState('All');

  // Find state info
  const stateMeta = ALL_INDIAN_STATES.find(
    (s) => s.state.toLowerCase() === stateName?.toLowerCase()
  ) || { state: stateName, capital: 'State Capital', mps_count: 26, lok_sabha_term: '18th Lok Sabha' };

  // Get current real MPs for this state
  const mpsList = getMPsByState(stateName);

  // If specific state has fewer detailed MP entries, fallback to state list or all MPs for demonstration
  const displayMps = mpsList.length > 0 ? mpsList : CURRENT_LOK_SABHA_MPS.slice(0, 10);

  const filteredMps = displayMps.filter((m) => {
    const matchesSearch =
      m.name.toLowerCase().includes(searchMp.toLowerCase()) ||
      m.constituency.toLowerCase().includes(searchMp.toLowerCase());
    const matchesParty = partyFilter === 'All' || m.party === partyFilter;
    return matchesSearch && matchesParty;
  });

  const uniqueParties = Array.from(new Set(displayMps.map((m) => m.party)));

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6"
    >
      <Breadcrumb items={[{ label: stateName }]} />

      <DisclaimerBanner />

      {/* State Header Card */}
      <motion.div
        variants={itemVariants}
        className="bg-white p-6 sm:p-8 rounded-2xl border border-ledger-line shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-6"
      >
        <div className="space-y-1.5">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 text-slate-700 text-xs font-mono font-medium">
            <Compass className="w-3.5 h-3.5 text-amber-600" />
            STATE PARLIAMENTARY OVERVIEW &middot; 18TH LOK SABHA
          </div>
          <h1 className="text-2xl sm:text-3xl font-serif font-bold text-ledger-navy">
            {stateName}
          </h1>
          <p className="text-xs text-slate-600 font-sans">
            Capital / Headquarters: <span className="font-semibold text-slate-800">{stateMeta.capital}</span> &middot; Total Parliamentary Constituencies: <span className="font-semibold font-mono text-slate-800">{stateMeta.mps_count} Seats</span>
          </p>
        </div>

        <div className="flex items-center gap-4 font-mono text-xs bg-slate-50 p-4 rounded-xl border border-slate-200">
          <div>
            <div className="text-slate-500 text-[10px]">LOK SABHA SEATS</div>
            <div className="text-xl font-bold text-ledger-navy">{stateMeta.mps_count} Seats</div>
          </div>
          <div className="border-l border-slate-300 pl-4">
            <div className="text-slate-500 text-[10px]">ANNUAL ALLOCATION POOL</div>
            <div className="text-lg font-bold text-amber-700">₹{(stateMeta.mps_count * 5).toFixed(0)} Cr / Year</div>
          </div>
        </div>
      </motion.div>

      {/* MPs Table */}
      <motion.div
        variants={itemVariants}
        className="bg-white rounded-2xl border border-ledger-line shadow-xs overflow-hidden"
      >
        <div className="p-6 border-b border-ledger-line bg-slate-50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="font-serif font-bold text-lg text-ledger-navy">
              Elected Members of Parliament (MPs) &mdash; {stateName}
            </h2>
            <p className="text-xs text-slate-600 font-sans mt-0.5">
              Roster of active 18th Lok Sabha representatives across parliamentary constituencies.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Party Filter */}
            <select
              value={partyFilter}
              onChange={(e) => setPartyFilter(e.target.value)}
              className="p-2 border border-slate-300 rounded-lg bg-white font-sans text-xs focus:ring-1 focus:ring-amber-500"
            >
              <option value="All">All Parties</option>
              {uniqueParties.map((p) => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>

            {/* Search MP */}
            <div className="relative max-w-xs w-full">
              <input
                type="text"
                placeholder="Search MP or constituency..."
                value={searchMp}
                onChange={(e) => setSearchMp(e.target.value)}
                className="w-full p-2 pl-8 text-xs border border-slate-300 rounded-lg bg-white font-sans focus:ring-1 focus:ring-amber-500 focus:outline-none"
              />
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm font-sans">
            <thead className="bg-slate-100 text-slate-700 font-mono text-xs uppercase border-b border-ledger-line">
              <tr>
                <th className="py-3.5 px-4">Constituency</th>
                <th className="py-3.5 px-4">Elected Member of Parliament (MP)</th>
                <th className="py-3.5 px-4">Political Affiliation</th>
                <th className="py-3.5 px-4">Term</th>
                <th className="py-3.5 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ledger-line">
              {filteredMps.map((mp, idx) => (
                <motion.tr
                  key={idx}
                  whileHover={{ backgroundColor: '#F8FAFC' }}
                  className="transition-colors group"
                >
                  <td className="py-3.5 px-4 font-semibold text-ledger-navy">{mp.constituency}</td>
                  <td className="py-3.5 px-4 font-medium text-slate-900 flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-slate-200 text-slate-700 text-xs flex items-center justify-center font-serif font-bold">
                      {mp.name.charAt(0)}
                    </span>
                    {mp.name}
                  </td>
                  <td className="py-3.5 px-4">
                    <span className="px-2.5 py-0.5 rounded-md bg-slate-100 text-slate-800 font-mono text-xs border border-slate-300 font-semibold">
                      {mp.party}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 font-mono text-xs text-slate-500">{mp.lok_sabha_term}</td>
                  <td className="py-3.5 px-4 text-right">
                    <Link
                      to={`/mps/${mp.mp_id}`}
                      className="text-xs font-bold text-ledger-navy group-hover:text-amber-600 transition-colors inline-flex items-center gap-1"
                    >
                      Inspect MP Profile <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>
    </motion.div>
  );
};
