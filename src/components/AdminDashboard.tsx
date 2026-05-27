import { useState, useEffect } from 'react';
import { X, Users, MessageSquare, LogOut, BarChart3 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { format } from 'date-fns';
import { adminLogin, fetchDashboard } from '../services/adminApi';

interface AdminDashboardProps {
  show: boolean;
  onClose: () => void;
}

type DashboardData = {
  users: { name: string; email: string; babyName?: string; babyBirthDate?: string; timestamp: number }[];
  feedback: { id: string; message: string; email: string | null; timestamp: number }[];
  stats: { totalUsers: number; totalFeedback: number; lifetimeRegistrations?: number; pushDevices?: number };
  analytics?: {
    totalUniqueVisitors: number;
    totalSessions: number;
    series: { date: string; visitors: number; signups: number }[];
  };
};

export default function AdminDashboard({ show, onClose }: AdminDashboardProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [token, setToken] = useState(() => sessionStorage.getItem('sahej_admin_token') || '');
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [tab, setTab] = useState<'analytics' | 'users' | 'feedback'>('analytics');

  const loggedIn = !!token;

  useEffect(() => {
    if (show && token) loadData();
  }, [show, token]);

  const handleLogin = async () => {
    if (!email.trim() || !password) return;
    setLoading(true);
    setError('');
    const t = await adminLogin(email.trim(), password);
    setLoading(false);
    if (t) {
      setToken(t);
      sessionStorage.setItem('sahej_admin_token', t);
      setPassword(''); // don't keep the password in state once exchanged for a token
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
              <div className="space-y-3">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Admin email"
                  autoComplete="username"
                  className="w-full bg-white/60 dark:bg-white/5 border border-brand-clay/20 rounded-2xl py-3 px-4 focus:outline-none focus:ring-2 focus:ring-brand-clay/30 text-sm min-h-[44px]"
                />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Admin password"
                  autoComplete="current-password"
                  onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
                  className="w-full bg-white/60 dark:bg-white/5 border border-brand-clay/20 rounded-2xl py-3 px-4 focus:outline-none focus:ring-2 focus:ring-brand-clay/30 text-sm min-h-[44px]"
                />
                {error && <p className="text-sm text-red-500">{error}</p>}
                <button
                  onClick={handleLogin}
                  disabled={loading || !email.trim() || !password}
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
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-white/40 dark:bg-white/5 rounded-2xl p-4 text-center">
                      <p className="text-2xl font-semibold">{data.stats.totalUsers}</p>
                      <p className="text-xs text-brand-sage">Registered</p>
                    </div>
                    <div className="bg-white/40 dark:bg-white/5 rounded-2xl p-4 text-center">
                      <p className="text-2xl font-semibold">{data.stats.lifetimeRegistrations ?? data.stats.totalUsers}</p>
                      <p className="text-xs text-brand-sage">Lifetime sign-ups</p>
                    </div>
                    <div className="bg-white/40 dark:bg-white/5 rounded-2xl p-4 text-center">
                      <p className="text-2xl font-semibold">{data.stats.pushDevices ?? 0}</p>
                      <p className="text-xs text-brand-sage">Push devices</p>
                    </div>
                    <div className="bg-white/40 dark:bg-white/5 rounded-2xl p-4 text-center">
                      <p className="text-2xl font-semibold">{data.stats.totalFeedback}</p>
                      <p className="text-xs text-brand-sage">Feedback</p>
                    </div>
                  </div>
                )}

                {/* Tab switcher */}
                <div className="flex gap-2">
                  <button
                    onClick={() => setTab('analytics')}
                    className={`flex-1 py-2 rounded-2xl text-sm font-medium flex items-center justify-center gap-1.5 min-h-[44px] ${tab === 'analytics' ? 'bg-brand-clay text-white' : 'bg-white/40 dark:bg-white/5 text-brand-sage'}`}
                  >
                    <BarChart3 className="w-4 h-4" /> Analytics
                  </button>
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

                {/* Analytics */}
                {!loading && tab === 'analytics' && data && (() => {
                  const a = data.analytics;
                  const uniques = a?.totalUniqueVisitors ?? 0;
                  const sessions = a?.totalSessions ?? 0;
                  const lifetime = data.stats.lifetimeRegistrations ?? data.stats.totalUsers;
                  const conversion = uniques > 0 ? Math.round((lifetime / uniques) * 100) : 0;
                  const series = a?.series ?? [];
                  const maxVal = Math.max(1, ...series.map(s => s.visitors));
                  return (
                    <div className="space-y-4">
                      <div className="grid grid-cols-3 gap-2">
                        <div className="bg-white/40 dark:bg-white/5 rounded-2xl p-3 text-center">
                          <p className="text-xl font-semibold">{uniques}</p>
                          <p className="text-[10px] text-brand-sage leading-tight">Unique visitors</p>
                        </div>
                        <div className="bg-white/40 dark:bg-white/5 rounded-2xl p-3 text-center">
                          <p className="text-xl font-semibold">{sessions}</p>
                          <p className="text-[10px] text-brand-sage leading-tight">Sessions</p>
                        </div>
                        <div className="bg-white/40 dark:bg-white/5 rounded-2xl p-3 text-center">
                          <p className="text-xl font-semibold">{conversion}%</p>
                          <p className="text-[10px] text-brand-sage leading-tight">Visitor→signup</p>
                        </div>
                      </div>

                      <div className="bg-white/40 dark:bg-white/5 rounded-2xl p-4">
                        <div className="flex items-center justify-between mb-3">
                          <p className="text-xs font-medium text-brand-ink/80">Last 14 days</p>
                          <div className="flex items-center gap-3 text-[10px] text-brand-sage">
                            <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm bg-brand-clay inline-block" /> Visitors</span>
                            <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm bg-brand-rose inline-block" /> Sign-ups</span>
                          </div>
                        </div>
                        {series.length === 0 || maxVal <= 1 && series.every(s => s.visitors === 0 && s.signups === 0) ? (
                          <p className="text-xs text-brand-sage italic text-center py-6">No visits recorded yet. Data appears as people open the app.</p>
                        ) : (
                          <>
                            <div className="flex items-end gap-[3px] h-28">
                              {series.map((s) => (
                                <div key={s.date} className="flex-1 h-full flex flex-col justify-end relative group" title={`${s.date}: ${s.visitors} visitors, ${s.signups} sign-ups`}>
                                  <div className="w-full rounded-t-sm bg-brand-clay/80 min-h-[2px]" style={{ height: `${Math.max(2, (s.visitors / maxVal) * 100)}%` }} />
                                  {s.signups > 0 && (
                                    <div className="w-full rounded-t-sm bg-brand-rose absolute bottom-0" style={{ height: `${Math.max(3, (s.signups / maxVal) * 100)}%` }} />
                                  )}
                                </div>
                              ))}
                            </div>
                            <div className="flex justify-between mt-1.5 text-[8px] text-brand-sage/60">
                              {series.map((s, i) => (
                                <span key={s.date} className="flex-1 text-center">{i % 2 === 0 ? s.date.slice(8) : ''}</span>
                              ))}
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  );
                })()}

                {/* Users list */}
                {!loading && tab === 'users' && data && (
                  <div className="space-y-2">
                    {data.users.length === 0 ? (
                      <p className="text-sm text-brand-sage text-center py-4 italic">No registered users yet.</p>
                    ) : (
                      data.users.map((u, i) => (
                        <div key={i} className="bg-white/40 dark:bg-white/5 rounded-2xl p-3">
                          <p className="text-sm font-medium">{u.name || '—'}</p>
                          <p className="text-xs text-brand-sage">{u.email}</p>
                          {u.babyName && (
                            <p className="text-[11px] text-brand-sage">👶 {u.babyName}{u.babyBirthDate ? ` · born ${u.babyBirthDate}` : ''}</p>
                          )}
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
