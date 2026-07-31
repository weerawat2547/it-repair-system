import { useEffect, useState } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line,
} from 'recharts';
import { BarChart2, RefreshCw, TrendingUp, Clock, CheckCircle, AlertCircle, XCircle } from 'lucide-react';

// --- ตรวจสอบ Environment และกำหนด Dynamic API Base URL ---
const isLocalhost = Boolean(
  window.location.hostname === 'localhost' ||
  window.location.hostname === '127.0.0.1'
);

const API_BASE_URL = isLocalhost
  ? 'http://localhost/it_repair_api'
  : 'http://it-repair-api.freehosting.dev';

const API = `${API_BASE_URL}/analytics.php`;

const STATUS_COLORS: Record<string, string> = {
  pending:     '#f59e0b',
  assigned:    '#3b82f6',
  in_progress: '#8b5cf6',
  completed:   '#10b981',
  cancelled:   '#ef4444',
};

const PRIORITY_COLORS: Record<string, string> = {
  urgent: '#ef4444',
  high:   '#f97316',
  medium: '#eab308',
  low:    '#6b7280',
};

const PRIORITY_LABELS: Record<string, string> = {
  urgent: 'เร่งด่วนมาก',
  high:   'เร่งด่วน',
  medium: 'ปานกลาง',
  low:    'ปานกลาง',
};

const STATUS_LABELS: Record<string, string> = {
  pending:     'รอดำเนินการ',
  assigned:    'มอบหมายแล้ว',
  in_progress: 'กำลังซ่อม',
  completed:   'ซ่อมเสร็จ',
  cancelled:   'ยกเลิก',
};

const CHART_COLORS = ['#2563eb', '#0891b2', '#7c3aed', '#059669', '#d97706', '#dc2626', '#0284c7', '#65a30d'];

interface Totals {
  total: number;
  pending: number;
  assigned: number;
  in_progress: number;
  completed: number;
  cancelled: number;
}

interface MonthData { month: string; label: string; total: number; completed: number; }
interface EquipmentData { name: string; total: number; }
interface PriorityData { priority: string; total: number; }
interface TechnicianData { name: string; total: number; completed: number; }

interface AnalyticsData {
  totals: Totals;
  byMonth: MonthData[];
  byEquipment: EquipmentData[];
  byPriority: PriorityData[];
  byTechnician: TechnicianData[];
}

// Demo data when API is unavailable
const DEMO: AnalyticsData = {
  totals: { total: 42, pending: 8, assigned: 5, in_progress: 6, completed: 20, cancelled: 3 },
  byMonth: [
    { month: '2026-02', label: 'Feb 2026', total: 5, completed: 3 },
    { month: '2026-03', label: 'Mar 2026', total: 8, completed: 5 },
    { month: '2026-04', label: 'Apr 2026', total: 6, completed: 4 },
    { month: '2026-05', label: 'May 2026', total: 9, completed: 6 },
    { month: '2026-06', label: 'Jun 2026', total: 7, completed: 5 },
    { month: '2026-07', label: 'Jul 2026', total: 7, completed: 3 },
  ],
  byEquipment: [
    { name: 'คอมพิวเตอร์', total: 15 },
    { name: 'เครื่องพิมพ์', total: 10 },
    { name: 'โปรเจคเตอร์', total: 7 },
    { name: 'เครือข่าย/WiFi', total: 6 },
    { name: 'มอนิเตอร์', total: 4 },
  ],
  byPriority: [
    { priority: 'urgent', total: 8 },
    { priority: 'high',   total: 14 },
    { priority: 'medium', total: 20 },
  ],
  byTechnician: [
    { name: 'สมชาย ใจดี',    total: 15, completed: 12 },
    { name: 'วิชัย เก่งงาน', total: 12, completed: 9  },
    { name: 'มานะ รักงาน',  total: 10, completed: 8  },
  ],
};

const CustomPieLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }: any) => {
  if (percent < 0.05) return null;
  const RADIAN = Math.PI / 180;
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);
  return (
    <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" fontSize={12}>
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  );
};

