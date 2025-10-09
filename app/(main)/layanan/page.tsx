"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { useAuth } from "@/contexts/auth-context"
import { Role } from "@/types"
import { fetchData } from "@/lib/api"
import { cn } from "@/lib/utils"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
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
  Image as ImageIcon,
  ChevronsLeft,
  ChevronLeft,
  ChevronRight,
  ChevronsRight,
  Package,
  X,
  List,
} from "lucide-react"

import Swal from "sweetalert2"

type Category = { id: string; name: string }
type ServicePackage = {
  id?: string
  name: string
  description: string
  unitRate: string
  features: string[] // 🆕 TAMBAH FEATURES
}

type ServiceDTO = {
  id: string
  categoryId: string | null
  name: string
  description?: string
  unitRate: string
  isActive: boolean
  photoUrl: string
  category?: Category | null
  Package?: ServicePackage[]
}

type ServerPaged<T> =
  | { items: T[]; total: number; page: number; pageSize: number }
  | T[]

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

export default function ServicesPage() {
  const { user } = useAuth()
  const isAdmin = user?.role === Role.ADMIN

  const [items, setItems] = useState<ServiceDTO[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [supportsServerPaging, setSupportsServerPaging] = useState<boolean | null>(null)

  const [allCache, setAllCache] = useState<ServiceDTO[]>([])
  const [rawSearch, setRawSearch] = useState("")
  const [search, setSearch] = useState("")
  const debounceRef = useRef<NodeJS.Timeout | null>(null)

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [formOpen, setFormOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [editing, setEditing] = useState<Partial<ServiceDTO> | null>(null)

  const [confirmOpen, setConfirmOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [toDelete, setToDelete] = useState<Pick<ServiceDTO, "id" | "name"> | null>(null)

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      setSearch(rawSearch)
      setPage(1)
    }, 400)
  }, [rawSearch])

  const loadCategories = async () => {
    try {
      const cats: Category[] = await fetchData('/categories', { method: "GET" })
      setCategories(cats)
    } catch (e) {
      console.error("Gagal memuat kategori:", e)
    }
  }

  const load = async () => {
    setLoading(true)
    setError(null)
    try {
      const query = qs({ page, pageSize, search })
      const resp: ServerPaged<ServiceDTO> = await fetchData(`/services?${query}`, { method: "GET" })

      if (Array.isArray(resp)) {
        setSupportsServerPaging(false)
        const filtered = filterLocal(resp, search)
        setAllCache(filtered)
        setTotal(filtered.length)
        const start = (page - 1) * pageSize
        setItems(filtered.slice(start, start + pageSize))
      } else {
        setSupportsServerPaging(true)
        setItems(resp.items)
        setTotal(resp.total)
        setPage(resp.page ?? page)
        setPageSize(resp.pageSize ?? pageSize)
      }
    } catch (e: any) {
      const msg = e?.response?.data?.message || "Gagal memuat layanan"
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
    loadCategories()
  }, [page, pageSize, search])

  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  const pages = useMemo(() => pageWindow(page, totalPages, 2), [page, totalPages])

  function filterLocal(rows: ServiceDTO[], q: string) {
    const s = q.toLowerCase()
    if (!s) return rows
    return rows.filter((c) => {
      const name = c.name?.toLowerCase() || ""
      const desc = c.description?.toLowerCase() || ""
      const category = c.category?.name?.toLowerCase() || ""
      return name.includes(s) || desc.includes(s) || category.includes(s)
    })
  }

  const openCreate = () => {
    setEditing({
      id: "",
      name: "",
      description: "",
      unitRate: "",
      isActive: true,
      categoryId: null,
      photoUrl: "",
      Package: [],
    })
    setFormOpen(true)
  }

  const handleSave = async (payload: FormData) => {
    setSaving(true)
    try {
      if (editing?.id) {
        const res = await fetchData(`/services/${editing.id}`, { method: "PATCH", data: payload })
        await Swal.fire({
          icon: "success",
          title: "Layanan diupdate",
          text: res.message || "Berhasil menyimpan perubahan",
          timer: 1100,
          showConfirmButton: false,
        })
      } else {
        const res = await fetchData("/services", { method: "POST", data: payload })
        await Swal.fire({
          icon: "success",
          title: "Layanan dibuat",
          text: res.message || "Berhasil menambah layanan",
          timer: 1100,
          showConfirmButton: false,
        })
        setPage(1)
      }
      setFormOpen(false)
      setEditing(null)
      await load()
    } catch (e: any) {
      const msg = e?.response?.data?.message || "Gagal menyimpan layanan"
      await Swal.fire({ icon: "error", title: "Gagal", text: msg })
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!toDelete) return
    setDeleting(true)
    try {
      await fetchData(`/services/${toDelete.id}`, { method: "DELETE" })
      await Swal.fire({
        icon: "success",
        title: "Berhasil dihapus",
        text: `Layanan "${toDelete.name}" dihapus`,
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
      const msg = e?.response?.data?.message || "Gagal menghapus layanan"
      await Swal.fire({ icon: "error", title: "Gagal", text: msg })
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="space-y-6 md:-ml-24">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Layanan / Jasa</h1>
          <p className="text-gray-600 mt-2">
            {isAdmin ? "Kelola jasa dan layanan multimedia" : "Daftar layanan yang tersedia"}
          </p>
        </div>
        {isAdmin && (
          <Button
            onClick={openCreate}
            className="rounded-xl bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-600 hover:to-violet-700"
          >
            <Plus className="w-4 h-4 mr-2" /> Tambah Layanan
          </Button>
        )}
      </div>

      <div className="flex items-center gap-4 p-4 bg-white rounded-2xl shadow-sm border">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder="Cari nama layanan atau kategori…"
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

      <div className="bg-white rounded-2xl border shadow-sm">
        <div className="grid grid-cols-12 px-5 py-3 border-b text-sm font-semibold text-gray-600">
          <div className="col-span-1"></div>
          <div className="col-span-3">Nama</div>
          <div className="col-span-2">Kategori</div>
          <div className="col-span-2">Tarif</div>
          <div className="col-span-2">Paket</div>
          <div className="col-span-1">Status</div>
          {isAdmin && <div className="col-span-1 text-right pr-2">Aksi</div>}
        </div>

        {loading ? (
          <SkeletonRows />
        ) : error ? (
          <div className="p-6">
            <Alert className="rounded-xl border-red-200 bg-red-50 max-w-lg">
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
              <div 
                key={row.id} 
                className="group grid grid-cols-12 items-center px-5 py-3 border-b last:border-b-0 transition-colors hover:bg-gray-50"
              >
                <div className="col-span-1">
                  <img
                    src={row.photoUrl}
                    alt={row.name}
                    className="w-10 h-10 rounded-xl object-cover border shadow-sm transition-transform group-hover:scale-105"
                  />
                </div>
                <div className="col-span-3">
                  <div className="font-medium">{row.name}</div>
                  {row.description && (
                    <div className="text-sm text-gray-500 truncate">{row.description}</div>
                  )}
                </div>
                <div className="col-span-2">{row.category?.name || "-"}</div>
                <div className="col-span-2 text-gray-700">Rp {parseInt(row.unitRate).toLocaleString('id-ID')}</div>
                <div className="col-span-2">
                  {row.Package && row.Package.length > 0 ? (
                    <div className="flex items-center gap-1 text-sm transition-all hover:scale-105">
                      <Package className="w-4 h-4 text-green-600" />
                      <span className="text-green-700 group-hover:text-green-800">{row.Package.length} paket</span>
                    </div>
                  ) : (
                    <span className="text-sm text-gray-500 group-hover:text-gray-600">Tidak ada paket</span>
                  )}
                </div>
                <div className="col-span-1">
                  <span
                    className={cn(
                      "inline-flex px-2.5 py-1 rounded-full text-xs font-medium ring-1 transition-colors",
                      row.isActive
                        ? "bg-emerald-50 text-emerald-700 ring-emerald-200"
                        : "bg-gray-100 text-gray-600 ring-gray-200"
                    )}
                  >
                    {row.isActive ? "Aktif" : "Nonaktif"}
                  </span>
                </div>
                {isAdmin && (
                  <div className="col-span-1 flex justify-end gap-1 pr-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setEditing(row)
                        setFormOpen(true)
                      }}
                      className="opacity-0 group-hover:opacity-100 transition-opacity hover:bg-gray-100"
                    >
                      <Edit className="w-4 h-4 text-gray-600 hover:text-gray-800" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-50 text-red-600 hover:text-red-700"
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

            {/* Pagination */}
            <div className="flex items-center justify-between px-5 py-3">
              <div className="text-sm text-gray-600">
                Menampilkan <b>{(page - 1) * pageSize + 1}</b>–<b>{Math.min(page * pageSize, total)}</b> dari{" "}
                <b>{total}</b> data
              </div>
              <div className="flex items-center gap-1">
                <Button
                  variant="outline"
                  size="sm"
                  className="rounded-xl"
                  onClick={() => setPage(1)}
                  disabled={page <= 1}
                >
                  <ChevronsLeft className="w-4 h-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="rounded-xl"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1}
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                {pages.map((p, idx) =>
                  typeof p === "string" ? (
                    <span key={idx} className="px-2 text-gray-500 text-sm">
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
                  size="sm"
                  className="rounded-xl"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page >= totalPages}
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="rounded-xl"
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

      <ServiceFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        service={editing}
        loading={saving}
        categories={categories}
        onCancel={() => {
          setFormOpen(false)
          setEditing(null)
        }}
        onSubmit={handleSave}
      />

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Layanan</AlertDialogTitle>
            <AlertDialogDescription>
              Yakin ingin menghapus layanan "{toDelete?.name}"? Tindakan ini tidak dapat dibatalkan.
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

function SkeletonRows() {
  return (
    <div className="divide-y">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="grid grid-cols-12 items-center px-5 py-3 animate-pulse">
          <div className="col-span-1">
            <div className="w-10 h-10 rounded-xl bg-gray-100" />
          </div>
          <div className="col-span-3">
            <div className="h-4 w-32 bg-gray-100 rounded mb-1" />
            <div className="h-3 w-24 bg-gray-100 rounded" />
          </div>
          <div className="col-span-2">
            <div className="h-3 w-20 bg-gray-100 rounded" />
          </div>
          <div className="col-span-2">
            <div className="h-3 w-16 bg-gray-100 rounded" />
          </div>
          <div className="col-span-2">
            <div className="h-3 w-20 bg-gray-100 rounded" />
          </div>
          <div className="col-span-1">
            <div className="h-4 w-16 bg-gray-100 rounded-full" />
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
        <ImageIcon className="w-6 h-6" />
      </div>
      <h3 className="text-lg font-semibold">Belum ada layanan</h3>
      <p className="text-gray-600 mt-1">Tambahkan layanan pertama untuk mulai menawarkan jasa multimedia.</p>
      {onCreate && (
        <Button onClick={onCreate} className="mt-4 rounded-xl bg-indigo-600 hover:bg-indigo-700">
          <Plus className="w-4 h-4 mr-2" />
          Tambah Layanan
        </Button>
      )}
    </div>
  )
}

function ServiceFormDialog({
  open,
  onOpenChange,
  service,
  loading,
  categories,
  onSubmit,
  onCancel,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
  service: Partial<ServiceDTO> | null
  loading: boolean
  categories: Category[]
  onSubmit: (payload: FormData) => void
  onCancel: () => void
}) {
  const isEdit = Boolean(service?.id)
  const [name, setName] = useState(service?.name || "")
  const [description, setDescription] = useState(service?.description || "")
  const [unitRate, setUnitRate] = useState(service?.unitRate || "")
  const [categoryId, setCategoryId] = useState(service?.categoryId || "")
  const [isActive, setIsActive] = useState(service?.isActive ?? true)
  const [photo, setPhoto] = useState<File | null>(null)
  const [packages, setPackages] = useState<ServicePackage[]>(
    service?.Package?.map(pkg => ({
      ...pkg,
      features: pkg.features || [] // 🆕 DEFAULT EMPTY ARRAY
    })) || []
  )

  useEffect(() => {
    setName(service?.name || "")
    setDescription(service?.description || "")
    setUnitRate(service?.unitRate || "")
    setCategoryId(service?.categoryId || "")
    setIsActive(service?.isActive ?? true)
    setPhoto(null)
    setPackages(
      service?.Package?.map(pkg => ({
        ...pkg,
        features: pkg.features || [] // 🆕 DEFAULT EMPTY ARRAY
      })) || []
    )
  }, [service, open])

  const addPackage = () => {
    setPackages(prev => [
      ...prev,
      { name: "", description: "", unitRate: "", features: [] } // 🆕 EMPTY FEATURES
    ])
  }

  const updatePackage = (index: number, field: keyof ServicePackage, value: any) => {
    setPackages(prev => prev.map((pkg, i) => 
      i === index ? { ...pkg, [field]: value } : pkg
    ))
  }

  const updatePackageFeature = (pkgIndex: number, featureIndex: number, value: string) => {
    setPackages(prev => prev.map((pkg, i) => {
      if (i === pkgIndex) {
        const newFeatures = [...pkg.features]
        newFeatures[featureIndex] = value
        return { ...pkg, features: newFeatures }
      }
      return pkg
    }))
  }

  const addPackageFeature = (pkgIndex: number) => {
    setPackages(prev => prev.map((pkg, i) => 
      i === pkgIndex ? { ...pkg, features: [...pkg.features, ""] } : pkg
    ))
  }

  const removePackageFeature = (pkgIndex: number, featureIndex: number) => {
    setPackages(prev => prev.map((pkg, i) => {
      if (i === pkgIndex) {
        const newFeatures = pkg.features.filter((_, idx) => idx !== featureIndex)
        return { ...pkg, features: newFeatures }
      }
      return pkg
    }))
  }

  const removePackage = (index: number) => {
    setPackages(prev => prev.filter((_, i) => i !== index))
  }

  const handleSubmit = () => {
    if (!name.trim()) {
      Swal.fire({ icon: "warning", title: "Nama wajib diisi" })
      return
    }
    if (!unitRate || parseInt(unitRate) <= 0) {
      Swal.fire({ icon: "warning", title: "Tarif harus lebih dari 0" })
      return
    }

    // Validasi packages
    for (const pkg of packages) {
      if (!pkg.name.trim()) {
        Swal.fire({ icon: "warning", title: "Nama paket wajib diisi" })
        return
      }
      if (!pkg.unitRate || parseInt(pkg.unitRate) <= 0) {
        Swal.fire({ icon: "warning", title: `Tarif paket "${pkg.name}" harus lebih dari 0` })
        return
      }
    }
    
    const form = new FormData()
    form.append("name", name)
    form.append("description", description)
    form.append("unitRate", unitRate)
    form.append("isActive", String(isActive))
    if (categoryId) {
      form.append("categoryId", categoryId)
    } else {
      form.append("categoryId", "")
    }
    if (photo) form.append("photo", photo)
    
    // Tambahkan packages ke form data (DENGAN FEATURES)
    if (packages.length > 0) {
      form.append("packages", JSON.stringify(packages))
    }
    
    onSubmit(form)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-2xl sm:max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl">{isEdit ? "Edit Layanan" : "Tambah Layanan"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-2">
          <div className="space-y-2">
            <label className="text-sm font-medium">Nama Layanan</label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Contoh: Jasa Fotografi"
              className="rounded-xl"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Deskripsi</label>
            <Input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Deskripsi singkat"
              className="rounded-xl"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Kategori</label>
            <Select value={categoryId || "_none"} onValueChange={setCategoryId}>
              <SelectTrigger className="rounded-xl">
                <SelectValue placeholder="Pilih kategori (opsional)" />
              </SelectTrigger>
              <SelectContent className="rounded-xl">
                <SelectItem value="_none">Tidak ada kategori</SelectItem>
                {categories.map((cat) => (
                  <SelectItem key={cat.id} value={cat.id}>
                    {cat.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Tarif Dasar</label>
            <Input
              type="number"
              value={unitRate}
              onChange={(e) => setUnitRate(e.target.value)}
              placeholder="Contoh: 50000"
              className="rounded-xl"
            />
          </div>
          
          {/* Packages Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">Paket Layanan</label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addPackage}
                className="rounded-xl"
              >
                <Plus className="w-4 h-4 mr-1" />
                Tambah Paket
              </Button>
            </div>
            
            {packages.length === 0 ? (
              <div className="text-center py-4 border-2 border-dashed rounded-xl text-gray-500">
                <Package className="w-8 h-8 mx-auto mb-2" />
                <p className="text-sm">Belum ada paket</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-80 overflow-y-auto p-2 border rounded-xl">
                {packages.map((pkg, index) => (
                  <div key={index} className="p-3 border rounded-lg bg-gray-50 space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium text-sm">Paket {index + 1}</h4>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removePackage(index)}
                        className="h-6 w-6 p-0 text-red-600"
                      >
                        <X className="w-3 h-3" />
                      </Button>
                    </div>
                    
                    <div className="grid grid-cols-1 gap-2">
                      <Input
                        placeholder="Nama paket (Contoh: Paket Basic)"
                        value={pkg.name}
                        onChange={(e) => updatePackage(index, 'name', e.target.value)}
                        className="rounded-xl text-sm"
                      />
                      <Input
                        placeholder="Deskripsi paket"
                        value={pkg.description}
                        onChange={(e) => updatePackage(index, 'description', e.target.value)}
                        className="rounded-xl text-sm"
                      />
                      <Input
                        type="number"
                        placeholder="Tarif paket"
                        value={pkg.unitRate}
                        onChange={(e) => updatePackage(index, 'unitRate', e.target.value)}
                        className="rounded-xl text-sm"
                      />
                      
                      {/* 🆕 FEATURES SECTION */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <label className="text-xs font-medium text-gray-700">Fitur Paket</label>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => addPackageFeature(index)}
                            className="h-6 text-xs rounded-lg"
                          >
                            <Plus className="w-3 h-3 mr-1" />
                            Tambah Fitur
                          </Button>
                        </div>
                        
                        {pkg.features.length === 0 ? (
                          <div className="text-center py-2 border border-dashed rounded-lg text-gray-400 text-xs">
                            <List className="w-4 h-4 mx-auto mb-1" />
                            <p>Belum ada fitur</p>
                          </div>
                        ) : (
                          <div className="space-y-1">
                            {pkg.features.map((feature, featureIndex) => (
                              <div key={featureIndex} className="flex gap-1">
                                <Input
                                  placeholder={`Fitur ${featureIndex + 1}`}
                                  value={feature}
                                  onChange={(e) => updatePackageFeature(index, featureIndex, e.target.value)}
                                  className="rounded-lg text-sm h-8"
                                />
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => removePackageFeature(index, featureIndex)}
                                  className="h-8 w-8 p-0 text-red-500"
                                >
                                  <X className="w-3 h-3" />
                                </Button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Status</label>
            <Select value={String(isActive)} onValueChange={(v) => setIsActive(v === "true")}>
              <SelectTrigger className="rounded-xl">
                <SelectValue placeholder="Pilih status" />
              </SelectTrigger>
              <SelectContent className="rounded-xl">
                <SelectItem value="true">Aktif</SelectItem>
                <SelectItem value="false">Nonaktif</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Foto</label>
            <Input
              type="file"
              accept="image/*"
              onChange={(e) => setPhoto(e.target.files?.[0] || null)}
              className="rounded-xl"
            />
            {service?.photoUrl && !photo && (
              <img
                src={service.photoUrl}
                alt="preview"
                className="mt-2 w-32 h-32 object-cover rounded-xl border"
              />
            )}
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" className="rounded-xl" onClick={onCancel}>
            Batal
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={loading}
            className="rounded-xl bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-600 hover:to-violet-700"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
            {isEdit ? "Simpan Perubahan" : "Buat Layanan"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}