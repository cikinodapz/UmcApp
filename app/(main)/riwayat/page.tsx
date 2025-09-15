"use client"

import { useEffect, useMemo, useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { formatCurrency } from "@/lib/format"
import { CalendarCheck, Eye, Search, Star, Boxes, Wrench } from "lucide-react"

type Kind = "aset" | "jasa"
type LoanStatus = "ONGOING" | "OVERDUE" | "RETURNED"
type Condition = "BAIK" | "RUSAK_RINGAN" | "RUSAK_BERAT" | "HILANG"

type LoanItem = {
  kind: Kind
  id: string
  code: string
  name: string
  photoUrl?: string | null
  qty: number
  unitPrice: number
  startDate: string // ISO
  dueDate: string // ISO
  returnedAt?: string | null // ISO
  status: LoanStatus
  notes?: string | null
  // riwayat
  condition?: Condition | null
  rating?: number | null // 1..5
  _showDetail?: boolean
}

const STORAGE_KEY = "loans-state-v1"

export default function RiwayatPage() {
  const { toast } = useToast()
  const [q, setQ] = useState("")
  const [cond, setCond] = useState<"all" | Condition>("all")
  const [from, setFrom] = useState<string>("")
  const [to, setTo] = useState<string>("")
  const [items, setItems] = useState<LoanItem[]>([])

  // hydrate
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (raw) {
        setItems(JSON.parse(raw))
      } else {
        // seed contoh riwayat
        const now = new Date()
        const iso = (d: Date) => d.toISOString()
        const makeDate = (y: number, m: number, d: number) => new Date(Date.UTC(y, m - 1, d, 3, 0, 0))
        const demo: LoanItem[] = [
          {
            kind: "jasa",
            id: "HIS-003",
            code: "SRV-FOTO-EVT",
            name: "Jasa Fotografi Event",
            qty: 1,
            unitPrice: 500000,
            startDate: iso(makeDate(2024, 1, 4)),
            dueDate: iso(makeDate(2024, 1, 5)),
            returnedAt: iso(makeDate(2024, 1, 5)),
            status: "RETURNED",
            condition: "BAIK",
            rating: 5,
            notes: "Dokumentasi seminar, file dikirim via Drive.",
          },
          {
            kind: "aset",
            id: "HIS-002",
            code: "CAM-DSLR-A1",
            name: "Kamera DSLR Canon",
            qty: 1,
            unitPrice: 150000,
            startDate: iso(makeDate(2023, 12, 10)),
            dueDate: iso(makeDate(2023, 12, 12)),
            returnedAt: iso(makeDate(2023, 12, 12)),
            status: "RETURNED",
            condition: "RUSAK_RINGAN",
            rating: 4,
            notes: "Sedikit scratch pada lens cap.",
          },
          {
            kind: "aset",
            id: "HIS-001",
            code: "TRP-VID-02",
            name: "Tripod Video Heavy Duty",
            qty: 1,
            unitPrice: 50000,
            startDate: iso(makeDate(2023, 11, 1)),
            dueDate: iso(makeDate(2023, 11, 4)),
            returnedAt: iso(makeDate(2023, 11, 4)),
            status: "RETURNED",
            condition: "BAIK",
            rating: 5,
            notes: "Semua kaki tripod normal.",
          },
        ]
        setItems(demo)
        localStorage.setItem(STORAGE_KEY, JSON.stringify(demo))
      }
    } catch {}
  }, [])

  // derived: hanya returned
  const returned = useMemo(() => items.filter((i) => i.status === "RETURNED"), [items])

  // filter
  const visible = useMemo(() => {
    const text = q.trim().toLowerCase()
    const fromTs = from ? new Date(from).getTime() : null
    const toTs = to ? new Date(to).getTime() : null

    return returned
      .filter((i) =>
        !text
          ? true
          : i.name.toLowerCase().includes(text) ||
            i.code.toLowerCase().includes(text) ||
            (i.notes ?? "").toLowerCase().includes(text),
      )
      .filter((i) => (cond === "all" ? true : i.condition === cond))
      .filter((i) => {
        if (!fromTs && !toTs) return true
        const ret = i.returnedAt ? new Date(i.returnedAt).getTime() : new Date(i.dueDate).getTime()
        if (fromTs && ret < fromTs) return false
        if (toTs && ret > toTs + 24 * 60 * 60 * 1000 - 1) return false // inclusive
        return true
      })
      .sort((a, b) => (b.returnedAt ? new Date(b.returnedAt).getTime() : 0) - (a.returnedAt ? new Date(a.returnedAt).getTime() : 0))
  }, [returned, q, cond, from, to])

  // actions
  function toggleDetail(id: string) {
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, _showDetail: !i._showDetail } : i)))
  }

  function setRating(id: string, rating: number) {
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, rating } : i)))
    toast({ title: "Terima kasih!", description: "Penilaian kamu sudah disimpan." })
  }

  function setCondition(id: string, condition: Condition) {
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, condition } : i)))
    toast({ title: "Kondisi diperbarui", description: `Item #${id.slice(-6)} diset ke ${conditionToText(condition)}.` })
  }

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <h1 className="text-3xl font-bold text-gray-900">Riwayat Peminjaman</h1>
        <p className="text-gray-600">Semua peminjaman yang telah selesai.</p>
      </header>

      {/* Filter bar */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        <div className="md:col-span-2 relative">
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Cari nama, kode, atau catatan…"
            className="rounded-xl pl-9"
          />
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        </div>

        <Select value={cond} onValueChange={(v) => setCond(v as any)}>
          <SelectTrigger className="rounded-xl">
            <SelectValue placeholder="Kondisi" />
          </SelectTrigger>
          <SelectContent className="rounded-xl">
            <SelectItem value="all">Semua Kondisi</SelectItem>
            <SelectItem value="BAIK">BAIK</SelectItem>
            <SelectItem value="RUSAK_RINGAN">RUSAK_RINGAN</SelectItem>
            <SelectItem value="RUSAK_BERAT">RUSAK_BERAT</SelectItem>
            <SelectItem value="HILANG">HILANG</SelectItem>
          </SelectContent>
        </Select>

        <div className="grid grid-cols-2 gap-2">
          <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="rounded-xl" />
          <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="rounded-xl" />
        </div>
      </div>

      {/* List */}
      {visible.length === 0 ? (
        <EmptyState
          text="Belum ada riwayat sesuai filter."
          hint={
            <>
              Lakukan peminjaman dari{" "}
              <Link href="/pemesanan" className="underline">/pemesanan</Link> atau cek{" "}
              <Link href="/peminjaman/aktif" className="underline">/peminjaman/aktif</Link>.
            </>
          }
        />
      ) : (
        <div className="space-y-4">
          {visible.map((i, idx) => (
            <Card key={i.id} className="rounded-2xl">
              <CardContent className="p-4 md:p-6">
                <div className="flex items-start justify-between gap-4">
                  {/* left: thumbnail + info */}
                  <div className="flex items-start gap-4 min-w-0">
                    <Thumb kind={i.kind} photoUrl={i.photoUrl} name={i.name} />

                    <div className="min-w-0">
                      <div className="text-lg font-semibold truncate">Peminjaman #{visible.length - idx}</div>
                      <div className="text-gray-700 truncate">{i.name}</div>

                      <div className="mt-2 flex flex-wrap items-center gap-2">
                        <div className="inline-flex items-center gap-1 text-gray-600 text-sm">
                          <CalendarCheck className="w-4 h-4" />
                          <span>Dikembalikan: {fmtDate(i.returnedAt || i.dueDate)}</span>
                        </div>
                        <Badge variant={conditionVariant(i.condition)} className="rounded-md">
                          Kondisi: {conditionToText(i.condition)}
                        </Badge>
                        {i.rating ? (
                          <div className="inline-flex items-center gap-1 text-amber-500 text-sm">
                            <Star className="w-4 h-4 fill-current" />
                            <span>{i.rating}</span>
                          </div>
                        ) : null}
                      </div>
                    </div>
                  </div>

                  {/* right: actions */}
                  <div className="shrink-0 flex flex-col items-end gap-2">
                    <Button variant="outline" size="sm" className="rounded-md" onClick={() => toggleDetail(i.id)}>
                      <Eye className="w-4 h-4 mr-1" /> Detail
                    </Button>

                    {/* quick rating */}
                    <StarRating value={i.rating ?? 0} onChange={(v) => setRating(i.id, v)} />

                    {/* kondisi select */}
                    <Select value={(i.condition ?? "BAIK") as any} onValueChange={(v) => setCondition(i.id, v as Condition)}>
                      <SelectTrigger className="h-8 rounded-md">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="BAIK">BAIK</SelectItem>
                        <SelectItem value="RUSAK_RINGAN">RUSAK_RINGAN</SelectItem>
                        <SelectItem value="RUSAK_BERAT">RUSAK_BERAT</SelectItem>
                        <SelectItem value="HILANG">HILANG</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* detail */}
                {i._showDetail && (
                  <div className="mt-4 rounded-xl border p-4 bg-gray-50">
                    <DetailBlock item={i} />
                    <div className="mt-3 flex flex-wrap gap-2">
                      <Button asChild variant="outline" size="sm" className="rounded-md">
                        <Link href={`/invoice/${i.id}`}>Lihat Kwitansi</Link>
                      </Button>
                      <Button asChild variant="outline" size="sm" className="rounded-md">
                        <Link href={`/ulasan/${i.id}`}>Tulis Ulasan</Link>
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

/* ================= Komponen ================= */

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

function StarRating({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <div className="inline-flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          aria-label={`rating-${n}`}
          className={`p-0.5 ${n <= value ? "text-amber-500" : "text-gray-300"} hover:text-amber-500`}
          onClick={() => onChange(n)}
        >
          <Star className={`w-4 h-4 ${n <= value ? "fill-current" : ""}`} />
        </button>
      ))}
    </div>
  )
}

function DetailBlock({ item }: { item: LoanItem }) {
  return (
    <div className="text-sm text-gray-700 space-y-1">
      <Row label="Kode" value={<span className="font-mono">#{item.code}</span>} />
      <Row label="Jenis" value={item.kind.toUpperCase()} />
      <Row label="Qty" value={String(item.qty)} />
      <Row label="Tarif Satuan" value={formatCurrency(item.unitPrice)} />
      <Row label="Mulai" value={fmtDate(item.startDate)} />
      <Row label="Jatuh Tempo" value={fmtDate(item.dueDate)} />
      <Row label="Dikembalikan" value={fmtDate(item.returnedAt || item.dueDate)} />
      {item.notes && <Row label="Catatan" value={item.notes} />}
      <div className="pt-2 text-xs text-gray-500">
        Subtotal estimasi: <strong>{formatCurrency(item.unitPrice * item.qty)}</strong> (belum termasuk denda/biaya lain).
      </div>
    </div>
  )
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-3">
      <span className="text-gray-500 w-40">{label}</span>
      <div className="flex-1 font-medium">{value}</div>
    </div>
  )
}

/* ================ Utils & UI kecil ================ */

function conditionToText(c?: Condition | null) {
  if (!c) return "BAIK"
  return c
}

function conditionVariant(c?: Condition | null): "secondary" | "outline" | "destructive" {
  if (c === "BAIK") return "secondary"
  if (c === "RUSAK_RINGAN") return "outline"
  if (c === "RUSAK_BERAT" || c === "HILANG") return "destructive"
  return "outline"
}

function fmtDate(iso?: string | null) {
  if (!iso) return "-"
  const d = new Date(iso)
  return d.toLocaleDateString("id-ID", { year: "numeric", month: "2-digit", day: "2-digit" })
}

function EmptyState({ text, hint }: { text: string; hint?: React.ReactNode }) {
  return (
    <div className="rounded-2xl border p-10 text-center text-gray-600">
      <p className="font-medium">{text}</p>
      {hint && <p className="text-sm text-gray-500 mt-1">{hint}</p>}
    </div>
  )
}
