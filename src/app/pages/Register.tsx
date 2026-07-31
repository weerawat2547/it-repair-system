import { useState } from 'react';
import { useNavigate, Link } from 'react-router';
import { Wrench, AlertCircle, CheckCircle, Eye, EyeOff, ArrowRight } from 'lucide-react';
import { mockUsers } from '../utils/mockData';
import { User } from '../types';

// ต้องอยู่นอก Register เพื่อไม่ให้ React สร้าง component ใหม่ทุก render
function Field({
  id, label, type = 'text', placeholder, value, onChange, required = false, rightEl,
}: {
  id: string;
  label: string;
  type?: string;
  placeholder: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  required?: boolean;
  rightEl?: React.ReactNode;
}) {
  return (
    <div>
      <label htmlFor={id} className="block text-slate-700 text-sm font-medium mb-1.5">
        {label}{required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      <div className="relative">
        <input
          id={id}
          type={type}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          required={required}
          className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
          style={rightEl ? { paddingRight: '2.75rem' } : {}}
        />
        {rightEl && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">{rightEl}</div>
        )}
      </div>
    </div>
  );
}

export default function Register() {
  const [formData, setFormData] = useState({
    username: '', password: '', confirmPassword: '',
    name: '', email: '', phone: '', department: '',
  });
  const [showPass, setShowPass] = useState(false);
  const [error, setError]       = useState('');
  const [loading, setLoading]   = useState(false);
  const [success, setSuccess]   = useState(false);
  const navigate = useNavigate();

  const set = (k: keyof typeof formData) =>
    (e: React.ChangeEvent<HTMLInputElement>) =>
      setFormData((prev) => ({ ...prev, [k]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError('รหัสผ่านไม่ตรงกัน');
      return;
    }
    if (formData.password.length < 6) {
      setError('รหัสผ่านต้องมีอักขระอย่างน้อย 6 ตัว');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('http://localhost/it_repair_api/register.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username:   formData.username,
          password:   formData.password,
          name:       formData.name,
          email:      formData.email,
          phone:      formData.phone,
          department: formData.department,
        }),
      });
      const result = await res.json();
      if (result.success) {
        setSuccess(true);
        setTimeout(() => navigate('/'), 2000);
      } else {
        setError(result.message || 'เกิดข้อผิดพลาด กรุณาลองใหม่');
      }
    } catch {
      const existingUsers = JSON.parse(localStorage.getItem('users') || '[]');
      const allUsers = [...mockUsers, ...existingUsers];
      if (allUsers.find((u) => u.username === formData.username)) {
        setError('ชื่อผู้ใช้นี้มีอยู่ในระบบแล้ว');
        setLoading(false);
        return;
      }
      if (allUsers.find((u) => u.email === formData.email)) {
        setError('อีเมลนี้มีอยู่ในระบบแล้ว');
        setLoading(false);
        return;
      }
      const newUser: User = {
        id:         Date.now().toString(),
        username:   formData.username,
        password:   formData.password,
        name:       formData.name,
        email:      formData.email,
        role:       'student',
        department: formData.department,
        phone:      formData.phone,
        createdAt:  new Date().toISOString(),
      };
      existingUsers.push(newUser);
      localStorage.setItem('users', JSON.stringify(existingUsers));
      setSuccess(true);
      setTimeout(() => navigate('/'), 2000);
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f0f4f8] p-6">
        <div className="bg-white rounded-2xl shadow-lg p-12 text-center max-w-sm w-full border border-slate-200/60">
          <div className="inline-flex bg-green-100 p-5 rounded-2xl mb-5">
            <CheckCircle className="size-14 text-green-600" />
          </div>
          <h3 className="text-slate-800 text-2xl font-bold mb-2">สมัครสำเร็จ!</h3>
          <p className="text-slate-500">กำลังพาคุณไปยังหน้าเข้าสู่ระบบ...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-[#f0f4f8]">
      {/* Left panel */}
      <div className="hidden lg:flex lg:w-2/5 bg-[#0f1e3d] flex-col items-center justify-center p-12 relative overflow-hidden">
        <div className="absolute -top-24 -left-24 size-80 rounded-full bg-blue-600/20" />
        <div className="absolute -bottom-24 -right-24 size-96 rounded-full bg-blue-800/20" />
        <div className="relative z-10 text-center">
          <div className="inline-flex bg-blue-600 p-5 rounded-2xl mb-8 shadow-lg shadow-blue-900/40">
            <Wrench className="size-12 text-white" />
          </div>
          <h1 className="text-white text-2xl font-bold mb-3">สมัครสมาชิก</h1>
          <p className="text-blue-300 mb-8">สร้างบัญชีเพื่อใช้งานระบบแจ้งซ่อม</p>
          <div className="space-y-3 text-left">
            {[
              'แจ้งซ่อมอุปกรณ์ IT ได้ตลอดเวลา',
              'ติดตามสถานะงานซ่อม real-time',
              'รับแจ้งเตือนผ่าน LINE OA',
            ].map((t) => (
              <div key={t} className="flex items-center gap-3">
                <CheckCircle className="size-4 text-green-400 shrink-0" />
                <span className="text-blue-200 text-sm">{t}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center p-6 overflow-y-auto">
        <div className="w-full max-w-xl py-6">
          <div className="lg:hidden text-center mb-8">
            <div className="inline-flex bg-blue-600 p-4 rounded-2xl mb-3">
              <Wrench className="size-10 text-white" />
            </div>
            <h1 className="text-slate-800 text-2xl font-bold">สมัครสมาชิก</h1>
          </div>

          <div className="bg-white rounded-2xl shadow-lg shadow-slate-200 p-8 border border-slate-200/60">
            <h2 className="text-slate-800 text-2xl font-bold mb-1">สร้างบัญชีใหม่</h2>
            <p className="text-slate-500 text-sm mb-7">กรอกข้อมูลให้ครบถ้วนเพื่อสมัครสมาชิก</p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field
                  id="username" label="ชื่อผู้ใช้" placeholder="กรอกชื่อผู้ใช้"
                  value={formData.username} onChange={set('username')} required
                />
                <Field
                  id="name" label="ชื่อ-นามสกุล" placeholder="กรอกชื่อ-นามสกุล"
                  value={formData.name} onChange={set('name')} required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field
                  id="password" label="รหัสผ่าน"
                  type={showPass ? 'text' : 'password'}
                  placeholder="อย่างน้อย 6 ตัวอักษร"
                  value={formData.password} onChange={set('password')} required
                  rightEl={
                    <button
                      type="button"
                      onClick={() => setShowPass((v) => !v)}
                      className="text-slate-400 hover:text-slate-600"
                    >
                      {showPass ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                    </button>
                  }
                />
                <Field
                  id="confirmPassword" label="ยืนยันรหัสผ่าน"
                  type="password" placeholder="กรอกรหัสผ่านอีกครั้ง"
                  value={formData.confirmPassword} onChange={set('confirmPassword')} required
                />
              </div>

              <Field
                id="email" label="อีเมล" type="email"
                placeholder="example@university.ac.th"
                value={formData.email} onChange={set('email')} required
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field
                  id="phone" label="เบอร์โทรศัพท์" type="tel"
                  placeholder="08-xxxx-xxxx"
                  value={formData.phone} onChange={set('phone')}
                />
                <Field
                  id="department" label="คณะ/หน่วยงาน"
                  placeholder="เช่น คณะวิศวกรรมศาสตร์"
                  value={formData.department} onChange={set('department')}
                />
              </div>

              {error && (
                <div className="flex items-center gap-2 bg-red-50 text-red-600 text-sm px-4 py-3 rounded-xl border border-red-100">
                  <AlertCircle className="size-4 shrink-0" />
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-semibold py-2.5 rounded-xl transition-colors shadow-md shadow-blue-500/20 mt-2"
              >
                {loading ? 'กำลังสมัคร...' : (
                  <>สมัครสมาชิก <ArrowRight className="size-4" /></>
                )}
              </button>
            </form>

            <p className="text-center text-slate-500 text-sm mt-6">
              มีบัญชีอยู่แล้ว?{' '}
              <Link to="/" className="text-blue-600 hover:text-blue-700 font-semibold">
                เข้าสู่ระบบ
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