export default function Analytics() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [isDemo, setIsDemo] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await fetch(API, { signal: AbortSignal.timeout(5000) });
      const json = await res.json();
      if (json.success) {
        setData(json);
        setIsDemo(false);
      } else {
        setData(DEMO);
        setIsDemo(true);
      }
    } catch {
      setData(DEMO);
      setIsDemo(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <RefreshCw className="size-8 animate-spin text-blue-600 mx-auto mb-2" />
          <p className="text-gray-500">กำลังโหลดข้อมูล...</p>
        </div>
      </div>
    );
  }

  if (!data) return null;

  const { totals, byMonth, byEquipment, byPriority, byTechnician } = data;

  const statusPieData = [
    { name: STATUS_LABELS.pending,     value: Number(totals.pending),     color: STATUS_COLORS.pending     },
    { name: STATUS_LABELS.assigned,    value: Number(totals.assigned),    color: STATUS_COLORS.assigned    },
    { name: STATUS_LABELS.in_progress, value: Number(totals.in_progress), color: STATUS_COLORS.in_progress },
    { name: STATUS_LABELS.completed,   value: Number(totals.completed),   color: STATUS_COLORS.completed   },
    { name: STATUS_LABELS.cancelled,   value: Number(totals.cancelled),   color: STATUS_COLORS.cancelled   },
  ].filter(d => d.value > 0);

  const priorityChartData = byPriority.map(p => ({
    name:  PRIORITY_LABELS[p.priority] ?? p.priority,
    total: Number(p.total),
    color: PRIORITY_COLORS[p.priority] ?? '#6b7280',
  }));

  const completionRate = totals.total > 0
    ? Math.round((Number(totals.completed) / Number(totals.total)) * 100)
    : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="bg-blue-100 p-2.5 rounded-xl">
            <BarChart2 className="size-5 text-blue-600" />
          </div>
          <div>
            <h2 className="text-slate-800 text-xl font-bold">รายงานและวิเคราะห์</h2>
            <p className="text-slate-500 text-sm">ภาพรวมระบบแจ้งซ่อมอุปกรณ์ IT</p>
          </div>
        </div>
        <button
          onClick={fetchData}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors text-sm shadow-sm shadow-blue-500/20"
        >
          <RefreshCw className="size-4" />
          รีเฟรช
        </button>
      </div>

      {isDemo && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-amber-700 text-sm">
          ⚠️ ไม่สามารถเชื่อมต่อ API ได้ — แสดงข้อมูลตัวอย่าง (Demo)
        </div>
      )}

      {/* Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        <StatCard label="ทั้งหมด"       value={totals.total}        icon={<TrendingUp className="size-5 text-blue-600" />}   bg="bg-blue-50"   text="text-blue-700" />
        <StatCard label="รอดำเนินการ"   value={totals.pending}      icon={<Clock className="size-5 text-amber-600" />}       bg="bg-amber-50"  text="text-amber-700" />
        <StatCard label="กำลังซ่อม"    value={totals.in_progress}  icon={<AlertCircle className="size-5 text-purple-600" />} bg="bg-purple-50" text="text-purple-700" />
        <StatCard label="ซ่อมเสร็จ"    value={totals.completed}    icon={<CheckCircle className="size-5 text-green-600" />}  bg="bg-green-50"  text="text-green-700" />
        <StatCard label="อัตราสำเร็จ"  value={`${completionRate}%`} icon={<XCircle className="size-5 text-slate-500" />}    bg="bg-slate-50"  text="text-slate-700" />
      </div>

      {/* Row 1: Line chart + Pie chart */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Monthly Trend - Line Chart */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200/60 shadow-sm p-5">
          <h3 className="font-semibold text-slate-700 mb-4">แนวโน้มการแจ้งซ่อมรายเดือน</h3>
          {byMonth.length > 0 ? (
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={byMonth} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="label" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="total"     stroke="#3b82f6" strokeWidth={2} dot={{ r: 4 }} name="แจ้งซ่อมทั้งหมด" />
                <Line type="monotone" dataKey="completed" stroke="#10b981" strokeWidth={2} dot={{ r: 4 }} name="ซ่อมเสร็จ" />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <EmptyState />
          )}
        </div>

        {/* Status Pie Chart */}
        <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm p-5">
          <h3 className="font-semibold text-slate-700 mb-4">สัดส่วนสถานะงาน</h3>
          {statusPieData.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={statusPieData}
                    cx="50%"
                    cy="50%"
                    outerRadius={85}
                    dataKey="value"
                    labelLine={false}
                    label={CustomPieLabel}
                  >
                    {statusPieData.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v: number, n: string) => [v, n]} />
                </PieChart>
              </ResponsiveContainer>
              <div className="mt-2 space-y-1">
                {statusPieData.map((d) => (
                  <div key={d.name} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1.5">
                      <span className="inline-block size-2.5 rounded-full" style={{ background: d.color }} />
                      <span className="text-gray-600">{d.name}</span>
                    </div>
                    <span className="font-semibold text-gray-800">{d.value}</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <EmptyState />
          )}
        </div>
      </div>

      {/* Row 2: Equipment Bar + Priority Bar */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Equipment Type Bar Chart */}
        <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm p-5">
          <h3 className="font-semibold text-slate-700 mb-4">ประเภทอุปกรณ์ที่แจ้งซ่อมบ่อย</h3>
          {byEquipment.length > 0 ? (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={byEquipment} layout="vertical" margin={{ top: 0, right: 20, left: 10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 12 }} allowDecimals={false} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 12 }} width={90} />
                <Tooltip />
                <Bar dataKey="total" name="จำนวน" radius={[0, 4, 4, 0]}>
                  {byEquipment.map((_, i) => (
                    <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <EmptyState />
          )}
        </div>

        {/* Priority Bar Chart */}
        <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm p-5">
          <h3 className="font-semibold text-slate-700 mb-4">ระดับความเร่งด่วน</h3>
          {priorityChartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={priorityChartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="total" name="จำนวนงาน" radius={[4, 4, 0, 0]}>
                  {priorityChartData.map((d, i) => (
                    <Cell key={i} fill={d.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <EmptyState />
          )}
        </div>
      </div>

      {/* Row 3: Technician Performance */}
      {byTechnician.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm p-5">
          <h3 className="font-semibold text-slate-700 mb-4">ผลงานช่างซ่อม (Top 5)</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={byTechnician} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="name" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
              <Tooltip />
              <Legend />
              <Bar dataKey="total"     name="งานทั้งหมด" fill="#93c5fd" radius={[4, 4, 0, 0]} />
              <Bar dataKey="completed" name="ซ่อมเสร็จ"  fill="#10b981" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}

function StatCard({
  label, value, icon, bg, text,
}: {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  bg: string;
  text: string;
}) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm p-4 flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <span className="text-xs text-slate-500">{label}</span>
        <div className={`${bg} p-1.5 rounded-lg`}>{icon}</div>
      </div>
      <span className={`text-2xl font-bold ${text}`}>{value}</span>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex items-center justify-center h-40 text-slate-400 text-sm">
      ยังไม่มีข้อมูลเพียงพอ
    </div>
  );
}