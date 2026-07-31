import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Textarea } from '../components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { Label } from '../components/ui/label';
import { Settings, Clock, CheckCircle, XCircle, Wrench, Calendar, MapPin, MessageSquareText, User as UserIcon, RefreshCw, Inbox } from 'lucide-react';
import { toast } from 'sonner';
import { repairApi, usersApi } from '../utils/api';
import { User } from '../types';

export default function UpdateRepair() {
  const [requests, setRequests] = useState<any[]>([]);
  const [technicians, setTechnicians] = useState<any[]>([]);
  const [selectedRequest, setSelectedRequest] = useState<any | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [updateData, setUpdateData] = useState({ status: '', assignedTo: '', technicianNotes: '' });

  useEffect(() => {
    const userStr = localStorage.getItem('currentUser');
    if (userStr) {
      try {
        setCurrentUser(JSON.parse(userStr));
      } catch (e) {
        console.error('Failed to parse user:', e);
      }
    }

    loadRequests();
    loadTechnicians();

    // ฟัง Event เมื่อมีการอัปเดตข้อมูล
    const handleStorageChange = () => {
      loadRequests();
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const loadRequests = async () => {
    setLoading(true);
    try {
      const res = await repairApi.getAll();
      let apiRequests: any[] = [];
      if (res && res.data && Array.isArray(res.data)) {
        apiRequests = res.data;
      } else if (Array.isArray(res)) {
        apiRequests = res;
      }

      // ดึงข้อมูลสำรองจาก LocalStorage รวมกัน
      let localRequests: any[] = [];
      const localDataStr = localStorage.getItem('repair_requests');
      if (localDataStr) {
        try {
          localRequests = JSON.parse(localDataStr);
        } catch (e) {
          localRequests = [];
        }
      }

      const combinedMap = new Map();
      [...localRequests, ...apiRequests].forEach((item) => {
        const key = item.id || item.request_no;
        if (key) combinedMap.set(String(key), item);
      });

      const mergedList = Array.from(combinedMap.values());

      mergedList.sort((a, b) => {
        const dateA = new Date(a.created_at || a.createdAt || 0).getTime();
        const dateB = new Date(b.created_at || b.createdAt || 0).getTime();
        return dateB - dateA;
      });

      setRequests(mergedList);
    } catch (error) {
      console.error('ไม่สามารถดึงข้อมูลคำขอซ่อมได้:', error);
      // กรณี API ล้มเหลว ยังดึงจาก LocalStorage มาโชว์ได้
      const localDataStr = localStorage.getItem('repair_requests');
      if (localDataStr) {
        try {
          setRequests(JSON.parse(localDataStr));
        } catch (e) {
          setRequests([]);
        }
      }
    } finally {
      setLoading(false);
    }
  };

  const loadTechnicians = async () => {
    try {
      const [techRes, adminRes] = await Promise.all([
        usersApi.getAll('technician').catch(() => null),
        usersApi.getAll('admin').catch(() => null),
      ]);
      const techList = techRes?.data || [];
      const adminList = adminRes?.data || [];
      setTechnicians([...techList, ...adminList]);
    } catch (error) {
      console.warn('ดึงข้อมูลรายชื่อช่างไม่สำเร็จ:', error);
    }
  };

  const handleOpenDialog = (request: any) => {
    setSelectedRequest(request);
    setUpdateData({
      status: request.status || 'pending',
      assignedTo: request.assigned_to ? String(request.assigned_to) : (request.assignedTo ? String(request.assignedTo) : ''),
      technicianNotes: request.technician_notes || request.technicianNotes || '',
    });
    setDialogOpen(true);
  };

  const handleUpdate = async () => {
    if (!selectedRequest) return;
    setSaving(true);

    const updatedItem = {
      ...selectedRequest,
      status: updateData.status,
      assigned_to: updateData.assignedTo,
      assignedTo: updateData.assignedTo,
      technician_notes: updateData.technicianNotes,
      technicianNotes: updateData.technicianNotes,
      updated_at: new Date().toISOString(),
    };

    // อัปเดตใน Local state ก่อนเพื่อความรวดเร็วของ UX
    const updatedList = requests.map((r) => (r.id === selectedRequest.id ? updatedItem : r));
    setRequests(updatedList);
    localStorage.setItem('repair_requests', JSON.stringify(updatedList));

    try {
      await repairApi.update({
        id: selectedRequest.id,
        status: updateData.status,
        assigned_to: updateData.assignedTo || null,
        technician_notes: updateData.technicianNotes,
        changed_by: currentUser?.id || '1',
      });
      toast.success('อัปเดตสถานะลง Database เรียบร้อยแล้ว');
    } catch (error) {
      console.warn('บันทึกไปยัง API ไม่สำเร็จ (บันทึกเฉพาะในเครื่อง)');
      toast.warning('อัปเดตในเครื่องเรียบร้อย (เชื่อมต่อ DB ไม่สำเร็จ)');
    } finally {
      setSaving(false);
      setDialogOpen(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200"><Clock className="size-3 mr-1" />รอดำเนินการ</Badge>;
      case 'in_progress':
      case 'in-progress':
        return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200"><Wrench className="size-3 mr-1" />กำลังดำเนินการ</Badge>;
      case 'completed':
        return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200"><CheckCircle className="size-3 mr-1" />เสร็จสิ้น</Badge>;
      case 'cancelled':
        return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200"><XCircle className="size-3 mr-1" />ยกเลิก</Badge>;
      default:
        return <Badge variant="outline">รอดำเนินการ</Badge>;
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'low':
        return <Badge variant="secondary">ต่ำ</Badge>;
      case 'medium':
        return <Badge className="bg-blue-500">ปานกลาง</Badge>;
      case 'high':
        return <Badge className="bg-orange-500">สูง</Badge>;
      case 'urgent':
        return <Badge variant="destructive">เร่งด่วนมาก</Badge>;
      default:
        return null;
    }
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '-';
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      return d.toLocaleDateString('th-TH', {
        year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit'
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="space-y-6">
      <Card className="border-slate-200/80 shadow-sm">
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="bg-blue-100 p-3 rounded-xl">
                <Settings className="size-6 text-blue-600" />
              </div>
              <div>
                <CardTitle className="text-xl">อัปเดตการซ่อม</CardTitle>
                <CardDescription>จัดการและอัปเดตสถานะคำขอซ่อมต่างๆ ในระบบ</CardDescription>
              </div>
            </div>
            <Button variant="outline" onClick={loadRequests} disabled={loading} className="rounded-xl gap-2 text-slate-600">
              <RefreshCw className={`size-4 ${loading ? 'animate-spin' : ''}`} />
              รีเฟรช
            </Button>
          </div>
        </CardHeader>
      </Card>

      {loading ? (
        <Card className="border-slate-200/80 shadow-sm">
          <CardContent className="py-12 text-center text-slate-500 flex flex-col items-center justify-center gap-2">
            <RefreshCw className="size-8 animate-spin text-blue-500 mb-2" />
            <p className="text-sm">กำลังโหลดข้อมูลคำขอซ่อม...</p>
          </CardContent>
        </Card>
      ) : requests.length === 0 ? (
        <Card className="border-slate-200/80 shadow-sm">
          <CardContent className="py-12 text-center text-slate-400 flex flex-col items-center justify-center gap-2">
            <Inbox className="size-12 text-slate-300" />
            <p>ยังไม่มีรายการแจ้งซ่อมในระบบ</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {requests.map((request) => {
            const techNotes = request.technician_notes || request.technicianNotes;
            return (
              <Card key={request.id || request.request_no} className="hover:shadow-md transition-shadow border-slate-200/80 shadow-sm">
                <CardHeader className="pb-3">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2 mb-2 flex-wrap">
                        <CardTitle className="text-base font-bold text-slate-800">
                          เลขที่: #{request.request_no || request.id}
                        </CardTitle>
                        {getStatusBadge(request.status)}
                        {getPriorityBadge(request.priority)}
                      </div>
                      <CardDescription className="text-base text-slate-700 font-medium">
                        {request.equipment_type_name || request.equipmentType || '-'}
                        {(request.equipment_model || request.equipmentModel) &&
                          ` - ${request.equipment_model || request.equipmentModel}`}
                      </CardDescription>
                    </div>
                    <Button onClick={() => handleOpenDialog(request)} className="shrink-0 bg-blue-600 hover:bg-blue-700 text-white rounded-xl">
                      <Settings className="size-4 mr-1.5" />
                      อัปเดตสถานะ
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4 pt-0">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-slate-100">
                    <div className="flex items-start gap-2">
                      <MapPin className="size-4 text-slate-400 mt-0.5 shrink-0" />
                      <div>
                        <p className="text-xs font-semibold text-slate-500">สถานที่</p>
                        <p className="text-sm text-slate-700">{request.location_description || request.location || '-'}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <Calendar className="size-4 text-slate-400 mt-0.5 shrink-0" />
                      <div>
                        <p className="text-xs font-semibold text-slate-500">วันที่แจ้ง</p>
                        <p className="text-sm text-slate-700">{formatDate(request.created_at || request.createdAt)}</p>
                      </div>
                    </div>
                  </div>

                  <div className="border-t border-slate-100 pt-3">
                    <p className="text-xs font-semibold text-slate-500 mb-1">รายละเอียดปัญหา</p>
                    <p className="text-sm text-slate-700 whitespace-pre-wrap">{request.problem_description || request.problemDescription || '-'}</p>
                  </div>

                  {techNotes && (
                    <div className="border-t border-slate-100 pt-3">
                      <div className="p-3 bg-blue-50 border border-blue-100 rounded-xl">
                        <p className="text-xs font-semibold text-blue-700 flex items-center gap-1.5 mb-1">
                          <MessageSquareText className="size-3.5" />
                          หมายเหตุจากช่าง
                        </p>
                        <p className="text-sm text-blue-900 whitespace-pre-wrap">{techNotes}</p>
                      </div>
                    </div>
                  )}

                  <div className="border-t border-slate-100 pt-3 flex items-center gap-2 text-xs text-slate-500">
                    <UserIcon className="size-3.5 text-slate-400" />
                    <span>
                      ผู้แจ้ง: {request.user_name || request.userName || '-'}
                      {(request.user_phone || request.userPhone) ? ` | โทร: ${request.user_phone || request.userPhone}` : ''}
                      {request.department ? ` | แผนก: ${request.department}` : ''}
                    </span>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Dialog สำหรับอัปเดตสถานะ */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle>อัปเดตสถานะการซ่อม</DialogTitle>
            <DialogDescription>
              เลขที่คำขอ: #{selectedRequest?.request_no || selectedRequest?.id}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>สถานะการซ่อม *</Label>
              <Select value={updateData.status} onValueChange={(v) => setUpdateData({ ...updateData, status: v })}>
                <SelectTrigger className="rounded-xl">
                  <SelectValue placeholder="เลือกสถานะ" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">🟡 รอดำเนินการ</SelectItem>
                  <SelectItem value="in_progress">🔵 กำลังดำเนินการ</SelectItem>
                  <SelectItem value="completed">🟢 เสร็จสิ้น</SelectItem>
                  <SelectItem value="cancelled">🔴 ยกเลิก</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>มอบหมายให้ช่างผู้รับผิดชอบ</Label>
              <Select value={updateData.assignedTo} onValueChange={(v) => setUpdateData({ ...updateData, assignedTo: v })}>
                <SelectTrigger className="rounded-xl">
                  <SelectValue placeholder="เลือกช่างผู้รับผิดชอบ" />
                </SelectTrigger>
                <SelectContent>
                  {technicians.map((tech) => (
                    <SelectItem key={tech.id} value={String(tech.id)}>
                      {tech.name || tech.username} ({tech.role === 'admin' ? 'Admin' : 'Technician'})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>หมายเหตุจากช่าง / รายละเอียดการแก้ไข</Label>
              <Textarea
                placeholder="ระบุรายละเอียดการซ่อม เช่น กำลังรออะไหล่ / เปลี่ยน RAM เรียบร้อยแล้ว..."
                rows={4}
                value={updateData.technicianNotes}
                onChange={(e) => setUpdateData({ ...updateData, technicianNotes: e.target.value })}
                className="rounded-xl"
              />
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setDialogOpen(false)} className="rounded-xl">
              ยกเลิก
            </Button>
            <Button onClick={handleUpdate} disabled={saving} className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl">
              {saving ? 'กำลังบันทึก...' : 'บันทึกการเปลี่ยนแปลง'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}