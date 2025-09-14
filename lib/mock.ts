import {
  type User,
  type Category,
  type Asset,
  type Service,
  type Booking,
  type BookingItem,
  type Payment,
  type Return,
  type Fine,
  type Feedback,
  type Notification,
  Role,
  UserStatus,
  Condition,
  AssetStatus,
  ItemType,
  BookingType,
  BookingStatus,
  PaymentMethod,
  PaymentStatus,
  FineType,
  NotificationChannel,
  NotificationType,
} from "../types"

// Helper function to generate UUID
const generateId = () => Math.random().toString(36).substr(2, 9)

// Mock Users
export const mockUsers: User[] = [
  {
    id: "user-admin-001",
    name: "Admin UMC",
    email: "admin@umc.ac.id",
    phone: "081234567890",
    role: Role.ADMIN,
    status: UserStatus.AKTIF,
  },
  {
    id: "user-peminjam-001",
    name: "Budi Santoso",
    email: "budi@student.umc.ac.id",
    phone: "081234567891",
    role: Role.PEMINJAM,
    status: UserStatus.AKTIF,
  },
  {
    id: "user-peminjam-002",
    name: "Sari Dewi",
    email: "sari@student.umc.ac.id",
    phone: "081234567892",
    role: Role.PEMINJAM,
    status: UserStatus.AKTIF,
  },
]

// Mock Categories
export const mockCategories: Category[] = [
  {
    id: "cat-001",
    name: "Kamera",
    description: "Peralatan kamera dan aksesoris",
  },
  {
    id: "cat-002",
    name: "Audio",
    description: "Peralatan audio dan sound system",
  },
  {
    id: "cat-003",
    name: "Lighting",
    description: "Peralatan pencahayaan dan studio",
  },
]

// Mock Assets
export const mockAssets: Asset[] = [
  {
    id: "asset-001",
    categoryId: "cat-001",
    code: "CAM-001",
    name: "Canon EOS R5",
    specification: "Mirrorless Camera 45MP, 8K Video",
    acquisitionDate: "2023-01-15",
    conditionNow: Condition.BAIK,
    status: AssetStatus.TERSEDIA,
    dailyRate: 500000,
    stock: 2,
    photoUrl: "/canon-eos-r5-camera.jpg",
  },
  {
    id: "asset-002",
    categoryId: "cat-001",
    code: "CAM-002",
    name: "Sony A7 III",
    specification: "Full Frame Mirrorless 24MP",
    acquisitionDate: "2023-02-20",
    conditionNow: Condition.BAIK,
    status: AssetStatus.DIPINJAM,
    dailyRate: 400000,
    stock: 1,
    photoUrl: "/sony-a7-iii-camera.jpg",
  },
  {
    id: "asset-003",
    categoryId: "cat-002",
    code: "AUD-001",
    name: "Rode VideoMic Pro",
    specification: "Directional Microphone",
    acquisitionDate: "2023-03-10",
    conditionNow: Condition.BAIK,
    status: AssetStatus.TERSEDIA,
    dailyRate: 150000,
    stock: 3,
    photoUrl: "/rode-videomic-pro-microphone.jpg",
  },
  {
    id: "asset-004",
    categoryId: "cat-003",
    code: "LGT-001",
    name: "Godox SL-60W",
    specification: "LED Video Light 60W",
    acquisitionDate: "2023-04-05",
    conditionNow: Condition.RUSAK_RINGAN,
    status: AssetStatus.TERSEDIA,
    dailyRate: 200000,
    stock: 2,
    photoUrl: "/godox-led-video-light.jpg",
  },
  {
    id: "asset-005",
    categoryId: "cat-001",
    code: "CAM-003",
    name: "DJI Ronin SC",
    specification: "Camera Gimbal Stabilizer",
    acquisitionDate: "2023-05-12",
    conditionNow: Condition.BAIK,
    status: AssetStatus.TERSEDIA,
    dailyRate: 300000,
    stock: 1,
    photoUrl: "/dji-ronin-sc-gimbal.jpg",
  },
]

// Mock Services
export const mockServices: Service[] = [
  {
    id: "service-001",
    categoryId: "cat-001",
    code: "SVC-001",
    name: "Jasa Fotografi Event",
    description: "Layanan fotografer profesional untuk acara",
    unitRate: 2000000,
    isActive: true,
  },
  {
    id: "service-002",
    categoryId: "cat-002",
    code: "SVC-002",
    name: "Jasa Editing Video",
    description: "Layanan editing video profesional",
    unitRate: 1500000,
    isActive: true,
  },
  {
    id: "service-003",
    categoryId: "cat-003",
    code: "SVC-003",
    name: "Jasa Setup Studio",
    description: "Layanan setup studio lighting dan audio",
    unitRate: 1000000,
    isActive: true,
  },
]

// Mock Bookings
export const mockBookings: Booking[] = [
  {
    id: "booking-001",
    userId: "user-peminjam-001",
    type: BookingType.ASET,
    startDatetime: "2024-01-15T09:00:00Z",
    endDatetime: "2024-01-17T17:00:00Z",
    status: BookingStatus.DIKONFIRMASI,
    approvedBy: "user-admin-001",
    approvedAt: "2024-01-14T10:00:00Z",
    notes: "Untuk project dokumenter kampus",
  },
  {
    id: "booking-002",
    userId: "user-peminjam-002",
    type: BookingType.CAMPUR,
    startDatetime: "2024-01-20T08:00:00Z",
    endDatetime: "2024-01-22T18:00:00Z",
    status: BookingStatus.MENUNGGU,
    notes: "Event wisuda fakultas",
  },
  {
    id: "booking-003",
    userId: "user-peminjam-001",
    type: BookingType.JASA,
    startDatetime: "2024-01-25T10:00:00Z",
    endDatetime: "2024-01-25T16:00:00Z",
    status: BookingStatus.SELESAI,
    approvedBy: "user-admin-001",
    approvedAt: "2024-01-24T09:00:00Z",
    notes: "Jasa editing untuk video promosi",
  },
]

