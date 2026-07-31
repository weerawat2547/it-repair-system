import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Textarea } from '../components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { Label } from '../components/ui/label';
import { Settings, Clock, CheckCircle, XCircle, Wrench, Calendar, MapPin } from 'lucide-react';
import { toast } from 'sonner';
import { repairApi, usersApi } from '../utils/api';
import { mockRepairRequests, mockUsers } from '../utils/mockData';
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
      const user = JSON.parse(userStr);
      setCurrentUser(user);
    }
    loadRequests();
    loadTechnicians();
  }, []);

  const loadRequests = async () => {
    setLoading(true);
    try {
      const res = await repairApi.getAll();
      setRequests(res.data);
    } catch {
      setRequests(mockRepairRequests.map((r) => ({
        id: r.id, request_no: r.id,
        equipment_type_name: r.equipmentType, equipment_model: r.equipmentModel,
        location_description: r.location, problem_description: r.problemDescription,
        status: r.status, priority: r.priority,
        assigned_to: r.assignedTo, technician_name: r.assignedTechnicianName,
        technician_notes: r.technicianNotes,
        user_name: r.userName, user_phone: r.userPhone, department: r.department,
        created_at: r.createdAt,
      })));
    } finally {
      setLoading(false);
    }
  };

  const loadTechnicians = async () => {
    try {
      const res = await usersApi.getAll('technician');
      const adminRes = await usersApi.getAll('admin');
      setTechnicians([...res.data, ...adminRes.data]);
    } catch {
      setTechnicians(mockUsers.filter((u) => u.role === 'technician' || u.role === 'admin'));
    }
  };

  const handleOpenDialog = (request: any) => {
    setSelectedRequest(request);
    setUpdateData({
      status: request.status,
      assignedTo: request.assigned_to || '',
      technicianNotes: request.technician_notes || '',
    });
    setDialogOpen(true);
  };

  const handleUpdate = async () => {
    if (!selectedRequest || !currentUser) return;
    setSaving(true);
    try {
      await repairApi.update({
        id:               selectedRequest.id,
        status:           updateData.status,
        assigned_to:      updateData.assignedTo || null,
        technician_notes: updateData.technicianNotes,
        changed_by:       currentUser.id,
      });
      toast.success('อัปเดตสถานะเรียบร้อยแล้ว', {
        description: `คำขอ ${selectedRequest.request_no || selectedRequest.id} ได้รับการอัปเดตแล้ว`,
      });
      setDialogOpen(false);
      loadRequests();
    } catch {
      // fallback: อัปเดต state local
      setRequests((prev) => prev.map((r) =>
        r.id === selectedRequest.id
          ? { ...r, status: updateData.status, assigned_to: updateData.assignedTo, technician_notes: updateData.technicianNotes }
          : r
      ));
      toast.success('อัปเดตสถานะเรียบร้อยแล้ว (offline mode)');
      setDialogOpen(false);
    } finally {
      setSaving(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':      return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-300"><Clock className="size-3 mr-1" />รอดำเนินการ</Badge>;
      case 'in_progress':
      case 'in-progress':  return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-300"><Wrench className="size-3 mr-1" />กำลังดำเนินการ</Badge>;
      case 'completed':    return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-300"><CheckCircle className="size-3 mr-1" />เสร็จสิ้น</Badge>;
      case 'cancelled':    return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-300"><XCircle className="size-3 mr-1" />ยกเลิก</Badge>;
      default:             return null;
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'low':    return <Badge variant="secondary">ต่ำ</Badge>;
      case 'medium': return <Badge className="bg-blue-500">ปานกลาง</Badge>;
      case 'high':   return <Badge className="bg-orange-500">สูง</Badge>;
      case 'urgent': return <Badge variant="destructive">เร่งด่วน</Badge>;
      default:       return null;
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="bg-blue-100 p-3 rounded-lg">
              <Settings className="size-6 text-blue-600" />
            </div>
            <div>
              <CardTitle>อัปเดตการซ่อม</CardTitle>
              <CardDescription>จัดการและอัปเดตสถานะคำขอซ่อมต่างๆ</CardDescription>
            </div>
          </div>
        </CardHeader>
      </Card>

      {loading ? (
        <Card><CardContent className="py-12 text-center text-gray-500">กำลังโหลด...</CardContent></Card>
      ) : (
        <div className="space-y-4">
          {requests.map((request) => (
            <Card key={request.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <CardTitle className="text-lg">เลขที่: {request.request_no || request.id}</CardTitle>
                      {getStatusBadge(request.status)}
                      {getPriorityBadge(request.priority)}
                    </div>
                    <CardDescription className="text-base">
                      {request.equipment_type_name || '-'}
                      {request.equipment_model && ` - ${request.equipment_model}`}
                    </CardDescription>
                  </div>
                  <Button onClick={() => handleOpenDialog(request)}>
                    <Settings className="size-4 mr-2" />
                    อัปเดตสถานะ
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-start gap-2">
                    <MapPin className="size-5 text-gray-500 mt-0.5" />
                    <div>
                      <p className="text-sm font-semibold text-gray-700">สถานที่</p>
                      <p className="text-sm text-gray-600">{request.location_description}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <Calendar className="size-5 text-gray-500 mt-0.5" />
                    <div>
                      <p className="text-sm font-semibold text-gray-700">วันที่แจ้ง</p>
                      <p className="text-sm text-gray-600">
                        {new Date(request.created_at || request.createdAt).toLocaleDateString('th-TH', {
                          year: 'numeric', month: 'long', day: 'numeric',
                        })}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="border-t pt-4">
                  <p className="text-sm font-semibold text-gray-700 mb-1">รายละเอียดปัญหา</p>
                  <p className="text-sm text-gray-600">{request.problem_description}</p>
                </div>
                <div className="border-t pt-4">
                  <p className="text-sm font-semibold text-gray-700 mb-1">ผู้แจ้ง</p>
                  <p className="text-sm text-gray-600">
                    {request.user_name} {request.user_phone ? `| ${request.user_phone}` : ''} {request.department ? `| ${request.department}` : ''}
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>อัปเดตสถานะการซ่อม</DialogTitle>
            <DialogDescription>เลขที่คำขอ: {selectedRequest?.request_no || selectedRequest?.id}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>สถานะ</Label>
              <Select value={updateData.status} onValueChange={(v) => setUpdateData({ ...updateData, status: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">รอดำเนินการ</SelectItem>
                  <SelectItem value="in_progress">กำลังดำเนินการ</SelectItem>
                  <SelectItem value="completed">เสร็จสิ้น</SelectItem>
                  <SelectItem value="cancelled">ยกเลิก</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>มอบหมายให้ช่าง</Label>
              <Select value={updateData.assignedTo} onValueChange={(v) => setUpdateData({ ...updateData, assignedTo: v })}>
                <SelectTrigger><SelectValue placeholder="เลือกช่างผู้รับผิดชอบ" /></SelectTrigger>
                <SelectContent>
                  {technicians.map((tech) => (
                    <SelectItem key={tech.id} value={tech.id}>
                      {tech.name} ({tech.role === 'admin' ? 'Admin' : 'Technician'})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>หมายเหตุจากช่าง</Label>
              <Textarea
                placeholder="กรุณากรอกรายละเอียดการซ่อม..."
                rows={5}
                value={updateData.technicianNotes}
                onChange={(e) => setUpdateData({ ...updateData, technicianNotes: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>ยกเลิก</Button>
            <Button onClick={handleUpdate} disabled={saving}>
              {saving ? 'กำลังบันทึก...' : 'บันทึกการเปลี่ยนแปลง'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
