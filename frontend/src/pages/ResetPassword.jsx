import React, { useState } from 'react';
import { useParams, useSearchParams, useNavigate, Link } from 'react-router-dom';
import api from '../api/axios';
import { ArrowLeftRight, CheckCircle2 } from 'lucide-react';

const ResetPassword = () => {
  const { token } = useParams();
  const [searchParams] = useSearchParams();
  const email = searchParams.get('email') || '';
  const navigate = useNavigate();

  const [form, setForm] = useState({ password: '', confirmPassword: '' });
  const [status, setStatus] = useState({ type: '', message: '' });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus({ type: '', message: '' });

    if (form.password !== form.confirmPassword) {
      return setStatus({ type: 'error', message: 'Passwords do not match.' });
    }
    if (form.password.length < 6) {
      return setStatus({ type: 'error', message: 'Password must be at least 6 characters.' });
    }

    setLoading(true);
    try {
      await api.post('/auth/reset-password', {
        email,
        token,
        newPassword: form.password
      });
      setSuccess(true);
    } catch (err) {
      setStatus({ 
        type: 'error', 
        message: err.response?.data?.message || 'Failed to reset password. The link might be expired.' 
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          <div className="flex items-center justify-center gap-3 mb-6">
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center">
              <ArrowLeftRight className="text-white" size={22} />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">PLM / ECO</h1>
          </div>

          <h2 className="text-xl font-bold text-gray-900 mb-6 text-center">Set new password</h2>

          {success ? (
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="text-green-600" size={32} />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Password reset complete</h3>
              <p className="text-gray-500 mb-6 text-sm">
                Your password has been successfully reset. You can now sign in with your new password.
              </p>
              <button
                onClick={() => navigate('/login')}
                className="w-full py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors"
              >
                Sign In
              </button>
            </div>
          ) : (
            <>
              {status.message && (
                <div className={`mb-6 p-3 rounded-lg text-sm border ${
                  status.type === 'error' ? 'bg-red-50 text-red-700 border-red-200' : ''
                }`}>
                  {status.message}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email <span className="text-gray-400 font-normal">(locked)</span></label>
                  <input
                    type="email"
                    disabled
                    value={email}
                    className="w-full px-4 py-2 bg-gray-50 text-gray-500 border border-gray-200 rounded-lg cursor-not-allowed"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
                  <input
                    type="password"
                    required
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="••••••••"
                    value={form.password}
                    onChange={e => setForm({...form, password: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Confirm New Password</label>
                  <input
                    type="password"
                    required
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="••••••••"
                    value={form.confirmPassword}
                    onChange={e => setForm({...form, confirmPassword: e.target.value})}
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading || !form.password || !form.confirmPassword}
                  className="w-full py-3 mt-4 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50"
                >
                  {loading ? 'Resetting...' : 'Reset Password'}
                </button>
              </form>
              
              <div className="mt-6 text-center">
                <Link to="/login" className="text-sm text-gray-500 hover:text-gray-800 transition-colors">
                  Cancel
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;
