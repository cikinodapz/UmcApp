"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { formatCurrency } from "@/lib/format";
import { fetchData } from "@/lib/api";
import {
  ShoppingCart,
  Info,
  Boxes,
  Wrench,
  Trash2,
  Minus,
  Plus,
  CheckCircle2,
  Clock3,
  Loader2,
  Trash,
  XCircle,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

type Kind = "aset" | "jasa";

type Category = {
  id: string;
  name: string;
  description?: string | null;
  type: "ASET" | "JASA";
};

type AssetAPI = {
  id: string;
  code: string;
  name: string;
  photoUrl?: string | null;
  dailyRate: string | number;
  stock: number;
  categoryId?: string | null;
  category?: { id: string; name: string } | null;
};

type ServiceAPI = {
  id: string;
  code: string;
  name: string;
  description?: string | null;
  unitRate: string | number;
  isActive: boolean;
  photoUrl?: string | null;
  categoryId?: string | null;
  category?: { id: string; name: string } | null;
};

type Asset = {
  id: string;
  code: string;
  name: string;
  photoUrl?: string | null;
  dailyRate: number;
  stock: number;
  categoryId?: string | null;
  categoryName?: string | null;
};

type Service = {
  id: string;
  code: string;
  name: string;
  description?: string | null;
  unitRate: number;
  isActive: boolean;
  photoUrl?: string | null;
  categoryId?: string | null;
  categoryName?: string | null;
};

/** Bentuk item dari API keranjang */
type CartAPI = {
  id: string;
  userId: string;
  itemType: "ASET" | "JASA";
  assetId: string | null;
  serviceId: string | null;
  qty: number;
  price: string | number;
  createdAt: string;
  updatedAt: string;
  asset?: { code: string; name: string; photoUrl?: string | null } | null;
  service?: { code: string; name: string; photoUrl?: string | null } | null;
};

/** Bentuk item untuk UI */
type CartItem = {
  /** gunakan id keranjang sbg key operasi */
  id: string;
  kind: Kind;
  /** id produk (assetId / serviceId) untuk deteksi duplikat */
  itemId: string;
  qty: number;
  name: string;
  code: string;
  photoUrl?: string | null;
  unitPrice: number;
  extra?: { description?: string | null; categoryName?: string | null };
  _showDetail?: boolean;
};

type BookingItem = {
  id: string;
  bookingId: string;
  itemType: "ASET" | "JASA";
  assetId: string | null;
  serviceId: string | null;
  qty: number;
  price: string;
  asset?: { name: string; code: string } | null;
  service?: { name: string; code: string } | null;
};

type Booking = {
  id: string;
  userId: string;
  type: "ASET" | "JASA";
  startDatetime: string;
  endDatetime: string;
  status: "MENUNGGU" | string; // assume others possible
  approvedBy: string | null;
  approvedAt: string | null;
  notes: string;
  createdAt: string;
  updatedAt: string;
  items: BookingItem[];
};

// kecilkan noise ketika user ngetik
const useDebounced = (value: string, ms = 300) => {
  const [v, setV] = useState(value);
  const t = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (t.current) clearTimeout(t.current);
    t.current = setTimeout(() => setV(value), ms);
    return () => t.current && clearTimeout(t.current);
  }, [value, ms]);
  return v;
};

