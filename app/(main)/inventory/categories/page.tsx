"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { useAuth } from "@/contexts/auth-context"
import { Role } from "@/types"
import { fetchData } from "@/lib/api"
import { cn } from "@/lib/utils"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

import {
  Plus,
  Search,
  Edit,
  Trash2,
  Loader2,
  Tag,
  ChevronsLeft,
  ChevronLeft,
  ChevronRight,
  ChevronsRight,
} from "lucide-react"

import Swal from "sweetalert2"

// ---- Types ----
// Kalau tipe global Category kamu belum diupdate, define aman di sini.
// (Akan otomatis “narrow” ke tipe global kalau sudah ada.)
type ItemType = "ASET" | "JASA"
type CategoryDTO = {
  id: string
  name: string
  description?: string | null
  type: ItemType
}
type ServerPaged<T> =
  | { items: T[]; total: number; page: number; pageSize: number }
  | T[]

// ---- Utils ----
const qs = (o: Record<string, string | number | undefined>) =>
  Object.entries(o)
    .filter(([, v]) => v !== undefined && v !== "")
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`)
    .join("&")

function pageWindow(current: number, total: number, span = 1) {
  const pages: (number | string)[] = []
  const start = Math.max(1, current - span)
  const end = Math.min(total, current + span)
  if (start > 1) pages.push(1)
  if (start > 2) pages.push("...")
  for (let p = start; p <= end; p++) pages.push(p)
  if (end < total - 1) pages.push("...")
  if (end < total) pages.push(total)
  return pages
}

// ---- Page ----
export default function CategoriesPage() {
  const { user } = useAuth()
  const isAdmin = user?.role === Role.ADMIN

  // data & state
  const [items, setItems] = useState<CategoryDTO[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [supportsServerPaging, setSupportsServerPaging] = useState<boolean | null>(null)

  // fallback cache jika server tidak support
  const [allCache, setAllCache] = useState<CategoryDTO[]>([])

  const [rawSearch, setRawSearch] = useState("")
  const [search, setSearch] = useState("")
  const debounceRef = useRef<NodeJS.Timeout | null>(null)

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // dialogs
  const [formOpen, setFormOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [editing, setEditing] = useState<Partial<CategoryDTO> | null>(null)

  const [confirmOpen, setConfirmOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [toDelete, setToDelete] = useState<Pick<CategoryDTO, "id" | "name"> | null>(null)

  // debounce search 400ms
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      setSearch(rawSearch)
      setPage(1)
    }, 400)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rawSearch])

  // fetch
  const load = async () => {
    setLoading(true)
    setError(null)
    try {
      const query = qs({ page, pageSize, search })
      const resp: ServerPaged<CategoryDTO> = await fetchData(`/categories?${query}`, { method: "GET" })

      if (Array.isArray(resp)) {
        // fallback client-side
        setSupportsServerPaging(false)
        const filtered = filterLocal(resp, search)
        setAllCache(filtered)
        setTotal(filtered.length)
        const start = (page - 1) * pageSize
        setItems(filtered.slice(start, start + pageSize))
      } else {
        // server-side
        setSupportsServerPaging(true)
        setItems(resp.items)
        setTotal(resp.total)
        setPage(resp.page ?? page)
        setPageSize(resp.pageSize ?? pageSize)
      }
    } catch (e: any) {
      const msg = e?.response?.data?.message || "Gagal memuat kategori"
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, pageSize, search])

  // helpers
  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  const pages = useMemo(() => pageWindow(page, totalPages, 2), [page, totalPages])

  function filterLocal(rows: CategoryDTO[], q: string) {
    const s = q.toLowerCase()
    if (!s) return rows
    return rows.filter((c) => {
      const name = c.name?.toLowerCase() || ""
      const desc = c.description?.toLowerCase() || ""
      const type = c.type?.toLowerCase() || ""
      return name.includes(s) || desc.includes(s) || type.includes(s)
    })
  }

  // actions
  const openCreate = () => {
    setEditing({ id: "", name: "", description: "", type: "ASET" })
    setFormOpen(true)
  }

  const handleSave = async (payload: { name: string; description?: string; type: ItemType }) => {
    if (!payload.name?.trim()) {
      await Swal.fire({ icon: "warning", title: "Nama wajib diisi" })
      return
    }
    if (!payload.type) {
      await Swal.fire({ icon: "warning", title: "Tipe kategori wajib dipilih" })
      return
    }
    setSaving(true)
    try {
      if (editing?.id) {
        const res = await fetchData(`/categories/${editing.id}`, { method: "PATCH", data: payload })
        await Swal.fire({
          icon: "success",
          title: "Kategori diupdate",
          text: res.message || "Berhasil menyimpan perubahan",
          timer: 1100,
          showConfirmButton: false,
        })
      } else {
        const res = await fetchData("/categories", { method: "POST", data: payload })
        await Swal.fire({
          icon: "success",
          title: "Kategori dibuat",
          text: res.message || "Berhasil menambah kategori",
          timer: 1100,
          showConfirmButton: false,
        })
        setPage(1)
      }
      setFormOpen(false)
      setEditing(null)
      await load()
    } catch (e: any) {
      const msg = e?.response?.data?.message || "Gagal menyimpan kategori"
      await Swal.fire({ icon: "error", title: "Gagal", text: msg })
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!toDelete) return
    setDeleting(true)
    try {
      await fetchData(`/categories/${toDelete.id}`, { method: "DELETE" })
      await Swal.fire({
        icon: "success",
        title: "Berhasil dihapus",
        text: `Kategori "${toDelete.name}" dihapus`,
        timer: 1100,
        showConfirmButton: false,
      })
      const nextTotal = total - 1
      const last = Math.max(1, Math.ceil(nextTotal / pageSize))
      if (page > last) setPage(last)
      setConfirmOpen(false)
      setToDelete(null)
      await load()
    } catch (e: any) {
      const msg = e?.response?.data?.message || "Gagal menghapus kategori"
      await Swal.fire({ icon: "error", title: "Gagal", text: msg })
    } finally {
      setDeleting(false)
    }
  }

  // ---- UI ----
  return (
    <div className="space-y-6 md:-ml-24">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Kategori</h1>
          <p className="text-gray-600 mt-2">
            {isAdmin ? "Kelola kategori untuk aset & jasa" : "Daftar kategori"}
          </p>
        </div>
        {isAdmin && (
          <Button
            onClick={openCreate}
            className="rounded-xl bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-600 hover:to-violet-700"
          >
            <Plus className="w-4 h-4 mr-2" />
            Tambah Kategori
          </Button>
        )}
      </div>

      {/* Toolbar */}
      <div className="flex items-center gap-4 p-4 bg-white rounded-2xl shadow-sm border">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder="Cari nama, deskripsi, atau ketik 'aset'/'jasa'…"
            value={rawSearch}
            onChange={(e) => setRawSearch(e.target.value)}
            className="pl-10 rounded-xl border-2 focus:border-indigo-500"
          />
        </div>

        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600">Rows</span>
          <select
            className="h-9 rounded-xl border px-3 text-sm"
            value={pageSize}
            onChange={(e) => {
              setPageSize(Number(e.target.value))
              setPage(1)
            }}
          >
            {[5, 10, 20, 50].map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Content */}
      <div className="bg-white rounded-2xl border shadow-sm">
        {/* Table Header */}
        <div className="grid grid-cols-12 px-5 py-3 border-b text-sm font-semibold text-gray-600">
          <div className="col-span-1"></div>
          <div className="col-span-4">Nama</div>
          <div className="col-span-2">Tipe</div>
          <div className="col-span-4">Deskripsi</div>
          {isAdmin && <div className="col-span-1 text-right pr-2">Aksi</div>}
        </div>

        {/* Table Body */}
        {loading ? (
          <SkeletonRows />
        ) : error ? (
          <div className="p-6">
            <Alert className="rounded-xl border-red-2 00 bg-red-50 max-w-lg">
              <AlertDescription className="text-red-800">{error}</AlertDescription>
            </Alert>
            <div className="mt-3">
              <Button variant="outline" className="rounded-xl" onClick={load}>
                Coba lagi
              </Button>
            </div>
          </div>
        ) : total === 0 ? (
          <EmptyState onCreate={isAdmin ? openCreate : undefined} />
        ) : (
          <>
            {items.map((row) => (
              <div key={row.id} className="grid grid-cols-12 items-center px-5 py-3 border-b last:border-b-0">
                <div className="col-span-1">
                  <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                    <Tag className="w-4 h-4" />
                  </div>
                </div>

                <div className="col-span-4">
                  <div className="font-medium">{row.name}</div>
                </div>

                <div className="col-span-2">
                  <TypeBadge type={row.type} />
                </div>

                <div className="col-span-4 text-gray-700">{row.description || "-"}</div>

                {isAdmin && (
                  <div className="col-span-1 flex justify-end gap-1 pr-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="rounded-lg"
                      onClick={() => {
                        setEditing(row)
                        setFormOpen(true)
                      }}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="rounded-lg text-red-600 hover:text-red-700"
                      onClick={() => {
                        setToDelete({ id: row.id, name: row.name })
                        setConfirmOpen(true)
                      }}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                )}
              </div>
            ))}

            {/* Footer / Pagination */}
            <div className="flex items-center justify-between px-5 py-3">
              <div className="text-sm text-gray-600">
                Menampilkan{" "}
                <span className="font-medium">
                  {total === 0 ? 0 : (page - 1) * pageSize + 1}
                </span>{" "}
                –{" "}
                <span className="font-medium">
                  {Math.min(page * pageSize, total)}
                </span>{" "}
                dari <span className="font-medium">{total}</span> data{" "}
              </div>

              <div className="flex items-center gap-1">
                <Button
                  variant="outline"
                  className="rounded-xl"
                  size="sm"
                  onClick={() => setPage(1)}
                  disabled={page <= 1}
                >
                  <ChevronsLeft className="w-4 h-4" />
                </Button>
                <Button
                  variant="outline"
                  className="rounded-xl"
                  size="sm"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1}
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>

                {pages.map((p, idx) =>
                  typeof p === "string" ? (
                    <span key={`${p}-${idx}`} className="px-2 text-sm text-gray-500">
                      {p}
                    </span>
                  ) : (
                    <Button
                      key={p}
                      variant={p === page ? "default" : "outline"}
                      size="sm"
                      className={cn("rounded-xl", p === page && "bg-indigo-600")}
                      onClick={() => setPage(p)}
                    >
                      {p}
                    </Button>
                  )
                )}

                <Button
                  variant="outline"
                  className="rounded-xl"
                  size="sm"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page >= totalPages}
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
                <Button
                  variant="outline"
                  className="rounded-xl"
                  size="sm"
                  onClick={() => setPage(totalPages)}
                  disabled={page >= totalPages}
                >
                  <ChevronsRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Form Dialog */}
      <CategoryFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        category={editing}
        loading={saving}
        onCancel={() => {
          setFormOpen(false)
          setEditing(null)
        }}
        onSubmit={(payload) => handleSave(payload)}
      />

      {/* Confirm Delete */}
      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Kategori</AlertDialogTitle>
            <AlertDialogDescription>
              Yakin ingin menghapus kategori "{toDelete?.name}"? Tindakan ini tidak dapat dibatalkan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl">Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className={cn("rounded-xl bg-red-600 hover:bg-red-700", deleting && "opacity-90")}
              disabled={deleting}
            >
              {deleting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Hapus
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

// ---- Subcomponents ----
function TypeBadge({ type }: { type: ItemType }) {
  const isAset = type === "ASET"
  return (
    <span
      className={cn(
        "inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium",
        isAset
          ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200"
          : "bg-amber-50 text-amber-700 ring-1 ring-amber-200"
      )}
      title={isAset ? "Kategori untuk aset fisik" : "Kategori untuk jasa/layanan"}
    >
      {type}
    </span>
  )
}

function SkeletonRows() {
  return (
    <div className="divide-y">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="grid grid-cols-12 items-center px-5 py-3 animate-pulse">
          <div className="col-span-1">
            <div className="w-9 h-9 rounded-xl bg-gray-100" />
          </div>
          <div className="col-span-4">
            <div className="h-4 w-40 bg-gray-100 rounded mb-2" />
            <div className="h-3 w-28 bg-gray-100 rounded" />
          </div>
          <div className="col-span-2">
            <div className="h-5 w-16 bg-gray-100 rounded-full" />
          </div>
          <div className="col-span-4">
            <div className="h-4 w-full max-w-[420px] bg-gray-100 rounded" />
          </div>
          <div className="col-span-1 flex justify-end">
            <div className="h-8 w-20 bg-gray-100 rounded" />
          </div>
        </div>
      ))}
    </div>
  )
}

function EmptyState({ onCreate }: { onCreate?: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
      <div className="w-14 h-14 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-4">
        <Tag className="w-6 h-6" />
      </div>
      <h3 className="text-lg font-semibold">Belum ada kategori</h3>
      <p className="text-gray-600 mt-1">
        Tambah kategori pertama (pilih tipe ASET/JASA) agar aset & jasa lebih terorganisir.
      </p>
      {onCreate && (
        <Button onClick={onCreate} className="mt-4 rounded-xl bg-indigo-600 hover:bg-indigo-700">
          <Plus className="w-4 h-4 mr-2" />
          Tambah Kategori
        </Button>
      )}
    </div>
  )
}

function CategoryFormDialog({
  open,
  onOpenChange,
  category,
  loading,
  onSubmit,
  onCancel,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
  category: Partial<CategoryDTO> | null
  loading: boolean
  onSubmit: (payload: { name: string; description?: string; type: ItemType }) => void
  onCancel: () => void
}) {
  const isEdit = Boolean(category?.id)
  const [name, setName] = useState(category?.name || "")
  const [description, setDescription] = useState(category?.description || "")
  const [type, setType] = useState<ItemType>((category?.type as ItemType) || "ASET")

  useEffect(() => {
    setName(category?.name || "")
    setDescription(category?.description || "")
    setType((category?.type as ItemType) || "ASET")
  }, [category, open])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-2xl sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-xl">{isEdit ? "Edit Kategori" : "Tambah Kategori"}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          <div className="space-y-2">
            <label className="text-sm font-medium">Nama</label>
            <Input
              placeholder="Mis. Kamera, Lighting, Studio"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="rounded-xl"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Tipe</label>
            <Select value={type} onValueChange={(v) => setType(v as ItemType)}>
              <SelectTrigger className="rounded-xl">
                <SelectValue placeholder="Pilih tipe kategori" />
              </SelectTrigger>
              <SelectContent className="rounded-xl">
                <SelectItem value="ASET">ASET</SelectItem>
                <SelectItem value="JASA">JASA</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Deskripsi</label>
            <Input
              placeholder="Deskripsi singkat (opsional)"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="rounded-xl"
            />
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" className="rounded-xl" onClick={onCancel}>
            Batal
          </Button>
          <Button
            className="rounded-xl bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-600 hover:to-violet-700"
            onClick={() =>
              onSubmit({
                name: name.trim(),
                description: description.trim() || undefined,
                type,
              })
            }
            disabled={loading}
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
            {isEdit ? "Simpan Perubahan" : "Buat Kategori"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
