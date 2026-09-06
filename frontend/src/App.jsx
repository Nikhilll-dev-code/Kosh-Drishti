import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { TopBar } from './components/TopBar';
import { Home } from './pages/Home';
import { StateView } from './pages/StateView';
import { MPProfile } from './pages/MPProfile';
import { WorksList } from './pages/WorksList';
import { WorkDetail } from './pages/WorkDetail';
import { CaseQueue } from './pages/CaseQueue';
import { AdminPanel } from './pages/AdminPanel';
import { Login } from './pages/Login';

export function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen flex flex-col bg-paper text-slate-800 font-sans">
          <TopBar />
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
            </Routes>
          </main>

          <footer className="bg-slate-900 text-slate-400 text-xs py-6 border-t border-slate-800 font-sans mt-12">
            <div className="max-w-7xl mx-auto px-4 text-center space-y-2">
              <div className="font-serif text-slate-200 font-semibold text-sm">
                KOSH-DRISHTI — AI-Powered Anomaly & Fraud Detection in MPLAD Scheme Implementation
              </div>
              <div className="font-mono text-[11px] text-slate-400">
                SIH Problem Statement ID: SIH26102 | Ministry of Statistics and Programme Implementation (MoSPI) | Built for Smart India Hackathon 2026
              </div>
              <div className="text-[10px] text-slate-500">
                Prepared by Geethanjali College of Engineering and Technology (GCET), Hyderabad
              </div>
            </div>
          </footer>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
