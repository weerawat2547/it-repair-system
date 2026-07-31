import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import {
  FileText, Search, Settings, MessageSquare, Users,
  TrendingUp, Clock, CheckCircle, Wrench, BarChart2, ArrowRight,
} from 'lucide-react';
import { User } from '../types';
import { statsApi, repairApi } from '../utils/api';
import { mockRepairRequests } from '../utils/mockData';

const STATUS_MAP: Record<string, { label: string; dot: string; bg: string; text: string }> = {
  pending:       { label: 'รอดำเนินการ',    dot: 'bg-amber-400',  bg: 'bg-amber-50',  text: 'text-amber-700' },
  in_progress:   { label: 'กำลังดำเนินการ', dot: 'bg-blue-400',   bg: 'bg-blue-50',   text: 'text-blue-700'  },
  'in-progress': { label: 'กำลังดำเนินการ', dot: 'bg-blue-400',   bg: 'bg-blue-50',   text: 'text-blue-700'  },
  completed:     { label: 'เสร็จสิ้น',       dot: 'bg-green-400',  bg: 'bg-green-50',  text: 'text-green-700' },
  cancelled:     { label: 'ยกเลิก',          dot: 'bg-red-400',    bg: 'bg-red-50',    text: 'text-red-700'   },
};

const QUICK_ACTIONS = [
  { title: 'แจ้งซ่อม',           desc: 'แจ้งซ่อมอุปกรณ์ที่มีปัญหา', icon: FileText,     color: '#2563eb', path: '/dashboard/report',    roles: ['student', 'technician', 'admin'] },
  { title: 'ตรวจสอบสถานะ',       desc: 'ดูสถานะการซ่อมปัจจุบัน',    icon: Search,       color: '#0891b2', path: '/dashboard/status',    roles: ['student', 'technician', 'admin'] },
  { title: 'อัปเดตการซ่อม',      desc: 'จัดการและอัปเดตคำขอซ่อม',  icon: Settings,     color: '#7c3aed', path: '/dashboard/update',    roles: ['technician', 'admin'] },
  { title: 'แชทบอท LINE OA',     desc: 'สอบถามผ่านแชทบอท',          icon: MessageSquare,color: '#059669', path: '/dashboard/chat',      roles: ['student', 'technician', 'admin'] },
  { title: 'จัดการผู้ใช้',       desc: 'จัดการบัญชีผู้ใช้งาน',      icon: Users,        color: '#d97706', path: '/dashboard/users',     roles: ['admin'] },
  { title: 'รายงานและวิเคราะห์', desc: 'ดูกราฟและสถิติการซ่อม',     icon: BarChart2,    color: '#dc2626', path: '/dashboard/analytics', roles: ['admin', 'technician'] },
];

const ROLE_LABEL: Record<string, string> = {
  admin: 'ผู้ดูแลระบบ', technician: 'ช่างซ่อม', student: 'นักศึกษา',
};

