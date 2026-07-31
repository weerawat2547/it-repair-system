import { useEffect, useState } from 'react';
import { Outlet, useNavigate, Link, useLocation } from 'react-router';
import { User } from '../types';
import {
  Wrench, LogOut, FileText, Search, Settings,
  MessageSquare, Users, Menu, X, BarChart2, ChevronRight,
} from 'lucide-react';

const NAV_ITEMS = [
  { path: '/dashboard/report',    label: 'แจ้งซ่อม',           icon: FileText,     roles: ['student', 'technician', 'admin'] },
  { path: '/dashboard/status',    label: 'ตรวจสอบสถานะ',       icon: Search,       roles: ['student', 'technician', 'admin'] },
  { path: '/dashboard/update',    label: 'อัปเดตการซ่อม',      icon: Settings,     roles: ['technician', 'admin'] },
  { path: '/dashboard/chat',      label: 'แชทบอท LINE OA',     icon: MessageSquare,roles: ['student', 'technician', 'admin'] },
  { path: '/dashboard/users',     label: 'จัดการผู้ใช้',       icon: Users,        roles: ['admin'] },
  { path: '/dashboard/analytics', label: 'รายงานและวิเคราะห์', icon: BarChart2,    roles: ['admin', 'technician'] },
];

const ROLE_LABEL: Record<string, string> = {
  admin: 'ผู้ดูแลระบบ', technician: 'ช่างซ่อม', student: 'นักศึกษา',
};

export default function Dashboard() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [mobileOpen, setMobileOpen]   = useState(false);
  const navigate  = useNavigate();
  const location  = useLocation();

  useEffect(() => {
    const userStr = localStorage.getItem('currentUser');
    if (!userStr) { navigate('/'); return; }
    setCurrentUser(JSON.parse(userStr));
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem('currentUser');
    navigate('/');
  };

  const filteredNav = NAV_ITEMS.filter((item) =>
    currentUser ? item.roles.includes(currentUser.role) : false
  );

  if (!currentUser) return null;

  const avatarLetter = currentUser.name.charAt(0).toUpperCase();
  const roleLabel    = ROLE_LABEL[currentUser.role] ?? currentUser.role;

  const SidebarContent = () => (
    <div className="flex flex-col h-full relative overflow-hidden">
      {/* Background patterns */}
      <div className="absolute inset-0 bg-dot-pattern pointer-events-none" />
      <div
        className="absolute -top-20 -right-20 w-48 h-48 rounded-full opacity-10 pointer-events-none animate-float"
        style={{ background: 'radial-gradient(circle, #3b82f6, transparent)' }}
      />
      <div
        className="absolute -bottom-16 -left-16 w-40 h-40 rounded-full opacity-10 pointer-events-none animate-float-slow"
        style={{ background: 'radial-gradient(circle, #6366f1, transparent)', animationDelay: '3s' }}
      />

      {/* Brand */}
      <div className="relative px-5 py-6 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="relative bg-gradient-to-br from-blue-400 to-blue-600 p-2 rounded-xl glow-blue-sm animate-pulse-ring">
            <Wrench className="size-5 text-white" />
          </div>
          <div>
            <p className="text-white font-semibold text-sm leading-tight">ระบบแจ้งซ่อม IT</p>
            <p className="text-blue-300 text-xs">IT Support System</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="relative flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {filteredNav.map((item, i) => {
          const Icon    = item.icon;
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              onClick={() => setMobileOpen(false)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group animate-slide-left ${
                isActive
                  ? 'bg-gradient-to-r from-blue-600 to-blue-500 text-white shadow-lg shadow-blue-900/40 glow-blue-sm'
                  : 'text-slate-300 hover:bg-white/10 hover:text-white'
              }`}
              style={{ animationDelay: `${i * 0.05}s` }}
            >
              <Icon className="size-4.5 shrink-0" />
              <span className="text-sm flex-1">{item.label}</span>
              {isActive && <ChevronRight className="size-3.5 opacity-70" />}
            </Link>
          );
        })}
      </nav>

      {/* User footer */}
      <div className="relative px-4 py-4 border-t border-white/10">
        <div className="flex items-center gap-3 mb-3">
          <div className="size-9 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-bold text-sm shrink-0 shadow-lg">
            {avatarLetter}
          </div>
          <div className="min-w-0">
            <p className="text-white text-sm font-medium truncate">{currentUser.name}</p>
            <p className="text-blue-300 text-xs">{roleLabel}</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 text-slate-300 hover:text-white hover:bg-white/10 rounded-xl transition-all text-sm group"
        >
          <LogOut className="size-4 group-hover:translate-x-0.5 transition-transform" />
          ออกจากระบบ
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#f0f4f8] flex">

      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-60 bg-[#0a1628] shrink-0 fixed left-0 top-0 h-full z-20">
        <SidebarContent />
      </aside>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-30 md:hidden backdrop-blur-sm animate-fade-in"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile Sidebar */}
      <aside
        className={`fixed left-0 top-0 h-full w-64 bg-[#0a1628] z-40 md:hidden transform transition-transform duration-300 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <button
          onClick={() => setMobileOpen(false)}
          className="absolute top-4 right-4 text-slate-400 hover:text-white z-10"
        >
          <X className="size-5" />
        </button>
        <SidebarContent />
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col md:ml-60">

        {/* Mobile top bar */}
        <header className="md:hidden bg-[#0a1628] text-white px-4 py-3 flex items-center justify-between sticky top-0 z-10 border-b border-white/10">
          <div className="flex items-center gap-3">
            <button onClick={() => setMobileOpen(true)} className="text-white">
              <Menu className="size-6" />
            </button>
            <div className="flex items-center gap-2">
              <Wrench className="size-4.5 text-blue-400" />
              <span className="font-semibold text-sm">ระบบแจ้งซ่อม IT</span>
            </div>
          </div>
          <div className="size-8 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-bold text-sm">
            {avatarLetter}
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 p-5 md:p-7 animate-fade-in-up">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
