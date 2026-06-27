import { useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';

export function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setLoading(false);
    if (error) setError(error.message);
    else setSent(true);
  };

  return (
    <div className="min-h-screen bg-[#0F172A] flex items-center justify-center p-4">
      <div className="w-full max-w-md glass rounded-2xl p-8">
        <h1 className="text-2xl font-bold text-white mb-2">Reset password</h1>
        <p className="text-sm text-gray-400 mb-6">We’ll send a reset link to your email.</p>
        {error && <div className="mb-4 p-3 rounded-lg bg-danger/10 border border-danger/20 text-danger-50 text-sm">{error}</div>}
        {sent ? (
          <p className="text-sm text-success-50">If the email exists, a reset link has been sent.</p>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <input value={email} onChange={e => setEmail(e.target.value)} type="email" placeholder="your@email.com" className="w-full bg-surface-50 rounded-lg px-4 py-3 text-white border border-white/5" />
            <button disabled={loading} className="w-full py-3 bg-primary rounded-lg text-white font-medium">{loading ? 'Sending...' : 'Send reset link'}</button>
          </form>
        )}
        <div className="mt-4 text-xs text-gray-500">
          <Link to="/login" className="hover:text-primary-50">Back to login</Link>
        </div>
      </div>
    </div>
  );
}
