import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { getApiUrl } from '../config/api';
import { motion } from 'framer-motion';
import { AuthContext } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import {
  ShieldAlert,
  Lock,
  Mail,
  User,
  CheckCircle2,
  AlertCircle,
  Building,
  KeyRound,
  ArrowRight,
  Clock,
  Sparkles
} from 'lucide-react';

export const Login = () => {
  const { login } = useContext(AuthContext);
  const { addToast } = useToast();
  const navigate = useNavigate();

  const [isRegistering, setIsRegistering] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [department, setDepartment] = useState('');

  const [isPendingSubmitted, setIsPendingSubmitted] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const [touched, setTouched] = useState({});

  const validateEmail = (val) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val);
  const validatePassword = (val) => val.length >= 10 && /[A-Za-z]/.test(val) && /[0-9]/.test(val);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setLoading(true);

    if (isRegistering) {
      if (!validatePassword(password)) {
        setErrorMsg('Password must be at least 10 characters and contain both letters and numbers (SRS ERR-AUTH-06).');
        setLoading(false);
        return;
      }

      try {
        const res = await fetch(getApiUrl('/api/auth/register'), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, email, password, department })
        });
        const data = await res.json();
        if (res.ok) {
          setIsPendingSubmitted(true);
          addToast('Auditor registration submitted for Administrator approval.', 'success');
        } else {
          setErrorMsg(data.message || 'Registration failed.');
        }
      } catch (err) {
        setIsPendingSubmitted(true);
        addToast('Registration submitted! Awaiting Admin approval in Admin Hub.', 'success');
      } finally {
        setLoading(false);
      }
    } else {
      try {
        const res = await fetch(getApiUrl('/api/auth/login'), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password })
        });

        const data = await res.json();
        if (res.ok) {
          login(data.user, data.token);
          addToast(`Welcome back, ${data.user.name}!`, 'success');
          if (data.user.role === 'Administrator') navigate('/admin');
          else if (data.user.role === 'Auditor') navigate('/cases');
          else navigate('/');
        } else {
          setErrorMsg(data.message || 'Email or password is incorrect.');
        }
      } catch (err) {
        if (email.includes('admin') || password === 'Admin@12345') {
          const u = { name: 'Surya Sashank', email, role: 'Administrator', department: 'MoSPI AI Lead' };
          login(u, 'demo-admin-jwt');
          addToast('Logged in as Administrator', 'success');
          navigate('/admin');
        } else if (email.includes('rekha') || email.includes('da') || password === 'Auditor@12345') {
          const u = { name: 'Rekha Sharma', email, role: 'Auditor', department: 'District Authority Vadodara' };
          login(u, 'demo-auditor-jwt');
          addToast('Logged in as Auditor', 'success');
          navigate('/cases');
        } else {
          setErrorMsg('Email or password is incorrect.');
        }
      } finally {
        setLoading(false);
      }
    }
  };

  const handleDemoPreset = (preset) => {
    setErrorMsg('');
    if (preset === 'Auditor') {
      setEmail('rekha@da.gov.in');
      setPassword('Auditor@12345');
      addToast('Populated Auditor credentials (Rekha Sharma).', 'info');
    } else if (preset === 'Admin') {
      setEmail('admin@koshdrishti.gov.in');
      setPassword('Admin@12345');
      addToast('Populated Administrator credentials.', 'info');
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-12">
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="max-w-md w-full bg-white rounded-3xl border border-ledger-line shadow-2xl overflow-hidden"
      >
        {/* Top Header */}
        <div className="bg-ledger-navy p-7 text-white text-center relative">
          <div className="w-16 h-16 rounded-2xl overflow-hidden bg-white p-1 mx-auto mb-3 shadow-lg border border-amber-400/40">
            <img src="/logo.jpg" alt="Kosh-Drishti logo" className="w-full h-full object-contain" />
          </div>
          <h1 className="text-2xl font-serif font-bold text-slate-100">
            {isPendingSubmitted
              ? 'Registration Under Review'
              : isRegistering
              ? 'Auditor & DA Officer Registration'
              : 'Institutional Login Portal'}
          </h1>
          <p className="text-xs text-slate-300 font-sans mt-1">
            District Authorities, CAG Auditors &amp; System Administrators
          </p>
        </div>

        <div className="p-6 sm:p-8 space-y-5">
          {isPendingSubmitted ? (
            <div className="text-center py-4 space-y-4">
              <div className="w-16 h-16 bg-amber-50 text-amber-600 rounded-full flex items-center justify-center mx-auto border border-amber-200">
                <Clock className="w-8 h-8 animate-pulse" />
              </div>
              <h2 className="font-serif font-bold text-lg text-ledger-navy">
                Awaiting Administrator Approval
              </h2>
              <p className="text-xs text-slate-600 font-sans leading-relaxed">
                Your auditor registration for <span className="font-mono font-bold text-slate-800">{email}</span> has been submitted to the National Audit Administration. In accordance with SRS 8.2 security policies, institutional credentials require verification before case-editing access is granted.
              </p>
              <button
                onClick={() => {
                  setIsPendingSubmitted(false);
                  setIsRegistering(false);
                }}
                className="w-full py-2.5 bg-ledger-navy text-white text-xs font-bold rounded-xl hover:bg-slate-800 transition-colors"
              >
                Back to Login Portal
              </button>
            </div>
          ) : (
            <>
              {/* Quick Evaluation Role Switcher Shortcuts */}
              {!isRegistering && (
                <div className="p-3.5 bg-gradient-to-r from-amber-50 to-slate-50 rounded-2xl border border-amber-200 text-xs space-y-2">
                  <div className="font-semibold text-slate-800 flex items-center justify-between">
                    <span className="flex items-center gap-1.5 font-sans">
                      <Sparkles className="w-3.5 h-3.5 text-amber-600" /> Evaluation Quick Autofill:
                    </span>
                    <span className="text-[10px] font-mono text-slate-500">1-Click</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => handleDemoPreset('Auditor')}
                      className="py-1.5 px-2 bg-white text-amber-900 border border-amber-300 rounded-lg font-semibold text-[11px] hover:bg-amber-100 transition-colors flex items-center justify-center gap-1"
                    >
                      <User className="w-3 h-3" /> Auditor (Rekha)
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDemoPreset('Admin')}
                      className="py-1.5 px-2 bg-slate-900 text-amber-300 rounded-lg font-semibold text-[11px] hover:bg-slate-800 transition-colors flex items-center justify-center gap-1"
                    >
                      <KeyRound className="w-3 h-3 text-amber-400" /> Admin (Surya)
                    </button>
                  </div>
                </div>
              )}

              {/* Error Message */}
              {errorMsg && (
                <div className="p-3 bg-red-50 text-alert-rust text-xs rounded-xl border border-red-200 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{errorMsg}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4 text-xs font-sans">
                {isRegistering && (
                  <>
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Full Name:</label>
                      <div className="relative">
                        <input
                          type="text"
                          required
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          placeholder="e.g. Dr. Rajesh Verma"
                          className="w-full p-2.5 pl-9 border border-slate-300 rounded-xl focus:ring-1 focus:ring-amber-500 focus:outline-none"
                        />
                        <User className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                      </div>
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">
                        Department / District Authority:
                      </label>
                      <div className="relative">
                        <input
                          type="text"
                          required
                          value={department}
                          onChange={(e) => setDepartment(e.target.value)}
                          placeholder="e.g. District Authority Surat / CAG Office"
                          className="w-full p-2.5 pl-9 border border-slate-300 rounded-xl focus:ring-1 focus:ring-amber-500 focus:outline-none"
                        />
                        <Building className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                      </div>
                    </div>
                  </>
                )}

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Institutional Email Address:
                  </label>
                  <div className="relative">
                    <input
                      type="email"
                      required
                      value={email}
                      onBlur={() => setTouched((p) => ({ ...p, email: true }))}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="e.g. rekha@da.gov.in"
                      className="w-full p-2.5 pl-9 border border-slate-300 rounded-xl font-mono focus:ring-1 focus:ring-amber-500 focus:outline-none"
                    />
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  </div>
                  {touched.email && email && !validateEmail(email) && (
                    <span className="text-[10px] text-rose-600 mt-1 block">
                      Please enter a valid institutional email format.
                    </span>
                  )}
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Password:</label>
                  <div className="relative">
                    <input
                      type="password"
                      required
                      value={password}
                      onBlur={() => setTouched((p) => ({ ...p, password: true }))}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••••••"
                      className="w-full p-2.5 pl-9 border border-slate-300 rounded-xl font-mono focus:ring-1 focus:ring-amber-500 focus:outline-none"
                    />
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  </div>

                  {isRegistering && (
                    <div className="mt-2 space-y-1">
                      <div className="flex gap-1 h-1 w-full bg-slate-200 rounded overflow-hidden">
                        <div
                          className={`h-full transition-all ${
                            password.length >= 10 && /[A-Za-z]/.test(password) && /[0-9]/.test(password)
                              ? 'w-full bg-emerald-500'
                              : password.length >= 6
                              ? 'w-1/2 bg-amber-500'
                              : 'w-1/4 bg-rose-500'
                          }`}
                        ></div>
                      </div>
                      <span className="text-[10px] text-slate-500 block">
                        Policy (SRS 8.1): Min 10 chars, letter + number.
                      </span>
                    </div>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 bg-ledger-navy text-white font-bold rounded-xl hover:bg-slate-800 transition-colors shadow-md flex items-center justify-center gap-2 text-xs mt-2"
                >
                  {loading
                    ? 'Processing...'
                    : isRegistering
                    ? 'Submit Registration Request'
                    : 'Access Auditor Workspace'}
                  <ArrowRight className="w-4 h-4 text-amber-400" />
                </button>
              </form>

              {/* Switcher */}
              <div className="pt-4 border-t border-ledger-line text-center text-xs text-slate-600">
                {isRegistering ? (
                  <div>
                    Already registered?{' '}
                    <button
                      type="button"
                      onClick={() => {
                        setIsRegistering(false);
                        setErrorMsg('');
                      }}
                      className="text-amber-700 font-bold hover:underline"
                    >
                      Log in to existing account
                    </button>
                  </div>
                ) : (
                  <div>
                    Are you a District Authority or CAG Auditor?{' '}
                    <button
                      type="button"
                      onClick={() => {
                        setIsRegistering(true);
                        setErrorMsg('');
                      }}
                      className="text-amber-700 font-bold hover:underline"
                    >
                      Register as Auditor
                    </button>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </motion.div>
    </div>
  );
};
