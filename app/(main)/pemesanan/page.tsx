"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { DataTable } from "@/components/data-table";
import { StatusBadge } from "@/components/status-badge";
import { useAuth } from "@/contexts/auth-context";
import { Role } from "@/types";
import { formatCurrency, formatDateTime } from "@/lib/format";
import {
  Eye,
  CheckCircle,
  XCircle,
  ChevronsLeft,
  ChevronLeft,
  ChevronRight,
  ChevronsRight,
} from "lucide-react";
import { fetchData } from "@/lib/api";
import Swal from "sweetalert2";

// Pagination component (diambil dari kode inventory)
function Pagination({
  total,
  page,
  setPage,
  pageSize,
  setPageSize,
}: {
  total: number;
  page: number;
  setPage: (n: number | ((p: number) => number)) => void;
  pageSize: number;
  setPageSize: (n: number) => void;
}) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const pageWindow = (cur: number, tot: number, span = 2) => {
    const out: (number | string)[] = [];
    const s = Math.max(1, cur - span);
    const e = Math.min(tot, cur + span);
    if (s > 1) out.push(1);
    if (s > 2) out.push("...");
    for (let p = s; p <= e; p++) out.push(p);
    if (e < tot - 1) out.push("...");
    if (e < tot) out.push(tot);
    return out;
  };
  const pagesArr = useMemo(
    () => pageWindow(page, totalPages, 2),
    [page, totalPages]
  );

  return (
    <div className="flex items-center justify-between px-1 py-2">
      <div className="text-sm text-gray-600">
        Menampilkan{" "}
        <span className="font-medium">
          {total === 0 ? 0 : (page - 1) * pageSize + 1}
        </span>{" "}
        –
        <span className="font-medium"> {Math.min(page * pageSize, total)}</span>{" "}
        dari <span className="font-medium">{total}</span> data
      </div>
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600">Rows</span>
          <select
            className="h-9 rounded-xl border px-3 text-sm"
            value={pageSize}
            onChange={(e) => {
              setPageSize(Number(e.target.value));
              setPage(1);
            }}
          >
            {[5, 10, 20, 50].map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            className="rounded-xl"
            size="sm"
            onClick={() => setPage(1)}
            disabled={page <= 1}
          >
            <ChevronsLeft className="w-4 h-4" />
          </Button>
          <Button
            variant="outline"
            className="rounded-xl"
            size="sm"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1}
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
          {pagesArr.map((p, i) =>
            typeof p === "string" ? (
              <span key={`${p}-${i}`} className="px-2 text-sm text-gray-500">
                {p}
              </span>
            ) : (
              <Button
                key={p}
                variant={p === page ? "default" : "outline"}
                size="sm"
                className={
                  p === page ? "rounded-xl bg-indigo-600" : "rounded-xl"
                }
                onClick={() => setPage(p)}
              >
                {p}
              </Button>
            )
          )}
          <Button
            variant="outline"
            className="rounded-xl"
            size="sm"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages}
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
          <Button
            variant="outline"
            className="rounded-xl"
            size="sm"
            onClick={() => setPage(totalPages)}
            disabled={page >= totalPages}
          >
            <ChevronsRight className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function BookingsPage() {
  const { user } = useAuth();
  const [statusFilter, setStatusFilter] = useState("");
  const [approveDialogOpen, setApproveDialogOpen] = useState(false);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [bookingToAction, setBookingToAction] = useState<{
    id: string;
    userName: string;
  } | null>(null);

  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Detail dialog state
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailData, setDetailData] = useState<any | null>(null);

  // Pagination state
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const isAdmin = user?.role === Role.ADMIN;

  // Fetch bookings
  useEffect(() => {
    async function loadBookings() {
      setLoading(true);
      try {
        const endpoint = isAdmin ? "/bookings/admin/all" : "/bookings";
        const data = await fetchData<any>(endpoint, {
          method: "GET",
        });
        const list = Array.isArray(data)
          ? data
          : Array.isArray(data?.bookings)
          ? data.bookings
          : [];
        setBookings(list);
      } catch (e: any) {
        const msg = e?.response?.data?.message || "Gagal memuat data booking";
        Swal.fire({ icon: "error", title: "Error", text: msg });
      } finally {
        setLoading(false);
      }
    }
    loadBookings();
  }, [isAdmin]);

  const filteredBookings = bookings
    .filter(
      (booking) =>
        !statusFilter ||
        statusFilter === "all" ||
        booking.status === statusFilter
    )
    .sort(
      (a, b) =>
        new Date(b.startDate || b.startDatetime).getTime() -
        new Date(a.startDate || a.startDatetime).getTime()
    );

  // Paginate data
  const pagedBookings = useMemo(
    () => filteredBookings.slice((page - 1) * pageSize, page * pageSize),
    [filteredBookings, page, pageSize]
  );

  // Helpers
  const computeTotal = (items: any[] = []) =>
    items.reduce((sum, it) => {
      const qty = Number(it?.quantity ?? it?.qty ?? 0);
      const price = Number(it?.unitPrice ?? it?.price ?? 0);
      return sum + qty * price;
    }, 0);

  const openDetail = async (id: string) => {
    setDetailOpen(true);
    setDetailLoading(true);
    setDetailData(null);
    try {
      const data = await fetchData<any>(`/bookings/${id}`, { method: "GET" });
      setDetailData(data);
    } catch (e: any) {
      const msg = e?.response?.data?.message || "Gagal memuat detail booking";
      Swal.fire({ icon: "error", title: "Error", text: msg });
      setDetailOpen(false);
    } finally {
      setDetailLoading(false);
    }
  };

  const handleCancel = async (id: string) => {
    try {
      await fetchData(`/bookings/${id}`, { method: "DELETE" });
      Swal.fire({
        icon: "success",
        title: "Dibatalkan",
        text: "Booking berhasil dibatalkan",
        timer: 1500,
        showConfirmButton: false,
      });
      const endpoint = isAdmin ? "/bookings/admin/all" : "/bookings";
      const data = await fetchData<any>(endpoint, { method: "GET" });
      const list = Array.isArray(data)
        ? data
        : Array.isArray(data?.bookings)
        ? data.bookings
        : [];
      setBookings(list);
    } catch (e: any) {
      const msg = e?.response?.data?.message || "Gagal membatalkan booking";
      Swal.fire({ icon: "error", title: "Error", text: msg });
    }
  };

  // Define columns for bookings table
  const bookingColumns = [
    {
      key: "id",
      title: "ID Booking",
      render: (value: string) => (
        <span className="font-mono text-sm bg-gray-100 px-2 py-1 rounded-md">
          {value.slice(-8)}
        </span>
      ),
    },
    ...(isAdmin
      ? [
          {
            key: "user",
            title: "Peminjam",
            render: (value: any) => (
              <div>
                <p className="font-medium">{value?.name || "Unknown"}</p>
                <p className="text-sm text-gray-500">{value?.email || ""}</p>
              </div>
            ),
          },
        ]
      : []),
    {
      key: "startDate",
      title: "Tanggal Mulai",
      render: (_: any, row: any) => formatDateTime(row.startDate || row.startDatetime),
      sortable: true,
    },
    {
      key: "endDate",
      title: "Tanggal Selesai",
      render: (_: any, row: any) => formatDateTime(row.endDate || row.endDatetime),
    },
    {
      key: "items",
      title: "Jumlah Item",
      render: (value: any[]) => `${value.length} item`,
    },
    {
      key: "totalAmount",
      title: "Total",
      render: (value: number, row: any) =>
        formatCurrency(Number(row?.totalAmount ?? value ?? computeTotal(row?.items || []))),
    },
    {
      key: "status",
      title: "Status",
      render: (value: string) => <StatusBadge status={value} />,
    },
    {
      key: "actions",
      title: "Aksi",
      render: (_: any, booking: any) => (
        <div className="flex items-center gap-2">
          {/* GANTI: buka pop-up detail, bukan pindah halaman */}
          <Button
            variant="ghost"
            size="sm"
            className="rounded-lg"
            onClick={() => openDetail(booking.id)}
          >
            <Eye className="w-4 h-4" />
          </Button>

          {isAdmin && booking.status === "MENUNGGU" && (
            <>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setBookingToAction({
                    id: booking.id,
                    userName: booking.user?.name || "Unknown",
                  });
                  setApproveDialogOpen(true);
                }}
                className="rounded-lg text-green-600 hover:text-green-700"
              >
                <CheckCircle className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setBookingToAction({
                    id: booking.id,
                    userName: booking.user?.name || "Unknown",
                  });
                  setRejectDialogOpen(true);
                }}
                className="rounded-lg text-red-600 hover:text-red-700"
              >
                <XCircle className="w-4 h-4" />
              </Button>
            </>
          )}

          {!isAdmin && booking.status === "MENUNGGU" && (
            <Button
              variant="ghost"
              size="sm"
              className="rounded-lg text-red-600 hover:text-red-700"
              onClick={() => handleCancel(booking.id)}
              title="Batalkan booking"
            >
              Batalkan
            </Button>
          )}
        </div>
      ),
    },
  ];

  const handleApprove = async () => {
    if (bookingToAction) {
      try {
        await fetchData(`/bookings/${bookingToAction.id}/approve`, {
          method: "PATCH",
        });
        Swal.fire({
          icon: "success",
          title: "Berhasil",
          text: "Booking berhasil disetujui",
          timer: 1500,
          showConfirmButton: false,
        });
        // Refresh bookings
        const endpoint = isAdmin ? "/bookings/admin/all" : "/bookings";
        const data = await fetchData<{ bookings: any[] }>(endpoint, {
          method: "GET",
        });
        setBookings(data?.bookings || []);
      } catch (e: any) {
        const msg = e?.response?.data?.message || "Gagal menyetujui booking";
        Swal.fire({ icon: "error", title: "Error", text: msg });
      } finally {
        setBookingToAction(null);
        setApproveDialogOpen(false);
      }
    }
  };

  const handleReject = async () => {
    if (bookingToAction) {
      try {
        await fetchData(`/bookings/${bookingToAction.id}/reject`, {
          method: "PATCH",
        });
        Swal.fire({
          icon: "success",
          title: "Berhasil",
          text: "Booking berhasil ditolak",
          timer: 1500,
          showConfirmButton: false,
        });
        // Refresh bookings
        const endpoint = isAdmin ? "/bookings/admin/all" : "/bookings";
        const data = await fetchData<{ bookings: any[] }>(endpoint, {
          method: "GET",
        });
        setBookings(data?.bookings || []);
      } catch (e: any) {
        const msg = e?.response?.data?.message || "Gagal menolak booking";
        Swal.fire({ icon: "error", title: "Error", text: msg });
      } finally {
        setBookingToAction(null);
        setRejectDialogOpen(false);
      }
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 md:-ml-24">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            {isAdmin ? "Kelola Pemesanan" : "Booking Saya"}
          </h1>
          <p className="text-gray-600 mt-2">
            {isAdmin
              ? "Kelola semua pemesanan pengguna"
              : "Lihat dan kelola booking Anda"}
          </p>
        </div>
      </div>
      {/* Filters */}
      <div className="flex items-center gap-4 p-4 bg-white rounded-2xl shadow-sm border">
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-48 rounded-xl">
            <SelectValue placeholder="Semua Status" />
          </SelectTrigger>
          <SelectContent className="rounded-xl">
            <SelectItem value="all" className="rounded-lg">
              Semua Status
            </SelectItem>
            <SelectItem value="MENUNGGU" className="rounded-lg">
              Menunggu
            </SelectItem>
            <SelectItem value="DIKONFIRMASI" className="rounded-lg">
              Dikonformasi
            </SelectItem>
            <SelectItem value="DITOLAK" className="rounded-lg">
              Ditolak
            </SelectItem>
            <SelectItem value="DIBATALKAN" className="rounded-lg">
              Dibatalkan
            </SelectItem>
            <SelectItem value="SELESAI" className="rounded-lg">
              Selesai
            </SelectItem>
          </SelectContent>
        </Select>
        <div className="text-sm text-gray-500">
          Menampilkan {filteredBookings.length} pemesanan
        </div>
      </div>
      {/* Bookings Table */}
      <DataTable
        data={pagedBookings}
        columns={bookingColumns}
        searchPlaceholder="Cari booking..."
        searchable={true}
      />
      {/* Pagination */}
      <Pagination
        total={filteredBookings.length}
        page={page}
        setPage={setPage}
        pageSize={pageSize}
        setPageSize={setPageSize}
      />
      {/* Approve Confirmation Dialog */}
      <AlertDialog open={approveDialogOpen} onOpenChange={setApproveDialogOpen}>
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Konfirmasi Setujui Booking</AlertDialogTitle>
            <AlertDialogDescription>
              Apakah Anda yakin ingin menyetujui booking dari{" "}
              {bookingToAction?.userName}?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl">Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleApprove}
              className="rounded-xl bg-green-600 hover:bg-green-700"
            >
              Setujui
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      {/* Reject Confirmation Dialog */}
      <AlertDialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Konfirmasi Tolak Booking</AlertDialogTitle>
            <AlertDialogDescription>
              Apakah Anda yakin ingin menolak booking dari{" "}
              {bookingToAction?.userName}?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl">Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleReject}
              className="rounded-xl bg-red-600 hover:bg-red-700"
            >
              Tolak
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      {/* DETAIL BOOKING DIALOG */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="rounded-2xl max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Detail Booking</DialogTitle>
            <DialogDescription>Informasi lengkap pemesanan</DialogDescription>
          </DialogHeader>

          {detailLoading ? (
            <div className="py-10 flex items-center justify-center">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600" />
            </div>
          ) : detailData ? (
            <div className="space-y-5">
              {/* Header ringkas */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl border bg-gray-50">
                  <div className="text-xs text-gray-500">ID Booking</div>
                  <div className="font-mono text-sm break-all">
                    {detailData.id}
                  </div>
                </div>
                <div className="p-4 rounded-xl border bg-gray-50">
                  <div className="text-xs text-gray-500">Status</div>
                  <div className="mt-1">
                    <StatusBadge status={detailData.status} />
                  </div>
                </div>

                {isAdmin && (
                  <div className="p-4 rounded-xl border bg-gray-50 md:col-span-2">
                    <div className="text-xs text-gray-500">Peminjam</div>
                    <div className="mt-1">
                      <div className="font-medium break-words">
                        {detailData.user?.name ?? "Unknown"}
                      </div>
                      <div className="text-sm text-gray-600 break-all">
                        {detailData.user?.email ?? ""}
                      </div>
                    </div>
                  </div>
                )}

                <div className="p-4 rounded-xl border bg-gray-50">
                  <div className="text-xs text-gray-500">Tanggal Mulai</div>
                  <div className="mt-1 font-medium break-words">
                    {formatDateTime(detailData.startDate || detailData.startDatetime)}
                  </div>
                </div>
                <div className="p-4 rounded-xl border bg-gray-50">
                  <div className="text-xs text-gray-500">Tanggal Selesai</div>
                  <div className="mt-1 font-medium break-words">
                    {formatDateTime(detailData.endDate || detailData.endDatetime)}
                  </div>
                </div>

                <div className="p-4 rounded-xl border bg-gray-50">
                  <div className="text-xs text-gray-500">Tipe</div>
                  <div className="mt-1 font-medium break-words">
                    {detailData.type}
                  </div>
                </div>
                <div className="p-4 rounded-xl border bg-gray-50 md:col-span-2">
                  <div className="text-xs text-gray-500">Catatan</div>
                  <div className="mt-1 break-words whitespace-pre-wrap max-h-32 overflow-y-auto">
                    {detailData.notes || "-"}
                  </div>
                </div>
              </div>

              {/* Items */}
              <div className="rounded-2xl border overflow-hidden">
                <div className="px-4 py-3 bg-gray-100 font-semibold">
                  Item ({detailData.items?.length ?? 0})
                </div>
                <div className="divide-y max-h-72 overflow-auto">
                  {(detailData.items ?? []).map((it: any) => {
                    const itemType = it.type || it.itemType;
                    const isService = itemType === "JASA";
                    const name = isService ? it.service?.name : it.asset?.name;
                    const code = isService ? it.service?.code : it.asset?.code;
                    return (
                      <div
                        key={it.id}
                        className="px-4 py-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-4"
                      >
                        <div className="min-w-0 flex-1">
                          <div className="font-medium break-words">
                            {name ?? (isService ? "Jasa" : "Aset")}
                          </div>
                          <div className="text-xs text-gray-500 break-all">
                            {code ? `Kode: ${code}` : ""}
                          </div>
                          <div className="text-xs text-gray-500">
                            Tipe: {itemType}
                          </div>
                        </div>
                        <div className="flex items-center gap-4 sm:gap-8 w-full sm:w-auto justify-between sm:justify-end">
                          <div className="text-sm text-gray-600">
                            Qty: {it.quantity ?? it.qty}
                          </div>
                          <div className="text-sm">
                            {formatCurrency(Number(it.unitPrice ?? it.price ?? 0))}
                          </div>
                          <div className="font-semibold whitespace-nowrap">
                            {formatCurrency(Number(it.subtotal ?? ((Number(it.quantity ?? it.qty ?? 0)) * Number(it.unitPrice ?? it.price ?? 0))))}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
                <div className="px-4 py-3 flex items-center justify-end gap-6 bg-white border-t">
                  <div className="text-sm text-gray-600">Total</div>
                  <div className="text-xl font-bold">
                    {formatCurrency(
                      detailData.totalAmount ?? computeTotal(detailData.items)
                    )}
                  </div>
                </div>
              </div>

              {/* Seksi tambahan ringkas */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-4 rounded-xl border">
                  <div className="text-xs text-gray-500">Pembayaran</div>
                  <div className="mt-1 font-semibold">
                    {detailData.payments?.length ?? 0} record
                  </div>
                </div>
                <div className="p-4 rounded-xl border">
                  <div className="text-xs text-gray-500">Denda</div>
                  <div className="mt-1 font-semibold">
                    {detailData.fines?.length ?? 0} record
                  </div>
                </div>
                <div className="p-4 rounded-xl border">
                  <div className="text-xs text-gray-500">Feedback</div>
                  <div className="mt-1 font-semibold">
                    {detailData.feedbacks?.length ?? 0} record
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="py-8 text-center text-gray-600">
              Data tidak tersedia
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
