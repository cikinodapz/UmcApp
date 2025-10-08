"use client"

import { useEffect, useMemo, useState } from "react"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Loader2, Boxes, ShoppingCart, ChevronLeft } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { fetchData } from "@/lib/api"
import { formatCurrency } from "@/lib/format"

// shadcn dialog utk konfirmasi
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

import Swal from "sweetalert2"

type Params = { id: string }

type AssetDetail = {
  id: string
  categoryId: string | null
  code: string
  name: string
  specification?: string | null
  acquisitionDate?: string | null
  conditionNow: "BAIK" | "RUSAK_RINGAN" | "RUSAK_BERAT" | "HILANG"
  status: "TERSEDIA" | "DIPINJAM" | "TIDAK_AKTIF"
  dailyRate: string | number
  stock: number
  photoUrl?: string | null
  createdAt: string
  updatedAt: string
  category?: { id: string; name: string } | null
}

const API_BASE = process.env.NEXT_PUBLIC_API_URL

export default function AssetDetailPage({ params }: { params: Params }) {
  const router = useRouter()
  const { toast } = useToast()

  const [data, setData] = useState<AssetDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [qty, setQty] = useState(1)

  // dialog + submit states
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    let mounted = true
    ;(async () => {
      setLoading(true)
      setError(null)
      try {
        const res = await fetchData<AssetDetail>(`/assets/${params.id}`, { method: "GET" })
        if (!mounted) return
        setData(res)
      } catch (e: any) {
        const msg = e?.response?.data?.message || "Gagal memuat detail aset"
        setError(msg)
      } finally {
        mounted && setLoading(false)
      }
    })()
    return () => {
      mounted = false
    }
  }, [params.id])

  const imageUrl = useMemo(() => {
    if (!data?.photoUrl) return null
    if (/^https?:\/\//i.test(data.photoUrl)) return data.photoUrl
    return `${API_BASE}/uploads/${data.photoUrl}`
  }, [data])

  // buka dialog konfirmasi
  function onClickAdd() {
    setConfirmOpen(true)
  }

  // submit ke API /cart
  async function handleConfirmAdd() {
    if (!data) return
    setSubmitting(true)
    try {
      const payload = {
        itemType: "ASET" as const,
        assetId: data.id,
        qty,
        price: Number(data.dailyRate || 0),
      }

      await fetchData<{ message: string; cartItem: any }>("/cart", {
        method: "POST",
        data: payload,
      })

      setConfirmOpen(false)

      await Swal.fire({
        icon: "success",
        title: "Ditambahkan ke Keranjang",
        text: `${data.name} (${qty}x) berhasil ditambahkan.`,
        confirmButtonText: "OK",
      })

      // redirect ke /sewa
      router.push("/sewa")
    } catch (e: any) {
      const msg = e?.response?.data?.message || "Gagal menambahkan ke keranjang"
      toast({ title: "Gagal", description: msg, variant: "destructive" })
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-gray-600">
        <Loader2 className="w-4 h-4 animate-spin" />
        Memuat detail aset...
      </div>
    )
  }

  if (error || !data) {
    return <div className="text-red-600">{error || "Data tidak ditemukan"}</div>
  }

  return (
    <div className="space-y-4">
      <Button variant="ghost" className="rounded-xl" onClick={() => router.back()}>
        <ChevronLeft className="w-4 h-4 mr-1" />
        Kembali
      </Button>

      <Card className="rounded-2xl overflow-hidden">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-0">
          <div className="relative min-h-[260px] lg:min-h-[360px] bg-gray-50">
            {imageUrl ? (
              <Image src={imageUrl} alt={data.name} fill className="object-cover" />
            ) : (
              <div className="w-full h-full grid place-items-center bg-gradient-to-br from-indigo-50 to-violet-50">
                <Boxes className="w-10 h-10 text-indigo-400" />
              </div>
            )}
          </div>

          <div className="p-6 lg:p-8">
            <CardHeader className="p-0">
              <CardTitle className="text-2xl">{data.name}</CardTitle>
              <CardDescription className="font-mono text-xs">#{data.code}</CardDescription>
            </CardHeader>

            <div className="mt-3 flex flex-wrap gap-2">
              <Badge variant="secondary" className="rounded-lg">
                {data.category?.name ?? "Umum"}
              </Badge>
              <Badge className="rounded-lg" variant={data.status === "TERSEDIA" ? "secondary" : "outline"}>
                {data.status}
              </Badge>
              <Badge className="rounded-lg" variant="outline">
                Kondisi: {data.conditionNow}
              </Badge>
              <Badge className="rounded-lg" variant="outline">
                Stok: {data.stock}
              </Badge>
            </div>

            <div className="mt-5 space-y-4">
              <div className="inline-flex items-center gap-2 rounded-xl bg-indigo-50 text-indigo-700 px-3 py-1 font-semibold">
                {formatCurrency(Number(data.dailyRate || 0))} / hari
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                <div className="flex items-center justify-between rounded-lg border p-3">
                  <span className="text-gray-500">Status</span>
                  <span className="font-medium">{data.status}</span>
                </div>
                <div className="flex items-center justify-between rounded-lg border p-3">
                  <span className="text-gray-500">Stok</span>
                  <span className="font-medium">{data.stock}</span>
                </div>
                <div className="flex items-center justify-between rounded-lg border p-3">
                  <span className="text-gray-500">Kondisi</span>
                  <span className="font-medium">{data.conditionNow}</span>
                </div>
                {data.acquisitionDate && (
                  <div className="flex items-center justify-between rounded-lg border p-3">
                    <span className="text-gray-500">Tgl perolehan</span>
                    <span className="font-medium">{new Date(data.acquisitionDate).toLocaleDateString()}</span>
                  </div>
                )}
              </div>

              {data.specification && (
                <div>
                  <p className="text-sm font-medium text-gray-900 mb-1">Spesifikasi</p>
                  <div className="rounded-xl border bg-gray-50 p-3 text-sm text-gray-700 whitespace-pre-wrap">
                    {data.specification}
                  </div>
                </div>
              )}
            </div>

            <div className="mt-6 flex items-center gap-3">
              <div className="w-28">
                <label className="text-sm text-gray-600">Jumlah</label>
                <Input
                  type="number"
                  min={1}
                  max={Math.max(1, data.stock)}
                  value={qty}
                  onChange={(e) =>
                    setQty(Math.max(1, Math.min(Number(e.target.value || 1), Math.max(1, data.stock))))
                  }
                  className="rounded-xl h-12 mt-1"
                />
              </div>

              <Button
                className="rounded-xl !bg-indigo-600 hover:!bg-indigo-700 !text-white font-medium shadow-lg hover:shadow-xl transition-all duration-200 !border-0"
                style={{
                  background:
                    "linear-gradient(to right, rgb(99, 102, 241), rgb(139, 92, 246))",
                  color: "white",
                }}
                onClick={onClickAdd}
                disabled={data.status !== "TERSEDIA" || data.stock <= 0 || submitting}
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Menambahkan...
                  </>
                ) : (
                  <>
                    <ShoppingCart className="w-4 h-4 mr-2" />
                    Tambah ke Keranjang
                  </>
                )}
              </Button>
            </div>

            {data.status !== "TERSEDIA" && (
              <p className="mt-2 text-sm text-amber-600">Aset tidak tersedia saat ini.</p>
            )}
          </div>
        </div>

        <CardContent />
      </Card>

      {/* Dialog Konfirmasi */}
      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Tambah ke Keranjang?</AlertDialogTitle>
            <AlertDialogDescription>
            <AlertDialogDescription>
              Kamu akan menambahkan <span className="font-medium">{data.name}</span> sebanyak{" "}
              <span className="font-medium">{qty} item</span> ke keranjang.
            </AlertDialogDescription>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl" disabled={submitting}>
              Batal
            </AlertDialogCancel>
            <AlertDialogAction
              className="rounded-xl !bg-indigo-600 hover:!bg-indigo-700 !text-white font-medium shadow-lg hover:shadow-xl transition-all duration-200 !border-0"
              style={{
                background:
                  "linear-gradient(to right, rgb(99, 102, 241), rgb(139, 92, 246))",
                color: "white",
              }}
              onClick={handleConfirmAdd}
              disabled={submitting}
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Menambahkan...
                </>
              ) : (
                "Ya, Tambahkan"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