export default function Home() {
  const [currentUser, setCurrentUser]     = useState<User | null>(null);
  const [stats, setStats]                 = useState({ total: 0, pending: 0, inProgress: 0, completed: 0 });
  const [recentRequests, setRecentRequests] = useState<any[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    const userStr = localStorage.getItem('currentUser');
    if (userStr) {
      const user = JSON.parse(userStr);
      setCurrentUser(user);
      loadStats(user);
      if (user.role === 'student') loadRecentRequests(user);
    }
  }, []);

  const loadStats = async (user: User) => {
    try {
      const data = await statsApi.get(user.id, user.role);
      setStats({ total: data.total, pending: data.pending, inProgress: data.in_progress, completed: data.completed });
    } catch {
      const list = user.role === 'student'
        ? mockRepairRequests.filter((r) => r.userId === user.id)
        : mockRepairRequests;
      setStats({
        total:      list.length,
        pending:    list.filter((r) => r.status === 'pending').length,
        inProgress: list.filter((r) => r.status === 'in-progress').length,
        completed:  list.filter((r) => r.status === 'completed').length,
      });
    }
  };

  const loadRecentRequests = async (user: User) => {
    try {
      const res = await repairApi.getAll(user.id, user.role);
      setRecentRequests(res.data.slice(0, 4));
    } catch {
      setRecentRequests(mockRepairRequests.filter((r) => r.userId === user.id).slice(0, 4));
    }
  };

  if (!currentUser) return null;

  const filteredActions = QUICK_ACTIONS.filter((a) => a.roles.includes(currentUser.role));
  const roleLabel = ROLE_LABEL[currentUser.role] ?? currentUser.role;

  return (
    <div className="space-y-6">

      {/* ── Animated Welcome Banner ──────────────────────── */}
      <div
        className="relative rounded-2xl overflow-hidden animate-fade-in-up"
        style={{
          background: 'linear-gradient(135deg, #0a1628 0%, #0d2157 40%, #1a3a8f 70%, #1d4ed8 100%)',
          backgroundSize: '200% 200%',
        }}
      >
        {/* Dot pattern */}
        <div className="absolute inset-0 bg-dot-pattern opacity-50" />

        {/* Floating orbs */}
        <div
          className="absolute -right-8 -top-8 w-40 h-40 rounded-full opacity-20 animate-float"
          style={{ background: 'radial-gradient(circle, #60a5fa, transparent)' }}
        />
        <div
          className="absolute right-20 -bottom-6 w-28 h-28 rounded-full opacity-15 animate-float-slow"
          style={{ background: 'radial-gradient(circle, #818cf8, transparent)', animationDelay: '2s' }}
        />

        <div className="relative z-10 px-6 py-7 flex items-center justify-between gap-4">
          <div>
            <p className="text-blue-300 text-sm mb-1">{roleLabel}</p>
            <h2 className="text-white text-2xl font-bold mb-1">
              ยินดีต้อนรับ, {currentUser.name}!
            </h2>
            <p className="text-blue-200 text-sm">ระบบแจ้งซ่อมอุปกรณ์ IT มหาวิทยาลัย</p>
          </div>
          <div className="hidden sm:flex items-center justify-center size-16 rounded-2xl bg-white/10 border border-white/20 shrink-0">
            <Wrench className="size-8 text-blue-200" />
          </div>
        </div>
      </div>

      {/* ── Stat Cards ───────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'คำขอทั้งหมด',    value: stats.total,      icon: TrendingUp, iconColor: 'text-blue-600',   iconBg: 'bg-blue-100',   delay: 0 },
          { label: 'รอดำเนินการ',    value: stats.pending,    icon: Clock,      iconColor: 'text-amber-600',  iconBg: 'bg-amber-100',  delay: 1 },
          { label: 'กำลังดำเนินการ', value: stats.inProgress, icon: Wrench,     iconColor: 'text-purple-600', iconBg: 'bg-purple-100', delay: 2 },
          { label: 'เสร็จสิ้น',      value: stats.completed,  icon: CheckCircle,iconColor: 'text-green-600',  iconBg: 'bg-green-100',  delay: 3 },
        ].map((s) => {
          const Icon = s.icon;
          return (
            <div
              key={s.label}
              className="bg-white rounded-2xl p-5 border border-slate-200/60 shadow-sm card-hover animate-fade-in-up"
              style={{ animationDelay: `${s.delay * 0.08}s` }}
            >
              <div className="flex items-start justify-between mb-3">
                <p className="text-slate-500 text-sm">{s.label}</p>
                <div className={`${s.iconBg} p-2 rounded-lg`}>
                  <Icon className={`size-4 ${s.iconColor}`} />
                </div>
              </div>
              <p className="text-slate-800 text-3xl font-bold">{s.value}</p>
              {/* Mini blue accent bar */}
              <div className="mt-3 h-1 w-10 bg-gradient-to-r from-blue-400 to-blue-600 rounded-full" />
            </div>
          );
        })}
      </div>

      {/* ── Quick Actions ─────────────────────────────────── */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/60 shadow-sm animate-fade-in-up delay-300">
        <div className="flex items-center gap-2 mb-5">
          <div className="w-1 h-5 bg-gradient-to-b from-blue-500 to-blue-700 rounded-full" />
          <h3 className="text-slate-800 font-semibold">เมนูหลัก</h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {filteredActions.map((action, i) => {
            const Icon = action.icon;
            return (
              <button
                key={action.path}
                onClick={() => navigate(action.path)}
                className="flex items-center gap-4 px-5 py-4 rounded-xl border border-slate-200 hover:border-blue-300 hover:bg-blue-50/60 hover:shadow-md transition-all group text-left card-hover animate-fade-in-up"
                style={{ animationDelay: `${0.3 + i * 0.06}s` }}
              >
                <div
                  className="size-10 rounded-xl flex items-center justify-center shrink-0 transition-transform group-hover:scale-110"
                  style={{ backgroundColor: action.color + '18' }}
                >
                  <Icon className="size-5 transition-colors" style={{ color: action.color }} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-slate-800 font-medium text-sm">{action.title}</p>
                  <p className="text-slate-400 text-xs mt-0.5 truncate">{action.desc}</p>
                </div>
                <ArrowRight className="size-4 text-slate-300 group-hover:text-blue-500 group-hover:translate-x-0.5 shrink-0 transition-all" />
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Recent Requests (student only) ──────────────── */}
      {currentUser.role === 'student' && (
        <div className="bg-white rounded-2xl p-6 border border-slate-200/60 shadow-sm animate-fade-in-up delay-500">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2">
              <div className="w-1 h-5 bg-gradient-to-b from-blue-500 to-blue-700 rounded-full" />
              <h3 className="text-slate-800 font-semibold">คำขอซ่อมล่าสุด</h3>
            </div>
            <button
              onClick={() => navigate('/dashboard/status')}
              className="text-blue-600 text-sm hover:text-blue-700 flex items-center gap-1 transition-colors"
            >
              ดูทั้งหมด <ArrowRight className="size-3.5" />
            </button>
          </div>

          {recentRequests.length === 0 ? (
            <div className="text-center py-8 text-slate-400 text-sm">
              ยังไม่มีคำขอซ่อม
            </div>
          ) : (
            <div className="space-y-3">
              {recentRequests.map((req, i) => {
                const s = STATUS_MAP[req.status] ?? { label: req.status, dot: 'bg-slate-400', bg: 'bg-slate-50', text: 'text-slate-600' };
                return (
                  <div
                    key={req.id}
                    className="flex items-center justify-between py-3 border-b border-slate-100 last:border-0 animate-fade-in"
                    style={{ animationDelay: `${0.5 + i * 0.07}s` }}
                  >
                    <div>
                      <p className="text-slate-800 text-sm font-medium">{req.equipment_type_name || req.equipmentType || '-'}</p>
                      <p className="text-slate-400 text-xs mt-0.5 font-mono">{req.request_no || req.id}</p>
                    </div>
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${s.bg} ${s.text}`}>
                      <span className={`size-1.5 rounded-full ${s.dot} ${req.status === 'in_progress' ? 'animate-pulse' : ''}`} />
                      {s.label}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
