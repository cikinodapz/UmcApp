// Utility functions for formatting data
export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(amount)
}

export const formatDate = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString("id-ID", {
    year: "numeric",
    month: "long",
    day: "numeric",
  })
}

export const formatDateTime = (dateString: string): string => {
  return new Date(dateString).toLocaleString("id-ID", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

export const formatTime = (dateString: string): string => {
  return new Date(dateString).toLocaleTimeString("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
  })
}

export const getStatusColor = (status: string): string => {
  const statusColors: Record<string, string> = {
    // Booking Status
    MENUNGGU: "bg-yellow-100 text-yellow-800",
    DIKONFIRMASI: "bg-blue-100 text-blue-800",
    DITOLAK: "bg-red-100 text-red-800",
    DIBATALKAN: "bg-gray-100 text-gray-800",
    SELESAI: "bg-green-100 text-green-800",

    // Payment Status
    PENDING: "bg-yellow-100 text-yellow-800",
    PAID: "bg-green-100 text-green-800",
    FAILED: "bg-red-100 text-red-800",
    REFUNDED: "bg-purple-100 text-purple-800",

    // Asset Status
    TERSEDIA: "bg-green-100 text-green-800",
    DIPINJAM: "bg-blue-100 text-blue-800",
    TIDAK_AKTIF: "bg-gray-100 text-gray-800",

    // Condition
    BAIK: "bg-green-100 text-green-800",
    RUSAK_RINGAN: "bg-yellow-100 text-yellow-800",
    RUSAK_BERAT: "bg-red-100 text-red-800",
    HILANG: "bg-red-100 text-red-800",
  }

  return statusColors[status] || "bg-gray-100 text-gray-800"
}

export const getStatusText = (status: string): string => {
  const statusTexts: Record<string, string> = {
    // Booking Status
    MENUNGGU: "Menunggu",
    DIKONFIRMASI: "Dikonfirmasi",
    DITOLAK: "Ditolak",
    DIBATALKAN: "Dibatalkan",
    SELESAI: "Selesai",

    // Payment Status
    PENDING: "Pending",
    PAID: "Lunas",
    FAILED: "Gagal",
    REFUNDED: "Dikembalikan",

    // Asset Status
    TERSEDIA: "Tersedia",
    DIPINJAM: "Dipinjam",
    TIDAK_AKTIF: "Tidak Aktif",

    // Condition
    BAIK: "Baik",
    RUSAK_RINGAN: "Rusak Ringan",
    RUSAK_BERAT: "Rusak Berat",
    HILANG: "Hilang",
  }

  return statusTexts[status] || status
}