// Mock Booking Items
export const mockBookingItems: BookingItem[] = [
  {
    id: "item-001",
    bookingId: "booking-001",
    itemType: ItemType.ASET,
    assetId: "asset-002",
    qty: 1,
    price: 800000,
  },
  {
    id: "item-002",
    bookingId: "booking-002",
    itemType: ItemType.ASET,
    assetId: "asset-001",
    qty: 1,
    price: 1000000,
  },
  {
    id: "item-003",
    bookingId: "booking-002",
    itemType: ItemType.JASA,
    serviceId: "service-001",
    qty: 1,
    price: 2000000,
  },
  {
    id: "item-004",
    bookingId: "booking-003",
    itemType: ItemType.JASA,
    serviceId: "service-002",
    qty: 1,
    price: 1500000,
  },
]

// Mock Payments
export const mockPayments: Payment[] = [
  {
    id: "payment-001",
    bookingId: "booking-001",
    amount: 800000,
    method: PaymentMethod.TRANSFER,
    status: PaymentStatus.PAID,
    paidAt: "2024-01-14T14:30:00Z",
    referenceNo: "TRF-001-2024",
    proofUrl: "/bank-transfer-receipt.png",
  },
  {
    id: "payment-002",
    bookingId: "booking-003",
    amount: 1500000,
    method: PaymentMethod.QRIS,
    status: PaymentStatus.PAID,
    paidAt: "2024-01-25T11:00:00Z",
    referenceNo: "QRIS-002-2024",
  },
]

// Mock Returns
export const mockReturns: Return[] = [
  {
    id: "return-001",
    bookingItemId: "item-004",
    returnedAt: "2024-01-25T17:00:00Z",
    conditionAfter: Condition.BAIK,
    notes: "Dikembalikan dalam kondisi baik",
    verifiedBy: "user-admin-001",
  },
]

// Mock Fines
export const mockFines: Fine[] = [
  {
    id: "fine-001",
    bookingId: "booking-001",
    type: FineType.TELAT,
    amount: 100000,
    isPaid: false,
    notes: "Terlambat mengembalikan 1 hari",
  },
  {
    id: "fine-002",
    bookingId: "booking-002",
    type: FineType.KERUSAKAN,
    amount: 500000,
    isPaid: true,
    paidAt: "2024-01-23T10:00:00Z",
    paymentId: "payment-fine-001",
    notes: "Kerusakan ringan pada lensa",
  },
]

// Mock Feedback
export const mockFeedback: Feedback[] = [
  {
    id: "feedback-001",
    bookingId: "booking-001",
    userId: "user-peminjam-001",
    rating: 5,
    comment: "Pelayanan sangat baik, peralatan berkualitas tinggi",
    createdAt: "2024-01-18T10:00:00Z",
  },
  {
    id: "feedback-002",
    bookingId: "booking-003",
    userId: "user-peminjam-001",
    rating: 4,
    comment: "Jasa editing profesional, hasil memuaskan",
    createdAt: "2024-01-26T09:00:00Z",
  },
]

// Mock Notifications
export const mockNotifications: Notification[] = [
  {
    id: "notif-001",
    userId: "user-peminjam-001",
    channel: NotificationChannel.APP,
    type: NotificationType.BOOKING,
    title: "Booking Dikonfirmasi",
    body: "Booking #booking-001 telah dikonfirmasi admin",
    sentAt: "2024-01-14T10:05:00Z",
    readAt: "2024-01-14T10:30:00Z",
  },
  {
    id: "notif-002",
    userId: "user-peminjam-002",
    channel: NotificationChannel.APP,
    type: NotificationType.BOOKING,
    title: "Booking Menunggu Konfirmasi",
    body: "Booking #booking-002 sedang menunggu konfirmasi admin",
    sentAt: "2024-01-19T15:00:00Z",
  },
  {
    id: "notif-003",
    userId: "user-peminjam-001",
    channel: NotificationChannel.APP,
    type: NotificationType.PAYMENT,
    title: "Pembayaran Berhasil",
    body: "Pembayaran untuk booking #booking-001 telah dikonfirmasi",
    sentAt: "2024-01-14T14:35:00Z",
    readAt: "2024-01-14T15:00:00Z",
  },
  {
    id: "notif-004",
    userId: "user-admin-001",
    channel: NotificationChannel.APP,
    type: NotificationType.RETURN,
    title: "Pengembalian Asset",
    body: "Asset Sony A7 III telah dikembalikan oleh Budi Santoso",
    sentAt: "2024-01-17T17:30:00Z",
  },
  {
    id: "notif-005",
    userId: "user-peminjam-001",
    channel: NotificationChannel.APP,
    type: NotificationType.SYSTEM,
    title: "Reminder Pengembalian",
    body: "Jangan lupa mengembalikan asset besok tanggal 17 Januari",
    sentAt: "2024-01-16T09:00:00Z",
    readAt: "2024-01-16T09:15:00Z",
  },
]

// Export all mock data
export const mockData = {
  users: mockUsers,
  categories: mockCategories,
  assets: mockAssets,
  services: mockServices,
  bookings: mockBookings,
  bookingItems: mockBookingItems,
  payments: mockPayments,
  returns: mockReturns,
  fines: mockFines,
  feedback: mockFeedback,
  notifications: mockNotifications,
}
