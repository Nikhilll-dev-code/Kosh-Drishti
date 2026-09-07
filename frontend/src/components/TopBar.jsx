import React, { useContext, useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import {
  ShieldAlert,
  Search,
  User,
  LogOut,
  Settings,
  CheckSquare,
  BookOpen,
  Menu,
  X,
  Sparkles,
  ChevronDown
} from 'lucide-react';

export const TopBar = () => {
  const { user, login, logout, isAuthenticated } = useContext(AuthContext);
  const { addToast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [roleDropdownOpen, setRoleDropdownOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      navigate(`/works?search=${encodeURIComponent(searchTerm.trim())}`);
      setSearchTerm('');
      setMobileMenuOpen(false);
    }
  };

  const handleQuickSwitch = (roleName) => {
    setRoleDropdownOpen(false);
    if (roleName === 'Public') {
      logout();
      addToast('Switched to Public Viewer (Unauthenticated)', 'info');
      navigate('/');
    } else if (roleName === 'Auditor') {
      login(
        {
          name: 'Rekha Sharma',
          email: 'rekha@da.gov.in',
          role: 'Auditor',
          department: 'District Authority Vadodara'
        },
        'demo-jwt-auditor-rekha'
      );
      addToast('Logged in as Auditor: Rekha Sharma (DA Officer)', 'success');
      navigate('/cases');
    } else if (roleName === 'Administrator') {
      login(
        {
          name: 'Surya Sashank',
          email: 'admin@koshdrishti.gov.in',
          role: 'Administrator',
          department: 'SIH MoSPI Applied AI Lead'
        },
        'demo-jwt-admin-surya'
      );
      addToast('Logged in as Administrator: Surya Sashank', 'success');
      navigate('/admin');
    } else if (roleName === 'Curator') {
      login(
        {
          name: 'Ananya Deshmukh',
          email: 'ananya.d@thehindu.co.in',
          role: 'Data Curator',
          department: 'Civic Data Watch'
        },
        'demo-jwt-curator-ananya'
      );
      addToast('Logged in as Data Curator: Ananya Deshmukh', 'info');
      navigate('/admin');
    }
  };

  const isActive = (path) => location.pathname === path;

  return (
    <header className="bg-ledger-navy text-white shadow-lg sticky top-0 z-40 border-b border-slate-700/60 backdrop-blur-md bg-opacity-95">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Left: Branding & SIH Tag */}
        <Link to="/" className="flex items-center gap-3 group shrink-0">
          <div className="p-2 bg-gradient-to-br from-amber-400 to-amber-500 text-ledger-navy rounded-lg font-bold shadow-md shadow-amber-500/20 transition-transform group-hover:scale-105">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div>
            <div className="font-serif font-bold text-lg tracking-wide flex items-center gap-2 text-slate-100">
              KOSH-DRISHTI
              <span className="text-[10px] font-mono font-semibold bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded border border-amber-500/30">
                SIH26102
              </span>
            </div>
            <div className="text-[10px] text-slate-300 font-sans hidden sm:block">
              AI Anomaly &amp; Fraud Detection &middot; MPLAD Scheme
            </div>
          </div>
        </Link>

        {/* Center: Global Search Bar */}
        <form onSubmit={handleSearch} className="flex-1 max-w-sm relative hidden md:block">
          <input
            type="text"
            placeholder="Search work ID, MP, district, description..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-800/90 text-white placeholder-slate-400 text-xs rounded-md py-2 pl-9 pr-4 border border-slate-700 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent font-sans transition-all"
          />
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
        </form>

        {/* Right: Desktop Navigation & Role-Aware Action */}
        <div className="hidden lg:flex items-center gap-2 text-xs">
          <Link
            to="/"
            className={`px-3 py-1.5 rounded font-medium transition-colors ${
              isActive('/') ? 'bg-slate-800 text-amber-300' : 'text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            National Map
          </Link>

          <Link
            to="/works"
            className={`px-3 py-1.5 rounded font-medium transition-colors ${
              isActive('/works') ? 'bg-slate-800 text-amber-300' : 'text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            Works Directory
          </Link>

          <Link
            to="/methodology"
            className={`flex items-center gap-1 px-3 py-1.5 rounded font-medium transition-colors ${
              isActive('/methodology') ? 'bg-slate-800 text-amber-300' : 'text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5 text-amber-400" />
            Methodology &amp; Rules
          </Link>

          {isAuthenticated && (user?.role === 'Auditor' || user?.role === 'Administrator') && (
            <Link
              to="/cases"
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded font-medium transition-colors ${
                isActive('/cases')
                  ? 'bg-amber-500 text-ledger-navy font-bold'
                  : 'bg-amber-500/15 text-amber-300 border border-amber-500/30 hover:bg-amber-500/25'
              }`}
            >
              <CheckSquare className="w-3.5 h-3.5" />
              Case Queue
            </Link>
          )}

          {isAuthenticated && user?.role === 'Administrator' && (
            <Link
              to="/admin"
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded font-medium transition-colors ${
                isActive('/admin')
                  ? 'bg-slate-700 text-white font-bold'
                  : 'bg-slate-800 text-slate-200 hover:bg-slate-700'
              }`}
            >
              <Settings className="w-3.5 h-3.5 text-amber-400" />
              Admin Hub
            </Link>
          )}

          {/* Quick Role Switcher Dropdown (Essential for Evaluation & Testing) */}
          <div className="relative ml-2">
            <button
              onClick={() => setRoleDropdownOpen(!roleDropdownOpen)}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-slate-800 border border-slate-700 text-slate-300 hover:text-white transition-colors text-[11px] font-mono"
            >
              <Sparkles className="w-3 h-3 text-amber-400" />
              Role: <span className="font-bold text-amber-300">{isAuthenticated ? user?.role : 'Public'}</span>
              <ChevronDown className="w-3 h-3" />
            </button>

            {roleDropdownOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-slate-900 border border-slate-700 rounded-lg shadow-xl py-1 z-50 text-xs font-sans">
                <div className="px-3 py-1.5 text-[10px] uppercase font-mono text-slate-400 border-b border-slate-800">
                  Switch Evaluation Role
                </div>
                <button
                  onClick={() => handleQuickSwitch('Public')}
                  className="w-full text-left px-3 py-2 text-slate-300 hover:bg-slate-800 hover:text-white flex items-center justify-between"
                >
                  <span>Public Viewer</span>
                  {!isAuthenticated && <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>}
                </button>
                <button
                  onClick={() => handleQuickSwitch('Auditor')}
                  className="w-full text-left px-3 py-2 text-slate-300 hover:bg-slate-800 hover:text-white flex items-center justify-between"
                >
                  <div>
                    <div>Auditor</div>
                    <div className="text-[10px] text-slate-400">Rekha Sharma (DA)</div>
                  </div>
                  {user?.role === 'Auditor' && <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>}
                </button>
                <button
                  onClick={() => handleQuickSwitch('Administrator')}
                  className="w-full text-left px-3 py-2 text-slate-300 hover:bg-slate-800 hover:text-white flex items-center justify-between"
                >
                  <div>
                    <div>Administrator</div>
                    <div className="text-[10px] text-slate-400">Surya Sashank (Lead)</div>
                  </div>
                  {user?.role === 'Administrator' && <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>}
                </button>
                <button
                  onClick={() => handleQuickSwitch('Curator')}
                  className="w-full text-left px-3 py-2 text-slate-300 hover:bg-slate-800 hover:text-white flex items-center justify-between"
                >
                  <div>
                    <div>Data Curator</div>
                    <div className="text-[10px] text-slate-400">Ananya (Civic Watch)</div>
                  </div>
                  {user?.role === 'Data Curator' && <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>}
                </button>
              </div>
            )}
          </div>

          {/* Auth Action */}
          {isAuthenticated ? (
            <div className="flex items-center gap-2 pl-2 border-l border-slate-700">
              <button
                onClick={logout}
                title="Log out"
                className="p-1.5 text-slate-300 hover:text-white hover:bg-slate-800 rounded transition-colors"
                aria-label="Log out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <Link
              to="/login"
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-gradient-to-r from-amber-500 to-amber-600 text-ledger-navy font-bold rounded hover:from-amber-400 hover:to-amber-500 transition-all shadow-md shadow-amber-500/20 text-xs ml-2"
            >
              <User className="w-3.5 h-3.5" />
              Login Portal
            </Link>
          )}
        </div>

        {/* Mobile Hamburger Button */}
        <div className="flex lg:hidden items-center gap-2">
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-slate-900 border-t border-slate-800 p-4 space-y-3 text-sm">
          <form onSubmit={handleSearch} className="relative mb-3">
            <input
              type="text"
              placeholder="Search work ID, MP, district..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-800 text-white placeholder-slate-400 text-xs rounded py-2 pl-8 pr-3 border border-slate-700"
            />
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
          </form>

          <Link
            to="/"
            onClick={() => setMobileMenuOpen(false)}
            className="block py-2 text-slate-200 hover:text-amber-400 font-medium"
          >
            National Heat-Map
          </Link>
          <Link
            to="/works"
            onClick={() => setMobileMenuOpen(false)}
            className="block py-2 text-slate-200 hover:text-amber-400 font-medium"
          >
            Works Directory
          </Link>
          <Link
            to="/methodology"
            onClick={() => setMobileMenuOpen(false)}
            className="block py-2 text-slate-200 hover:text-amber-400 font-medium"
          >
            Methodology &amp; Rules
          </Link>

          {isAuthenticated && (
            <>
              <Link
                to="/cases"
                onClick={() => setMobileMenuOpen(false)}
                className="block py-2 text-amber-300 hover:text-amber-400 font-medium"
              >
                Case Queue
              </Link>
              <Link
                to="/admin"
                onClick={() => setMobileMenuOpen(false)}
                className="block py-2 text-slate-200 hover:text-amber-400 font-medium"
              >
                Admin Hub
              </Link>
            </>
          )}

          <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
            {isAuthenticated ? (
              <div className="flex items-center justify-between w-full">
                <div>
                  <div className="text-xs font-bold text-white">{user?.name}</div>
                  <div className="text-[10px] text-amber-400 font-mono">{user?.role}</div>
                </div>
                <button
                  onClick={() => { logout(); setMobileMenuOpen(false); }}
                  className="text-xs text-rose-400 hover:underline"
                >
                  Log Out
                </button>
              </div>
            ) : (
              <Link
                to="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full text-center py-2 bg-amber-500 text-ledger-navy font-bold rounded"
              >
                Login to Auditor Portal
              </Link>
            )}
          </div>
        </div>
      )}
    </header>
  );
};
