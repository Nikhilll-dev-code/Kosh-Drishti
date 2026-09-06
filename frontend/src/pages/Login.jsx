import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { ShieldAlert, Lock, Mail, User, CheckCircle2, AlertCircle } from 'lucide-react';

export const Login = () => {
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  const [isRegistering, setIsRegistering] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');

  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    const endpoint = isRegistering ? '/api/auth/register' : '/api/auth/login';
    const payload = isRegistering ? { name, email, password } : { email, password };

    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (!res.ok) {
        setErrorMsg(data.message || 'Authentication error.');
      } else {
        if (isRegistering) {
          setSuccessMsg(data.message);
          setIsRegistering(false);
        } else {
          login(data.user, data.token);
          if (data.user.role === 'Administrator') navigate('/admin');
          else if (data.user.role === 'Auditor') navigate('/cases');
          else navigate('/');
        }
      }
    } catch (err) {
      setErrorMsg('Network error connecting to backend API.');
    }
  };

  const handleDemoLogin = (demoRole) => {
    if (demoRole === 'Admin') {
      setEmail('admin@koshdrishti.gov.in');
      setPassword('Admin@12345');
    } else if (demoRole === 'Auditor') {
      setEmail('rekha@da.gov.in');
      setPassword('Auditor@12345');
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <div className="bg-white p-8 rounded-lg border border-ledger-line shadow-lg max-w-md w-full">
        <div className="text-center mb-6">
          <div className="inline-p-3 bg-amber-500 text-ledger-navy p-3 rounded-full mb-3 inline-block">
            <ShieldAlert className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-serif font-bold text-ledger-navy">
            {isRegistering ? 'Register as Auditor' : 'Auditor & Admin Portal Login'}
          </h1>
          <p className="text-xs text-slate-600 font-sans mt-1">
            Access case management queue, investigation notes, threshold tuning, and export tools.
          </p>
        </div>

        {/* Demo Login Quick Buttons */}
        {!isRegistering && (
          <div className="mb-6 p-3 bg-slate-50 rounded border border-slate-200 text-xs">
            <div className="font-semibold text-slate-700 mb-1">Quick Demo Login Shortcuts:</div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => handleDemoLogin('Auditor')}
                className="flex-1 py-1 bg-amber-100 text-amber-900 border border-amber-300 rounded font-semibold hover:bg-amber-200 transition-colors"
              >
                Auditor (Rekha)
              </button>
              <button
                type="button"
                onClick={() => handleDemoLogin('Admin')}
                className="flex-1 py-1 bg-slate-800 text-white rounded font-semibold hover:bg-slate-700 transition-colors"
              >
                Admin (Surya)
              </button>
            </div>
          </div>
        )}

        {errorMsg && (
          <div className="p-3 mb-4 bg-rose-50 text-rose-800 text-xs rounded border border-rose-200 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            {errorMsg}
          </div>
        )}

        {successMsg && (
          <div className="p-3 mb-4 bg-emerald-50 text-emerald-800 text-xs rounded border border-emerald-200 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            {successMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs font-sans">
          {isRegistering && (
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Full Name:</label>
              <div className="relative">
                <input
                  type="text"
                  required
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="e.g. Rekha Sharma"
                  className="w-full p-2.5 pl-9 border border-slate-300 rounded focus:ring-1 focus:ring-amber-500"
                />
                <User className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              </div>
            </div>
          )}

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Institutional Email:</label>
            <div className="relative">
              <input
                type="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="e.g. rekha@da.gov.in"
                className="w-full p-2.5 pl-9 border border-slate-300 rounded focus:ring-1 focus:ring-amber-500 font-mono"
              />
              <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Password:</label>
            <div className="relative">
              <input
                type="password"
                required
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full p-2.5 pl-9 border border-slate-300 rounded focus:ring-1 focus:ring-amber-500 font-mono"
              />
              <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            </div>
            {isRegistering && (
              <p className="text-[10px] text-slate-500 mt-1">
                Password policy: Min 10 chars, at least one letter and one number (SRS ERR-AUTH-06).
              </p>
            )}
          </div>

          <button
            type="submit"
            className="w-full py-2.5 bg-ledger-navy text-white font-semibold rounded hover:bg-slate-800 transition-colors shadow-2xs text-sm mt-2"
          >
            {isRegistering ? 'Submit Auditor Registration' : 'Log In to Portal'}
          </button>
        </form>

        <div className="mt-6 pt-4 border-t border-ledger-line text-center text-xs text-slate-600">
          {isRegistering ? (
            <div>
              Already have an account?{' '}
              <button
                type="button"
                onClick={() => { setIsRegistering(false); setErrorMsg(''); }}
                className="text-amber-700 font-semibold hover:underline"
              >
                Log In
              </button>
            </div>
          ) : (
            <div>
              Don't have an auditor account?{' '}
              <button
                type="button"
                onClick={() => { setIsRegistering(true); setErrorMsg(''); }}
                className="text-amber-700 font-semibold hover:underline"
              >
                Register as Auditor
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
