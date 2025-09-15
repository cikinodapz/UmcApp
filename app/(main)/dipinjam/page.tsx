"use client"

import Image from "next/image"
import Link from "next/link"
import { useEffect, useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
// ⬇️ hanya Tabs, TabsList, TabsTrigger (tanpa TabsContent)
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { formatCurrency } from "@/lib/format"
import {
  Boxes,
  Wrench,
  Info,
  Undo2,
  CalendarClock,
  CalendarRange,
  Clock3,
  ArrowRightLeft,
  Search,
} from "lucide-react"

// === tarik dummy dari mock.ts
import {
  mockBookings,
  mockBookingItems,
  mockAssets,
  mockServices,
  mockReturns,
} from "@/lib/mock"

type Kind = "aset" | "jasa"
type LoanStatus = "ONGOING" | "OVERDUE" | "RETURNED"

type LoanItem = {
  kind: Kind
  id: string
  code: string
  name: string
  photoUrl?: string | null
  qty: number
  unitPrice: number
  startDate: string
  dueDate: string
  returnedAt?: string | null
  status: LoanStatus
  notes?: string | null
  _showDetail?: boolean
}

const STORAGE_KEY = "loans-state-v1"

export default function PeminjamanAktifPage() {
  const { toast } = useToast()
  const [tab, setTab] = useState<"semua" | "aset" | "jasa">("semua")
  const [statusFilter, setStatusFilter] = useState<"all" | LoanStatus>("all")
  const [q, setQ] = useState("")
  const [items, setItems] = useState<LoanItem[]>([])

  function buildItemsFromMocks(): LoanItem[] {
    const assetById = new Map(mockAssets.map(a => [a.id, a]))
    const serviceById = new Map(mockServices.map(s => [s.id, s]))
    const returnsByItemId = new Map(mockReturns.map(r => [r.bookingItemId, r]))
    const now = new Date()

    const list: LoanItem[] = []

    for (const bi of mockBookingItems) {
      const bk = mockBookings.find(b => b.id === bi.bookingId)
      if (!bk) continue

      const isAsset = !!bi.assetId
      const catalog = isAsset ? assetById.get(bi.assetId!) : serviceById.get(bi.serviceId!)
      if (!catalog) continue

      const ret = returnsByItemId.get(bi.id)
      const due = new Date(bk.endDatetime)
      const status: LoanStatus = ret ? "RETURNED" : (now > due ? "OVERDUE" : "ONGOING")

      list.push({
        kind: isAsset ? "aset" : "jasa",
        id: bi.id,
        code: (catalog as any).code,
        name: (catalog as any).name,
        photoUrl: isAsset ? (catalog as any).photoUrl ?? null : null,
        qty: bi.qty,
        unitPrice: bi.price,
        startDate: bk.startDatetime,
        dueDate: bk.endDatetime,
        returnedAt: ret?.returnedAt ?? null,
        status,
        notes: bk.notes ?? null,
      })
    }

    return list.sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime())
  }

  // Hydrate dari localStorage, fallback seed dari mock.ts
  useEffect(() => {
    let ok = false
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (raw) {
        const parsed = JSON.parse(raw)
        if (Array.isArray(parsed) && parsed.length > 0) {
          setItems(parsed)
          ok = true
        }
      }
    } catch {}

    if (!ok) {
      const seeded = buildItemsFromMocks()
      setItems(seeded)
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(seeded)) } catch {}
    }
  }, [])

  // Persist
  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(items)) } catch {}
  }, [items])

  // Update status overdue saat mount
  useEffect(() => {
    const now = Date.now()
    setItems(prev =>
      prev.map(i => {
        if (i.status === "RETURNED") return i
        const due = new Date(i.dueDate).getTime()
        const next: LoanStatus = now > due ? "OVERDUE" : "ONGOING"
        return next === i.status ? i : { ...i, status: next }
      }),
    )
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Derived: filter & search
  const visible = useMemo(() => {
    const text = q.trim().toLowerCase()
    return items
      .filter(i => (tab === "semua" ? true : i.kind === tab))
      .filter(i => (statusFilter === "all" ? true : i.status === statusFilter))
      .filter(i =>
        !text
          ? true
          : i.name.toLowerCase().includes(text) ||
            i.code.toLowerCase().includes(text) ||
            (i.notes ?? "").toLowerCase().includes(text),
      )
      .sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime())
  }, [items, tab, statusFilter, q])

  const ongoingTotal = useMemo(
    () => visible.filter(v => v.status !== "RETURNED").reduce((s, v) => s + v.qty * v.unitPrice, 0),
    [visible],
  )

  // Actions
  function toggleDetail(id: string) {
    setItems(prev => prev.map(i => (i.id === id ? { ...i, _showDetail: !i._showDetail } : i)))
  }
  function perpanjang(id: string, hari: number) {
    setItems(prev => prev.map(i => (i.id !== id ? i : { ...i, dueDate: addDaysISO(i.dueDate, hari), status: "ONGOING" })))
  }
  function kembalikan(id: string) {
    setItems(prev => prev.map(i => (i.id !== id ? i : { ...i, status: "RETURNED", returnedAt: new Date().toISOString() })))
  }
  function resetSeed() {
    const seeded = buildItemsFromMocks()
    setItems(seeded)
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(seeded)) } catch {}
    toast({ title: "Data dummy di-reset dari mock.ts" })
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Sedang Dipinjam</h1>
          <p className="text-gray-600 mt-2">Lihat daftar pinjaman aktif, perpanjang jatuh tempo, dan proses pengembalian.</p>
        </div>
        <Button variant="outline" className="rounded-lg" onClick={resetSeed}>Muat Ulang Data Dummy</Button>
      </div>

      {/* Filter Bar */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="md:col-span-2 flex gap-2">
          <div className="relative flex-1">
            <Input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Cari nama, kode, atau catatan…"
              className="rounded-xl pl-9"
            />
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          </div>
          <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as any)}>
            <SelectTrigger className="rounded-xl min-w-[160px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent className="rounded-xl">
              <SelectItem value="all">Semua Status</SelectItem>
              <SelectItem value="ONGOING">Berjalan</SelectItem>
              <SelectItem value="OVERDUE">Terlambat</SelectItem>
              <SelectItem value="RETURNED">Dikembalikan</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Tabs hanya untuk switch filter jenis */}
        <Tabs value={tab} onValueChange={(v) => setTab(v as any)} className="md:justify-self-end">
          <TabsList className="rounded-xl">
            <TabsTrigger value="semua" className="rounded-lg">Semua</TabsTrigger>
            <TabsTrigger value="aset" className="rounded-lg"><Boxes className="w-4 h-4 mr-1" /> Aset</TabsTrigger>
            <TabsTrigger value="jasa" className="rounded-lg"><Wrench className="w-4 h-4 mr-1" /> Jasa</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* ⬇️ render konten sekali saja, ga pakai TabsContent */}
      {visible.length === 0 ? (
        <EmptyState
          text="Belum ada data sesuai filter."
          hint={<>Coba ubah kata kunci/status, atau lakukan peminjaman dari <Link href="/pemesanan" className="underline">/pemesanan</Link>.</>}
        />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* List */}
          <div className="lg:col-span-2 space-y-6">
            <Card className="rounded-2xl">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Daftar Peminjaman</CardTitle>
                <CardDescription>{visible.length} item</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {visible.map((i) => (
                  <LoanRow
                    key={i.id}
                    item={i}
                    onDetail={() => toggleDetail(i.id)}
                    onPerpanjang={(hari) => perpanjang(i.id, hari)}
                    onKembalikan={() => kembalikan(i.id)}
                  />
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Ringkasan */}
          <Card className="rounded-2xl h-fit sticky top-6">
            <CardHeader>
              <CardTitle>Ringkasan</CardTitle>
              <CardDescription>Estimasi biaya berjalan (non-returned).</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <SummaryRow label="Item Berjalan" value={`${visible.filter(v => v.status !== "RETURNED").length} item`} />
              <SummaryRow label="Estimasi Subtotal" value={formatCurrency(ongoingTotal)} />
              <div className="text-xs text-gray-500">
                *Estimasi dihitung dari <em>qty × tarif</em> (per hari/sesi) dan tidak termasuk denda telat.
              </div>
              <div className="pt-2">
                <Button asChild className="w-full rounded-lg" variant="outline">
                  <Link href="/pemesanan">Tambah Peminjaman</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}

/* ================== Komponen ================== */

function LoanRow({
  item,
  onDetail,
  onPerpanjang,
  onKembalikan,
}: {
  item: LoanItem
  onDetail: () => void
  onPerpanjang: (hari: number) => void
  onKembalikan: () => void
}) {
  const overdueDays = diffDays(item.dueDate, new Date().toISOString())
  const variant =
    item.status === "OVERDUE" ? "destructive" : item.status === "RETURNED" ? "secondary" : "outline"

  return (
    <div className="border rounded-xl p-4">
      <div className="flex items-center gap-4">
        <Thumb kind={item.kind} photoUrl={item.photoUrl} name={item.name} />

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-3">
            <div className="truncate">
              <p className="font-medium truncate">{item.name}</p>
              <p className="text-xs text-gray-500 font-mono truncate">#{item.code} • {item.kind.toUpperCase()}</p>
              <div className="mt-1 flex flex-wrap items-center gap-2">
                <Badge variant={variant as any} className="rounded-md">
                  {item.status === "OVERDUE" ? "Terlambat" : item.status === "RETURNED" ? "Dikembalikan" : "Berjalan"}
                </Badge>
                <Badge variant="outline" className="rounded-md">Qty: {item.qty}</Badge>
              </div>
            </div>

            <div className="text-right">
              <p className="text-sm text-gray-500">Tarif</p>
              <p className="font-semibold">{formatCurrency(item.unitPrice)}</p>
            </div>
          </div>

          <div className="mt-3 grid grid-cols-1 md:grid-cols-3 gap-2 text-sm">
            <Timeline label="Mulai" icon={<CalendarRange className="w-4 h-4" />} value={fmtDate(item.startDate)} />
            <Timeline
              label="Jatuh Tempo"
              icon={<CalendarClock className="w-4 h-4" />}
              value={fmtDate(item.dueDate)}
              extra={item.status === "OVERDUE" ? `Lewat ${Math.abs(overdueDays)} hari` : undefined}
            />
            <Timeline
              label="Status"
              icon={<Clock3 className="w-4 h-4" />}
              value={
                item.status === "RETURNED"
                  ? `Dikembalikan (${fmtDate(item.returnedAt!)})`
                  : item.status === "OVERDUE"
                  ? "Terlambat"
                  : "Berjalan"
              }
            />
          </div>

          <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="rounded-md" onClick={onDetail}>
                <Info className="w-4 h-4 mr-1" /> Detail
              </Button>

              {item.status !== "RETURNED" && (
                <>
                  <Button variant="outline" size="sm" className="rounded-md" onClick={() => onPerpanjang(1)}>
                    <ArrowRightLeft className="w-4 h-4 mr-1" /> Perpanjang +1 hari
                  </Button>
                  <Button variant="outline" size="sm" className="rounded-md" onClick={() => onPerpanjang(3)}>
                    <ArrowRightLeft className="w-4 h-4 mr-1" /> Perpanjang +3 hari
                  </Button>
                </>
              )}

              {item.status !== "RETURNED" && (
                <Button size="sm" className="rounded-md" onClick={onKembalikan}>
                  <Undo2 className="w-4 h-4 mr-1" /> Kembalikan
                </Button>
              )}
            </div>

            <div className="text-right">
              <p className="text-sm text-gray-500">Perkiraan Subtotal</p>
              <p className="font-semibold">{formatCurrency(item.unitPrice * item.qty)}</p>
            </div>
          </div>

          {item._showDetail && (
            <div className="mt-3 rounded-lg bg-gray-50 p-3 text-sm text-gray-700">
              <DetailBlock item={item} />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function Thumb({ kind, photoUrl, name }: { kind: Kind; photoUrl?: string | null; name: string }) {
  return (
    <div className="relative w-20 h-20 rounded-lg overflow-hidden bg-gray-50 shrink-0">
      {photoUrl ? (
        <Image src={photoUrl} alt={name} fill className="object-cover" />
      ) : (
        <div className="w-full h-full grid place-items-center bg-gradient-to-br from-indigo-50 to-violet-50">
          {kind === "aset" ? <Boxes className="w-6 h-6 text-indigo-400" /> : <Wrench className="w-6 h-6 text-violet-400" />}
        </div>
      )}
    </div>
  )
}

function Timeline({ label, icon, value, extra }: { label: string; icon: React.ReactNode; value: string; extra?: string }) {
  return (
    <div className="rounded-lg border p-2">
      <div className="flex items-center gap-2 text-gray-500">
        {icon}
        <span className="text-xs">{label}</span>
      </div>
      <div className="mt-1 text-sm font-medium">{value}</div>
      {extra && <div className="text-xs text-red-600 mt-0.5">{extra}</div>}
    </div>
  )
}

function DetailBlock({ item }: { item: LoanItem }) {
  return (
    <div className="space-y-1">
      <p><span className="text-gray-500">Nama:</span> {item.name}</p>
      <p><span className="text-gray-500">Kode:</span> {item.code}</p>
      <p><span className="text-gray-500">Jenis:</span> {item.kind.toUpperCase()}</p>
      <p><span className="text-gray-500">Qty:</span> {item.qty}</p>
      <p><span className="text-gray-500">Tarif Satuan:</span> {formatCurrency(item.unitPrice)}</p>
      <p><span className="text-gray-500">Mulai:</span> {fmtDate(item.startDate)}</p>
      <p><span className="text-gray-500">Jatuh Tempo:</span> {fmtDate(item.dueDate)}</p>
      {item.status === "RETURNED" && <p><span className="text-gray-500">Waktu Pengembalian:</span> {fmtDate(item.returnedAt!)}</p>}
      {item.notes && <p className="text-gray-600"><span className="text-gray-500">Catatan:</span> {item.notes}</p>}
      {item.status === "OVERDUE" && (
        <p className="text-xs text-amber-700">Item ini terlambat. Segera perpanjang atau kembalikan untuk menghindari denda.</p>
      )}
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

/* ================== Utils ================== */

function fmtDate(iso?: string | null) {
  if (!iso) return "-"
  const d = new Date(iso)
  return d.toLocaleString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

function addDaysISO(iso: string, days: number) {
  const d = new Date(iso)
  d.setDate(d.getDate() + days)
  return d.toISOString()
}

function diffDays(aISO: string, bISO: string) {
  const A = new Date(aISO).getTime()
  const B = new Date(bISO).getTime()
  const ms = A - B
  return Math.floor(ms / (1000 * 60 * 60 * 24))
}
