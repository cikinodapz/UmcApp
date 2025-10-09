"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { fetchData } from "@/lib/api";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Image as ImageIcon,
  Package,
  ShoppingCart,
  Trash2,
  Save,
  Minus,
  Plus,
} from "lucide-react";
import Image from "next/image";
import { formatCurrency } from "@/lib/format";
import { useToast } from "@/hooks/use-toast";

type Category = {
  id: string;
  name: string;
} | null;

type ServicePackage = {
  id: string;
  serviceId: string;
  name: string;
  description: string | null;
  unitRate: string;
  features?: string[] | null;
  createdAt?: string;
  updatedAt?: string;
} | null;

type Service = {
  id: string;
  categoryId: string | null;
  name: string;
  description: string | null;
  unitRate: string;
  isActive: boolean;
  photoUrl: string | null;
  createdAt: string;
  updatedAt: string;
  category: Category;
  Package: ServicePackage[];
};

type CartItem = {
  id: string;
  userId: string;
  serviceId: string;
  packageId: string | null;
  quantity: number;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  service: Service;
  package: ServicePackage;
};

export default function CartPage() {
  const { toast } = useToast();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<CartItem[]>([]);
  const [updating, setUpdating] = useState<Record<string, boolean>>({});
  const [deleting, setDeleting] = useState<Record<string, boolean>>({});
  const [clearing, setClearing] = useState(false);
  const [drafts, setDrafts] = useState<
    Record<string, { quantity: number; notes: string }>
  >({});
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [bookingNotes, setBookingNotes] = useState<string>("");
  const [checkingOut, setCheckingOut] = useState<boolean>(false);

  useEffect(() => {
    const loadCart = async () => {
      try {
        setLoading(true);
        const data: CartItem[] = await fetchData("/cart", { method: "GET" });
        const arr = Array.isArray(data) ? data : [];
        setItems(arr);
        // seed drafts
        const seed: Record<string, { quantity: number; notes: string }> = {};
        for (const it of arr) {
          seed[it.id] = { quantity: it.quantity || 1, notes: it.notes || "" };
        }
        setDrafts(seed);
      } catch (error: any) {
        toast({
          title: "Error",
          description: error?.message || "Gagal memuat keranjang",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };
    loadCart();
  }, [toast]);

  const totals = useMemo(() => {
    let subtotal = 0;
    for (const it of items) {
      const price = Number(it.package?.unitRate || it.service.unitRate) || 0;
      subtotal += price * (it.quantity || 0);
    }
    return { subtotal };
  }, [items]);

  const setItemDraft = (
    id: string,
    patch: Partial<{ quantity: number; notes: string }>
  ) => {
    setDrafts((prev) => ({
      ...prev,
      [id]: {
        quantity: prev[id]?.quantity ?? 1,
        notes: prev[id]?.notes ?? "",
        ...patch,
      },
    }));
  };

  const handleUpdateItem = async (id: string) => {
    const d = drafts[id];
    if (!d || !Number.isFinite(d.quantity) || d.quantity < 1) {
      toast({
        title: "Validasi",
        description: "Jumlah minimal 1",
        variant: "destructive",
      });
      return;
    }
    try {
      setUpdating((s) => ({ ...s, [id]: true }));
      const resp = await fetchData(`/cart/${id}`, {
        method: "PATCH",
        data: { quantity: d.quantity, notes: d.notes || null },
      });
      // apply returned item if available, else patch local
      if (resp?.cartItem) {
        setItems((prev) =>
          prev.map((it) => (it.id === id ? { ...it, ...resp.cartItem } : it))
        );
      } else {
        setItems((prev) =>
          prev.map((it) =>
            it.id === id
              ? { ...it, quantity: d.quantity, notes: d.notes || null }
              : it
          )
        );
      }
      toast({ title: resp?.message || "Keranjang berhasil diupdate" });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error?.message || "Gagal mengupdate item",
        variant: "destructive",
      });
    } finally {
      setUpdating((s) => ({ ...s, [id]: false }));
    }
  };

  const handleDeleteItem = async (id: string) => {
    try {
      setDeleting((s) => ({ ...s, [id]: true }));
      const resp = await fetchData(`/cart/${id}`, { method: "DELETE" });
      setItems((prev) => prev.filter((it) => it.id !== id));
      setDrafts((prev) => {
        const { [id]: _, ...rest } = prev;
        return rest;
      });
      toast({ title: resp?.message || "Item dihapus" });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error?.message || "Gagal menghapus item",
        variant: "destructive",
      });
    } finally {
      setDeleting((s) => ({ ...s, [id]: false }));
    }
  };

  const handleClearCart = async () => {
    try {
      setClearing(true);
      const resp = await fetchData(`/cart`, { method: "DELETE" });
      setItems([]);
      setDrafts({});
      toast({ title: resp?.message || "Keranjang dikosongkan" });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error?.message || "Gagal mengosongkan keranjang",
        variant: "destructive",
      });
    } finally {
      setClearing(false);
    }
  };

  const handleCheckout = async () => {
    if (!items.length) {
      toast({
        title: "Keranjang kosong",
        description: "Tambahkan item sebelum checkout",
        variant: "destructive",
      });
      return;
    }
    if (!startDate || !endDate) {
      toast({
        title: "Tanggal wajib diisi",
        description: "Isi tanggal mulai dan selesai",
        variant: "destructive",
      });
      return;
    }
    try {
      setCheckingOut(true);
      const resp = await fetchData("/bookings/checkout", {
        method: "POST",
        data: {
          startDate,
          endDate,
          notes: bookingNotes || undefined,
        },
      });
      toast({ title: resp?.message || "Booking berhasil dibuat dari keranjang" });
      // Setelah berhasil, arahkan ke halaman daftar booking
      router.push("/booking");
    } catch (error: any) {
      toast({
        title: "Checkout gagal",
        description: error?.message || "Tidak dapat membuat booking",
        variant: "destructive",
      });
    } finally {
      setCheckingOut(false);
    }
  };

  return (
    <div className="container max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="mb-8">
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
          Keranjang
        </h1>
        <p className="text-gray-500">Ringkasan layanan yang Anda tambahkan</p>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <Card key={i} className="rounded-2xl">
                <CardContent className="p-5 flex gap-4">
                  <Skeleton className="h-24 w-28 rounded-xl" />
                  <div className="flex-1 space-y-3">
                    <Skeleton className="h-5 w-2/3" />
                    <Skeleton className="h-4 w-1/2" />
                    <Skeleton className="h-4 w-1/3" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          <div>
            <Card className="rounded-2xl">
              <CardContent className="p-5 space-y-3">
                <Skeleton className="h-5 w-1/2" />
                <Skeleton className="h-8 w-32" />
              </CardContent>
            </Card>
          </div>
        </div>
      ) : items.length === 0 ? (
        <div className="text-center py-20">
          <ShoppingCart className="w-12 h-12 mx-auto text-gray-400 mb-3" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Keranjang kosong
          </h3>
          <p className="text-gray-500">Yuk, jelajahi layanan di katalog.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Items */}
          <div className="lg:col-span-2 space-y-4">
            {items.map((it) => {
              const price =
                Number(it.package?.unitRate || it.service.unitRate) || 0;
              const total = price * (it.quantity || 0);
              const draft = drafts[it.id] || {
                quantity: it.quantity || 1,
                notes: it.notes || "",
              };
              const isUpdating = !!updating[it.id];
              const isDeleting = !!deleting[it.id];
              return (
                <Card key={it.id} className="rounded-2xl">
                  <CardContent className="p-5 flex gap-4">
                    <div className="relative h-24 w-28 bg-gray-100 rounded-xl overflow-hidden flex-shrink-0">
                      {it.service.photoUrl ? (
                        <Image
                          src={toServicePhoto(it.service.photoUrl) || ""}
                          alt={it.service.name}
                          fill
                          className="object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <ImageIcon className="w-8 h-8 text-gray-400" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <h3 className="font-semibold text-gray-900">
                            {it.service.name}
                          </h3>
                          {it.package ? (
                            <div className="mt-1 flex items-center gap-2">
                              <Badge className="bg-indigo-500/90 text-white">
                                {it.package.name}
                              </Badge>
                              <span className="text-sm text-gray-500">
                                {formatCurrency(price)}
                              </span>
                            </div>
                          ) : (
                            <p className="mt-1 text-sm text-gray-600">
                              {formatCurrency(price)}
                            </p>
                          )}
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-gray-500">Jumlah</p>
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              type="button"
                              variant="outline"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() =>
                                setItemDraft(it.id, {
                                  quantity: Math.max(
                                    1,
                                    (draft.quantity || 1) - 1
                                  ),
                                })
                              }
                              disabled={isUpdating || isDeleting}
                            >
                              <Minus className="w-4 h-4" />
                            </Button>
                            <input
                              type="number"
                              min={1}
                              value={draft.quantity}
                              onChange={(e) =>
                                setItemDraft(it.id, {
                                  quantity: Math.max(
                                    1,
                                    parseInt(e.target.value || "1", 10)
                                  ),
                                })
                              }
                              className="w-16 text-center border rounded-md h-8"
                              disabled={isUpdating || isDeleting}
                            />
                            <Button
                              type="button"
                              variant="outline"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() =>
                                setItemDraft(it.id, {
                                  quantity: (draft.quantity || 1) + 1,
                                })
                              }
                              disabled={isUpdating || isDeleting}
                            >
                              <Plus className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </div>

                      <div className="mt-2">
                        <label className="text-sm text-gray-600">Catatan</label>
                        <input
                          type="text"
                          placeholder="Catatan (opsional)"
                          value={draft.notes}
                          onChange={(e) =>
                            setItemDraft(it.id, { notes: e.target.value })
                          }
                          className="mt-1 w-full border rounded-md h-9 px-3"
                          disabled={isUpdating || isDeleting}
                        />
                      </div>

                      <div className="mt-3 flex items-center justify-between">
                        <span className="text-sm text-gray-500">Subtotal</span>
                        <span className="font-semibold text-indigo-600">
                          {formatCurrency(total)}
                        </span>
                      </div>

                      <div className="mt-3 flex items-center justify-end gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => handleDeleteItem(it.id)}
                          disabled={isDeleting || isUpdating}
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          {isDeleting ? "Menghapus..." : "Hapus"}
                        </Button>
                        <Button
                          type="button"
                          onClick={() => handleUpdateItem(it.id)}
                          disabled={isUpdating || isDeleting}
                          className="bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-600 hover:to-violet-700 text-white"
                        >
                          <Save className="w-4 h-4 mr-2" />
                          {isUpdating ? "Menyimpan..." : "Simpan Perubahan"}
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Summary */}
          <div>
            <Card className="rounded-2xl sticky top-6">
              <CardHeader>
                <CardTitle>Ringkasan</CardTitle>
                <CardDescription>{items.length} item</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Subtotal</span>
                  <span className="font-semibold">
                    {formatCurrency(totals.subtotal)}
                  </span>
                </div>
                <div className="space-y-3">
                  <div>
                    <label className="text-sm text-gray-600">Tanggal Mulai</label>
                    <input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="mt-1 w-full border rounded-md h-9 px-3"
                    />
                  </div>
                  <div>
                    <label className="text-sm text-gray-600">Tanggal Selesai</label>
                    <input
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="mt-1 w-full border rounded-md h-9 px-3"
                    />
                  </div>
                  <div>
                    <label className="text-sm text-gray-600">Catatan Booking (opsional)</label>
                    <input
                      type="text"
                      placeholder="Notes keseluruhan booking"
                      value={bookingNotes}
                      onChange={(e) => setBookingNotes(e.target.value)}
                      className="mt-1 w-full border rounded-md h-9 px-3"
                    />
                  </div>
                </div>
                <Button
                  onClick={handleCheckout}
                  disabled={checkingOut || !items.length}
                  className="w-full bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-600 hover:to-violet-700"
                >
                  <Package className="w-4 h-4 mr-2" />
                  {checkingOut ? "Memproses…" : "Lanjutkan Pemesanan"}
                </Button>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={handleClearCart}
                  disabled={clearing || items.length === 0}
                >
                  {clearing ? "Mengosongkan..." : "Kosongkan Keranjang"}
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
const toServicePhoto = (p?: string | null) => {
  if (!p) return null;
  if (/^https?:\/\//i.test(p)) return p;
  const base = process.env.NEXT_PUBLIC_API_URL || "";
  const path = p.startsWith("/uploads/") ? p : `/uploads/${p}`;
  return `${base}${path}`;
};
