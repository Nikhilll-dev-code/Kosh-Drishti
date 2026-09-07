import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import { TopBar } from './components/TopBar';
import { LoadingSplash } from './components/LoadingSplash';
import { ScrollProgress } from './components/ScrollProgress';
import { Home } from './pages/Home';
import { StateView } from './pages/StateView';
import { MPProfile } from './pages/MPProfile';
import { WorksList } from './pages/WorksList';
import { WorkDetail } from './pages/WorkDetail';
import { CaseQueue } from './pages/CaseQueue';
import { AdminPanel } from './pages/AdminPanel';
import { Login } from './pages/Login';
import { Methodology } from './pages/Methodology';
import { ShieldAlert, ExternalLink, Award, FileSpreadsheet, Lock } from 'lucide-react';

export function App() {
  const [showSplash, setShowSplash] = useState(() => {
    // Show splash on initial session load
    return !sessionStorage.getItem('kd_splash_shown');
  });

  const handleSplashFinish = () => {
    sessionStorage.setItem('kd_splash_shown', 'true');
    setShowSplash(false);
  };

  return (
    <AuthProvider>
      <ToastProvider>
        {showSplash && <LoadingSplash onFinish={handleSplashFinish} />}

        <Router>
          <div className="min-h-screen flex flex-col bg-paper text-slate-800 font-sans selection:bg-amber-500 selection:text-ledger-navy">
            {/* Top Viewport Scroll Progress Bar & Floating Back-to-Top Button */}
            <ScrollProgress />

            {/* Sticky Navigation Top Bar */}
            <TopBar />

            {/* Main Application Viewport */}
            <main className="flex-1">
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/states/:stateName" element={<StateView />} />
                <Route path="/mps/:mp_id" element={<MPProfile />} />
                <Route path="/works" element={<WorksList />} />
                <Route path="/works/:work_id" element={<WorkDetail />} />
                <Route path="/cases" element={<CaseQueue />} />
                <Route path="/admin" element={<AdminPanel />} />
                <Route path="/login" element={<Login />} />
                <Route path="/methodology" element={<Methodology />} />
              </Routes>
            </main>

            {/* Comprehensive Institutional Government Footer */}
            <footer className="bg-slate-900 text-slate-400 text-xs py-10 border-t border-slate-800 font-sans mt-16">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-8 border-b border-slate-800 pb-8">
                  <div className="md:col-span-2 space-y-3">
                    <div className="flex items-center gap-2 text-white font-serif font-bold text-base">
                      <div className="p-1.5 bg-amber-500 text-ledger-navy rounded-md font-bold">
                        <ShieldAlert className="w-4 h-4" />
                      </div>
                      KOSH-DRISHTI &middot; SIH26102
                    </div>
                    <p className="text-xs text-slate-400 leading-relaxed max-w-md">
                      AI-Powered Anomaly &amp; Fraud Detection Platform for the Members of Parliament Local Area Development Scheme (MPLADS). Built with CAG audit rule grounding, unsupervised Isolation Forest vector anomaly scoring, and plain-language evidence synthesis.
                    </p>
                    <div className="inline-flex items-center gap-2 text-[11px] text-amber-400 font-mono">
                      <Award className="w-3.5 h-3.5" /> Smart India Hackathon 2026 Official Prototype
                    </div>
                  </div>

                  <div className="space-y-2 text-xs">
                    <div className="font-semibold text-slate-200 uppercase font-mono text-[11px] tracking-wider">
                      Drill-Down Navigation
                    </div>
                    <ul className="space-y-1.5 text-slate-400">
                      <li><a href="/" className="hover:text-amber-400 transition-colors">National Risk Heat-Map</a></li>
                      <li><a href="/works" className="hover:text-amber-400 transition-colors">543-Constituency Works Directory</a></li>
                      <li><a href="/works/GJ-2023-4471" className="hover:text-amber-400 transition-colors">Gujarat Confirmed Case Study</a></li>
                      <li><a href="/methodology" className="hover:text-amber-400 transition-colors">Rule Engine &amp; ML Architecture</a></li>
                    </ul>
                  </div>

                  <div className="space-y-2 text-xs">
                    <div className="font-semibold text-slate-200 uppercase font-mono text-[11px] tracking-wider">
                      Governance &amp; Authority
                    </div>
                    <ul className="space-y-1.5 text-slate-400">
                      <li><a href="/cases" className="hover:text-amber-400 transition-colors">Auditor Case Queue (Rekha Sharma)</a></li>
                      <li><a href="/admin" className="hover:text-amber-400 transition-colors">System Admin Hub (Surya Sashank)</a></li>
                      <li><a href="/login" className="hover:text-amber-400 transition-colors">Auditor / DA Officer Login</a></li>
                      <li>
                        <button
                          onClick={() => {
                            sessionStorage.removeItem('kd_splash_shown');
                            setShowSplash(true);
                          }}
                          className="text-amber-400 hover:underline text-[11px] flex items-center gap-1"
                        >
                          Replay Initialization Scan &rarr;
                        </button>
                      </li>
                    </ul>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] text-slate-500">
                  <div>
                    Ministry of Statistics and Programme Implementation (MoSPI) &middot; Government of India
                  </div>
                  <div>
                    Developed by Team Lead Basina Surya Sashank &middot; Geethanjali College of Engineering and Technology (GCET), Hyderabad
                  </div>
                </div>
              </div>
            </footer>
          </div>
        </Router>
      </ToastProvider>
    </AuthProvider>
  );
}

export default App;
