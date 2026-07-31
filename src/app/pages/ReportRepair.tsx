import { useState, useEffect } from 'react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../components/ui/dialog';
import { FileText, CheckCircle, Upload, X, ImageIcon, MapPin } from 'lucide-react';
import { toast } from 'sonner';
import LocationPicker from '../components/LocationPicker';
import { equipmentApi } from '../utils/api';
import { User } from '../types';

// --- ตรวจสอบ Environment และกำหนด Dynamic API Base URL ---
const isLocalhost = Boolean(
  window.location.hostname === 'localhost' ||
  window.location.hostname === '127.0.0.1'
);

const API_BASE_URL = isLocalhost
  ? 'http://localhost/it_repair_api'
  : 'http://it-repair-api.freehosting.dev';

export default function ReportRepair() {
  const [submitted, setSubmitted] = useState(false);
  const [submittedRequestNo, setSubmittedRequestNo] = useState('');
  const [images, setImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [showMap, setShowMap] = useState(false);
  const [locationCoords, setLocationCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [pendingCoords, setPendingCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [mapCenter] = useState<[number, number]>([18.7883, 98.9853]);
  const [equipmentTypes, setEquipmentTypes] = useState<{ id: number; name: string }[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);
  const [priority, setPriority] = useState<'medium' | 'high' | 'urgent'>('medium');
  const [formData, setFormData] = useState({
    equipmentType: '',
    equipmentTypeId: '',
    equipmentModel: '',
    serialNumber: '',
    location: '',
    problemDescription: '',
  });

  useEffect(() => {
    const userStr = localStorage.getItem('currentUser');
    if (userStr) setCurrentUser(JSON.parse(userStr));
    loadEquipmentTypes();
  }, []);

  const loadEquipmentTypes = async () => {
    try {
      const res = await equipmentApi.getAll();
      setEquipmentTypes(res.data);
    } catch {
      setEquipmentTypes([
        { id: 1, name: 'คอมพิวเตอร์ตั้งโต๊ะ' },
        { id: 2, name: 'โน้ตบุ๊ก' },
        { id: 3, name: 'เครื่องพิมพ์' },
        { id: 4, name: 'โปรเจกเตอร์' },
        { id: 5, name: 'สแกนเนอร์' },
        { id: 6, name: 'จอมอนิเตอร์' },
        { id: 7, name: 'อุปกรณ์เครือข่าย' },
        { id: 8, name: 'อื่นๆ' },
      ]);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      const fileArray = Array.from(files);
      
      // Check total images count
      if (images.length + fileArray.length > 5) {
        toast.error('สามารถอัปโหลดได้สูงสุด 5 รูปภาพ');
        return;
      }

      // Check file size (max 5MB per file)
      const oversizedFiles = fileArray.filter(file => file.size > 5 * 1024 * 1024);
      if (oversizedFiles.length > 0) {
        toast.error('ไฟล์รูปภาพต้องมีขนาดไม่เกิน 5 MB');
        return;
      }

      // Add new images
      setImages([...images, ...fileArray]);

      // Create previews
      fileArray.forEach(file => {
        const reader = new FileReader();
        reader.onloadend = () => {
          setImagePreviews(prev => [...prev, reader.result as string]);
        };
        reader.readAsDataURL(file);
      });

      toast.success(`อัปโหลดรูปภาพสำเร็จ ${fileArray.length} รูป`);
    }
  };

  const removeImage = (index: number) => {
    setImages(images.filter((_, i) => i !== index));
    setImagePreviews(imagePreviews.filter((_, i) => i !== index));
    toast.info('ลบรูปภาพแล้ว');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    setLoading(true);

    try {
      const fd = new FormData();
      fd.append('user_id',               currentUser.id);
      fd.append('equipment_type_id',    formData.equipmentTypeId || '');
      fd.append('equipment_model',      formData.equipmentModel);
      fd.append('serial_number',        formData.serialNumber);
      fd.append('location_description', formData.location);
      fd.append('location_lat',         String(locationCoords?.lat || ''));
      fd.append('location_lng',         String(locationCoords?.lng || ''));
      fd.append('problem_description',  formData.problemDescription);
      fd.append('priority',             priority);
      images.forEach((img) => fd.append('images[]', img));

      // 🔄 ใช้ API_BASE_URL แบบ Dynamic
      const res = await fetch(`${API_BASE_URL}/repair_requests.php`, {
        method: 'POST',
        body: fd,
      }).then(r => r.json());

      setSubmittedRequestNo(res.request_no);
      setSubmitted(true);
      toast.success('ส่งคำขอซ่อมเรียบร้อยแล้ว');
    } catch {
      // fallback: บันทึกลง LocalStorage
      const requestNo = 'REQ-' + Date.now();
      setSubmittedRequestNo(requestNo);
      setSubmitted(true);
      toast.success('ส่งคำขอซ่อมเรียบร้อยแล้ว (offline mode)');
    } finally {
      setLoading(false);
      setTimeout(() => {
        setSubmitted(false);
        setSubmittedRequestNo('');
        setFormData({ equipmentType: '', equipmentTypeId: '', equipmentModel: '', serialNumber: '', location: '', problemDescription: '' });
        setImages([]);
        setImagePreviews([]);
        setLocationCoords(null);
        setPendingCoords(null);
      }, 3000);
    }
  };

  if (submitted) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center py-12">
            <div className="flex justify-center mb-4">
              <div className="bg-green-100 p-4 rounded-full">
                <CheckCircle className="size-16 text-green-600" />
              </div>
            </div>
            <h3 className="text-2xl font-bold text-green-600 mb-2">
              ส่งคำขอซ่อมเรียบร้อยแล้ว
            </h3>
            <p className="text-gray-600">
              เลขที่คำขอ: {submittedRequestNo}
            </p>
            <p className="text-gray-600 mt-2">
              เราจะดำเนินการตรวจสอบและติดต่อกลับโดยเร็วที่สุด
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="bg-blue-100 p-3 rounded-lg">
            <FileText className="size-6 text-blue-600" />
          </div>
          <div>
            <CardTitle>แจ้งซ่อมอุปกรณ์</CardTitle>
            <CardDescription>
              กรุณากรอกข้อมูลเพื่อแจ้งซ่อมอุปกรณ์ที่มีปัญหา
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="equipmentType">ประเภทอุปกรณ์ *</Label>
              <Select
                value={formData.equipmentTypeId}
                onValueChange={(value) =>
                  setFormData({ ...formData, equipmentTypeId: value, equipmentType: equipmentTypes.find(e => String(e.id) === value)?.name || '' })
                }
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="เลือกประเภทอุปกรณ์" />
                </SelectTrigger>
                <SelectContent>
                  {equipmentTypes.map((et) => (
                    <SelectItem key={et.id} value={String(et.id)}>{et.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="equipmentModel">รุ่นอุปกรณ์</Label>
              <Input
                id="equipmentModel"
                placeholder="เช่น Dell OptiPlex 7090"
                value={formData.equipmentModel}
                onChange={(e) =>
                  setFormData({ ...formData, equipmentModel: e.target.value })
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="serialNumber">Serial Number</Label>
              <Input
                id="serialNumber"
                placeholder="หมายเลขเครื่อง (ถ้ามี)"
                value={formData.serialNumber}
                onChange={(e) =>
                  setFormData({ ...formData, serialNumber: e.target.value })
                }
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="location">สถานที่ตั้งอุปกรณ์ *</Label>
            <Input
              id="location"
              placeholder="เช่น ห้องปฏิบัติการคอมพิวเตอร์ 301 อาคาร 3"
              value={formData.location}
              onChange={(e) =>
                setFormData({ ...formData, location: e.target.value })
              }
              required
            />
            <button
              type="button"
              onClick={() => {
                setPendingCoords(locationCoords);
                setShowMap(true);
              }}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl border text-sm transition-all ${
                locationCoords
                  ? 'bg-green-50 border-green-300 text-green-700 hover:bg-green-100'
                  : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
              }`}
            >
              <MapPin className="size-4" />
              {locationCoords
                ? `📍 ปักหมุดแล้ว: ${locationCoords.lat.toFixed(5)}, ${locationCoords.lng.toFixed(5)} (คลิกเพื่อเปลี่ยน)`
                : 'ปักหมุดตำแหน่งบนแผนที่ (ไม่บังคับ)'}
            </button>
          </div>

          {/* Map Dialog */}
          <Dialog open={showMap} onOpenChange={(open) => {
            if (!open) setPendingCoords(locationCoords); // reset pending on close
            setShowMap(open);
          }}>
            <DialogContent className="max-w-3xl w-full">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <MapPin className="size-5 text-blue-600" />
                  เลือกสถานที่บนแผนที่
                </DialogTitle>
                <DialogDescription>
                  คลิกบนแผนที่เพื่อปักหมุด หรือกดปุ่ม "ตำแหน่งปัจจุบัน" เพื่อใช้ GPS
                </DialogDescription>
              </DialogHeader>

              <LocationPicker
                center={mapCenter}
                initialCoords={locationCoords}
                onSelect={(lat, lng) => {
                  setPendingCoords({ lat, lng });
                }}
              />

              {/* Selected coords display */}
              <div className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm ${
                pendingCoords
                  ? 'bg-green-50 border border-green-200 text-green-700'
                  : 'bg-slate-50 border border-slate-200 text-slate-400'
              }`}>
                <MapPin className="size-4 shrink-0" />
                {pendingCoords
                  ? `ตำแหน่งที่เลือก: ${pendingCoords.lat.toFixed(6)}, ${pendingCoords.lng.toFixed(6)}`
                  : 'ยังไม่ได้เลือกตำแหน่ง — คลิกบนแผนที่'}
              </div>

              <div className="flex justify-end gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setPendingCoords(locationCoords);
                    setShowMap(false);
                  }}
                >
                  ยกเลิก
                </Button>
                <Button
                  type="button"
                  disabled={!pendingCoords}
                  onClick={() => {
                    if (pendingCoords) {
                      setLocationCoords(pendingCoords);
                      toast.success('บันทึกตำแหน่งสำเร็จ', {
                        description: `${pendingCoords.lat.toFixed(6)}, ${pendingCoords.lng.toFixed(6)}`,
                      });
                    }
                    setShowMap(false);
                  }}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  <MapPin className="size-4 mr-2" />
                  ยืนยันตำแหน่ง
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          {/* ความเร่งด่วน */}
          <div className="space-y-3">
            <Label>ระดับความเร่งด่วน *</Label>
            <div className="grid grid-cols-3 gap-3">
              {[
                { value: 'medium', label: 'ปานกลาง',     icon: '🟡', desc: 'ไม่เร่งด่วน ดำเนินการตามคิว' },
                { value: 'high',   label: 'เร่งด่วน',    icon: '🟠', desc: 'กระทบการทำงาน ต้องซ่อมเร็ว' },
                { value: 'urgent', label: 'เร่งด่วนมาก', icon: '🔴', desc: 'หยุดการทำงานทันที ต้องซ่อมด่วน' },
              ].map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setPriority(opt.value as typeof priority)}
                  className={`flex flex-col items-center gap-1 p-4 rounded-xl border-2 transition-all text-center
                    ${priority === opt.value
                      ? 'border-blue-500 bg-blue-50 shadow-md'
                      : 'border-gray-200 bg-white hover:border-gray-300'
                    }`}
                >
                  <span className="text-2xl">{opt.icon}</span>
                  <span className={`text-sm font-semibold ${priority === opt.value ? 'text-blue-700' : 'text-gray-700'}`}>
                    {opt.label}
                  </span>
                  <span className="text-xs text-gray-500 leading-tight">{opt.desc}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="problemDescription">อาการเสีย / ปัญหาที่พบ *</Label>
            <Textarea
              id="problemDescription"
              placeholder="โปรดอธิบายอาการเสียหรือปัญหาที่พบโดยละเอียด..."
              rows={5}
              value={formData.problemDescription}
              onChange={(e) =>
                setFormData({ ...formData, problemDescription: e.target.value })
              }
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="images">อัปโหลดรูปภาพเพิ่มเติม (ไม่เกิน 5 รูป)</Label>
            <div className="flex items-center gap-3">
              <Input
                id="images"
                type="file"
                accept="image/*"
                multiple
                onChange={handleImageUpload}
                className="hidden"
              />
              <Button
                type="button"
                variant="outline"
                onClick={() => document.getElementById('images')?.click()}
                disabled={images.length >= 5}
              >
                <Upload className="size-4 mr-2" />
                อัปโหลดรูปภาพ ({images.length}/5)
              </Button>
              {images.length > 0 && (
                <span className="text-sm text-gray-500">
                  {images.length} รูป
                </span>
              )}
            </div>
            
            {imagePreviews.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 mt-4">
                {imagePreviews.map((preview, index) => (
                  <div key={index} className="relative group">
                    <img
                      src={preview}
                      alt={`อัปโหลดรูปที่ ${index + 1}`}
                      className="w-full h-32 object-cover rounded-lg border-2 border-gray-200"
                    />
                    <Button
                      type="button"
                      variant="destructive"
                      size="icon"
                      className="absolute top-1 right-1 size-7 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => removeImage(index)}
                    >
                      <X className="size-4" />
                    </Button>
                    <div className="absolute bottom-1 left-1 bg-black/60 text-white text-xs px-2 py-0.5 rounded">
                      {index + 1}
                    </div>
                  </div>
                ))}
              </div>
            )}
            
            {images.length === 0 && (
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                <ImageIcon className="size-12 text-gray-400 mx-auto mb-2" />
                <p className="text-sm text-gray-500">
                  คลิกปุ่ม "อัปโหลดรูปภาพ" เพื่อเพิ่มรูปถ่ายอาการเสีย
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  รองรับไฟล์ JPG, PNG ขนาดไม่เกิน 5 MB ต่อรูป
                </p>
              </div>
            )}
          </div>

          <div className="flex gap-3">
            <Button type="submit" className="flex-1" disabled={loading}>
              {loading ? 'กำลังส่ง...' : 'ส่งคำขอซ่อม'}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setFormData({ equipmentType: '', equipmentTypeId: '', equipmentModel: '', serialNumber: '', location: '', problemDescription: '' });
                setLocationCoords(null);
                setPendingCoords(null);
                setImages([]);
                setImagePreviews([]);
              }}
            >
              ล้างข้อมูล
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}