export default function PemesananPage() {
  const { toast } = useToast();
  const [tab, setTab] = useState<"katalog" | "keranjang" | "booking">(
    "katalog"
  );
  const [katalogTab, setKatalogTab] = useState<"aset" | "jasa">("aset");

  const [searchRaw, setSearchRaw] = useState("");
  const search = useDebounced(searchRaw, 300);

  const [category, setCategory] = useState<string>("all");

  // data server
  const [categories, setCategories] = useState<Category[]>([]);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // keranjang (server-synced)
  const [cart, setCart] = useState<CartItem[]>([]);
  const [cartLoading, setCartLoading] = useState<boolean>(false);
  const [cartBusy, setCartBusy] = useState<string | null>(null); // id yang sedang diproses

  // bookings
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [bookingsLoading, setBookingsLoading] = useState<boolean>(false);
  const [bookingsBusy, setBookingsBusy] = useState<string | null>(null);

  // modal checkout
  const [open, setOpen] = useState(false);
  const [startDatetime, setStartDatetime] = useState("");
  const [endDatetime, setEndDatetime] = useState("");
  const [notes, setNotes] = useState("");
  const [checkoutBusy, setCheckoutBusy] = useState(false);

  // fetch awal: katalog + keranjang + bookings
  useEffect(() => {
    let mounted = true;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const [cats, a, s] = await Promise.all([
          fetchData<Category[]>("/categories", { method: "GET" }),
          fetchData<AssetAPI[]>("/assets", { method: "GET" }),
          fetchData<ServiceAPI[]>("/services", { method: "GET" }),
        ]);

        if (!mounted) return;

        setCategories(cats || []);

        setAssets(
          (a || []).map((x) => ({
            id: x.id,
            code: x.code,
            name: x.name,
            photoUrl: x.photoUrl ?? null,
            dailyRate: Number(x.dailyRate ?? 0),
            stock: Number(x.stock ?? 0),
            categoryId: x.categoryId ?? null,
            categoryName: x.category?.name ?? null,
          }))
        );

        setServices(
          (s || []).map((x) => ({
            id: x.id,
            code: x.code,
            name: x.name,
            description: x.description ?? "",
            unitRate: Number(x.unitRate ?? 0),
            isActive: Boolean(x.isActive),
            photoUrl: x.photoUrl ?? null,
            categoryId: x.categoryId ?? null,
            categoryName: x.category?.name ?? null,
          }))
        );
      } catch (e: any) {
        const msg = e?.response?.data?.message || "Gagal memuat data katalog";
        setError(msg);
      } finally {
        mounted && setLoading(false);
      }
    }
    load();
    return () => {
      mounted = false;
    };
  }, []);

  // load keranjang dari API
  const fetchCart = async () => {
    setCartLoading(true);
    try {
      const data = await fetchData<CartAPI[]>("/cart", { method: "GET" });
      const mapped: CartItem[] = (data || []).map((x) => {
        const isAset = x.itemType === "ASET";
        const nm = isAset ? x.asset?.name ?? "Aset" : x.service?.name ?? "Jasa";
        const cd = isAset ? x.asset?.code ?? "-" : x.service?.code ?? "-";

        // PERBAIKAN: Gunakan NEXT_PUBLIC_API_URL dari environment variable
        const baseUrl =
          process.env.NEXT_PUBLIC_API_URL;
        const photo = isAset
          ? x.asset?.photoUrl
            ? `${baseUrl}/uploads/${x.asset.photoUrl}`
            : null
          : x.service?.photoUrl
          ? `${baseUrl}/uploads/${x.service.photoUrl}`
          : null;

        return {
          id: x.id, // cart id
          kind: isAset ? "aset" : "jasa",
          itemId: (isAset ? x.assetId : x.serviceId) || "",
          qty: Number(x.qty || 1),
          name: nm,
          code: cd,
          photoUrl: photo,
          unitPrice: Number(x.price || 0),
        };
      });
      setCart(mapped);
    } catch (e: any) {
      const msg = e?.response?.data?.message || "Gagal memuat keranjang";
      toast({ title: "Error", description: msg, variant: "destructive" });
    } finally {
      setCartLoading(false);
    }
  };

  // load bookings dari API
  const fetchBookings = async () => {
    setBookingsLoading(true);
    try {
      const data = await fetchData<{ bookings: Booking[] }>("/bookings", {
        method: "GET",
      });
      setBookings(data?.bookings || []);
    } catch (e: any) {
      const msg = e?.response?.data?.message || "Gagal memuat daftar booking";
      toast({ title: "Error", description: msg, variant: "destructive" });
    } finally {
      setBookingsLoading(false);
    }
  };

  useEffect(() => {
    fetchCart();
    fetchBookings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // kategori yang ditampilkan di dropdown mengikuti tab
  const visibleCategories = useMemo(() => {
    const need = katalogTab === "aset" ? "ASET" : "JASA";
    return categories.filter((c) => c.type === need);
  }, [categories, katalogTab]);

  // filter aset
  const filteredAssets = useMemo(() => {
    let base = assets;
    if (category !== "all")
      base = base.filter((a) => a.categoryId === category);
    const q = search.trim().toLowerCase();
    if (!q) return base;
    return base.filter(
      (a) =>
        a.name.toLowerCase().includes(q) ||
        a.code.toLowerCase().includes(q) ||
        (a.categoryName ?? "").toLowerCase().includes(q)
    );
  }, [assets, category, search]);

  // filter jasa
  const filteredServices = useMemo(() => {
    let base = services;
    if (category !== "all")
      base = base.filter((s) => s.categoryId === category);
    const q = search.trim().toLowerCase();
    if (!q) return base;
    return base.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        s.code.toLowerCase().includes(q) ||
        (s.categoryName ?? "").toLowerCase().includes(q) ||
        (s.description ?? "").toLowerCase().includes(q)
    );
  }, [services, category, search]);

  // reset category ketika ganti tab (biar ga “nyangkut” id kategori beda tipe)
  useEffect(() => {
    setCategory("all");
  }, [katalogTab]);

  // ==== API helpers untuk keranjang ====

  /** Tambah ke keranjang; kalau sudah ada, auto PATCH qty+1 */
  async function addToCart(kind: Kind, productId: string, qty = 1) {
    try {
      setCartBusy(`add-${kind}-${productId}`);

      // cek apakah sudah ada (by itemId + kind)
      const existing = cart.find(
        (i) => i.kind === kind && i.itemId === productId
      );
      if (existing) {
        await fetchData(`/cart/${existing.id}`, {
          method: "PATCH",
          data: { qty: existing.qty + qty },
        });
        toast({
          title: "Keranjang diperbarui",
          description: "Jumlah item ditambah.",
        });
        await fetchCart();
        setTab("keranjang");
        return;
      }

      if (kind === "aset") {
        const a = assets.find((x) => x.id === productId);
        if (!a) return;
        await fetchData("/cart", {
          method: "POST",
          data: {
            itemType: "ASET",
            assetId: a.id,
            qty,
            price: Number(a.dailyRate || 0),
          },
        });
      } else {
        const s = services.find((x) => x.id === productId);
        if (!s) return;
        await fetchData("/cart", {
          method: "POST",
          data: {
            itemType: "JASA",
            serviceId: s.id,
            qty,
            price: Number(s.unitRate || 0),
          },
        });
      }

      toast({
        title: "Ditambahkan ke keranjang",
        description: `${kind === "aset" ? "Aset" : "Jasa"} #${productId.slice(
          -6
        )} ditambahkan.`,
      });
      await fetchCart();
      setTab("keranjang");
    } catch (e: any) {
      const msg = e?.response?.data?.message || "Gagal menambah ke keranjang";
      toast({ title: "Error", description: msg, variant: "destructive" });
    } finally {
      setCartBusy(null);
    }
  }

  /** Ubah jumlah */
  async function setQty(kind: Kind, cartId: string, qty: number) {
    const next = Math.max(1, qty);
    try {
      setCartBusy(`qty-${cartId}`);
      await fetchData(`/cart/${cartId}`, {
        method: "PATCH",
        data: { qty: next },
      });
      // update lokal cepat biar responsif
      setCart((prev) =>
        prev.map((i) => (i.id === cartId ? { ...i, qty: next } : i))
      );
    } catch (e: any) {
      const msg = e?.response?.data?.message || "Gagal memperbarui jumlah";
      toast({ title: "Error", description: msg, variant: "destructive" });
    } finally {
      setCartBusy(null);
    }
  }

  /** Hapus satu item */
  async function removeItem(_kind: Kind, cartId: string) {
    try {
      setCartBusy(`del-${cartId}`);
      await fetchData(`/cart/${cartId}`, { method: "DELETE" });
      setCart((prev) => prev.filter((i) => i.id !== cartId));
      toast({
        title: "Item dihapus",
        description: "Item keranjang berhasil dihapus.",
      });
    } catch (e: any) {
      const msg = e?.response?.data?.message || "Gagal menghapus item";
      toast({ title: "Error", description: msg, variant: "destructive" });
    } finally {
      setCartBusy(null);
    }
  }

  /** Kosongkan semua item */
  async function clearCart() {
    try {
      setCartBusy("clear-all");
      await fetchData("/cart", { method: "DELETE" });
      setCart([]);
      toast({
        title: "Keranjang dikosongkan",
        description: "Semua item keranjang telah dihapus.",
      });
    } catch (e: any) {
      const msg = e?.response?.data?.message || "Gagal mengosongkan keranjang";
      toast({ title: "Error", description: msg, variant: "destructive" });
    } finally {
      setCartBusy(null);
    }
  }

  function toggleDetail(kind: Kind, cartId: string) {
    setCart((prev) =>
      prev.map((i) =>
        i.id === cartId ? { ...i, _showDetail: !i._showDetail } : i
      )
    );
  }

  const totalCart = cart.reduce((sum, i) => sum + i.unitPrice * i.qty, 0);

  // checkout handler
  async function handleCheckout() {
    if (!startDatetime || !endDatetime || !notes) {
      toast({
        title: "Error",
        description: "Isi semua field terlebih dahulu.",
        variant: "destructive",
      });
      return;
    }
    setCheckoutBusy(true);
    try {
      const data = await fetchData("/bookings/checkout", {
        method: "POST",
        data: {
          startDatetime: new Date(startDatetime).toISOString(),
          endDatetime: new Date(endDatetime).toISOString(),
          notes,
        },
      });
      toast({
        title: "Sukses",
        description: data.message || "Booking berhasil dibuat.",
      });
      setOpen(false);
      await fetchCart();
      await fetchBookings();
      setTab("booking");
      // reset form
      setStartDatetime("");
      setEndDatetime("");
      setNotes("");
    } catch (e: any) {
      const msg = e?.response?.data?.message || "Gagal membuat booking";
      toast({ title: "Error", description: msg, variant: "destructive" });
    } finally {
      setCheckoutBusy(false);
    }
  }

  // cancel booking
  async function cancelBooking(bookingId: string) {
    try {
      setBookingsBusy(`cancel-${bookingId}`);
      const data = await fetchData(`/bookings/${bookingId}/cancel`, {
        method: "PATCH",
      });
      toast({
        title: "Sukses",
        description: data.message || "Booking berhasil dibatalkan.",
      });
      await fetchBookings();
    } catch (e: any) {
      const msg = e?.response?.data?.message || "Gagal membatalkan booking";
      toast({ title: "Error", description: msg, variant: "destructive" });
    } finally {
      setBookingsBusy(null);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Pemesanan Aset & Jasa
          </h1>
          <p className="text-gray-600 mt-2">
            Cari item → masukkan ke keranjang → checkout untuk buat booking.
          </p>
        </div>

        {/* Tombol kosongkan keranjang */}
        <div className="hidden md:block">
          <Button
            variant="outline"
            className="rounded-lg"
            onClick={clearCart}
            disabled={
              cartLoading || cart.length === 0 || cartBusy === "clear-all"
            }
          >
            {cartBusy === "clear-all" ? (
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
            ) : (
              <Trash className="w-4 h-4 mr-2" />
            )}
            Kosongkan Keranjang
          </Button>
        </div>
      </div>

      <Tabs
        value={tab}
        onValueChange={(v) => setTab(v as any)}
        className="space-y-4"
      >
        <TabsList className="rounded-xl">
          <TabsTrigger value="katalog" className="rounded-lg">
            Katalog
          </TabsTrigger>
          <TabsTrigger value="keranjang" className="rounded-lg">
            Keranjang
            {(cartLoading ? false : cart.length > 0) ? (
              <Badge variant="secondary" className="ml-2 rounded-md">
                {cart.length}
              </Badge>
            ) : null}
          </TabsTrigger>
          <TabsTrigger value="booking" className="rounded-lg">
            Booking
          </TabsTrigger>
        </TabsList>
        {/* === KATALOG === */}
        <TabsContent value="katalog" className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="md:col-span-2">
              <Input
                value={searchRaw}
                onChange={(e) => setSearchRaw(e.target.value)}
                placeholder="Cari nama, kode, atau kategori…"
                className="rounded-xl"
              />
            </div>

            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger className="rounded-xl">
                <SelectValue placeholder="Pilih kategori" />
              </SelectTrigger>
              <SelectContent className="rounded-xl">
                <SelectItem value="all" className="rounded-lg">
                  Semua Kategori
                </SelectItem>
                {visibleCategories.map((c) => (
                  <SelectItem key={c.id} value={c.id} className="rounded-lg">
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <div className="md:col-span-3 -mt-1">
              <Tabs
                value={katalogTab}
                onValueChange={(v) => setKatalogTab(v as any)}
                className="space-y-4"
              >
                <TabsList className="rounded-xl">
                  <TabsTrigger value="aset" className="rounded-lg">
                    <Boxes className="w-4 h-4 mr-2" /> Aset
                  </TabsTrigger>
                  <TabsTrigger value="jasa" className="rounded-lg">
                    <Wrench className="w-4 h-4 mr-2" /> Jasa
                  </TabsTrigger>
                </TabsList>

                <div className="py-2" />

                {loading ? (
                  <div className="flex items-center gap-2 text-gray-600">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Memuat data…
                  </div>
                ) : error ? (
                  <div className="text-red-600">{error}</div>
                ) : (
                  <>
                    <TabsContent value="aset">
                      <GridAssets
                        assets={filteredAssets}
                        onAdd={(id) => addToCart("aset", id)}
                        busyKey={cartBusy}
                      />
                    </TabsContent>

                    <TabsContent value="jasa">
                      <GridServices
                        services={filteredServices}
                        onAdd={(id) => addToCart("jasa", id)}
                        busyKey={cartBusy}
                      />
                    </TabsContent>
                  </>
                )}
              </Tabs>
            </div>
          </div>
        </TabsContent>
        {/* === KERANJANG === */}
        <TabsContent value="keranjang" className="space-y-5">
          {cartLoading ? (
            <div className="text-gray-600 flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" /> Memuat keranjang…
            </div>
          ) : cart.length === 0 ? (
            <EmptyState
              text="Keranjang masih kosong."
              hint={
                <>
                  Buka tab <strong>Katalog</strong> lalu klik{" "}
                  <strong>Keranjang</strong> pada item untuk menambahkan.
                </>
              }
            />
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* List items */}
              <div className="lg:col-span-2 space-y-6">
                <CartSection
                  title="Item di Keranjang"
                  items={cart}
                  onRemove={removeItem}
                  onQty={setQty}
                  onDetail={toggleDetail}
                  busyKey={cartBusy}
                />
              </div>

              {/* Ringkasan */}
              <Card className="rounded-2xl h-fit sticky top-6">
                <CardHeader>
                  <CardTitle>Ringkasan Keranjang</CardTitle>
                  <CardDescription>
                    Harga estimasi, final dihitung berdasarkan periode booking.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <SummaryRow
                    label="Jumlah item"
                    value={`${cart.length} item`}
                  />
                  <SummaryRow
                    label="Estimasi total"
                    value={formatCurrency(totalCart)}
                  />
                  <div className="pt-2">
                    <Dialog open={open} onOpenChange={setOpen}>
                      <DialogTrigger asChild>
                        <Button
                          className="w-full rounded-lg"
                          disabled={cart.length === 0}
                        >
                          Checkout
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="rounded-2xl">
                        <DialogHeader>
                          <DialogTitle>Checkout Booking</DialogTitle>
                          <DialogDescription>
                            Masukkan detail periode dan catatan untuk booking.
                          </DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                          <div className="grid gap-2">
                            <Label htmlFor="start">Mulai</Label>
                            <Input
                              id="start"
                              type="datetime-local"
                              value={startDatetime}
                              onChange={(e) => setStartDatetime(e.target.value)}
                            />
                          </div>
                          <div className="grid gap-2">
                            <Label htmlFor="end">Selesai</Label>
                            <Input
                              id="end"
                              type="datetime-local"
                              value={endDatetime}
                              onChange={(e) => setEndDatetime(e.target.value)}
                            />
                          </div>
                          <div className="grid gap-2">
                            <Label htmlFor="notes">Catatan</Label>
                            <Textarea
                              id="notes"
                              value={notes}
                              onChange={(e) => setNotes(e.target.value)}
                              placeholder="Untuk event apa..."
                            />
                          </div>
                        </div>
                        <DialogFooter>
                          <Button
                            onClick={handleCheckout}
                            disabled={checkoutBusy}
                          >
                            {checkoutBusy ? (
                              <Loader2 className="w-4 h-4 animate-spin mr-2" />
                            ) : null}
                            Buat Booking
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                    <Button
                      variant="outline"
                      className="w-full rounded-lg mt-3"
                      onClick={clearCart}
                      disabled={
                        cartLoading ||
                        cart.length === 0 ||
                        cartBusy === "clear-all"
                      }
                    >
                      {cartBusy === "clear-all" ? (
                        <Loader2 className="w-4 h-4 animate-spin mr-2" />
                      ) : (
                        <Trash className="w-4 h-4 mr-2" />
                      )}
                      Kosongkan Keranjang
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>
        {/* === BOOKING === */}
        <TabsContent value="booking" className="space-y-5">
          {bookingsLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <Loader2 className="w-8 h-8 animate-spin mx-auto text-gray-400" />
                <p className="text-gray-600 mt-2">Memuat data booking...</p>
              </div>
            </div>
          ) : bookings.length === 0 ? (
            <EmptyState
              text="Belum ada booking"
              hint={
                <div className="mt-2">
                  <p className="text-sm">
                    Tambahkan item ke keranjang dan lakukan checkout
                  </p>
                  <Button
                    className="mt-4 rounded-lg"
                    onClick={() => setTab("katalog")}
                  >
                    <ShoppingCart className="w-4 h-4 mr-2" />
                    Mulai Berbelanja
                  </Button>
                </div>
              }
            />
          ) : (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-900">
                  Daftar Booking
                </h2>
                <Badge variant="outline" className="rounded-md">
                  Total: {bookings.length} booking
                </Badge>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {bookings.map((b) => {
                  const isBusy = bookingsBusy === `cancel-${b.id}`;
                  const total = b.items.reduce(
                    (sum, i) => sum + Number(i.price) * i.qty,
                    0
                  );
                  const isPending = b.status === "MENUNGGU";
                  const isApproved = b.status === "DISETUJUI";
                  const isRejected =
                    b.status === "DITOLAK" || b.status === "DIBATALKAN";

                  return (
                    <Card
                      key={b.id}
                      className="rounded-2xl overflow-hidden hover:shadow-lg transition-shadow"
                    >
                      <CardHeader className="pb-4">
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <CardTitle className="text-lg flex items-center gap-2">
                              Booking #{b.id.slice(0, 8)}
                              {isPending && (
                                <Clock3 className="w-4 h-4 text-amber-500" />
                              )}
                              {isApproved && (
                                <CheckCircle2 className="w-4 h-4 text-green-500" />
                              )}
                              {isRejected && (
                                <XCircle className="w-4 h-4 text-red-500" />
                              )}
                            </CardTitle>
                            <CardDescription className="text-xs">
                              Dibuat:{" "}
                              {new Date(b.createdAt).toLocaleDateString(
                                "id-ID"
                              )}
                            </CardDescription>
                          </div>
                          <Badge
                            variant={
                              isPending
                                ? "outline"
                                : isApproved
                                ? "secondary"
                                : "destructive"
                            }
                            className="rounded-md capitalize"
                          >
                            {b.status.toLowerCase()}
                          </Badge>
                        </div>

                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-gray-500">Mulai:</span>
                            <span className="font-medium">
                              {new Date(b.startDatetime).toLocaleString(
                                "id-ID"
                              )}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-500">Selesai:</span>
                            <span className="font-medium">
                              {new Date(b.endDatetime).toLocaleString("id-ID")}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-500">Total:</span>
                            <span className="font-bold text-blue-600">
                              {formatCurrency(total)}
                            </span>
                          </div>
                        </div>

                        {b.notes && (
                          <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                            <p className="text-xs text-gray-600">
                              <span className="font-medium">Catatan:</span>{" "}
                              {b.notes}
                            </p>
                          </div>
                        )}
                      </CardHeader>

                      <CardContent className="space-y-4">
                        <div className="space-y-3">
                          <h4 className="font-medium text-sm text-gray-700">
                            Item Booking:
                          </h4>
                          {b.items.map((item, index) => (
                            <div
                              key={item.id}
                              className="flex justify-between items-center py-2 border-b last:border-b-0"
                            >
                              <div className="flex-1">
                                <p className="font-medium text-sm">
                                  {item.asset?.name || item.service?.name}
                                </p>
                                <p className="text-xs text-gray-500">
                                  {item.qty} ×{" "}
                                  {formatCurrency(Number(item.price))}
                                </p>
                              </div>
                              <p className="font-semibold text-sm">
                                {formatCurrency(Number(item.price) * item.qty)}
                              </p>
                            </div>
                          ))}
                        </div>

                        {isPending && (
                          <Button
                            variant="destructive"
                            className="w-full rounded-lg"
                            onClick={() => cancelBooking(b.id)}
                            disabled={isBusy}
                            size="sm"
                          >
                            {isBusy ? (
                              <Loader2 className="w-4 h-4 animate-spin mr-2" />
                            ) : (
                              <XCircle className="w-4 h-4 mr-2" />
                            )}
                            Batalkan Booking
                          </Button>
                        )}

                        {isApproved && (
                          <div className="p-3 bg-green-50 rounded-lg">
                            <p className="text-xs text-green-700 text-center">
                              ✅ Booking telah disetujui pada{" "}
                              {b.approvedAt
                                ? new Date(b.approvedAt).toLocaleDateString(
                                    "id-ID"
                                  )
                                : "tanggal tidak tersedia"}
                            </p>
                          </div>
                        )}

                        {isRejected && (
                          <div className="p-3 bg-red-50 rounded-lg">
                            <p className="text-xs text-red-700 text-center">
                              ❌ Booking {b.status.toLowerCase()}
                            </p>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

/* ================== KOMPONEN ================== */

function GridAssets({
  assets,
  onAdd,
  busyKey,
}: {
  assets: Asset[];
  onAdd: (id: string) => void;
  busyKey: string | null;
}) {
  if (!assets.length)
    return (
      <EmptyState
        text="Tidak ada aset yang cocok dengan filter."
        hint="Coba ubah kata kunci atau kategori."
      />
    );
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
      {assets.map((a) => {
        const isBusy = busyKey === `add-aset-${a.id}`;
        return (
          <Card key={a.id} className="overflow-hidden rounded-2xl">
            <div className="relative h-40 w-full bg-gray-50">
              {a.photoUrl ? (
                <Image
                  src={a.photoUrl}
                  alt={a.name}
                  fill
                  className="object-cover"
                />
              ) : (
                <div className="h-full w-full bg-gradient-to-br from-indigo-50 to-violet-50 grid place-items-center">
                  <Boxes className="w-8 h-8 text-indigo-400" />
                </div>
              )}
            </div>
            <CardHeader className="pb-2">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <CardTitle className="text-base">{a.name}</CardTitle>
                  <CardDescription className="font-mono text-xs">
                    #{a.code}
                  </CardDescription>
                </div>
                <Badge variant="secondary" className="rounded-lg">
                  Stok: {a.stock}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Tarif harian</p>
                <p className="text-lg font-semibold">
                  {formatCurrency(Number(a.dailyRate || 0))}
                </p>
              </div>
              <div className="flex gap-2">
                <Button
                  asChild
                  variant="outline"
                  size="sm"
                  className="rounded-lg"
                >
                  <Link href={`/sewa/assets/${a.id}`}>
                    <Info className="w-4 h-4 mr-1" />
                    Detail
                  </Link>
                </Button>
                <Button
                  size="sm"
                  className="rounded-lg"
                  onClick={() => onAdd(a.id)}
                  disabled={isBusy}
                >
                  {isBusy ? (
                    <Loader2 className="w-4 h-4 animate-spin mr-1" />
                  ) : (
                    <ShoppingCart className="w-4 h-4 mr-1" />
                  )}
                  Keranjang
                </Button>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

function GridServices({
  services,
  onAdd,
  busyKey,
}: {
  services: Service[];
  onAdd: (id: string) => void;
  busyKey: string | null;
}) {
  if (!services.length)
    return (
      <EmptyState
        text="Tidak ada jasa yang cocok dengan filter."
        hint="Coba ubah kata kunci atau kategori."
      />
    );
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
      {services.map((s) => {
        const isBusy = busyKey === `add-jasa-${s.id}`;
        return (
          <Card key={s.id} className="overflow-hidden rounded-2xl">
            <div className="relative h-40 w-full bg-gray-50">
              {s.photoUrl ? (
                <Image
                  src={s.photoUrl}
                  alt={s.name}
                  fill
                  className="object-cover"
                />
              ) : (
                <div className="h-full w-full bg-gradient-to-br from-indigo-50 to-violet-50 grid place-items-center">
                  <Wrench className="w-8 h-8 text-violet-400" />
                </div>
              )}
            </div>
            <CardHeader className="pb-2">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <CardTitle className="text-base">{s.name}</CardTitle>
                  <CardDescription className="font-mono text-xs">
                    #{s.code}
                  </CardDescription>
                </div>
                <Badge
                  variant={s.isActive ? "secondary" : "outline"}
                  className="rounded-lg"
                >
                  {s.isActive ? "Aktif" : "Nonaktif"}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Tarif</p>
                <p className="text-lg font-semibold">
                  {formatCurrency(Number(s.unitRate || 0))}
                </p>
              </div>
              <div className="flex gap-2">
                <Button
                  asChild
                  variant="outline"
                  size="sm"
                  className="rounded-lg"
                >
                  <Link href={`/sewa/services/${s.id}`}>
                    <Info className="w-4 h-4 mr-1" />
                    Detail
                  </Link>
                </Button>
                <Button
                  size="sm"
                  className="rounded-lg"
                  onClick={() => onAdd(s.id)}
                  disabled={isBusy}
                >
                  {isBusy ? (
                    <Loader2 className="w-4 h-4 animate-spin mr-1" />
                  ) : (
                    <ShoppingCart className="w-4 h-4 mr-1" />
                  )}
                  Keranjang
                </Button>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

function CartSection({
  title,
  items,
  onRemove,
  onQty,
  onDetail,
  busyKey,
}: {
  title: React.ReactNode;
  items: CartItem[];
  onRemove: (kind: Kind, cartId: string) => void;
  onQty: (kind: Kind, cartId: string, qty: number) => void;
  onDetail: (kind: Kind, cartId: string) => void;
  busyKey: string | null;
}) {
  return (
    <Card className="rounded-2xl">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">{title}</CardTitle>
        <CardDescription>{items.length} item</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {items.map((i) => {
          const isQtyBusy = busyKey === `qty-${i.id}`;
          const isDelBusy = busyKey === `del-${i.id}`;
          return (
            <div key={i.id} className="border rounded-xl p-4">
              <div className="flex items-center gap-4">
                <div className="relative w-20 h-20 rounded-lg overflow-hidden bg-gray-50 shrink-0">
                  {i.photoUrl ? (
                    <Image
                      src={i.photoUrl}
                      alt={i.name}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="w-full h-full grid place-items-center bg-gradient-to-br from-indigo-50 to-violet-50">
                      {i.kind === "aset" ? (
                        <Boxes className="w-6 h-6 text-indigo-400" />
                      ) : (
                        <Wrench className="w-6 h-6 text-violet-400" />
                      )}
                    </div>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-3">
                    <div className="truncate">
                      <p className="font-medium truncate">{i.name}</p>
                      <p className="text-xs text-gray-500 font-mono truncate">
                        #{i.code} • {i.kind.toUpperCase()}
                      </p>
                    </div>

                    <div className="text-right">
                      <p className="text-sm text-gray-500">Harga</p>
                      <p className="font-semibold">
                        {formatCurrency(i.unitPrice)}
                      </p>
                    </div>
                  </div>

                  <div className="mt-3 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="icon"
                        className="rounded-md h-8 w-8"
                        onClick={() => onQty(i.kind, i.id, i.qty - 1)}
                        disabled={isQtyBusy || i.qty <= 1}
                      >
                        {isQtyBusy ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Minus className="w-4 h-4" />
                        )}
                      </Button>
                      <span className="w-10 text-center font-medium">
                        {i.qty}
                      </span>
                      <Button
                        variant="outline"
                        size="icon"
                        className="rounded-md h-8 w-8"
                        onClick={() => onQty(i.kind, i.id, i.qty + 1)}
                        disabled={isQtyBusy}
                      >
                        {isQtyBusy ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Plus className="w-4 h-4" />
                        )}
                      </Button>
                    </div>

                    <div className="text-right">
                      <p className="text-sm text-gray-500">Subtotal</p>
                      <p className="font-semibold">
                        {formatCurrency(i.unitPrice * i.qty)}
                      </p>
                    </div>
                  </div>

                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="rounded-md"
                      onClick={() => onDetail(i.kind, i.id)}
                    >
                      <Info className="w-4 h-4 mr-1" /> Detail
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="rounded-md text-red-600 hover:text-red-700"
                      onClick={() => onRemove(i.kind, i.id)}
                      disabled={isDelBusy}
                    >
                      {isDelBusy ? (
                        <Loader2 className="w-4 h-4 animate-spin mr-1" />
                      ) : (
                        <Trash2 className="w-4 h-4 mr-1" />
                      )}
                      Hapus
                    </Button>
                  </div>

                  {i._showDetail && (
                    <div className="mt-3 rounded-lg bg-gray-50 p-3 text-sm text-gray-700">
                      <DetailBlock item={i} />
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}

function DetailBlock({ item }: { item: CartItem }) {
  return (
    <div className="space-y-1">
      <p>
        <span className="text-gray-500">Nama:</span> {item.name}
      </p>
      <p>
        <span className="text-gray-500">Kode:</span> {item.code}
      </p>
      <p>
        <span className="text-gray-500">Jenis:</span> {item.kind.toUpperCase()}
      </p>
      <p>
        <span className="text-gray-500">Harga Satuan:</span>{" "}
        {formatCurrency(item.unitPrice)}
      </p>
      {item.extra?.categoryName && (
        <p>
          <span className="text-gray-500">Kategori:</span>{" "}
          {item.extra.categoryName}
        </p>
      )}
      {item.extra?.description && (
        <p className="text-gray-600">
          <span className="text-gray-500">Deskripsi:</span>{" "}
          {item.extra.description}
        </p>
      )}
    </div>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-gray-600">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}

function EmptyState({ text, hint }: { text: string; hint?: React.ReactNode }) {
  return (
    <div className="rounded-2xl border p-10 text-center text-gray-600">
      <p className="font-medium">{text}</p>
      {hint && <p className="text-sm text-gray-500 mt-1">{hint}</p>}
    </div>
  );
}
