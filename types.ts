// Core types for UMC Media Hub rental system
export type UUID = string

export enum Role {
  PEMINJAM = "PEMINJAM",
  ADMIN = "ADMIN",
}

export enum UserStatus {
  AKTIF = "AKTIF",
  NONAKTIF = "NONAKTIF",
}

export enum Condition {
  BAIK = "BAIK",
  RUSAK_RINGAN = "RUSAK_RINGAN",
  RUSAK_BERAT = "RUSAK_BERAT",
  HILANG = "HILANG",
}

export enum AssetStatus {
  TERSEDIA = "TERSEDIA",
  DIPINJAM = "DIPINJAM",
  TIDAK_AKTIF = "TIDAK_AKTIF",
}

export enum ItemType {
  ASET = "ASET",
  JASA = "JASA",
}

export enum BookingType {
  ASET = "ASET",
  JASA = "JASA",
  CAMPUR = "CAMPUR",
}

export enum BookingStatus {
  MENUNGGU = "MENUNGGU",
  DIKONFIRMASI = "DIKONFIRMASI",
  DITOLAK = "DITOLAK",
  DIBATALKAN = "DIBATALKAN",
  SELESAI = "SELESAI",
}

export enum PaymentMethod {
  CASH = "CASH",
  TRANSFER = "TRANSFER",
  QRIS = "QRIS",
}

export enum PaymentStatus {
  PENDING = "PENDING",
  PAID = "PAID",
  FAILED = "FAILED",
  REFUNDED = "REFUNDED",
}

export enum FineType {
  TELAT = "TELAT",
  KERUSAKAN = "KERUSAKAN",
  KEHILANGAN = "KEHILANGAN",
  LAINNYA = "LAINNYA",
}

export enum NotificationChannel {
  EMAIL = "EMAIL",
  WA = "WA",
  APP = "APP",
}

export enum NotificationType {
  BOOKING = "BOOKING",
  PAYMENT = "PAYMENT",
  RETURN = "RETURN",
  SYSTEM = "SYSTEM",
}

export interface User {
  id: UUID
  name: string
  email: string
  phone?: string
  role: Role
  status: UserStatus
}

export interface Category {
  id: UUID
  name: string
  description?: string
}

export interface Asset {
  id: UUID
  categoryId?: UUID
  code: string
  name: string
  specification?: string
  acquisitionDate?: string
  conditionNow: Condition
  status: AssetStatus
  dailyRate: number
  stock: number
  photoUrl?: string
}

export interface Service {
  id: UUID
  categoryId?: UUID
  code: string
  name: string
  description?: string
  unitRate: number
  isActive: boolean
}

export interface BookingItem {
  id: UUID
  bookingId: UUID
  itemType: ItemType
  assetId?: UUID
  serviceId?: UUID
  qty: number
  price: number
}

export interface Booking {
  id: UUID
  userId: UUID
  type: BookingType
  startDatetime: string
  endDatetime: string
  status: BookingStatus
  approvedBy?: UUID
  approvedAt?: string
  notes?: string
}

export interface Payment {
  id: UUID
  bookingId: UUID
  amount: number
  method: PaymentMethod
  status: PaymentStatus
  paidAt?: string
  referenceNo?: string
  proofUrl?: string
}

export interface Return {
  id: UUID
  bookingItemId: UUID
  returnedAt: string
  conditionAfter: Condition
  notes?: string
  verifiedBy?: UUID
}

export interface Fine {
  id: UUID
  bookingId: UUID
  returnId?: UUID
  type: FineType
  amount: number
  isPaid: boolean
  paidAt?: string
  paymentId?: UUID
  notes?: string
}

export interface Feedback {
  id: UUID
  bookingId: UUID
  userId: UUID
  rating: number
  comment?: string
  createdAt: string
}

export interface Notification {
  id: UUID
  userId: UUID
  channel: NotificationChannel
  type: NotificationType
  title: string
  body?: string
  sentAt: string
  readAt?: string
}
