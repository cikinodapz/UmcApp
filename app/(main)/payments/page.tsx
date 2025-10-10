"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { DataTable } from "@/components/data-table";
import { StatusBadge } from "@/components/status-badge";
import { useAuth } from "@/contexts/auth-context";
import { fetchData } from "@/lib/api";
import { PaymentStatus, PaymentMethod, Role } from "@/types";
import { formatCurrency, formatDateTime } from "@/lib/format";
import { CreditCard, Eye, ChevronsLeft, ChevronLeft, ChevronRight, ChevronsRight } from "lucide-react";
import Swal from "sweetalert2";
import { useToast } from "@/hooks/use-toast";

export default function PaymentsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [statusFilter, setStatusFilter] = useState("");
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<any>(null);
  const [detailByBooking, setDetailByBooking] = useState<any>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [payments, setPayments] = useState<any[]>([]);
  const [loadingList, setLoadingList] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [completing, setCompleting] = useState<string | null>(null);

  const isAdmin = user?.role === Role.ADMIN;

  // Fetch payments list from API
  useEffect(() => {
    const load = async () => {
      try {
        setLoadingList(true);
        setError(null);
        const data = await fetchData("/payments");
        const arr = Array.isArray(data) ? data : [];
        setPayments(
          arr.map((p: any) => ({
            ...p,
            amount: typeof p.amount === "string" ? Number(p.amount) : p.amount,
          }))
        );
      } catch (e: any) {
        setError(e?.message || "Gagal memuat pembayaran");
      } finally {
        setLoadingList(false);
      }
    };
    load();
  }, []);

  const paymentsWithDetails = useMemo(() => {
    return payments
      .map((payment: any) => {
        const booking = payment.booking;
        const bookingUser = booking?.user;
        return {
          ...payment,
          bookingCode:
            booking?.id?.slice?.(-8) || payment.bookingId?.slice?.(-8) || "Unknown",
          userName: bookingUser?.name || "Unknown",
          userEmail: bookingUser?.email || "",
          bookingStartDate: booking?.startDate || booking?.startDatetime || "",
        };
      })
      .filter((payment: any) =>
        isAdmin ? true : payment?.booking?.userId === user?.id
      )
      .filter(
        (payment: any) =>
          !statusFilter || statusFilter === "all" || payment.status === statusFilter
      )
      .sort(
        (a: any, b: any) =>
          new Date(b.paidAt || "1970-01-01").getTime() -
          new Date(a.paidAt || "1970-01-01").getTime()
      );
  }, [payments, isAdmin, user?.id, statusFilter]);

  const pagedPayments = useMemo(
    () => paymentsWithDetails.slice((page - 1) * pageSize, page * pageSize),
    [paymentsWithDetails, page, pageSize]
  );

  // Define columns for payments table
  const paymentColumns = [
    {
      key: "bookingCode",
      title: "Booking",
      render: (value: string) => (
        <span className="font-mono text-sm bg-gray-100 px-2 py-1 rounded-md">
          {value}
        </span>
      ),
    },
    ...(isAdmin
      ? [
          {
            key: "userName",
            title: "Pengguna",
            render: (value: string, item: any) => (
              <div>
                <p className="font-medium">{value}</p>
                <p className="text-sm text-gray-500">{item.userEmail}</p>
              </div>
            ),
          },
        ]
      : []),
    {
      key: "bookingStatus",
      title: "Status Booking",
      render: (_: any, item: any) => (
        <StatusBadge status={item?.booking?.status || "-"} />
      ),
    },
    {
      key: "amount",
      title: "Jumlah",
      render: (value: number) => formatCurrency(value),
    },
    {
      key: "method",
      title: "Metode",
      render: (value: string) => {
        const methodLabels = {
          [PaymentMethod.CASH]: "Tunai",
          [PaymentMethod.TRANSFER]: "Transfer",
          [PaymentMethod.QRIS]: "QRIS",
        };
        return methodLabels[value as PaymentMethod] || value;
      },
    },
    {
      key: "status",
      title: "Status",
      render: (value: string) => <StatusBadge status={value} />,
    },
    {
      key: "paidAt",
      title: "Tanggal Bayar",
      render: (value: string) => (value ? formatDateTime(value) : "-"),
      sortable: true,
    },
    {
      key: "referenceNo",
      title: "Referensi",
      render: (value: string) => value || "-",
    },
    {
      key: "actions",
      title: "Aksi",
      render: (_: any, payment: any) => (
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setSelectedPayment(payment);
              fetchDetail(payment.bookingId);
            }}
            className="rounded-lg"
          >
            <Eye className="w-4 h-4" />
          </Button>

          {payment.status === PaymentStatus.PAID && payment?.booking?.status !== "SELESAI" && (
            <Button
              size="sm"
              onClick={() => handleCompleteClick(payment.bookingId)}
              className="rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white"
              disabled={completing === payment.bookingId}
            >
              {completing === payment.bookingId ? "Memproses..." : "Tandai Selesai"}
            </Button>
          )}
        </div>
      ),
    },
  ];

  async function fetchDetail(bookingId: string) {
    if (!bookingId) return;
    try {
      setLoadingDetail(true);
      setPaymentDialogOpen(true);
      const data = await fetchData(`/payments/admin/by-booking/${bookingId}`);
      setDetailByBooking(data);
    } catch (e: any) {
      toast({
        title: "Gagal memuat detail",
        description: e?.message || "Terjadi kesalahan",
      });
    } finally {
      setLoadingDetail(false);
    }
  }

  async function completeBooking(bookingId: string) {
    try {
      setCompleting(bookingId);
      await fetchData(`/bookings/${bookingId}/complete`, { method: "PATCH" });
      await Swal.fire({
        icon: "success",
        title: "Berhasil",
        text: "Booking berhasil diselesaikan",
        timer: 1500,
        showConfirmButton: false,
      });
      // refresh list and detail
      await Promise.all([
        fetchDetail(bookingId),
        (async () => {
          const data = await fetchData("/payments");
          const arr = Array.isArray(data) ? data : [];
          setPayments(
            arr.map((p: any) => ({
              ...p,
              amount: typeof p.amount === "string" ? Number(p.amount) : p.amount,
            }))
          );
        })(),
      ]);
    } catch (e: any) {
      await Swal.fire({
        icon: "error",
        title: "Gagal",
        text: e?.message || "Tidak dapat menyelesaikan booking",
      });
    }
    finally {
      setCompleting(null);
    }
  }

  async function handleCompleteClick(bookingId: string) {
    const res = await Swal.fire({
      icon: "question",
      title: "Tandai selesai?",
      text: "Pastikan pembayaran sudah valid.",
      showCancelButton: true,
      confirmButtonText: "Ya, selesaikan",
      cancelButtonText: "Batal",
      confirmButtonColor: "#4f46e5",
      customClass: { confirmButton: "rounded-xl", cancelButton: "rounded-xl" },
    });
    if (res.isConfirmed) {
      await completeBooking(bookingId);
    }
  }

  return (
    <div className="space-y-6 md:-ml-24">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Pembayaran</h1>
        <p className="text-gray-600 mt-2">
          {isAdmin
            ? "Kelola pembayaran dari semua pengguna"
            : "Lihat status pembayaran Anda"}
        </p>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4 p-4 bg-white rounded-2xl shadow-sm border">
        <CreditCard className="w-5 h-5 text-gray-400" />
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-48 rounded-xl">
            <SelectValue placeholder="Semua Status" />
          </SelectTrigger>
          <SelectContent className="rounded-xl">
            <SelectItem value="all" className="rounded-lg">
              Semua Status
            </SelectItem>
            <SelectItem value={PaymentStatus.PENDING} className="rounded-lg">
              Pending
            </SelectItem>
            <SelectItem value={PaymentStatus.PAID} className="rounded-lg">
              Lunas
            </SelectItem>
            <SelectItem value={PaymentStatus.FAILED} className="rounded-lg">
              Gagal
            </SelectItem>
            <SelectItem value={PaymentStatus.REFUNDED} className="rounded-lg">
              Dikembalikan
            </SelectItem>
          </SelectContent>
        </Select>
        <div className="text-sm text-gray-500">
          Menampilkan {paymentsWithDetails.length} pembayaran
        </div>
      </div>

      {/* Payments Table */}
      {error ? (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
          {error}
        </div>
      ) : (
        <>
          <DataTable
            data={loadingList ? [] : pagedPayments}
            columns={paymentColumns}
            searchPlaceholder="Cari pembayaran..."
            pageSize={pageSize}
          />
          <div className="mt-2">
            {/* Pagination ala pemesanan */}
            <div className="flex items-center justify-between px-1 py-2">
              <div className="text-sm text-gray-600">
                Menampilkan <span className="font-medium">{paymentsWithDetails.length === 0 ? 0 : (page - 1) * pageSize + 1}</span>
                {" - "}
                <span className="font-medium">{Math.min(page * pageSize, paymentsWithDetails.length)}</span>
                {" dari "}
                <span className="font-medium">{paymentsWithDetails.length}</span> data
              </div>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600">Rows</span>
                  <select
                    className="h-9 rounded-xl border px-3 text-sm"
                    value={pageSize}
                    onChange={(e) => { setPageSize(Number(e.target.value)); setPage(1); }}
                  >
                    {[5,10,20,50].map(n => (<option key={n} value={n}>{n}</option>))}
                  </select>
                </div>
                <div className="flex items-center gap-1">
                  <Button variant="outline" className="rounded-xl" size="sm" onClick={() => setPage(1)} disabled={page <= 1}>
                    <ChevronsLeft className="w-4 h-4" />
                  </Button>
                  <Button variant="outline" className="rounded-xl" size="sm" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1}>
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  {(() => {
                    const totalPages = Math.max(1, Math.ceil(paymentsWithDetails.length / pageSize));
                    const span = 2;
                    const out: (number | string)[] = [];
                    const s = Math.max(1, page - span);
                    const e = Math.min(totalPages, page + span);
                    if (s > 1) out.push(1);
                    if (s > 2) out.push("...");
                    for (let p = s; p <= e; p++) out.push(p);
                    if (e < totalPages - 1) out.push("...");
                    if (e < totalPages) out.push(totalPages);
                    return out.map((p, i) => typeof p === 'string' ? (
                      <span key={`ellipsis-${i}`} className="px-2 text-sm text-gray-500">{p}</span>
                    ) : (
                      <Button
                        key={p}
                        variant={p === page ? 'default' : 'outline'}
                        size="sm"
                        className={p === page ? 'rounded-xl bg-indigo-600' : 'rounded-xl'}
                        onClick={() => setPage(p)}
                      >
                        {p}
                      </Button>
                    ));
                  })()}
                  <Button variant="outline" className="rounded-xl" size="sm" onClick={() => setPage(p => {
                    const totalPages = Math.max(1, Math.ceil(paymentsWithDetails.length / pageSize));
                    return Math.min(totalPages, p + 1);
                  })}>
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                  <Button variant="outline" className="rounded-xl" size="sm" onClick={() => setPage(() => Math.max(1, Math.ceil(paymentsWithDetails.length / pageSize)))}>
                    <ChevronsRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Payment Dialog */}
      <Dialog open={paymentDialogOpen} onOpenChange={setPaymentDialogOpen}>
        <DialogContent className="sm:max-w-[500px] rounded-2xl">
          <DialogHeader>
            <DialogTitle>Detail Pembayaran</DialogTitle>
            <DialogDescription>
              Lihat informasi pembayaran dan selesaikan booking bila sesuai.
            </DialogDescription>
          </DialogHeader>

          {selectedPayment && (
            <div className="space-y-6">
              {/* Payment Details */}
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-gray-500">Booking</p>
                    <p className="font-medium">{selectedPayment.bookingCode}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Jumlah</p>
                    <p className="font-medium">
                      {formatCurrency(selectedPayment.amount)}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-500">Metode</p>
                    <p className="font-medium">{selectedPayment.method}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Status Saat Ini</p>
                    <StatusBadge status={selectedPayment.status} />
                  </div>
                </div>
              </div>

              {/* Detail dari API by-booking */}
              <div className="space-y-3">
                {loadingDetail ? (
                  <p className="text-sm text-gray-500">Memuat detail…</p>
                ) : detailByBooking ? (
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-gray-500">Pemesan</p>
                        <p className="font-medium">{detailByBooking.booking?.user?.name}</p>
                        <p className="text-gray-500">{detailByBooking.booking?.user?.email}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Periode</p>
                        <p className="font-medium">
                          {detailByBooking.booking?.startDate
                            ? formatDateTime(detailByBooking.booking?.startDate)
                            : "-"}
                          {" - "}
                          {detailByBooking.booking?.endDate
                            ? formatDateTime(detailByBooking.booking?.endDate)
                            : "-"}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-500">Total</p>
                        <p className="font-medium">{formatCurrency(Number(detailByBooking.summary?.totalAmount || selectedPayment.amount))}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Status Terakhir</p>
                        <StatusBadge status={detailByBooking.summary?.latestPaymentStatus || selectedPayment.status} />
                      </div>
                    </div>
                    {detailByBooking.latestPayment?.proofUrl && (
                      <div className="space-y-1">
                        <Label>Bukti Pembayaran</Label>
                        <a
                          className="text-indigo-600 text-sm underline"
                          href={detailByBooking.latestPayment?.proofUrl}
                          target="_blank"
                          rel="noreferrer"
                        >
                          Buka bukti pembayaran
                        </a>
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">Detail tidak tersedia</p>
                )}
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setPaymentDialogOpen(false)}
              className="rounded-xl"
            >
              Tutup
            </Button>
            {/* Tombol tandai selesai dipindah ke tabel (inline) agar tidak duplikatif di dialog */}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
