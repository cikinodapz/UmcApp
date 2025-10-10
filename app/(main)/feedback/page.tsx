"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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
import { useAuth } from "@/contexts/auth-context";
import { BookingStatus, Role } from "@/types";
import { formatCurrency, formatDateTime } from "@/lib/format";
import { fetchData } from "@/lib/api";
import { Star, MessageSquare, Edit, Eye, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

// Data type row ditabel

type FeedbackRow = {
  id: string;
  bookingId: string;
  userId: string;
  userName: string;
  userEmail: string;
  rating: number;
  comment?: string;
  createdAt: string;
  bookingCode: string;
};

function StarRating({
  value,
  onChange,
  readOnly = false,
  size = 18,
}: {
  value: number;
  onChange?: (v: number) => void;
  readOnly?: boolean;
  size?: number;
}) {
  return (
    <div className="flex items-center gap-1">
      {Array.from({ length: 5 }).map((_, i) => {
        const filled = i < value;
        return (
          <button
            key={i}
            type="button"
            className={`p-0.5 ${
              readOnly ? "cursor-default" : "cursor-pointer"
            }`}
            onClick={!readOnly && onChange ? () => onChange(i + 1) : undefined}
            aria-label={`rating-${i + 1}`}
          >
            <Star
              className={
                filled ? "fill-yellow-400 text-yellow-400" : "text-gray-300"
              }
              width={size}
              height={size}
            />
          </button>
        );
      })}
    </div>
  );
}

export default function FeedbackPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const isAdmin = user?.role === Role.ADMIN;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [feedbacks, setFeedbacks] = useState<FeedbackRow[]>([]);

  // Filter & derived data
  const [ratingFilter, setRatingFilter] = useState<string>("all");
  const [search, setSearch] = useState("");

  // Dialog states
  const [dialogOpen, setDialogOpen] = useState(false);
  // view-only dialog
  const [selected, setSelected] = useState<FeedbackRow | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailBooking, setDetailBooking] = useState<any | null>(null);

  // Pagination state
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  useEffect(() => {
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await fetchData('/feedbacks/admin/all');
        const arr = Array.isArray(data) ? data : [];
        setFeedbacks(arr.map((f: any) => ({
          id: f.id,
          bookingId: f.bookingId,
          userId: f.userId,
          userName: f.user?.name || '-',
          userEmail: f.user?.email || '',
          rating: Number(f.rating || 0),
          comment: f.comment || '',
          createdAt: f.createdAt,
          bookingCode: (f.booking?.id || f.bookingId || '').slice(-8),
        })));
      } catch (e: any) {
        setError(e?.message || 'Gagal memuat feedback');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // Data untuk tabel (join user & booking)
  const tableData: FeedbackRow[] = useMemo(() => {
    const base = feedbacks;
    const scoped = base; // admin page: tampilkan semua
    const rated =
      ratingFilter === "all"
        ? scoped
        : scoped.filter((f) => f.rating === Number(ratingFilter));
    const searched =
      search.trim() === ""
        ? rated
        : rated.filter(
            (r) =>
              r.userName.toLowerCase().includes(search.toLowerCase()) ||
              r.comment?.toLowerCase().includes(search.toLowerCase()) ||
              r.bookingCode.toLowerCase().includes(search.toLowerCase())
          );
    return searched.sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }, [feedbacks, isAdmin, ratingFilter, search, user?.id]);

  const averageRating = useMemo(() => {
    if (tableData.length === 0) return 0;
    return (
      Math.round(
        (tableData.reduce((s, f) => s + f.rating, 0) / tableData.length) * 10
      ) / 10
    );
  }, [tableData]);

  // ====== Columns ======
  const columns = [
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
            render: (v: string, item: FeedbackRow) => (
              <div>
                <p className="font-medium">{v}</p>
                <p className="text-xs text-gray-500">{item.userEmail}</p>
              </div>
            ),
          },
        ]
      : []),
    {
      key: "rating",
      title: "Rating",
      render: (v: number) => <StarRating value={v} readOnly />,
      sortable: true,
    },
    {
      key: "comment",
      title: "Komentar",
      render: (v: string) =>
        v ? (
          <span className="line-clamp-2">{v}</span>
        ) : (
          <span className="text-gray-400">—</span>
        ),
    },
    {
      key: "createdAt",
      title: "Tanggal",
      render: (v: string) => formatDateTime(v),
      sortable: true,
    },
    {
      key: "actions",
      title: "Aksi",
      render: (_: any, row: FeedbackRow) => (
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            className="rounded-lg"
            onClick={() => openDetail(row)}
          >
            <Eye className="w-4 h-4" />
          </Button>

        </div>
      ),
    },
  ];

  // ====== Handlers ======
  const resetForm = () => {
    setSelected(null);
    setSelectedBookingId("");
    setFormRating(5);
    setFormComment("");
  };

  const onCreate = () => {
    if (!selectedBookingId || !user) return;
    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    const newRow: FeedbackRow = {
      id,
      bookingId: selectedBookingId,
      userId: user.id,
      userName: mockUsers.find((u) => u.id === user.id)?.name ?? "You",
      userEmail: mockUsers.find((u) => u.id === user.id)?.email ?? "",
      rating: formRating,
      comment: formComment?.trim() || undefined,
      createdAt: now,
      bookingCode: selectedBookingId.slice(-8),
    };
    setFeedbacks((prev) => [newRow, ...prev]);
    toast({
      title: "Terkirim",
      description: "Terima kasih atas feedback Anda!",
    });
    setDialogOpen(false);
    resetForm();
  };

  const onUpdate = () => {
    if (!selected) return;
    setFeedbacks((prev) =>
      prev.map((f) =>
        f.id === selected.id
          ? { ...f, rating: formRating, comment: formComment }
          : f
      )
    );
    toast({ title: "Tersimpan", description: "Feedback berhasil diperbarui" });
    setDialogOpen(false);
    resetForm();
  };

  const paged = useMemo(
    () => tableData.slice((page - 1) * pageSize, page * pageSize),
    [tableData, page, pageSize]
  );

  async function openDetail(row: FeedbackRow) {
    setSelected(row);
    setDialogOpen(true);
    setDetailLoading(true);
    setDetailBooking(null);
    try {
      const data = await fetchData(`/feedbacks/by-booking/${row.bookingId}`, { method: 'GET' });
      const arr = Array.isArray(data) ? data : [];
      const first = arr[0];
      setDetailBooking(first?.booking || null);
    } catch (e) {
      setDetailBooking(null);
    } finally {
      setDetailLoading(false);
    }
  }

  return (
    <div className="space-y-6 md:-ml-24">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Feedback</h1>
          <p className="text-gray-600 mt-2">
            {isAdmin
              ? "Lihat & kelola semua feedback pengguna"
              : "Berikan pengalaman Anda terhadap layanan kami"}
          </p>
        </div>
        
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-6 bg-white rounded-2xl shadow-sm border">
          <p className="text-sm text-gray-500">Rata-rata Rating</p>
          <div className="mt-2 flex items-center gap-3">
            <p className="text-3xl font-bold">{averageRating || "-"}</p>
            <StarRating value={Math.round(averageRating)} readOnly size={20} />
          </div>
        </div>
        <div className="p-6 bg-white rounded-2xl shadow-sm border md:col-span-2">
          <div className="flex items-center gap-4">
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari komentar, user, atau kode booking..."
              className="rounded-xl"
            />
            <Select value={ratingFilter} onValueChange={setRatingFilter}>
              <SelectTrigger className="w-40 rounded-xl">
                <SelectValue placeholder="Filter rating" />
              </SelectTrigger>
              <SelectContent className="rounded-xl">
                <SelectItem value="all" className="rounded-lg">
                  Semua rating
                </SelectItem>
                <SelectItem value="5" className="rounded-lg">
                  5 Bintang
                </SelectItem>
                <SelectItem value="4" className="rounded-lg">
                  4 Bintang
                </SelectItem>
                <SelectItem value="3" className="rounded-lg">
                  3 Bintang
                </SelectItem>
                <SelectItem value="2" className="rounded-lg">
                  2 Bintang
                </SelectItem>
                <SelectItem value="1" className="rounded-lg">
                  1 Bintang
                </SelectItem>
              </SelectContent>
            </Select>
            <div className="text-sm text-gray-500 ml-auto">
              Menampilkan {tableData.length} feedback
            </div>
          </div>
        </div>
      </div>

      {/* Table (single card, no nested header/search) */}
      {error ? (
        <div className="p-3 text-sm text-red-700 bg-red-50 border border-red-200 rounded-xl">{error}</div>
      ) : (
        <DataTable
          data={loading ? [] : paged}
          columns={columns}
          searchable={false}
          pageSize={10}
          className="rounded-2xl border shadow-sm overflow-hidden"
        />
      )}

      {/* Pagination (eksternal, agar tidak dobel card) */}
      <div className="flex items-center justify-between px-1 py-2">
        <div className="text-sm text-gray-600">
          Menampilkan <span className="font-medium">{tableData.length === 0 ? 0 : (page - 1) * pageSize + 1}</span>
          {" - "}
          <span className="font-medium">{Math.min(page * pageSize, tableData.length)}</span>
          {" dari "}
          <span className="font-medium">{tableData.length}</span> data
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">Rows</span>
            <select className="h-9 rounded-xl border px-3 text-sm" value={pageSize} onChange={(e)=> { setPageSize(Number(e.target.value)); setPage(1); }}>
              {[5,10,20,50].map(n => (<option key={n} value={n}>{n}</option>))}
            </select>
          </div>
          <div className="flex items-center gap-1">
            <Button variant="outline" className="rounded-xl" size="sm" onClick={() => setPage(1)} disabled={page <= 1}>«</Button>
            <Button variant="outline" className="rounded-xl" size="sm" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1}>‹</Button>
            {(() => {
              const totalPages = Math.max(1, Math.ceil(tableData.length / pageSize));
              const span = 2; const out: (number | string)[] = [];
              const s = Math.max(1, page - span); const e = Math.min(totalPages, page + span);
              if (s > 1) out.push(1); if (s > 2) out.push('...');
              for (let p = s; p <= e; p++) out.push(p);
              if (e < totalPages - 1) out.push('...'); if (e < totalPages) out.push(totalPages);
              return out.map((p, i) => typeof p === 'string' ? (
                <span key={`ellipsis-${i}`} className="px-2 text-sm text-gray-500">{p}</span>
              ) : (
                <Button key={p} variant={p === page ? 'default' : 'outline'} size="sm" className={p === page ? 'rounded-xl bg-indigo-600' : 'rounded-xl'} onClick={() => setPage(p)}>{p}</Button>
              ));
            })()}
            <Button variant="outline" className="rounded-xl" size="sm" onClick={() => setPage(p => Math.min(Math.max(1, Math.ceil(tableData.length / pageSize)), p + 1))} disabled={page >= Math.max(1, Math.ceil(tableData.length / pageSize))}>›</Button>
            <Button variant="outline" className="rounded-xl" size="sm" onClick={() => setPage(Math.max(1, Math.ceil(tableData.length / pageSize)))} disabled={page >= Math.max(1, Math.ceil(tableData.length / pageSize))}>»</Button>
          </div>
        </div>
      </div>

      {/* Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[520px] rounded-2xl">
          <DialogHeader>
            <DialogTitle>Detail Feedback</DialogTitle>
            <DialogDescription>Ringkasan penilaian & komentar pengguna</DialogDescription>
          </DialogHeader>

          {/* VIEW */}
          {selected && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-500">Booking</p>
                  <p className="font-medium">{selected.bookingCode}</p>
                </div>
                <div>
                  <p className="text-gray-500">Tanggal</p>
                  <p className="font-medium">
                    {formatDateTime(selected.createdAt)}
                  </p>
                </div>
                <div className="col-span-2">
                  <p className="text-gray-500">Rating</p>
                  <StarRating value={selected.rating} readOnly />
                </div>
              </div>
              <div>
                <p className="text-gray-500 text-sm mb-1">Komentar</p>
                <p className="text-sm">{selected.comment || "-"}</p>
              </div>

              <div className="space-y-2">
                <p className="text-sm font-medium">Detail Pesanan</p>
                {detailLoading ? (
                  <div className="text-sm text-muted-foreground">Memuat detail pesanan...</div>
                ) : detailBooking?.items && detailBooking.items.length > 0 ? (
                  <div className="divide-y rounded-xl border">
                    {detailBooking.items.map((it: any) => {
                      const qty = Number(it.quantity ?? it.qty ?? 0);
                      const unit = Number(it.unitPrice ?? it.price ?? 0);
                      const subtotal = Number(it.subtotal ?? qty * unit);
                      const name = it?.service?.name || it?.asset?.name || (it.type || it.itemType);
                      return (
                        <div key={it.id} className="px-4 py-3 flex items-center justify-between gap-4">
                          <div className="min-w-0">
                            <div className="font-medium truncate" title={name}>{name}</div>
                            <div className="text-xs text-gray-500">Qty {qty} × {formatCurrency(unit)}</div>
                          </div>
                          <div className="font-semibold whitespace-nowrap">{formatCurrency(subtotal)}</div>
                        </div>
                      );
                    })}
                    <div className="px-4 py-3 flex items-center justify-end gap-6 bg-gray-50">
                      <div className="text-sm text-gray-600">Total</div>
                      <div className="text-base font-bold">{formatCurrency(Number(detailBooking.totalAmount || 0))}</div>
                    </div>
                  </div>
                ) : (
                  <div className="text-sm text-muted-foreground">Tidak ada item pesanan.</div>
                )}
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDialogOpen(false)}
              className="rounded-xl"
            >
              Tutup
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
