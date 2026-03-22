import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';
import { ArrowLeftRight, Mail } from 'lucide-react';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState({ type: '', message: '' });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setStatus({ type: '', message: '' });
    
    try {
      const res = await api.post('/auth/forgot-password', { email });
      setStatus({ 
        type: 'success', 
        message: res.data.message || 'If an account exists, a reset link has been sent.' 
      });
      setEmail(''); // clear after success
    } catch (err) {
      setStatus({ 
        type: 'error', 
        message: err.response?.data?.message || 'Failed to request password reset' 
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
          
          <h2 className="text-xl font-bold text-gray-900 mb-2 text-center">Reset your password</h2>
          <p className="text-sm text-gray-500 mb-6 text-center">
            Enter your email address and we'll send you a link to reset your password.
          </p>

          {status.message && (
            <div className={`mb-6 p-4 rounded-lg text-sm flex items-start gap-3 ${
              status.type === 'success' 
                ? 'bg-green-50 text-green-800 border border-green-200' 
                : 'bg-red-50 text-red-800 border border-red-200'
            }`}>
              {status.type === 'success' && <Mail className="shrink-0 mt-0.5" size={18} />}
              <p>{status.message}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email address</label>
              <input
                type="email"
                required
                className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-shadow"
                placeholder="developer@plm.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                disabled={loading}
              />
            </div>
            <button
              type="submit"
              disabled={loading || !email}
              className="w-full py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Sending link...' : 'Send reset link'}
            </button>
          </form>

          <div className="mt-8 text-center">
            <Link to="/login" className="text-sm text-gray-600 hover:text-blue-600 font-medium transition-colors">
              &larr; Back to sign in
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
