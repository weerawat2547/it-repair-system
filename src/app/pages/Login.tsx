import { useState } from 'react';
import { useNavigate, Link } from 'react-router';
import { Wrench, AlertCircle, Eye, EyeOff, ArrowRight, ChevronDown, Shield, Clock, Star } from 'lucide-react';
import { mockUsers } from '../utils/mockData';

// --- ตรวจสอบ Environment และกำหนด Dynamic API Base URL ---
const isLocalhost = Boolean(
  window.location.hostname === 'localhost' ||
  window.location.hostname === '127.0.0.1'
);

const API_BASE_URL = isLocalhost
  ? 'http://localhost/it_repair_api'
  : 'http://it-repair-api.freehosting.dev';

const TEST_ACCOUNTS = [
  { role: 'ผู้ดูแลระบบ', username: 'admin',    password: 'admin123',    color: 'text-red-500' },
  { role: 'ช่างซ่อม',    username: 'tech1',    password: 'tech123',     color: 'text-purple-500' },
  { role: 'นักศึกษา',    username: 'student', password: 'student1234', color: 'text-blue-500' },
];

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [error, setError]       = useState('');
  const [loading, setLoading]   = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const storedUsers = JSON.parse(localStorage.getItem('users') || '[]');
    const allUsers = [...mockUsers, ...storedUsers.filter(
      (su: any) => !mockUsers.find((mu) => mu.username === su.username)
    )];
    const localUser = allUsers.find(
      (u) => u.username === username && u.password === password
    );

    if (localUser) {
      localStorage.setItem('currentUser', JSON.stringify(localUser));
      setLoading(false);
      navigate('/dashboard');
      return;
    }

    try {
      // 🔄 ใช้ API_BASE_URL แบบ Dynamic
      const res = await fetch(`${API_BASE_URL}/login.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      const result = await res.json();
      if (result.success) {
        localStorage.setItem('currentUser', JSON.stringify(result.user));
        navigate('/dashboard');
      } else {
        setError(result.message || 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง');
      }
    } catch {
      setError(
        isLocalhost
          ? 'เชื่อมต่อ XAMPP ไม่ได้ — กรุณาตรวจสอบว่า Apache และ MySQL เปิดอยู่'
          : 'ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ API ได้ กรุณาตรวจสอบการเชื่อมต่ออินเทอร์เน็ต'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-[#060f24]">

      {/* ── Left Panel ─────────────────────────────── */}
      <div className="hidden lg:flex lg:w-1/2 relative flex-col items-center justify-center overflow-hidden">

        {/* Animated gradient background */}
        <div
          className="absolute inset-0 animate-gradient"
          style={{
            background: 'linear-gradient(135deg, #060f24 0%, #0d2157 30%, #1a3a8f 60%, #0a1d4a 100%)',
          }}
        />

        {/* Dot pattern overlay */}
        <div className="absolute inset-0 bg-dot-pattern opacity-60" />

        {/* Animated blobs */}
        <div
          className="absolute top-16 left-16 w-64 h-64 rounded-full animate-blob animate-float opacity-20"
          style={{ background: 'radial-gradient(circle, #3b82f6, #1d4ed8)' }}
        />
        <div
          className="absolute bottom-20 right-16 w-48 h-48 rounded-full animate-blob animate-float-slow opacity-15 delay-300"
          style={{ background: 'radial-gradient(circle, #6366f1, #2563eb)', animationDelay: '2s' }}
        />
        <div
          className="absolute top-1/2 right-8 w-32 h-32 rounded-full animate-float opacity-10 delay-500"
          style={{ background: 'radial-gradient(circle, #60a5fa, #1e40af)', animationDelay: '4s' }}
        />

        {/* Rotating ring decoration */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div
            className="w-[500px] h-[500px] rounded-full border border-blue-500/10 animate-spin-slow"
            style={{ borderStyle: 'dashed' }}
          />
          <div
            className="absolute w-[360px] h-[360px] rounded-full border border-blue-400/10 animate-spin-slow"
            style={{ animationDirection: 'reverse', animationDuration: '15s' }}
          />
        </div>

        {/* Content */}
        <div className="relative z-10 text-center px-12 animate-fade-in-up">
          <div className="inline-flex bg-gradient-to-br from-blue-500 to-blue-700 p-5 rounded-2xl mb-8 glow-blue">
            <Wrench className="size-14 text-white" />
          </div>
          <h1 className="text-white text-3xl font-bold mb-3 tracking-tight">ระบบแจ้งซ่อมอุปกรณ์ IT</h1>
          <p className="text-blue-300 text-lg mb-12">มหาวิทยาลัย · IT Support System</p>

          <div className="grid grid-cols-3 gap-4">
            {[
              { icon: <Clock className="size-5 text-blue-300 mx-auto mb-2" />, num: '24/7', label: 'บริการตลอดเวลา' },
              { icon: <Shield className="size-5 text-blue-300 mx-auto mb-2" />, num: '< 2h', label: 'เวลาตอบสนอง' },
              { icon: <Star className="size-5 text-blue-300 mx-auto mb-2" />, num: '99%', label: 'ความพึงพอใจ' },
            ].map((s, i) => (
              <div
                key={s.num}
                className="glass rounded-xl px-4 py-4 animate-fade-in-up"
                style={{ animationDelay: `${0.2 + i * 0.1}s` }}
              >
                {s.icon}
                <p className="text-white text-xl font-bold">{s.num}</p>
                <p className="text-blue-300 text-xs mt-1">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Right Panel ────────────────────────────── */}
      <div className="flex-1 flex items-center justify-center p-6 bg-[#f0f4f8] relative">
        {/* Subtle blue tint top-right */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-100 rounded-full -translate-y-1/2 translate-x-1/2 opacity-50 pointer-events-none" />

        <div className="w-full max-w-md relative z-10 animate-fade-in-up delay-100">

          {/* Mobile logo */}
          <div className="lg:hidden text-center mb-8">
            <div className="inline-flex bg-gradient-to-br from-blue-500 to-blue-700 p-4 rounded-2xl mb-3 glow-blue-sm">
              <Wrench className="size-10 text-white" />
            </div>
            <h1 className="text-slate-800 text-2xl font-bold">ระบบแจ้งซ่อมอุปกรณ์ IT</h1>
          </div>

          <div className="bg-white rounded-2xl shadow-xl shadow-blue-900/10 p-8 border border-blue-100">
            {/* Header bar accent */}
            <div className="h-1 w-16 bg-gradient-to-r from-blue-500 to-blue-700 rounded-full mb-6" />

            <h2 className="text-slate-800 text-2xl font-bold mb-1">เข้าสู่ระบบ</h2>
            <p className="text-slate-500 text-sm mb-7">กรุณากรอกข้อมูลเพื่อเข้าใช้งาน</p>

            <form onSubmit={handleLogin} className="space-y-5">
              <div>
                <label className="block text-slate-700 text-sm font-medium mb-1.5">ชื่อผู้ใช้</label>
                <input
                  type="text"
                  placeholder="กรอกชื่อผู้ใช้"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                />
              </div>

              <div>
                <label className="block text-slate-700 text-sm font-medium mb-1.5">รหัสผ่าน</label>
                <div className="relative">
                  <input
                    type={showPass ? 'text' : 'password'}
                    placeholder="กรอกรหัสผ่าน"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="w-full px-4 py-2.5 pr-11 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass(!showPass)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showPass ? <EyeOff className="size-4.5" /> : <Eye className="size-4.5" />}
                  </button>
                </div>
              </div>

              {error && (
                <div className="flex items-center gap-2 bg-red-50 text-red-600 text-sm px-4 py-3 rounded-xl border border-red-100 animate-fade-in">
                  <AlertCircle className="size-4 shrink-0" />
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 disabled:opacity-60 text-white font-semibold py-2.5 rounded-xl transition-all shadow-lg shadow-blue-500/25"
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <span className="size-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                    กำลังเข้าสู่ระบบ...
                  </span>
                ) : (
                  <>เข้าสู่ระบบ <ArrowRight className="size-4" /></>
                )}
              </button>
            </form>

            <p className="text-center text-slate-500 text-sm mt-6">
              ยังไม่มีบัญชี?{' '}
              <Link to="/register" className="text-blue-600 hover:text-blue-700 font-semibold">
                สมัครสมาชิก
              </Link>
            </p>

            {/* Test accounts */}
            <div className="mt-5 border-t border-slate-100 pt-4">
              <button
                type="button"
                onClick={() => setShowHint(!showHint)}
                className="w-full flex items-center justify-between text-slate-400 hover:text-slate-600 text-xs transition-colors"
              >
                <span>บัญชีทดสอบ (ใช้ได้โดยไม่ต้องเปิด XAMPP)</span>
                <ChevronDown className={`size-3.5 transition-transform ${showHint ? 'rotate-180' : ''}`} />
              </button>
              {showHint && (
                <div className="mt-3 space-y-2 animate-fade-in">
                  {TEST_ACCOUNTS.map((acc) => (
                    <button
                      key={acc.username}
                      type="button"
                      onClick={() => { setUsername(acc.username); setPassword(acc.password); setError(''); }}
                      className="w-full flex items-center justify-between px-3 py-2 bg-blue-50 hover:bg-blue-100 border border-blue-100 rounded-lg transition-all text-left"
                    >
                      <div>
                        <span className={`text-xs font-semibold ${acc.color}`}>{acc.role}</span>
                        <p className="text-slate-600 text-xs font-mono mt-0.5">{acc.username} / {acc.password}</p>
                      </div>
                      <span className="text-blue-400 text-xs">คลิกกรอก →</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}