export type UserRole = 'student' | 'technician' | 'admin';

export interface User {
  id: string;
  username: string;
  password: string;
  name: string;
  email: string;
  role: UserRole;
  department?: string;
  phone?: string;
  createdAt: string;
}

export type RepairStatus = 'pending' | 'in-progress' | 'completed' | 'cancelled';

export interface RepairRequest {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  userPhone: string;
  department: string;
  equipmentType: string;
  equipmentModel?: string;
  serialNumber?: string;
  location: string;
  problemDescription: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: RepairStatus;
  assignedTo?: string;
  assignedTechnicianName?: string;
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
  notes?: string;
  technicianNotes?: string;
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'bot';
  message: string;
  timestamp: string;
}
