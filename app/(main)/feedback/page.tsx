"use client";

import { useMemo, useState } from "react";
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
import { mockBookings, mockUsers } from "@/lib/mock";
import { BookingStatus, Role } from "@/types";
import { formatDateTime } from "@/lib/format";
import { Star, MessageSquare, Edit, Eye, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

// ===== Dummy feedback seeding (ambil 3–5 booking yang SELESAI) =====
const sampleComments = [
  "Pelayanan cepat dan ramah. Terima ya!",
  "Peralatan lengkap, hasilnya memuaskan.",
  "Sedikit terlambat saat pengambilan, tapi overall oke.",
  "Admin responsif, proses mudah.",
  "Kualitas audio mantap. Recommended!",
];

function seedFeedbacks(): FeedbackRow[] {
  const done = mockBookings.filter((b) => b.status === BookingStatus.SELESAI);
  const picked = (done.length ? done : mockBookings).slice(
    0,
    Math.min(5, done.length || 3)
  );

  return picked.map((b, i) => {
    const u = mockUsers.find((uu) => uu.id === b.userId);
    const rating = [5, 4, 5, 3, 4][i % 5];
    return {
      id: crypto.randomUUID(),
      bookingId: b.id,
      userId: u?.id || "user-seed",
      userName: u?.name || "Pengguna Demo",
      userEmail: u?.email || "demo@umc.ac.id",
      rating,
      comment: sampleComments[i % sampleComments.length],
      createdAt: new Date(Date.now() - (i + 1) * 36e5).toISOString(), // mundur per 1 jam
      bookingCode: b.id.slice(-8),
    };
  });
}

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

  // ====== Local state as mock "DB" ======
  const [feedbacks, setFeedbacks] = useState<FeedbackRow[]>(seedFeedbacks());

  // Filter & derived data
  const [ratingFilter, setRatingFilter] = useState<string>("all");
  const [search, setSearch] = useState("");

  // Dialog states
  const [dialogOpen, setDialogOpen] = useState(false);
  const [viewMode, setViewMode] = useState<"create" | "edit" | "view">(
    "create"
  );
  const [selected, setSelected] = useState<FeedbackRow | null>(null);

  // Form states
  const [selectedBookingId, setSelectedBookingId] = useState<string>("");
  const [formRating, setFormRating] = useState<number>(5);
  const [formComment, setFormComment] = useState<string>("");

  // Bookings yang SELESAI
  const completedBookings = useMemo(
    () =>
      mockBookings
        .filter((b) => b.status === BookingStatus.SELESAI)
        .filter((b) => (isAdmin ? true : b.userId === user?.id)),
    [isAdmin, user?.id]
  );

  // Booking yang belum punya feedback oleh user aktif
  const selectableBookings = useMemo(() => {
    const owned = completedBookings.filter((b) => b.userId === user?.id);
    const already = new Set(
      feedbacks.filter((f) => f.userId === user?.id).map((f) => f.bookingId)
    );
    return owned.filter((b) => !already.has(b.id));
  }, [completedBookings, feedbacks, user?.id]);

  // Data untuk tabel (join user & booking)
  const tableData: FeedbackRow[] = useMemo(() => {
    const base = feedbacks.map((f) => {
      const bk = mockBookings.find((b) => b.id === f.bookingId);
      const u = mockUsers.find((uu) => uu.id === f.userId);
      return {
        ...f,
        bookingCode: bk ? bk.id.slice(-8) : "Unknown",
        userName: u?.name ?? "Unknown",
        userEmail: u?.email ?? "",
      };
    });
    const scoped = isAdmin ? base : base.filter((f) => f.userId === user?.id);
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
    if (feedbacks.length === 0) return 0;
    return (
      Math.round(
        (feedbacks.reduce((s, f) => s + f.rating, 0) / feedbacks.length) * 10
      ) / 10
    );
  }, [feedbacks]);

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
            onClick={() => {
              setSelected(row);
              setViewMode("view");
              setDialogOpen(true);
            }}
          >
            <Eye className="w-4 h-4" />
          </Button>

          {/* Edit hanya pemilik atau admin */}
          {/* {(isAdmin || row.userId === user?.id) && (
            <Button
              variant="ghost"
              size="sm"
              className="rounded-lg"
              onClick={() => {
                setSelected(row);
                setSelectedBookingId(row.bookingId);
                setFormRating(row.rating);
                setFormComment(row.comment ?? "");
                setViewMode("edit");
                setDialogOpen(true);
              }}
            >
              <Edit className="w-4 h-4" />
            </Button>
          )} */}

          {/* Hapus hanya admin atau pemilik */}
          {(isAdmin || row.userId === user?.id) && (
            <Button
              variant="ghost"
              size="sm"
              className="rounded-lg text-red-600 hover:text-red-700"
              onClick={() => {
                setFeedbacks((prev) => prev.filter((f) => f.id !== row.id));
                toast({
                  title: "Dihapus",
                  description: "Feedback berhasil dihapus",
                });
              }}
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          )}
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

  return (
    <div className="space-y-6">
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
        {/* Tombol tambah hanya untuk user biasa (punya booking selesai yang belum dinilai) */}
        {!isAdmin && (
          <Button
            className="rounded-xl bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-600 hover:to-violet-700"
            disabled={selectableBookings.length === 0}
            onClick={() => {
              resetForm();
              setViewMode("create");
              setDialogOpen(true);
            }}
          >
            <MessageSquare className="w-4 h-4 mr-2" />
            Beri Feedback
          </Button>
        )}
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

      {/* Table */}
      <DataTable
        data={tableData}
        columns={columns}
        searchPlaceholder="Cari feedback..."
        pageSize={10}
      />

      {/* Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[520px] rounded-2xl">
          <DialogHeader>
            <DialogTitle>
              {viewMode === "create"
                ? "Beri Feedback"
                : viewMode === "edit"
                ? "Edit Feedback"
                : "Detail Feedback"}
            </DialogTitle>
            <DialogDescription>
              {viewMode === "create"
                ? "Pilih booking yang telah selesai, beri rating & komentar."
                : viewMode === "edit"
                ? "Perbarui rating atau komentar Anda."
                : "Ringkasan penilaian & komentar."}
            </DialogDescription>
          </DialogHeader>

          {/* VIEW */}
          {viewMode === "view" && selected && (
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
            </div>
          )}

          {/* CREATE / EDIT */}
          {(viewMode === "create" || viewMode === "edit") && (
            <div className="space-y-5">
              {viewMode === "create" && (
                <div className="space-y-2">
                  <Label>Booking</Label>
                  <Select
                    value={selectedBookingId}
                    onValueChange={setSelectedBookingId}
                  >
                    <SelectTrigger className="rounded-xl">
                      <SelectValue
                        placeholder={
                          selectableBookings.length
                            ? "Pilih booking selesai"
                            : "Tidak ada booking tersedia"
                        }
                      />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl">
                      {selectableBookings.map((b) => (
                        <SelectItem
                          key={b.id}
                          value={b.id}
                          className="rounded-lg"
                        >
                          {b.id.slice(-8)} — {formatDateTime(b.endDatetime)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="space-y-2">
                <Label>Rating</Label>
                <StarRating value={formRating} onChange={setFormRating} />
              </div>

              <div className="space-y-2">
                <Label>Komentar (opsional)</Label>
                <Textarea
                  value={formComment}
                  onChange={(e) => setFormComment(e.target.value)}
                  placeholder="Tulis pengalaman Anda..."
                  className="rounded-xl min-h-[96px]"
                />
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
            {viewMode === "create" && (
              <Button
                disabled={!selectedBookingId || !formRating}
                onClick={onCreate}
                className="rounded-xl bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-600 hover:to-violet-700"
              >
                Kirim
              </Button>
            )}
            {viewMode === "edit" && (
              <Button
                onClick={onUpdate}
                className="rounded-xl bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-600 hover:to-violet-700"
              >
                Simpan Perubahan
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}