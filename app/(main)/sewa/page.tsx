"use client"

import Link from "next/link"
import Image from "next/image"
import { useEffect, useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { formatCurrency } from "@/lib/format"
import { mockAssets, mockServices, mockCategories } from "@/lib/mock"
import { ShoppingCart, Info, Boxes, Wrench, Trash2, Minus, Plus, CheckCircle2, Clock3 } from "lucide-react"

type Asset = {
  id: string
  code: string
  name: string
  photoUrl?: string | null
  dailyRate: number | string
  stock: number
  categoryId?: string | null
  categoryName?: string | null
}

type Service = {
  id: string
  code: string
  name: string
  description?: string | null
  unitRate: number | string
  isActive: boolean
  photoUrl?: string | null
  categoryId?: string | null
  categoryName?: string | null
}

type Category = {
  id: string
  name: string
}

type Kind = "aset" | "jasa"
type ApprovalStatus = "PENDING_APPROVAL" | "APPROVED" | "REJECTED"

type CartItem = {
  kind: Kind
  id: string
  qty: number
  name: string
  code: string
  photoUrl?: string | null
  unitPrice: number
  status: ApprovalStatus
  extra?: { description?: string | null; categoryName?: string | null }
  _showDetail?: boolean
}

const STORAGE_KEY = "cart-state-v1"

export default function PemesananPage() {
  const { toast } = useToast()
  const [tab, setTab] = useState<"katalog" | "keranjang">("katalog")
  const [katalogTab, setKatalogTab] = useState<"aset" | "jasa">("aset")
  const [search, setSearch] = useState("")
  const [category, setCategory] = useState<string>("all")
  const [cart, setCart] = useState<CartItem[]>([])

  // Hydrate cart
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (raw) setCart(JSON.parse(raw))
    } catch {}
  }, [])
  // Persist cart
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(cart))
    } catch {}
  }, [cart])

  // ---- Derive categories ----
  const categories: Category[] = useMemo(() => {
    const base: Category[] =
      (mockCategories as Category[] | undefined) ??
      Array.from(
        new Map(
          [
            ...(mockAssets as Asset[]).map((a) => [a.categoryId ?? a.categoryName ?? "uncat", a.categoryName ?? "Umum"]),
            ...(mockServices as Service[]).map((s) => [s.categoryId ?? s.categoryName ?? "uncat", s.categoryName ?? "Umum"]),
          ].filter(Boolean) as [string, string][],
        ).entries(),
      ).map(([id, name]) => ({ id, name }))
    return base.length ? base : [{ id: "uncat", name: "Umum" }]
  }, [])

  // ---- Filtered datasets ----
  const filteredAssets = useMemo(() => {
    return (mockAssets as Asset[])
      .filter((a) =>
        category === "all"
          ? true
          : a.categoryId === category || (a.categoryName && a.categoryName === categories.find((c) => c.id === category)?.name),
      )
      .filter((a) => {
        const q = search.trim().toLowerCase()
        if (!q) return true
        return (
          a.name.toLowerCase().includes(q) ||
          a.code.toLowerCase().includes(q) ||
          (a.categoryName ?? "").toLowerCase().includes(q)
        )
      })
  }, [category, search, categories])

  const filteredServices = useMemo(() => {
    return (mockServices as Service[])
      .filter((s) =>
        category === "all"
          ? true
          : s.categoryId === category || (s.categoryName && s.categoryName === categories.find((c) => c.id === category)?.name),
      )
      .filter((s) => {
        const q = search.trim().toLowerCase()
        if (!q) return true
        return (
          s.name.toLowerCase().includes(q) ||
          s.code.toLowerCase().includes(q) ||
          (s.categoryName ?? "").toLowerCase().includes(q) ||
          (s.description ?? "").toLowerCase().includes(q)
        )
      })
  }, [category, search, categories])

  // ---- Cart helpers ----
  function inCart(kind: Kind, id: string) {
    return cart.find((i) => i.kind === kind && i.id === id)
  }

  function addToCart(kind: Kind, id: string, qty = 1) {
    if (inCart(kind, id)) {
      setCart((prev) =>
        prev.map((i) => (i.kind === kind && i.id === id ? { ...i, qty: i.qty + qty } : i)),
      )
      toast({ title: "Keranjang diperbarui", description: "Jumlah item ditambah." })
      setTab("keranjang")
      return
    }

    if (kind === "aset") {
      const a = (mockAssets as Asset[]).find((x) => x.id === id)
      if (!a) return
      const item: CartItem = {
        kind,
        id,
        qty,
        name: a.name,
        code: a.code,
        photoUrl: a.photoUrl ?? null,
        unitPrice: Number(a.dailyRate || 0),
        status: "PENDING_APPROVAL", // aset butuh persetujuan
        extra: { categoryName: a.categoryName ?? undefined },
      }
      setCart((p) => [item, ...p])
    } else {
      const s = (mockServices as Service[]).find((x) => x.id === id)
      if (!s) return
      const item: CartItem = {
        kind,
        id,
        qty,
        name: s.name,
        code: s.code,
        photoUrl: s.photoUrl ?? null,
        unitPrice: Number(s.unitRate || 0),
        status: "APPROVED", // jasa langsung bisa dibayar
        extra: { description: s.description ?? undefined, categoryName: s.categoryName ?? undefined },
      }
      setCart((p) => [item, ...p])
    }
    toast({ title: "Ditambahkan ke keranjang", description: `${kind === "aset" ? "Aset" : "Jasa"} #${id.slice(-6)} ditambahkan.` })
    setTab("keranjang")
  }

  function removeItem(kind: Kind, id: string) {
    setCart((prev) => prev.filter((i) => !(i.kind === kind && i.id === id)))
  }

  function setQty(kind: Kind, id: string, qty: number) {
    setCart((prev) =>
      prev.map((i) => (i.kind === kind && i.id === id ? { ...i, qty: Math.max(1, qty) } : i)),
    )
  }

  function toggleDetail(kind: Kind, id: string) {
    setCart((prev) =>
      prev.map((i) => (i.kind === kind && i.id === id ? { ...i, _showDetail: !i._showDetail } : i)),
    )
  }

  function simulateApproval(kind: Kind, id: string, next: ApprovalStatus) {
    setCart((prev) => prev.map((i) => (i.kind === kind && i.id === id ? { ...i, status: next } : i)))
    toast({ title: "Status diperbarui", description: `Item #${id.slice(-6)} sekarang ${next === "APPROVED" ? "Disetujui" : next === "REJECTED" ? "Ditolak" : "Menunggu"}.` })
  }

  const approved = cart.filter((i) => i.status === "APPROVED")
  const pending = cart.filter((i) => i.status === "PENDING_APPROVAL")
  const rejected = cart.filter((i) => i.status === "REJECTED")

  const totalApproved = approved.reduce((sum, i) => sum + i.unitPrice * i.qty, 0)

  function payNow() {
    if (!approved.length) return
    // Di real app: redirect ke /checkout atau panggil payment intent
    toast({
      title: "Pembayaran diproses",
      description: `Total ${formatCurrency(totalApproved)} untuk ${approved.length} item.`,
    })
    // contoh: kosongkan item APPROVED setelah "bayar"
    setCart((prev) => prev.filter((i) => i.status !== "APPROVED"))
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Pemesanan Aset & Jasa</h1>
          <p className="text-gray-600 mt-2">Cari item → masukkan ke keranjang → bayar (yang sudah disetujui).</p>
        </div>
      </div>

      <Tabs value={tab} onValueChange={(v) => setTab(v as any)} className="space-y-4">
        <TabsList className="rounded-xl">
          <TabsTrigger value="katalog" className="rounded-lg">Katalog</TabsTrigger>
          <TabsTrigger value="keranjang" className="rounded-lg">
            Keranjang
            {cart.length ? (
              <Badge variant="secondary" className="ml-2 rounded-md">{cart.length}</Badge>
            ) : null}
          </TabsTrigger>
        </TabsList>

        {/* === KATALOG === */}
        <TabsContent value="katalog" className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="md:col-span-2">
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Cari nama, kode, atau kategori…"
                className="rounded-xl"
              />
            </div>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger className="rounded-xl">
                <SelectValue placeholder="Pilih kategori" />
              </SelectTrigger>
              <SelectContent className="rounded-xl">
                <SelectItem value="all" className="rounded-lg">Semua Kategori</SelectItem>
                {categories.map((c) => (
                  <SelectItem key={c.id} value={c.id} className="rounded-lg">
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <div className="md:col-span-3 -mt-1">
              <Tabs value={katalogTab} onValueChange={(v) => setKatalogTab(v as any)} className="space-y-4">
                <TabsList className="rounded-xl">
                  <TabsTrigger value="aset" className="rounded-lg">
                    <Boxes className="w-4 h-4 mr-2" /> Aset
                  </TabsTrigger>
                  <TabsTrigger value="jasa" className="rounded-lg">
                    <Wrench className="w-4 h-4 mr-2" /> Jasa
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="aset">
                  <GridAssets assets={filteredAssets} onAdd={(id) => addToCart("aset", id)} />
                </TabsContent>

                <TabsContent value="jasa">
                  <GridServices services={filteredServices} onAdd={(id) => addToCart("jasa", id)} />
                </TabsContent>
              </Tabs>
            </div>
          </div>
        </TabsContent>

        {/* === KERANJANG & PEMBAYARAN === */}
        <TabsContent value="keranjang" className="space-y-5">
          {cart.length === 0 ? (
            <EmptyState
              text="Keranjang masih kosong."
              hint={
                <>
                  Buka tab <strong>Katalog</strong> lalu klik <strong>Keranjang</strong> pada item untuk menambahkan.
                </>
              }
            />
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* List items */}
              <div className="lg:col-span-2 space-y-6">
                {!!pending.length && (
                  <CartSection
                    title={
                      <span className="inline-flex items-center gap-2">
                        <Clock3 className="w-4 h-4" /> Menunggu Persetujuan
                      </span>
                    }
                    items={pending}
                    onRemove={removeItem}
                    onQty={setQty}
                    onDetail={toggleDetail}
                    onStatus={simulateApproval}
                    showStatusActions
                  />
                )}

                {!!approved.length && (
                  <CartSection
                    title={
                      <span className="inline-flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4" /> Siap Dibayar
                      </span>
                    }
                    items={approved}
                    onRemove={removeItem}
                    onQty={setQty}
                    onDetail={toggleDetail}
                  />
                )}

                {!!rejected.length && (
                  <CartSection
                    title="Ditolak"
                    items={rejected}
                    onRemove={removeItem}
                    onQty={setQty}
                    onDetail={toggleDetail}
                  />
                )}
              </div>

              {/* Ringkasan pembayaran */}
              <Card className="rounded-2xl h-fit sticky top-6">
                <CardHeader>
                  <CardTitle>Ringkasan Pembayaran</CardTitle>
                  <CardDescription>Hanya item yang disetujui dapat dibayar.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <SummaryRow label="Jumlah item disetujui" value={`${approved.length} item`} />
                  <SummaryRow
                    label="Subtotal (disetujui)"
                    value={formatCurrency(totalApproved)}
                  />
                  <div className="pt-2">
                    <Button
                      className="w-full rounded-lg"
                      onClick={payNow}
                      disabled={approved.length === 0}
                    >
                      Bayar Sekarang
                    </Button>
                    {approved.length === 0 && (
                      <p className="text-xs text-gray-500 mt-2">
                        Belum ada item disetujui. Tunggu persetujuan atau tambah jasa (biasanya langsung disetujui).
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}

/* ================== KOMPONEN ================== */

function GridAssets({ assets, onAdd }: { assets: Asset[]; onAdd: (id: string) => void }) {
  if (!assets.length) return <EmptyState text="Tidak ada aset yang cocok dengan filter." hint="Coba ubah kata kunci atau kategori." />
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
      {assets.map((a) => (
        <Card key={a.id} className="overflow-hidden rounded-2xl">
          <div className="relative h-40 w-full bg-gray-50">
            {a.photoUrl ? (
              <Image src={a.photoUrl} alt={a.name} fill className="object-cover" />
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
                <CardDescription className="font-mono text-xs">#{a.code}</CardDescription>
              </div>
              <Badge variant="secondary" className="rounded-lg">
                Stok: {a.stock}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Tarif harian</p>
              <p className="text-lg font-semibold">{formatCurrency(Number(a.dailyRate || 0))}</p>
            </div>
            <div className="flex gap-2">
              <Button asChild variant="outline" size="sm" className="rounded-lg">
                <Link href={`/assets/${a.id}`}>
                  <Info className="w-4 h-4 mr-1" />
                  Detail
                </Link>
              </Button>
              <Button size="sm" className="rounded-lg" onClick={() => onAdd(a.id)}>
                <ShoppingCart className="w-4 h-4 mr-1" />
                Keranjang
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

function GridServices({ services, onAdd }: { services: Service[]; onAdd: (id: string) => void }) {
  if (!services.length) return <EmptyState text="Tidak ada jasa yang cocok dengan filter." hint="Coba ubah kata kunci atau kategori." />
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
      {services.map((s) => (
        <Card key={s.id} className="overflow-hidden rounded-2xl">
          <div className="relative h-40 w-full bg-gray-50">
            {s.photoUrl ? (
              <Image src={s.photoUrl} alt={s.name} fill className="object-cover" />
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
                <CardDescription className="font-mono text-xs">#{s.code}</CardDescription>
              </div>
              <Badge variant={s.isActive ? "secondary" : "outline"} className="rounded-lg">
                {s.isActive ? "Aktif" : "Nonaktif"}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Tarif</p>
              <p className="text-lg font-semibold">{formatCurrency(Number(s.unitRate || 0))}</p>
            </div>
            <div className="flex gap-2">
              <Button asChild variant="outline" size="sm" className="rounded-lg">
                <Link href={`/services/${s.id}`}>
                  <Info className="w-4 h-4 mr-1" />
                  Detail
                </Link>
              </Button>
              <Button size="sm" className="rounded-lg" onClick={() => onAdd(s.id)}>
                <ShoppingCart className="w-4 h-4 mr-1" />
                Keranjang
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

function CartSection({
  title,
  items,
  onRemove,
  onQty,
  onDetail,
  onStatus,
  showStatusActions = false,
}: {
  title: React.ReactNode
  items: CartItem[]
  onRemove: (kind: Kind, id: string) => void
  onQty: (kind: Kind, id: string, qty: number) => void
  onDetail: (kind: Kind, id: string) => void
  onStatus?: (kind: Kind, id: string, status: ApprovalStatus) => void
  showStatusActions?: boolean
}) {
  return (
    <Card className="rounded-2xl">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">{title}</CardTitle>
        <CardDescription>{items.length} item</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {items.map((i) => (
          <div key={`${i.kind}-${i.id}`} className="border rounded-xl p-4">
            <div className="flex items-center gap-4">
              <div className="relative w-20 h-20 rounded-lg overflow-hidden bg-gray-50 shrink-0">
                {i.photoUrl ? (
                  <Image src={i.photoUrl} alt={i.name} fill className="object-cover" />
                ) : (
                  <div className="w-full h-full grid place-items-center bg-gradient-to-br from-indigo-50 to-violet-50">
                    {i.kind === "aset" ? <Boxes className="w-6 h-6 text-indigo-400" /> : <Wrench className="w-6 h-6 text-violet-400" />}
                  </div>
                )}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-3">
                  <div className="truncate">
                    <p className="font-medium truncate">{i.name}</p>
                    <p className="text-xs text-gray-500 font-mono truncate">#{i.code} • {i.kind.toUpperCase()}</p>
                    <div className="mt-1">
                      <Badge variant={i.status === "APPROVED" ? "secondary" : i.status === "REJECTED" ? "destructive" : "outline"} className="rounded-md">
                        {i.status === "APPROVED" ? "Disetujui" : i.status === "REJECTED" ? "Ditolak" : "Menunggu"}
                      </Badge>
                    </div>
                  </div>

                  <div className="text-right">
                    <p className="text-sm text-gray-500">Harga</p>
                    <p className="font-semibold">{formatCurrency(i.unitPrice)}</p>
                  </div>
                </div>

                <div className="mt-3 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="icon" className="rounded-md h-8 w-8" onClick={() => onQty(i.kind, i.id, i.qty - 1)}>
                      <Minus className="w-4 h-4" />
                    </Button>
                    <span className="w-10 text-center font-medium">{i.qty}</span>
                    <Button variant="outline" size="icon" className="rounded-md h-8 w-8" onClick={() => onQty(i.kind, i.id, i.qty + 1)}>
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>

                  <div className="text-right">
                    <p className="text-sm text-gray-500">Subtotal</p>
                    <p className="font-semibold">{formatCurrency(i.unitPrice * i.qty)}</p>
                  </div>
                </div>

                <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" className="rounded-md" onClick={() => onDetail(i.kind, i.id)}>
                      <Info className="w-4 h-4 mr-1" /> Detail
                    </Button>
                    <Button variant="outline" size="sm" className="rounded-md text-red-600 hover:text-red-700" onClick={() => onRemove(i.kind, i.id)}>
                      <Trash2 className="w-4 h-4 mr-1" /> Hapus
                    </Button>
                  </div>

                  {showStatusActions && onStatus && (
                    <div className="flex gap-2">
                      <Button size="sm" className="rounded-md" onClick={() => onStatus(i.kind, i.id, "APPROVED")}>Setujui</Button>
                      <Button size="sm" variant="outline" className="rounded-md" onClick={() => onStatus(i.kind, i.id, "PENDING_APPROVAL")}>Tunda</Button>
                      <Button size="sm" variant="destructive" className="rounded-md" onClick={() => onStatus(i.kind, i.id, "REJECTED")}>Tolak</Button>
                    </div>
                  )}
                </div>

                {i._showDetail && (
                  <div className="mt-3 rounded-lg bg-gray-50 p-3 text-sm text-gray-700">
                    <DetailBlock item={i} />
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}

function DetailBlock({ item }: { item: CartItem }) {
  return (
    <div className="space-y-1">
      <p><span className="text-gray-500">Nama:</span> {item.name}</p>
      <p><span className="text-gray-500">Kode:</span> {item.code}</p>
      <p><span className="text-gray-500">Jenis:</span> {item.kind.toUpperCase()}</p>
      <p><span className="text-gray-500">Harga Satuan:</span> {formatCurrency(item.unitPrice)}</p>
      {item.extra?.categoryName && <p><span className="text-gray-500">Kategori:</span> {item.extra.categoryName}</p>}
      {item.extra?.description && (
        <p className="text-gray-600"><span className="text-gray-500">Deskripsi:</span> {item.extra.description}</p>
      )}
      <div className="pt-1">
        {item.kind === "aset" ? (
          <p className="text-xs text-amber-600">Catatan: Aset memerlukan persetujuan pengelola sebelum dapat dibayar.</p>
        ) : (
          <p className="text-xs text-emerald-600">Jasa umumnya langsung dapat dibayar.</p>
        )}
      </div>
    </div>
  )
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-gray-600">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  )
}

function EmptyState({ text, hint }: { text: string; hint?: React.ReactNode }) {
  return (
    <div className="rounded-2xl border p-10 text-center text-gray-600">
      <p className="font-medium">{text}</p>
      {hint && <p className="text-sm text-gray-500 mt-1">{hint}</p>}
    </div>
  )
}
