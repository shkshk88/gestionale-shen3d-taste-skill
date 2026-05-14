// User types
export type UserRole = 'admin' | 'operator' | 'client'

export interface User {
  id: string
  email: string
  name: string
  role: UserRole
  googleId?: string
  language: Language
  clientId?: string
  client?: Client  // Relation populated from backend
  avatarUrl?: string
  createdAt: string
  updatedAt: string
}

// Language support
export type Language = 'it' | 'en' | 'fr' | 'he'

// Client (Dentist) types
export interface Client {
  id: string
  studioName: string
  contactPerson: string
  address: string
  city: string
  postalCode: string
  country: string
  phone: string
  email: string
  whatsapp?: string
  vatNumber?: string
  taxCode?: string
  priceListId?: string
  notes?: string
  active: boolean
  createdAt: string
  updatedAt: string
}

// Case types
export type CaseStatus = 'received' | 'in_progress' | 'qc' | 'shipped' | 'delivered'
export type CasePriority = 'normal' | 'urgent' | 'rush'
export type WorkType = 'corona' | 'protesi' | 'impianto' | 'bite' | 'maryland' | 'intarsio' | 'faccetta' | 'altro'
export type Material = 'ZR' | 'EMAX' | 'PMMA' | 'RES' | 'CR-CO' | 'CERAM' | 'COMP' | 'ALT'

export interface Case {
  id: string
  caseNumber: string
  clientId: string
  client?: Client
  patientName: string
  patientNotes?: string
  status: CaseStatus
  priority: CasePriority
  receivedDate: string
  dueDate: string
  shippedDate?: string
  totalPrice?: number
  notesInternal?: string
  teeth: CaseTooth[]
  files: CaseFile[]
  messages?: CaseMessage[]
  timeline?: CaseTimelineEvent[]
  createdBy: string
  createdAt: string
  updatedAt: string
}

export interface CaseTooth {
  id: string
  caseId: string
  toothNumber: number
  workType: WorkType
  material: Material
  vitaColor?: string
  unitPrice?: number
  notes?: string
  createdAt: string
}

export interface CaseFile {
  id: string
  caseId: string
  fileName: string
  filePath: string
  fileType: 'image' | 'stl' | 'ply' | 'other'
  fileSize: number
  uploadedBy: string
  uploadedAt: string
  isDeleted: boolean
  thumbnailUrl?: string
  downloadUrl?: string
}

export interface CaseMessage {
  id: string
  caseId: string
  senderId: string
  sender?: User
  messageText: string
  messageType: 'text' | 'file' | 'annotation'
  fileId?: string
  file?: CaseFile
  annotationData?: AnnotationData
  isRead: boolean
  createdAt: string
  updatedAt: string
}

export interface AnnotationData {
  type: 'arrow' | 'marker' | 'text'
  position: { x: number; y: number; z?: number }
  color: string
  text?: string
  targetPosition?: { x: number; y: number; z?: number }
}

export interface CaseTimelineEvent {
  id: string
  caseId: string
  eventType: 'created' | 'status_changed' | 'note_added' | 'message_sent' | 'file_uploaded'
  eventData: Record<string, unknown>
  userId?: string
  user?: User
  createdAt: string
}

// Price list types
export interface PriceList {
  id: string
  listName: string
  description?: string
  isDefault: boolean
  validFrom?: string
  validTo?: string
  items: PriceListItem[]
  createdAt: string
  updatedAt: string
}

export interface PriceListItem {
  id: string
  priceListId: string
  workType: WorkType
  material: Material
  unitPrice: number
  updatedAt: string
}

// Notification types
export type NotificationType =
  | 'new_case'
  | 'new_message'
  | 'status_change'
  | 'delay_alert'
  | 'delivery_reminder'
  | 'qc_completed'

export interface Notification {
  id: string
  userId: string
  notificationType: NotificationType
  title: string
  message: string
  link?: string
  isRead: boolean
  createdAt: string
  readAt?: string
}

export interface NotificationSettings {
  id: string
  userId: string
  notifyNewCase: boolean
  notifyNewMessage: boolean
  notifyStatusChange: boolean
  notifyDelayAlert: boolean
  notifyDeliveryReminder: boolean
  notifyViaEmail: boolean
  notifyViaWhatsapp: boolean
  updatedAt: string
}

// API response types
export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  limit: number
  totalPages: number
}

export interface ApiError {
  statusCode: number
  message: string
  error?: string
}

// Constants
export const WORK_TYPES: { value: WorkType; label: string }[] = [
  { value: 'corona', label: 'Corona' },
  { value: 'protesi', label: 'Protesi' },
  { value: 'impianto', label: 'Impianto' },
  { value: 'bite', label: 'Bite' },
  { value: 'maryland', label: 'Maryland' },
  { value: 'intarsio', label: 'Intarsio' },
  { value: 'faccetta', label: 'Faccetta' },
  { value: 'altro', label: 'Altro' },
]

export const MATERIALS: { value: Material; label: string; color: string }[] = [
  { value: 'ZR', label: 'Zirconio', color: '#3b82f6' },
  { value: 'EMAX', label: 'Disilicato di Litio', color: '#8b5cf6' },
  { value: 'PMMA', label: 'PMMA', color: '#fbbf24' },
  { value: 'RES', label: 'Resina', color: '#f97316' },
  { value: 'CR-CO', label: 'Cromo-Cobalto', color: '#6b7280' },
  { value: 'CERAM', label: 'Ceramica', color: '#ea580c' },
  { value: 'COMP', label: 'Composito', color: '#06b6d4' },
  { value: 'ALT', label: 'Altro', color: '#a855f7' },
]

export const VITA_COLORS = [
  'A1', 'A2', 'A3', 'A3.5', 'A4',
  'B1', 'B2', 'B3', 'B4',
  'C1', 'C2', 'C3', 'C4',
  'D2', 'D3', 'D4',
]

export const CASE_STATUSES: { value: CaseStatus; label: string; color: string }[] = [
  { value: 'received', label: 'Ricevuto', color: '#3b82f6' },
  { value: 'in_progress', label: 'In Lavorazione', color: '#f59e0b' },
  { value: 'qc', label: 'Controllo Qualità', color: '#8b5cf6' },
  { value: 'shipped', label: 'Spedito', color: '#22c55e' },
  { value: 'delivered', label: 'Consegnato', color: '#16a34a' },
]

export const CASE_PRIORITIES: { value: CasePriority; label: string; color: string }[] = [
  { value: 'normal', label: 'Normale', color: '#22c55e' },
  { value: 'urgent', label: 'Urgente', color: '#f59e0b' },
  { value: 'rush', label: 'Rush', color: '#ef4444' },
]
