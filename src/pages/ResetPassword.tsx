import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';

export function ResetPasswordPage() {
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 8) return setError('Password must be at least 8 characters');
    if (password !== confirm) return setError('Passwords do not match');
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (error) setError(error.message);
    else navigate('/login', { replace: true });
  };

  return (
    <div className="min-h-screen bg-[#0F172A] flex items-center justify-center p-4">
      <div className="w-full max-w-md glass rounded-2xl p-8">
        <h1 className="text-2xl font-bold text-white mb-2">Set new password</h1>
        {error && <div className="mb-4 p-3 rounded-lg bg-danger/10 border border-danger/20 text-danger-50 text-sm">{error}</div>}
        <form onSubmit={handleSubmit} className="space-y-4">
          <input value={password} onChange={e => setPassword(e.target.value)} type="password" placeholder="New password" className="w-full bg-surface-50 rounded-lg px-4 py-3 text-white border border-white/5" />
          <input value={confirm} onChange={e => setConfirm(e.target.value)} type="password" placeholder="Confirm password" className="w-full bg-surface-50 rounded-lg px-4 py-3 text-white border border-white/5" />
          <button disabled={loading} className="w-full py-3 bg-primary rounded-lg text-white font-medium">{loading ? 'Updating...' : 'Update password'}</button>
        </form>
      </div>
    </div>
  );
}
