import React, { useContext, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { ShieldAlert, Search, User, LogOut, FileText, Settings, Database, CheckSquare } from 'lucide-react';

export const TopBar = () => {
  const { user, logout, isAuthenticated } = useContext(AuthContext);
  const [searchTerm, setSearchTerm] = useState('');
  const navigate = useNavigate();

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      navigate(`/works?search=${encodeURIComponent(searchTerm.trim())}`);
    }
  };

  return (
    <header className="bg-ledger-navy text-white shadow-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Left: Branding */}
        <Link to="/" className="flex items-center gap-3 group">
          <div className="p-2 bg-amber-500 text-ledger-navy rounded font-bold transition-transform group-hover:scale-105">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div>
            <div className="font-serif font-bold text-lg tracking-wide flex items-center gap-2">
              KOSH-DRISHTI <span className="text-xs font-sans font-normal bg-slate-700 text-amber-300 px-2 py-0.5 rounded border border-slate-600">SIH26102</span>
            </div>
            <div className="text-[10px] text-slate-300 font-sans tracking-tight">
              AI-Powered Anomaly & Fraud Detection in MPLAD Scheme
            </div>
          </div>
        </Link>

        {/* Center: Global Search Bar */}
        <form onSubmit={handleSearch} className="flex-1 max-w-md relative hidden md:block">
          <input
            type="text"
            placeholder="Search work description, MP name, work ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-800/90 text-white placeholder-slate-400 text-sm rounded-md py-1.5 pl-9 pr-4 border border-slate-700 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent font-sans"
          />
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
        </form>

        {/* Right: Navigation & Role-Aware Action */}
        <div className="flex items-center gap-3">
          <Link
            to="/works"
            className="text-xs font-medium px-3 py-1.5 rounded hover:bg-slate-800 transition-colors text-slate-200"
          >
            All Works
          </Link>

          {isAuthenticated && (user?.role === 'Auditor' || user?.role === 'Administrator') && (
            <Link
              to="/cases"
              className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 bg-amber-500/20 text-amber-300 rounded border border-amber-500/30 hover:bg-amber-500/30 transition-colors"
            >
              <CheckSquare className="w-3.5 h-3.5" />
              Case Queue
            </Link>
          )}

          {isAuthenticated && user?.role === 'Administrator' && (
            <Link
              to="/admin"
              className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 bg-slate-700 text-white rounded hover:bg-slate-600 transition-colors"
            >
              <Settings className="w-3.5 h-3.5 text-amber-400" />
              Admin Panel
            </Link>
          )}

          {isAuthenticated ? (
            <div className="flex items-center gap-3 border-l border-slate-700 pl-3">
              <div className="text-right hidden sm:block">
                <div className="text-xs font-semibold text-white">{user.name}</div>
                <div className="text-[10px] text-amber-400 font-mono">{user.role}</div>
              </div>
              <button
                onClick={logout}
                title="Log out"
                className="p-1.5 text-slate-300 hover:text-white hover:bg-slate-800 rounded transition-colors"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <Link
              to="/login"
              className="flex items-center gap-1.5 text-xs font-semibold px-3.5 py-1.5 bg-amber-500 text-ledger-navy rounded hover:bg-amber-400 transition-colors shadow-sm"
            >
              <User className="w-3.5 h-3.5" />
              Auditor Login
            </Link>
          )}
        </div>
      </div>
    </header>
  );
};
