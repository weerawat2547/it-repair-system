import { useState, useEffect } from 'react';
import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button';
import { Search, Clock, CheckCircle, XCircle, AlertCircle, Calendar, User, MapPin, Wrench, RefreshCw } from 'lucide-react';
import { User as UserType } from '../types';

// --- ตรวจสอบ Environment และกำหนด Dynamic API Base URL ---
const isLocalhost = Boolean(
  typeof window !== 'undefined' &&
  (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
);

// 🌐 ถ้ารันบน Vercel ให้ใช้ ngrok URL (ต้องเป็น https://)
const API_BASE_URL = isLocalhost
  ? 'http://localhost/it_repair_api'
  : 'https://pajamas-luckless-operation.ngrok-free.dev/it_repair_api';

interface StatusConfig {
  label: string; bg: string; text: string; border: string; icon: React.ReactNode;
}

const STATUS: Record<string, StatusConfig> = {
  pending:      { label: 'รอดำเนินการ',    bg: 'bg-amber-50',  text: 'text-amber-700',  border: 'border-amber-200', icon: <Clock className="size-3.5" /> },
  in_progress:  { label: 'กำลังดำเนินการ', bg: 'bg-blue-50',   text: 'text-blue-700',   border: 'border-blue-200',  icon: <Wrench className="size-3.5" /> },
  'in-progress':{ label: 'กำลังดำเนินการ', bg: 'bg-blue-50',   text: 'text-blue-700',   border: 'border-blue-200',  icon: <Wrench className="size-3.5" /> },
  completed:    { label: 'เสร็จสิ้น',       bg: 'bg-green-50',  text: 'text-green-700',  border: 'border-green-200', icon: <CheckCircle className="size-3.5" /> },
  cancelled:    { label: 'ยกเลิก',          bg: 'bg-red-50',    text: 'text-red-700',    border: 'border-red-200',   icon: <XCircle className="size-3.5" /> },
};

const PRIORITY: Record<string, { label: string; dot: string }> = {
  urgent: { label: 'เร่งด่วนมาก', dot: 'bg-red-500' },
  high:   { label: 'เร่งด่วน',    dot: 'bg-orange-500' },
  medium: { label: 'ปานกลาง',    dot: 'bg-amber-400' },
  low:    { label: 'ปานกลาง',    dot: 'bg-slate-400' },
};

export default function CheckStatus() {
  const [searchTerm, setSearchTerm]   = useState('');
  const [requests, setRequests]       = useState<any[]>([]);
  const [currentUser, setCurrentUser] = useState<UserType | null>(null);
  const [loading, setLoading]         = useState(true);

  useEffect(() => {
    const userStr = localStorage.getItem('currentUser');
    if (userStr) {
      const user = JSON.parse(userStr);
      setCurrentUser(user);
      loadRequests(user);
    } else {
      setLoading(false);
    }
  }, []);

  const loadRequests = async (user: UserType) => {
    setLoading(true);
    try {
      // 🔄 ยิง API ไปที่ Dynamic Base URL บน localhost หรือ server จริง
      const res = await fetch(`${API_BASE_URL}/repair_requests.php?user_id=${user.id}&role=${user.role}`, {
        headers: {
          'ngrok-skip-browser-warning': 'true', // ป้องกัน ngrok ติดหน้าเตือนสติ๊กเกอร์ HTML
        }
      });
      if (!res.ok) throw new Error('Network error');
      
      const data = await res.json();
      
      // รองรับโครงสร้าง Response ทั้งแบบ Array ตรงๆ และแบบ { data: [...] }
      if (Array.isArray(data)) {
        setRequests(data);
      } else if (data && Array.isArray(data.data)) {
        setRequests(data.data);
      } else {
        setRequests([]);
      }
    } catch (error) {
      console.error('Failed to load repair requests:', error);
      // หากเกิดข้อผิดพลาด ให้แสดงรายการว่างเปล่า
      setRequests([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredRequests = requests.filter((req) => {
    const term = searchTerm.toLowerCase();
    return (
      (req.request_no || req.id || '').toString().toLowerCase().includes(term) ||
      (req.equipment_type_name || '').toLowerCase().includes(term) ||
      (req.location_description || '').toLowerCase().includes(term)
    );
  });

  const fmtDate = (d: string) => {
    if (!d) return '-';
    return new Date(d).toLocaleDateString('th-TH', {
      year: 'numeric', month: 'long', day: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  };

  return (
    <div className="space-y-5">
      {/* Search bar */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200/60 shadow-sm">
        <div className="flex items-center gap-3 mb-4">
          <div className="bg-blue-100 p-2.5 rounded-xl">
            <Search className="size-5 text-blue-600" />
          </div>
          <div>
            <h2 className="text-slate-800 font-semibold">ตรวจสอบสถานะการซ่อม</h2>
            <p className="text-slate-500 text-sm">ค้นหาและติดตามคำขอซ่อมของคุณ</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Input
            placeholder="ค้นหาด้วยเลขที่คำขอ, ประเภทอุปกรณ์, หรือสถานที่..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-1 bg-slate-50 border-slate-200 rounded-xl"
          />
          <Button
            onClick={() => currentUser && loadRequests(currentUser)}
            className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl px-4 shrink-0"
          >
            <RefreshCw className="size-4" />
          </Button>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="bg-white rounded-2xl p-12 text-center border border-slate-200/60 shadow-sm">
          <RefreshCw className="size-8 animate-spin text-blue-500 mx-auto mb-3" />
          <p className="text-slate-500 text-sm">กำลังโหลดข้อมูล...</p>
        </div>
      ) : filteredRequests.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center border border-slate-200/60 shadow-sm">
          <AlertCircle className="size-12 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500">ไม่พบข้อมูลคำขอซ่อม</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredRequests.map((request) => {
            const st = STATUS[request.status] || STATUS.pending;
            const pr = PRIORITY[request.priority] || PRIORITY.medium;
            return (
              <div key={request.id} className="bg-white rounded-2xl border border-slate-200/60 shadow-sm overflow-hidden hover:shadow-md transition-shadow">
                {/* Card header */}
                <div className="px-6 py-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <span className="text-slate-800 font-semibold">
                        {request.equipment_type_name || request.equipment_type || '-'}
                        {request.equipment_model && ` — ${request.equipment_model}`}
                      </span>
                    </div>
                    <p className="text-slate-400 text-sm font-mono">#{request.request_no || request.id}</p>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap sm:justify-end">
                    {pr && (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-600">
                        <span className={`size-1.5 rounded-full ${pr.dot}`} />
                        {pr.label}
                      </span>
                    )}
                    {st && (
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${st.bg} ${st.text} ${st.border}`}>
                        {st.icon}
                        {st.label}
                      </span>
                    )}
                  </div>
                </div>

                {/* Card body */}
                <div className="px-6 py-5">
                  <div className="flex flex-col md:flex-row items-start justify-between gap-6">
                    {/* Left details section */}
                    <div className="flex-1 w-full space-y-4">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="flex items-start gap-2.5">
                          <MapPin className="size-4 text-slate-400 mt-0.5 shrink-0" />
                          <div>
                            <p className="text-slate-500 text-xs mb-0.5">สถานที่</p>
                            <p className="text-slate-700 text-sm">{request.location_description || '-'}</p>
                          </div>
                        </div>
                        <div className="flex items-start gap-2.5">
                          <Calendar className="size-4 text-slate-400 mt-0.5 shrink-0" />
                          <div>
                            <p className="text-slate-500 text-xs mb-0.5">วันที่แจ้ง</p>
                            <p className="text-slate-700 text-sm">{fmtDate(request.created_at || request.createdAt)}</p>
                          </div>
                        </div>
                        {currentUser?.role !== 'student' && request.user_name && (
                          <div className="flex items-start gap-2.5">
                            <User className="size-4 text-slate-400 mt-0.5 shrink-0" />
                            <div>
                              <p className="text-slate-500 text-xs mb-0.5">ผู้แจ้ง</p>
                              <p className="text-slate-700 text-sm">{request.user_name}</p>
                              {request.user_phone && <p className="text-slate-400 text-xs">{request.user_phone}</p>}
                            </div>
                          </div>
                        )}
                        {request.technician_name && (
                          <div className="flex items-start gap-2.5">
                            <Wrench className="size-4 text-slate-400 mt-0.5 shrink-0" />
                            <div>
                              <p className="text-slate-500 text-xs mb-0.5">ช่างผู้รับผิดชอบ</p>
                              <p className="text-slate-700 text-sm">{request.technician_name}</p>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Problem */}
                      <div className="bg-slate-50 rounded-xl px-4 py-3">
                        <p className="text-slate-500 text-xs mb-1">รายละเอียดปัญหา</p>
                        <p className="text-slate-700 text-sm">{request.problem_description || '-'}</p>
                      </div>

                      {/* Technician notes */}
                      {request.technician_notes && (
                        <div className="bg-blue-50 rounded-xl px-4 py-3 border border-blue-100">
                          <p className="text-blue-600 text-xs font-medium mb-1">หมายเหตุจากช่าง</p>
                          <p className="text-blue-700 text-sm">{request.technician_notes}</p>
                        </div>
                      )}

                      {/* Completed at */}
                      {request.completed_at && (
                        <div className="bg-green-50 rounded-xl px-4 py-2.5 border border-green-100 flex items-center gap-2">
                          <CheckCircle className="size-4 text-green-600 shrink-0" />
                          <p className="text-green-700 text-sm">
                            เสร็จสิ้นเมื่อ {fmtDate(request.completed_at)}
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Right side: QR Code */}
                    <div className="w-full md:w-auto flex flex-col items-center justify-center p-3 bg-slate-50/80 border border-slate-200/80 rounded-2xl shrink-0 self-center md:self-start">
                      <img
                        src="/line-oa-qr.jpg"
                        alt="สแกนเพื่อติดตามสถานะผ่าน LINE OA"
                        title="สแกนเพื่อติดตามสถานะผ่าน LINE OA"
                        className="w-28 h-28 sm:w-32 sm:h-32 rounded-xl border border-slate-200 bg-white p-1.5 shadow-sm object-contain"
                      />
                      <span className="text-xs text-slate-500 font-medium mt-2 text-center">
                        สแกนติดตามผ่าน LINE OA
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}