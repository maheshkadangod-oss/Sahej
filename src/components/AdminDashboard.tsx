import { useState, useEffect } from 'react';
import { X, Users, MessageSquare, LogOut } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { format } from 'date-fns';
import { adminLogin, fetchDashboard } from '../services/adminApi';

interface AdminDashboardProps {
  show: boolean;
  onClose: () => void;
}

type DashboardData = {
  users: { name: string; email: string; timestamp: number }[];
  feedback: { id: string; message: string; email: string | null; timestamp: number }[];
  stats: { totalUsers: number; totalFeedback: number };
};

export default function AdminDashboard({ show, onClose }: AdminDashboardProps) {
  const [email, setEmail] = useState('');
  const [token, setToken] = useState(() => sessionStorage.getItem('sahej_admin_token') || '');
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [tab, setTab] = useState<'users' | 'feedback'>('users');

  const loggedIn = !!token;

  useEffect(() => {
    if (show && token) loadData();
  }, [show, token]);

  const handleLogin = async () => {
    if (!email.trim()) return;
    setLoading(true);
    setError('');
    const t = await adminLogin(email.trim());
    setLoading(false);
    if (t) {
      setToken(t);
      sessionStorage.setItem('sahej_admin_token', t);
    } else {
      setError('Not authorized.');
    }
  };

  const handleLogout = () => {
    setToken('');
    setData(null);
    sessionStorage.removeItem('sahej_admin_token');
  };

  const loadData = async () => {
    setLoading(true);
    const d = await fetchDashboard(token);
    setLoading(false);
    if (d) {
      setData(d);
    } else {
      // Token expired
      handleLogout();
      setError('Session expired. Please login again.');
    }
  };

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-brand-cream dark:bg-brand-ink w-full max-w-md rounded-3xl p-6 max-h-[80vh] overflow-y-auto"
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">Admin Dashboard</h2>
              <button onClick={onClose} className="p-2 rounded-full hover:bg-black/5 min-w-[44px] min-h-[44px] flex items-center justify-center">
                <X className="w-5 h-5 text-brand-sage" />
              </button>
            </div>

            {/* Login */}
            {!loggedIn && (
              <div className="space-y-4">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Admin email"
                  onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
                  className="w-full bg-white/60 dark:bg-white/5 border border-brand-clay/20 rounded-2xl py-3 px-4 focus:outline-none focus:ring-2 focus:ring-brand-clay/30 text-sm"
                />
                {error && <p className="text-sm text-red-500">{error}</p>}
                <button
                  onClick={handleLogin}
                  disabled={loading}
                  className="w-full py-3 bg-brand-clay text-white rounded-2xl text-sm font-medium press-effect min-h-[44px] disabled:opacity-40"
                >
                  {loading ? 'Logging in...' : 'Login'}
                </button>
              </div>
            )}

            {/* Dashboard */}
            {loggedIn && (
              <div className="space-y-4">
                {/* Stats */}
                {data && (
                  <div className="flex gap-3">
                    <div className="flex-1 bg-white/40 dark:bg-white/5 rounded-2xl p-4 text-center">
                      <p className="text-2xl font-semibold">{data.stats.totalUsers}</p>
                      <p className="text-xs text-brand-sage">Registered</p>
                    </div>
                    <div className="flex-1 bg-white/40 dark:bg-white/5 rounded-2xl p-4 text-center">
                      <p className="text-2xl font-semibold">{data.stats.totalFeedback}</p>
                      <p className="text-xs text-brand-sage">Feedback</p>
                    </div>
                  </div>
                )}

                {/* Tab switcher */}
                <div className="flex gap-2">
                  <button
                    onClick={() => setTab('users')}
                    className={`flex-1 py-2 rounded-2xl text-sm font-medium flex items-center justify-center gap-1.5 min-h-[44px] ${tab === 'users' ? 'bg-brand-clay text-white' : 'bg-white/40 dark:bg-white/5 text-brand-sage'}`}
                  >
                    <Users className="w-4 h-4" /> Users
                  </button>
                  <button
                    onClick={() => setTab('feedback')}
                    className={`flex-1 py-2 rounded-2xl text-sm font-medium flex items-center justify-center gap-1.5 min-h-[44px] ${tab === 'feedback' ? 'bg-brand-clay text-white' : 'bg-white/40 dark:bg-white/5 text-brand-sage'}`}
                  >
                    <MessageSquare className="w-4 h-4" /> Feedback
                  </button>
                </div>

                {/* Loading */}
                {loading && (
                  <div className="flex justify-center py-8">
                    <div className="w-6 h-6 border-2 border-brand-clay/30 border-t-brand-clay rounded-full animate-spin" />
                  </div>
                )}

                {/* Users list */}
                {!loading && tab === 'users' && data && (
                  <div className="space-y-2">
                    {data.users.length === 0 ? (
                      <p className="text-sm text-brand-sage text-center py-4 italic">No registered users yet.</p>
                    ) : (
                      data.users.map((u, i) => (
                        <div key={i} className="bg-white/40 dark:bg-white/5 rounded-2xl p-3">
                          <p className="text-sm font-medium">{u.name}</p>
                          <p className="text-xs text-brand-sage">{u.email}</p>
                          <p className="text-[10px] text-brand-sage/60">{format(u.timestamp, 'MMM d, yyyy h:mm a')}</p>
                        </div>
                      ))
                    )}
                  </div>
                )}

                {/* Feedback list */}
                {!loading && tab === 'feedback' && data && (
                  <div className="space-y-2">
                    {data.feedback.length === 0 ? (
                      <p className="text-sm text-brand-sage text-center py-4 italic">No feedback yet.</p>
                    ) : (
                      data.feedback.map((f) => (
                        <div key={f.id} className="bg-white/40 dark:bg-white/5 rounded-2xl p-3">
                          <p className="text-sm">{f.message}</p>
                          {f.email && <p className="text-xs text-brand-clay mt-1">{f.email}</p>}
                          <p className="text-[10px] text-brand-sage/60 mt-1">{format(f.timestamp, 'MMM d, yyyy h:mm a')}</p>
                        </div>
                      ))
                    )}
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-2 pt-2">
                  <button
                    onClick={loadData}
                    disabled={loading}
                    className="flex-1 py-2 bg-white/40 dark:bg-white/5 rounded-2xl text-sm text-brand-sage min-h-[44px]"
                  >
                    Refresh
                  </button>
                  <button
                    onClick={handleLogout}
                    className="py-2 px-4 bg-red-50 dark:bg-red-900/20 text-red-500 rounded-2xl text-sm flex items-center gap-1.5 min-h-[44px]"
                  >
                    <LogOut className="w-4 h-4" /> Logout
                  </button>
                </div>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
