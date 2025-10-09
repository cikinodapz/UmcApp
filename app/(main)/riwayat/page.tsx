"use client";

import { useEffect, useMemo, useState } from "react";
import { DataTable } from "@/components/data-table";
import { StatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { formatCurrency, formatDateTime } from "@/lib/format";
import { api, fetchData } from "@/lib/api";
import { CreditCard, ExternalLink, RefreshCw, Eye } from "lucide-react";
import Image from "next/image";
import { PaymentMethod, PaymentStatus } from "@/types";

type ApiUser = {
  id: string;
  name: string;
  email: string;
};

type ApiBooking = {
  id: string;
  userId: string;
  startDate: string;
  endDate: string;
  status: string;
  user?: ApiUser;
};

type ApiPayment = {
  id: string;
  bookingId: string;
  amount: string; // API returns string numbers
  method: keyof typeof PaymentMethod | string;
  status: keyof typeof PaymentStatus | string;
  paidAt: string | null;
  referenceNo: string | null;
  proofUrl?: string | null;
  createdAt: string;
  updatedAt: string;
  booking?: ApiBooking;
};

type StatusResponse = {
  paymentStatus: string;
  midtransStatus?: string;
  details?: any;
};

export default function RiwayatPembayaranPage() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [items, setItems] = useState<ApiPayment[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selected, setSelected] = useState<ApiPayment | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [bookingDetail, setBookingDetail] = useState<any | null>(null);

  useEffect(() => {
    let active = true;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await fetchData("/payments");
        if (!active) return;
        setItems(Array.isArray(data) ? data : []);
      } catch (e: any) {
        if (!active) return;
        setError(e?.message || "Gagal memuat riwayat pembayaran");
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  const data = useMemo(() => {
    const mapped = items.map((p) => ({
      ...p,
      amountNumber: Number(p.amount ?? 0),
      bookingCode: p.booking?.id?.slice(-8) ?? p.bookingId?.slice(-8) ?? "-",
      userName: p.booking?.user?.name ?? "-",
      userEmail: p.booking?.user?.email ?? "",
      startDate: p.booking?.startDate ?? "",
      endDate: p.booking?.endDate ?? "",
    }));
    return mapped.filter((it) => statusFilter === "all" || it.status === statusFilter);
  }, [items, statusFilter]);

  // Simple aggregate values if needed later (not rendered to keep UI minimal)
  const _aggregate = useMemo(() => ({
    total: items.length,
    pending: items.filter((x) => x.status === PaymentStatus.PENDING).length,
    paid: items.filter((x) => x.status === PaymentStatus.PAID).length,
    totalAmount: items.reduce((sum, x) => sum + Number(x.amount || 0), 0),
  }), [items]);

  const columns = [
    {
      key: "bookingCode",
      title: "Booking",
      render: (v: string) => (
        <span className="font-mono text-sm bg-gray-100 px-2 py-1 rounded-md">{v}</span>
      ),
    },
    {
      key: "userName",
      title: "Pengguna",
      render: (v: string, row: any) => (
        <div>
          <p className="font-medium">{v}</p>
          {row.userEmail ? (
            <p className="text-sm text-gray-500">{row.userEmail}</p>
          ) : null}
        </div>
      ),
    },
    {
      key: "amountNumber",
      title: "Jumlah",
      render: (v: number) => formatCurrency(v || 0),
      sortable: true,
    },
    {
      key: "method",
      title: "Metode",
      render: (v: string) => v,
    },
    {
      key: "status",
      title: "Status",
      render: (v: string) => <StatusBadge status={v} />,
    },
    {
      key: "paidAt",
      title: "Dibayar Pada",
      render: (v: string | null) => (v ? formatDateTime(v) : "-"),
      sortable: true,
    },
    {
      key: "referenceNo",
      title: "Referensi",
      render: (v: string | null) => v || "-",
    },
    {
      key: "actions",
      title: "Aksi",
      render: (_: any, row: ApiPayment) => (
        <div className="flex items-center gap-2">
          {row.status === PaymentStatus.PENDING && row.proofUrl ? (
            <Button
              size="sm"
              variant="outline"
              onClick={() => window.open(row.proofUrl!, "_blank")}
              className="rounded-lg"
            >
              <ExternalLink className="w-4 h-4 mr-1" /> Bayar
            </Button>
          ) : null}
          <Button
            size="sm"
            variant="outline"
            onClick={() => handleCheckStatus(row)}
            className="rounded-lg"
          >
            <RefreshCw className="w-4 h-4 mr-1" /> Cek Status
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => openDetail(row)}
            className="rounded-lg"
          >
            <Eye className="w-4 h-4" />
          </Button>
        </div>
      ),
    },
  ];

  function toServicePhoto(p?: string | null) {
    if (!p) return null;
    if (/^https?:\/\//i.test(p)) return p;
    const base = process.env.NEXT_PUBLIC_API_URL || "";
    const path = p.startsWith("/uploads/") ? p : `/uploads/${p}`;
    return `${base}${path}`;
  }

  async function handleCheckStatus(p: ApiPayment) {
    try {
      const res: StatusResponse = await fetchData(`/payments/${p.id}/status`);
      // Prefer backend paymentStatus if provided
      const nextStatus = res.paymentStatus || p.status;
      setItems((prev) => prev.map((it) => (it.id === p.id ? { ...it, status: nextStatus, paidAt: it.paidAt ?? (res.midtransStatus === "settlement" ? new Date().toISOString() : it.paidAt) } : it)));
      toast({
        title: "Status diperbarui",
        description: `Midtrans: ${res.midtransStatus || "-"}`,
      });
    } catch (e: any) {
      toast({ title: "Gagal cek status", description: e?.message ?? "Terjadi kesalahan" });
    }
  }

  async function openDetail(p: ApiPayment) {
    setSelected(p);
    setDetailOpen(true);
    setDetailLoading(true);
    setBookingDetail(null);
    try {
      // Fetch payment detail (includes booking + items)
      const detail = await fetchData(`/payments/${p.id}`, { method: "GET" });
      // Update selected to latest server state
      setSelected(detail);
      setBookingDetail(detail?.booking || null);
    } catch (e: any) {
      // keep dialog open, but show minimal info
      setBookingDetail(null);
    } finally {
      setDetailLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Riwayat Pembayaran</h1>
        <p className="text-gray-600 mt-2">Lihat dan kelola status pembayaran Anda</p>
      </div>

      {loading ? (
        <div className="space-y-3">
          <Skeleton className="h-12 w-full rounded-xl" />
          <Skeleton className="h-64 w-full rounded-2xl" />
        </div>
      ) : error ? (
        <Card className="p-6 rounded-2xl border border-red-200 bg-red-50 text-red-700">
          {error}
        </Card>
      ) : data.length === 0 ? (
        <Card className="p-8 text-center rounded-xl border bg-white">
          <div className="text-sm text-gray-600">Belum ada riwayat pembayaran.</div>
        </Card>
      ) : (
        <DataTable
          data={data as any}
          columns={columns as any}
          searchPlaceholder="Cari pembayaran..."
          pageSize={10}
          className="rounded-xl"
          renderHeader={({ searchQuery, setSearchQuery }) => (
            <div className="flex flex-col md:flex-row md:items-center gap-3 md:gap-4">
              <div className="flex items-center gap-3 flex-1">
                <CreditCard className="w-5 h-5 text-gray-400" />
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-48 md:w-56 rounded-lg">
                    <SelectValue placeholder="Filter status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Semua Status</SelectItem>
                    <SelectItem value={PaymentStatus.PENDING}>Pending</SelectItem>
                    <SelectItem value={PaymentStatus.PAID}>Lunas</SelectItem>
                    <SelectItem value={PaymentStatus.FAILED}>Gagal</SelectItem>
                    <SelectItem value={PaymentStatus.REFUNDED}>Dikembalikan</SelectItem>
                  </SelectContent>
                </Select>
                <div className="text-sm text-gray-500 hidden md:block">Menampilkan {data.length} pembayaran</div>
              </div>

              <div className="relative w-full md:w-64">
                <input
                  placeholder="Cari pembayaran..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full h-10 pl-10 pr-3 rounded-lg border border-gray-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
                />
                <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">🔎</span>
              </div>
            </div>
          )}
        />
      )}

      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="sm:max-w-[520px] rounded-2xl">
          <DialogHeader>
            <DialogTitle>Detail Pembayaran</DialogTitle>
            <DialogDescription>Informasi lengkap transaksi dan pemesanan</DialogDescription>
          </DialogHeader>
          {selected && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-500">Booking</p>
                  <p className="font-medium">{selected.booking?.id?.slice(-8) ?? selected.bookingId?.slice(-8)}</p>
                </div>
                <div>
                  <p className="text-gray-500">Jumlah</p>
                  <p className="font-medium">{formatCurrency(Number(selected.amount || 0))}</p>
                </div>
                <div>
                  <p className="text-gray-500">Metode</p>
                  <p className="font-medium">{selected.method}</p>
                </div>
                <div>
                  <p className="text-gray-500">Status</p>
                  <StatusBadge status={selected.status} />
                </div>
                <div>
                  <p className="text-gray-500">Dibuat</p>
                  <p className="font-medium">{formatDateTime(selected.createdAt)}</p>
                </div>
                <div>
                  <p className="text-gray-500">Diperbarui</p>
                  <p className="font-medium">{formatDateTime(selected.updatedAt)}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-gray-500">Rentang Waktu</p>
                  <p className="font-medium">
                    {selected.booking?.startDate ? formatDateTime(selected.booking.startDate) : "-"} -
                    {" "}
                    {selected.booking?.endDate ? formatDateTime(selected.booking.endDate) : "-"}
                  </p>
                </div>
                <div className="col-span-2">
                  <p className="text-gray-500">Referensi</p>
                  <p className="font-medium">{selected.referenceNo || "-"}</p>
                </div>
              </div>

              {/* Detail Pesanan mirip /booking */}
              <Separator />
              <div className="space-y-3">
                <div className="text-sm font-medium">Detail Pesanan</div>
                {detailLoading ? (
                  <div className="text-sm text-muted-foreground">Memuat detail pesanan...</div>
                ) : bookingDetail?.items && bookingDetail.items.length > 0 ? (
                  <div className="space-y-3">
                    {bookingDetail.items.map((it: any) => {
                      const img = toServicePhoto(it?.service?.photoUrl || null);
                      const features: string[] = it?.package?.features || [];
                      const shown = features.slice(0, 3);
                      const more = Math.max(0, features.length - shown.length);
                      return (
                        <div key={it.id} className="flex items-start gap-3">
                          <div className="h-14 w-14 rounded-md overflow-hidden bg-muted flex-shrink-0">
                            {img ? (
                              <Image src={img} alt={it?.service?.name || "Service"} width={56} height={56} className="h-full w-full object-cover" />
                            ) : (
                              <div className="h-full w-full flex items-center justify-center text-xs text-muted-foreground">No Img</div>
                            )}
                          </div>
                          <div className="min-w-0 flex-1 space-y-1">
                            <div className="flex items-center gap-2 min-w-0">
                              <div className="font-medium truncate" title={it?.service?.name || ""}>{it?.service?.name || "-"}</div>
                              {it?.package?.name ? (
                                <Badge variant="outline" className="rounded-md whitespace-nowrap">{it?.package?.name}</Badge>
                              ) : null}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {(it?.quantity ?? it?.qty ?? 0)} x {formatCurrency(Number(it?.unitPrice ?? it?.price ?? 0))} • Subtotal {formatCurrency(Number(it?.subtotal ?? (Number(it?.unitPrice ?? it?.price ?? 0) * Number(it?.quantity ?? it?.qty ?? 0))))}
                            </div>
                            {shown.length > 0 ? (
                              <div className="flex flex-wrap gap-1 pt-1">
                                {shown.map((f, idx) => (
                                  <Badge key={idx} variant="secondary" className="rounded-md text-[10px] py-0 px-1.5">{f}</Badge>
                                ))}
                                {more > 0 ? (
                                  <Badge variant="outline" className="rounded-md text-[10px] py-0 px-1.5">+{more} lagi</Badge>
                                ) : null}
                              </div>
                            ) : null}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-sm text-muted-foreground">Tidak ada item pesanan untuk booking ini.</div>
                )}
              </div>

              {selected.proofUrl && (
                <div>
                  <p className="text-gray-500 text-sm mb-2">Tautan Pembayaran / Bukti</p>
                  <Button
                    variant="outline"
                    onClick={() => window.open(selected.proofUrl!, "_blank")}
                    className="rounded-lg"
                  >
                    <ExternalLink className="w-4 h-4 mr-2" /> Buka Tautan
                  </Button>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" className="rounded-xl" onClick={() => setDetailOpen(false)}>
              Tutup
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
