import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Badge } from '../components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Users, UserPlus, Edit, Trash2, Search } from 'lucide-react';
import { UserRole } from '../types';
import { toast } from 'sonner';
import { usersApi } from '../utils/api';
import { mockUsers } from '../utils/mockData';

export default function UserManagement() {
  const [users, setUsers] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [currentEditUser, setCurrentEditUser] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    username: '', password: '', name: '', email: '',
    role: 'student' as UserRole, department: '', phone: '',
  });

  useEffect(() => { loadUsers(); }, []);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const res = await usersApi.getAll();
      setUsers(res.data);
    } catch {
      setUsers(mockUsers.map((u) => ({ ...u, is_active: true, created_at: u.createdAt })));
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAddDialog = () => {
    setEditMode(false);
    setCurrentEditUser(null);
    setFormData({ username: '', password: '', name: '', email: '', role: 'student', department: '', phone: '' });
    setDialogOpen(true);
  };

  const handleOpenEditDialog = (user: any) => {
    setEditMode(true);
    setCurrentEditUser(user);
    setFormData({
      username: user.username, password: '',
      name: user.name, email: user.email,
      role: user.role, department: user.department || '', phone: user.phone || '',
    });
    setDialogOpen(true);
  };

  const handleSubmit = async () => {
    setSaving(true);
    try {
      if (editMode && currentEditUser) {
        await usersApi.update({ id: currentEditUser.id, ...formData });
        toast.success('อัปเดตข้อมูลผู้ใช้เรียบร้อยแล้ว');
      } else {
        await usersApi.create(formData);
        toast.success('เพิ่มผู้ใช้ใหม่เรียบร้อยแล้ว');
      }
      setDialogOpen(false);
      loadUsers();
    } catch (err: any) {
      toast.error(err.message || 'เกิดข้อผิดพลาด');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (userId: string) => {
    if (!confirm('คุณแน่ใจหรือไม่ว่าต้องการลบผู้ใช้นี้?')) return;
    try {
      await usersApi.delete(userId);
      toast.success('ลบผู้ใช้เรียบร้อยแล้ว');
      loadUsers();
    } catch {
      toast.error('ไม่สามารถลบผู้ใช้ได้');
    }
  };

  const getRoleBadge = (role: UserRole) => {
    switch (role) {
      case 'admin':      return <Badge variant="destructive">ผู้ดูแลระบบ</Badge>;
      case 'technician': return <Badge className="bg-blue-600">ช่างซ่อม</Badge>;
      case 'student':    return <Badge variant="secondary">นักศึกษา</Badge>;
      default:           return null;
    }
  };

  const filteredUsers = users.filter((user) => {
    const term = searchTerm.toLowerCase();
    return (
      user.name?.toLowerCase().includes(term) ||
      user.username?.toLowerCase().includes(term) ||
      user.email?.toLowerCase().includes(term)
    );
  });

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="bg-purple-100 p-3 rounded-lg">
                <Users className="size-6 text-purple-600" />
              </div>
              <div>
                <CardTitle>จัดการผู้ใช้งาน</CardTitle>
                <CardDescription>เพิ่ม แก้ไข และจัดการผู้ใช้งานในระบบ</CardDescription>
              </div>
            </div>
            <Button onClick={handleOpenAddDialog}>
              <UserPlus className="size-4 mr-2" />
              เพิ่มผู้ใช้ใหม่
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex gap-3 mb-6">
            <Input
              placeholder="ค้นหาผู้ใช้..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1"
            />
            <Button variant="outline" onClick={loadUsers}>
              <Search className="size-4 mr-2" />
              ค้นหา
            </Button>
          </div>

          {loading ? (
            <div className="text-center py-8 text-gray-500">กำลังโหลด...</div>
          ) : (
            <div className="rounded-lg border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ชื่อผู้ใช้</TableHead>
                    <TableHead>ชื่อ-นามสกุล</TableHead>
                    <TableHead>อีเมล</TableHead>
                    <TableHead>แผนก/คณะ</TableHead>
                    <TableHead>บทบาท</TableHead>
                    <TableHead className="text-right">จัดการ</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">{user.username}</TableCell>
                      <TableCell>{user.name}</TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>{user.department || '-'}</TableCell>
                      <TableCell>{getRoleBadge(user.role)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button variant="outline" size="sm" onClick={() => handleOpenEditDialog(user)}>
                            <Edit className="size-4" />
                          </Button>
                          <Button
                            variant="outline" size="sm"
                            onClick={() => handleDelete(user.id)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="size-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          {!loading && filteredUsers.length === 0 && (
            <div className="text-center py-8 text-gray-500">ไม่พบข้อมูลผู้ใช้</div>
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editMode ? 'แก้ไขข้อมูลผู้ใช้' : 'เพิ่มผู้ใช้ใหม่'}</DialogTitle>
            <DialogDescription>กรุณากรอกข้อมูลผู้ใช้ให้ครบถ้วน</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>ชื่อผู้ใช้ *</Label>
                <Input value={formData.username} onChange={(e) => setFormData({ ...formData, username: e.target.value })} disabled={editMode} />
              </div>
              <div className="space-y-2">
                <Label>{editMode ? 'รหัสผ่านใหม่ (เว้นว่างถ้าไม่เปลี่ยน)' : 'รหัสผ่าน *'}</Label>
                <Input type="password" value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>ชื่อ-นามสกุล *</Label>
              <Input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>อีเมล *</Label>
                <Input type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>เบอร์โทรศัพท์</Label>
                <Input value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>บทบาท *</Label>
                <Select value={formData.role} onValueChange={(v) => setFormData({ ...formData, role: v as UserRole })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="student">นักศึกษา</SelectItem>
                    <SelectItem value="technician">ช่างซ่อม</SelectItem>
                    <SelectItem value="admin">ผู้ดูแลระบบ</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>แผนก/คณะ</Label>
                <Input value={formData.department} onChange={(e) => setFormData({ ...formData, department: e.target.value })} />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>ยกเลิก</Button>
            <Button onClick={handleSubmit} disabled={saving}>
              {saving ? 'กำลังบันทึก...' : editMode ? 'บันทึกการเปลี่ยนแปลง' : 'เพิ่มผู้ใช้'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
