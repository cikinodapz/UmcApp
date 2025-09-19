"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import {
  Button,
} from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { DataTable } from "@/components/data-table";
import { StatusBadge } from "@/components/status-badge";
import { useAuth } from "@/contexts/auth-context";
import { fetchData } from "@/lib/api";
import { formatCurrency } from "@/lib/format";
import type { Asset, Service, Category } from "@/types";
import { Role } from "@/types";
import {
  Plus,
  Search,
  Edit,
  Trash2,
  Eye,
  Package,
  Loader2,
  ChevronsLeft,
  ChevronLeft,
  ChevronRight,
  ChevronsRight,
} from "lucide-react";
import Swal from "sweetalert2";

/* =============================
   Helpers & Small Reusables
   ============================= */
const toDateInputValue = (v: any) => {
  if (!v) return ""; const d = new Date(v); if (isNaN(d.getTime())) return "";
  const tz = d.getTimezoneOffset(); return new Date(d.getTime() - tz * 60000).toISOString().slice(0, 10);
};
const toNumberSafe = (v: any, f = 0) => (Number.isFinite(Number(v)) ? Number(v) : f);
const pageWindow = (cur: number, tot: number, span = 2) => {
  const out: (number | string)[] = []; const s = Math.max(1, cur - span); const e = Math.min(tot, cur + span);
  if (s > 1) out.push(1); if (s > 2) out.push("..."); for (let p = s; p <= e; p++) out.push(p);
  if (e < tot - 1) out.push("..."); if (e < tot) out.push(tot); return out;
};

const CONDITION_OPTIONS = [
  { value: "BAIK", label: "Baik" },
  { value: "RUSAK_RINGAN", label: "Rusak Ringan" },
  { value: "RUSAK_BERAT", label: "Rusak Berat" },
];
const STATUS_OPTIONS = [
  { value: "TERSEDIA", label: "Tersedia" },
  { value: "DIPINJAM", label: "Dipinjam" },
  { value: "TIDAK_AKTIF", label: "Tidak Aktif" },
];

function LabeledField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <Label className="text-sm font-medium">{label}</Label>
      {children}
    </div>
  );
}

function ImgUpload({ preview, onChange, placeholder }: { preview: string | null; onChange: React.ChangeEventHandler<HTMLInputElement>; placeholder: string; }) {
  return (
    <div className="space-y-2">
      <Label className="text-sm font-medium">{placeholder}</Label>
      <div className="w-full aspect-square rounded-xl border-2 border-dashed border-gray-300 bg-gray-50 flex flex-col items-center justify-center overflow-hidden p-4">
        {preview ? (
          <>
            <Image src={preview} alt="Preview" width={300} height={300} className="h-full w-full object-contain" />
            <p className="text-xs text-gray-500 mt-2">Pratinjau gambar</p>
          </>
        ) : (
          <div className="text-center text-gray-500">
            <Package className="w-10 h-10 mx-auto mb-2" />
            <p className="text-sm">Upload gambar</p>
            <p className="text-xs">Format: JPG, PNG (max 5MB)</p>
          </div>
        )}
      </div>
      <Input type="file" accept="image/*" onChange={onChange} className="rounded-lg mt-2" />
    </div>
  );
}

function Pagination({
  total,
  page,
  setPage,
  pageSize,
  setPageSize,
}: {
  total: number; page: number; setPage: (n: number | ((p: number) => number)) => void; pageSize: number; setPageSize: (n: number) => void;
}) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const pagesArr = useMemo(() => pageWindow(page, totalPages, 2), [page, totalPages]);
  return (
    <div className="flex items-center justify-between px-1 py-2">
      <div className="text-sm text-gray-600">
        Menampilkan <span className="font-medium">{total === 0 ? 0 : (page - 1) * pageSize + 1}</span> –
        <span className="font-medium"> {Math.min(page * pageSize, total)}</span> dari <span className="font-medium">{total}</span> data
      </div>
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600">Rows</span>
          <select
            className="h-9 rounded-xl border px-3 text-sm"
            value={pageSize}
            onChange={(e) => { setPageSize(Number(e.target.value)); setPage(1); }}
          >
            {[5, 10, 20, 50].map((n) => (
              <option key={n} value={n}>{n}</option>
            ))}
          </select>
        </div>
        <div className="flex items-center gap-1">
          <Button variant="outline" className="rounded-xl" size="sm" onClick={() => setPage(1)} disabled={page <= 1}>
            <ChevronsLeft className="w-4 h-4" />
          </Button>
          <Button variant="outline" className="rounded-xl" size="sm" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1}>
            <ChevronLeft className="w-4 h-4" />
          </Button>
          {pagesArr.map((p, i) => typeof p === "string" ? (
            <span key={`${p}-${i}`} className="px-2 text-sm text-gray-500">{p}</span>
          ) : (
            <Button key={p} variant={p === page ? "default" : "outline"} size="sm" className={p === page ? "rounded-xl bg-indigo-600" : "rounded-xl"} onClick={() => setPage(p)}>
              {p}
            </Button>
          ))}
          <Button variant="outline" className="rounded-xl" size="sm" onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page >= totalPages}>
            <ChevronRight className="w-4 h-4" />
          </Button>
          <Button variant="outline" className="rounded-xl" size="sm" onClick={() => setPage(totalPages)} disabled={page >= totalPages}>
            <ChevronsRight className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}

/* =============================
   Asset Form (inline)
   ============================= */
function AssetFormInline({ open, onOpenChange, asset, categories, onSave }: {
  open: boolean; onOpenChange: (v: boolean) => void; asset?: Asset; categories: Category[];
  onSave: (data: Partial<Asset> & { photo?: File | null }) => Promise<void> | void;
}) {
  const isEdit = !!asset;
  const [form, setForm] = useState({
    categoryId: asset?.categoryId ?? "",
    code: asset?.code ?? "",
    name: asset?.name ?? "",
    specification: asset?.specification ?? "",
    acquisitionDate: toDateInputValue(asset?.acquisitionDate),
    conditionNow: (asset?.conditionNow as any) ?? "BAIK",
    status: (asset?.status as any) ?? "TERSEDIA",
    dailyRate: toNumberSafe(asset?.dailyRate, 0),
    stock: toNumberSafe(asset?.stock, 1),
  });
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(asset?.photoUrl ?? null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    setForm({
      categoryId: asset?.categoryId ?? "",
      code: asset?.code ?? "",
      name: asset?.name ?? "",
      specification: asset?.specification ?? "",
      acquisitionDate: toDateInputValue(asset?.acquisitionDate),
      conditionNow: (asset?.conditionNow as any) ?? "BAIK",
      status: (asset?.status as any) ?? "TERSEDIA",
      dailyRate: toNumberSafe(asset?.dailyRate, 0),
      stock: toNumberSafe(asset?.stock, 1),
    });
    setPhotoFile(null); setPreview(asset?.photoUrl ?? null);
  }, [asset, open]);

  useEffect(() => { return () => { if (preview?.startsWith("blob:")) URL.revokeObjectURL(preview); }; }, [preview]);

  const canSubmit = !!form.categoryId && !!form.code && !!form.name;
  const update = (k: keyof typeof form, v: any) => setForm((s) => ({ ...s, [k]: v }));
  const onFile: React.ChangeEventHandler<HTMLInputElement> = (e) => {
    const f = e.target.files?.[0] ?? null; if (preview?.startsWith("blob:")) URL.revokeObjectURL(preview);
    setPhotoFile(f); setPreview(f ? URL.createObjectURL(f) : asset?.photoUrl ?? null);
  };

  const submit = async () => {
    if (!canSubmit || loading) return; setLoading(true);
    try { await onSave({ ...form, photo: photoFile ?? undefined }); }
    finally { setLoading(false); }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl rounded-2xl">
        <DialogHeader className="pb-2 border-b">
          <DialogTitle className="text-xl font-semibold text-gray-800">{isEdit ? "Edit Aset" : "Tambah Aset Baru"}</DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 py-4">
          <div className="md:col-span-2 space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <LabeledField label="Kode Aset *">
                <Input value={form.code} onChange={(e) => update("code", e.target.value)} placeholder="INV-001" className="rounded-lg" />
              </LabeledField>
              <LabeledField label="Kategori *">
                <Select value={form.categoryId} onValueChange={(v) => update("categoryId", v)}>
                  <SelectTrigger className="rounded-lg"><SelectValue placeholder="Pilih kategori" /></SelectTrigger>
                  <SelectContent className="rounded-lg">
                    {categories.map((c) => (<SelectItem key={c.id} value={c.id} className="rounded-md">{c.name}</SelectItem>))}
                  </SelectContent>
                </Select>
              </LabeledField>
            </div>
            <LabeledField label="Nama Aset *">
              <Input value={form.name} onChange={(e) => update("name", e.target.value)} placeholder="Contoh: Kamera DSLR Canon EOS 90D" className="rounded-lg" />
            </LabeledField>
            <LabeledField label="Spesifikasi">
              <Textarea value={form.specification} onChange={(e) => update("specification", e.target.value)} rows={3} className="rounded-lg" placeholder="Deskripsi detail spesifikasi aset..." />
            </LabeledField>
          </div>
          <ImgUpload preview={preview} onChange={onFile} placeholder="Foto Aset" />
        </div>

        <div className="bg-gray-50 p-4 rounded-xl space-y-4">
          <h3 className="font-medium text-gray-700">Informasi Tambahan</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <LabeledField label="Tanggal Perolehan">
              <Input type="date" value={form.acquisitionDate} onChange={(e) => update("acquisitionDate", e.target.value)} className="rounded-lg" />
            </LabeledField>
            <LabeledField label="Kondisi">
              <Select value={form.conditionNow} onValueChange={(v) => update("conditionNow", v)}>
                <SelectTrigger className="rounded-lg"><SelectValue placeholder="Pilih kondisi" /></SelectTrigger>
                <SelectContent className="rounded-lg">
                  {CONDITION_OPTIONS.map((o) => (<SelectItem key={o.value} value={o.value} className="rounded-md">{o.label}</SelectItem>))}
                </SelectContent>
              </Select>
            </LabeledField>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <LabeledField label="Tarif per Hari (Rp)">
              <Input type="number" min={0} value={form.dailyRate} onChange={(e) => update("dailyRate", toNumberSafe(e.target.value, 0))} className="rounded-lg" />
            </LabeledField>
            <LabeledField label="Jumlah Stok">
              <Input type="number" min={1} value={form.stock} onChange={(e) => update("stock", toNumberSafe(e.target.value, 1))} className="rounded-lg" />
            </LabeledField>
          </div>

          {isEdit && (
            <div className="rounded-xl border bg-white p-4">
              <h4 className="font-medium text-gray-800 mb-3">Update Status Aset</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <LabeledField label="Status">
                  <Select value={form.status} onValueChange={(v) => update("status", v)}>
                    <SelectTrigger className="rounded-lg"><SelectValue placeholder="Pilih status" /></SelectTrigger>
                    <SelectContent className="rounded-lg">
                      {STATUS_OPTIONS.map((o) => (<SelectItem key={o.value} value={o.value} className="rounded-md">{o.label}</SelectItem>))}
                    </SelectContent>
                  </Select>
                </LabeledField>
              </div>
              <p className="text-xs text-gray-500 mt-2">Perubahan status hanya tersedia saat mengedit aset. Gunakan <b>TIDAK_AKTIF</b> jika aset sudah tidak digunakan.</p>
            </div>
          )}
        </div>

        <DialogFooter className="pt-4 mt-4 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)} className="rounded-lg">Batal</Button>
          <Button onClick={submit} disabled={!canSubmit || loading} className="rounded-lg bg-blue-600 hover:bg-blue-700">
            {loading ? (
              <span className="flex items-center">
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Menyimpan...
              </span>
            ) : isEdit ? "Simpan Perubahan" : "Simpan Aset"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* =============================
   Service Form (inline)
   ============================= */
function ServiceFormInline({ open, onOpenChange, service, categories, onSave }: {
  open: boolean; onOpenChange: (v: boolean) => void; service?: Service; categories: Category[];
  onSave: (data: Partial<Service> & { photo?: File | null }) => Promise<void> | void;
}) {
  const isEdit = !!service;
  const [form, setForm] = useState({
    categoryId: service?.categoryId ?? "",
    code: service?.code ?? "",
    name: service?.name ?? "",
    description: service?.description ?? "",
    unitRate: toNumberSafe(service?.unitRate, 0),
    isActive: service?.isActive ?? true,
  });
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(service?.photoUrl ?? null);

  useEffect(() => {
    if (!open) return;
    setForm({
      categoryId: service?.categoryId ?? "",
      code: service?.code ?? "",
      name: service?.name ?? "",
      description: service?.description ?? "",
      unitRate: toNumberSafe(service?.unitRate, 0),
      isActive: service?.isActive ?? true,
    });
    setPhotoFile(null); setPreview(service?.photoUrl ?? null);
  }, [service, open]);

  useEffect(() => { return () => { if (preview?.startsWith("blob:")) URL.revokeObjectURL(preview); }; }, [preview]);

  const update = (k: keyof typeof form, v: any) => setForm((s) => ({ ...s, [k]: v }));
  const canSubmit = !!form.code && !!form.name;
  const onFile: React.ChangeEventHandler<HTMLInputElement> = (e) => {
    const f = e.target.files?.[0] ?? null; if (preview?.startsWith("blob:")) URL.revokeObjectURL(preview);
    setPhotoFile(f); setPreview(f ? URL.createObjectURL(f) : service?.photoUrl ?? null);
  };

  const submit = async () => { if (!canSubmit) return; await onSave({ ...form, photo: photoFile ?? undefined }); };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl rounded-2xl">
        <DialogHeader className="pb-2 border-b">
          <DialogTitle className="text-xl font-semibold text-gray-800">{isEdit ? "Edit Jasa" : "Tambah Jasa"}</DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 py-4">
          <div className="md:col-span-2 space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <LabeledField label="Kode Jasa *">
                <Input value={form.code} onChange={(e) => update("code", e.target.value)} placeholder="SRV-001" className="rounded-lg" />
              </LabeledField>
              <LabeledField label="Kategori">
                <Select value={form.categoryId} onValueChange={(v) => update("categoryId", v)}>
                  <SelectTrigger className="rounded-lg"><SelectValue placeholder="(Opsional)" /></SelectTrigger>
                  <SelectContent className="rounded-lg">
                    {categories.map((c) => (<SelectItem key={c.id} value={c.id} className="rounded-md">{c.name}</SelectItem>))}
                  </SelectContent>
                </Select>
              </LabeledField>
            </div>
            <LabeledField label="Nama Jasa *">
              <Input value={form.name} onChange={(e) => update("name", e.target.value)} placeholder="Contoh: Pijat, Editing Video, dsb." className="rounded-lg" />
            </LabeledField>
            <LabeledField label="Deskripsi">
              <Textarea value={form.description} onChange={(e) => update("description", e.target.value)} rows={3} className="rounded-lg" placeholder="Penjelasan singkat jasa..." />
            </LabeledField>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <LabeledField label="Tarif per Unit (Rp)">
                <Input type="number" min={0} value={form.unitRate} onChange={(e) => update("unitRate", toNumberSafe(e.target.value, 0))} className="rounded-lg" />
              </LabeledField>
              <LabeledField label="Status">
                <Select value={form.isActive ? "ACTIVE" : "INACTIVE"} onValueChange={(v) => update("isActive", v === "ACTIVE") }>
                  <SelectTrigger className="rounded-lg"><SelectValue placeholder="Pilih status" /></SelectTrigger>
                  <SelectContent className="rounded-lg">
                    <SelectItem value="ACTIVE" className="rounded-md">Aktif</SelectItem>
                    <SelectItem value="INACTIVE" className="rounded-md">Tidak Aktif</SelectItem>
                  </SelectContent>
                </Select>
              </LabeledField>
            </div>
          </div>
          <ImgUpload preview={preview} onChange={onFile} placeholder="Foto (Opsional)" />
        </div>

        <DialogFooter className="pt-4 mt-2 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)} className="rounded-lg">Batal</Button>
          <Button onClick={submit} disabled={!canSubmit} className="rounded-lg bg-indigo-600 hover:bg-indigo-700">{isEdit ? "Simpan Perubahan" : "Simpan Jasa"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* =============================
   PAGE: Inventory
   ============================= */
export default function InventoryPage() {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  // pagination state per tab
  const [assetPage, setAssetPage] = useState(1);
  const [assetPageSize, setAssetPageSize] = useState(10);
  const [servicePage, setServicePage] = useState(1);
  const [servicePageSize, setServicePageSize] = useState(10);

  const [assetDialogOpen, setAssetDialogOpen] = useState(false);
  const [serviceDialogOpen, setServiceDialogOpen] = useState(false);
  const [editingAsset, setEditingAsset] = useState<Asset | undefined>();
  const [editingService, setEditingService] = useState<Service | undefined>();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<{ type: "asset" | "service"; id: string; name: string } | null>(null);

  const [assets, setAssets] = useState<Asset[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [allCategories, setAllCategories] = useState<Category[]>([]);
  const [assetCategories, setAssetCategories] = useState<Category[]>([]);
  const [serviceCategories, setServiceCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const isAdmin = user?.role === Role.ADMIN;

  useEffect(() => {
    (async () => {
      setIsLoading(true); setError(null);
      try {
        const [a, s, cAset, cJasa] = await Promise.all([
          fetchData("/assets", { method: "GET" }),
          fetchData("/services", { method: "GET" }),
          fetchData("/categories/type/aset", { method: "GET" }),
          fetchData("/categories/type/jasa", { method: "GET" }),
        ]);
        setAssets(a); setServices(s); setAssetCategories(cAset); setServiceCategories(cJasa);
        setAllCategories([...cAset, ...cJasa]);
      } catch (e: any) {
        const msg = e?.response?.data?.message || "Gagal memuat data";
        setError(msg);
        await Swal.fire({ icon: "error", title: "Gagal memuat data", text: msg });
      } finally { setIsLoading(false); }
    })();
  }, []);

  useEffect(() => { setAssetPage(1); setServicePage(1); }, [searchQuery, categoryFilter, statusFilter]);

  const matches = (q: string, ...vals: string[]) => vals.some((v) => v?.toLowerCase().includes(q));

  const filteredAssets = assets.filter((x) => {
    const q = searchQuery.toLowerCase();
    const byQ = matches(q, x.name, x.code);
    const byCat = !categoryFilter || categoryFilter === "all" || x.categoryId === categoryFilter;
    const byStatus = !statusFilter || statusFilter === "all" || x.status === statusFilter;
    return byQ && byCat && byStatus;
  });

  const filteredServices = services.filter((x) => {
    const q = searchQuery.toLowerCase();
    const byQ = matches(q, x.name, x.code);
    const byCat = !categoryFilter || categoryFilter === "all" || x.categoryId === categoryFilter;
    const byStatus = !statusFilter || statusFilter === "all" || (statusFilter === "ACTIVE" ? x.isActive : statusFilter === "INACTIVE" ? !x.isActive : true);
    return byQ && byCat && byStatus;
  });

  // slice paged data
  const assetTotal = filteredAssets.length;
  const pagedAssets = useMemo(() => filteredAssets.slice((assetPage - 1) * assetPageSize, (assetPage) * assetPageSize), [filteredAssets, assetPage, assetPageSize]);
  const serviceTotal = filteredServices.length;
  const pagedServices = useMemo(() => filteredServices.slice((servicePage - 1) * servicePageSize, (servicePage) * servicePageSize), [filteredServices, servicePage, servicePageSize]);

  // Columns
  const assetColumns = [
    {
      key: "photoUrl",
      title: "Foto",
      render: (v: string, r: Asset) => (
        <div className="w-12 h-12 rounded-lg overflow-hidden bg-gray-100 flex items-center justify-center">
          {v ? (<Image src={v || "/placeholder.svg"} alt={r.name} width={48} height={48} className="object-cover" />) : (<Package className="w-6 h-6 text-gray-400" />)}
        </div>
      ),
    },
    { key: "code", title: "Kode", render: (v: string) => (<span className="font-mono text-sm bg-gray-100 px-2 py-1 rounded-md">{v}</span>) },
    { key: "name", title: "Nama Aset", render: (v: string, r: Asset) => (
      <div>
        <p className="font-medium">{v}</p>
        {r.specification && <p className="text-sm text-gray-500 truncate max-w-xs">{r.specification}</p>}
      </div>
    ) },
    { key: "categoryId", title: "Kategori", render: (v: string) => allCategories.find((c) => c.id === v)?.name || "-" },
    { key: "conditionNow", title: "Kondisi", render: (v: string) => <StatusBadge status={v} /> },
    { key: "status", title: "Status", render: (v: string) => <StatusBadge status={v} /> },
    { key: "dailyRate", title: "Tarif/Hari", render: (v: number) => formatCurrency(v) },
    { key: "stock", title: "Stok", render: (v: number) => `${v} unit` },
    ...(isAdmin ? [{ key: "actions", title: "Aksi", render: (_: any, r: Asset) => (
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" onClick={() => { setEditingAsset(r); setAssetDialogOpen(true); }} className="rounded-lg"><Edit className="w-4 h-4" /></Button>
        <Button variant="ghost" size="sm" onClick={() => { setItemToDelete({ type: "asset", id: r.id, name: r.name }); setDeleteDialogOpen(true); }} className="rounded-lg text-red-600 hover:text-red-700"><Trash2 className="w-4 h-4" /></Button>
      </div>
    )}] : [{ key: "actions", title: "Aksi", render: () => (<Button variant="ghost" size="sm" className="rounded-lg"><Eye className="w-4 h-4" /></Button>) }]),
  ];

  const serviceColumns = [
    {
      key: "photoUrl",
      title: "Foto",
      render: (v: string, r: Service) => (
        <div className="w-12 h-12 rounded-lg overflow-hidden bg-gray-100 flex items-center justify-center">
          {v ? (<Image src={v || "/placeholder.svg"} alt={r.name} width={48} height={48} className="object-cover" />) : (<Package className="w-6 h-6 text-gray-400" />)}
        </div>
      ),
    },
    { key: "code", title: "Kode", render: (v: string) => (<span className="font-mono text-sm bg-gray-100 px-2 py-1 rounded-md">{v}</span>) },
    { key: "name", title: "Nama Jasa", render: (v: string, r: Service) => (
      <div>
        <p className="font-medium">{v}</p>
        {r.description && <p className="text-sm text-gray-500 truncate max-w-xs">{r.description}</p>}
      </div>
    ) },
    { key: "categoryId", title: "Kategori", render: (v: string) => allCategories.find((c) => c.id === v)?.name || "-" },
    { key: "unitRate", title: "Tarif/Unit", render: (v: number) => formatCurrency(v) },
    { key: "isActive", title: "Status", render: (b: boolean) => <StatusBadge status={b ? "ACTIVE" : "INACTIVE"} /> },
    ...(isAdmin ? [{ key: "actions", title: "Aksi", render: (_: any, r: Service) => (
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" onClick={() => { setEditingService(r); setServiceDialogOpen(true); }} className="rounded-lg"><Edit className="w-4 h-4" /></Button>
        <Button variant="ghost" size="sm" onClick={() => { setItemToDelete({ type: "service", id: r.id, name: r.name }); setDeleteDialogOpen(true); }} className="rounded-lg text-red-600 hover:text-red-700"><Trash2 className="w-4 h-4" /></Button>
      </div>
    )}] : [{ key: "actions", title: "Aksi", render: () => (<Button variant="ghost" size="sm" className="rounded-lg"><Eye className="w-4 h-4" /></Button>) }]),
  ];

  // SAVE handlers (multipart) — compact
  const saveMultipart = async (url: string, method: "POST" | "PATCH", data: Record<string, any>) => {
    const fd = new FormData();
    Object.entries(data).forEach(([k, v]) => {
      if (v === undefined || v === null) return;
      if (k === "photo" && v instanceof File) fd.append("photo", v);
      else if (typeof v === "boolean") fd.append(k, v ? "true" : "false");
      else fd.append(k, String(v));
    });
    return fetchData(url, { method, data: fd });
  };

  const handleSaveAsset = async (payload: Partial<Asset> & { photo?: File | null }) => {
    try {
      const method = editingAsset ? "PATCH" : "POST";
      const url = editingAsset ? `/assets/${editingAsset.id}` : "/assets";
      const res = await saveMultipart(url, method, payload);
      setAssets((prev) => (editingAsset ? prev.map((x) => (x.id === editingAsset.id ? res.asset : x)) : [...prev, res.asset]));
      await Swal.fire({ icon: "success", title: `Aset berhasil ${editingAsset ? "diupdate" : "dibuat"}`, text: res.message, timer: 1500, showConfirmButton: false });
      setEditingAsset(undefined); setAssetDialogOpen(false);
    } catch (e: any) {
      await Swal.fire({ icon: "error", title: "Gagal menyimpan aset", text: e?.response?.data?.message || "Gagal menyimpan aset" });
    }
  };

  const handleSaveService = async (payload: Partial<Service> & { photo?: File | null }) => {
    try {
      const method = editingService ? "PATCH" : "POST";
      const url = editingService ? `/services/${editingService.id}` : "/services";
      const res = await saveMultipart(url, method, payload);
      setServices((prev) => (editingService ? prev.map((x) => (x.id === editingService.id ? res.service : x)) : [...prev, res.service]));
      await Swal.fire({ icon: "success", title: `Jasa berhasil ${editingService ? "diupdate" : "dibuat"}`, text: res.message, timer: 1500, showConfirmButton: false });
      setEditingService(undefined); setServiceDialogOpen(false);
    } catch (e: any) {
      await Swal.fire({ icon: "error", title: "Gagal menyimpan jasa", text: e?.response?.data?.message || "Gagal menyimpan jasa" });
    }
  };

  const handleDelete = async () => {
    if (!itemToDelete) return;
    try {
      await fetchData(itemToDelete.type === "asset" ? `/assets/${itemToDelete.id}` : `/services/${itemToDelete.id}`, { method: "DELETE" });
      if (itemToDelete.type === "asset") setAssets((p) => p.filter((x) => x.id !== itemToDelete.id)); else setServices((p) => p.filter((x) => x.id !== itemToDelete.id));
      await Swal.fire({ icon: "success", title: "Berhasil", text: `${itemToDelete.type === "asset" ? "Aset" : "Jasa"} "${itemToDelete.name}" berhasil dihapus`, timer: 1500, showConfirmButton: false });
      setItemToDelete(null); setDeleteDialogOpen(false);
    } catch (e: any) {
      await Swal.fire({ icon: "error", title: "Gagal menghapus", text: e?.response?.data?.message || "Gagal menghapus" });
    }
  };

  if (isLoading) return (
    <div className="flex min-height-screen min-h-screen items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
    </div>
  );
  if (error) return (
    <div className="flex min-h-screen items-center justify-center">
      <Alert className="rounded-xl border-red-200 bg-red-50 max-w-md"><AlertDescription className="text-red-800">{error}</AlertDescription></Alert>
    </div>
  );

  return (
    <div className="space-y-6 md:-ml-24">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Inventaris</h1>
          <p className="text-gray-600 mt-2">{isAdmin ? "Kelola aset dan jasa multimedia" : "Jelajahi aset dan jasa yang tersedia"}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4 p-4 bg-white rounded-2xl shadow-sm border">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input placeholder="Cari aset atau jasa..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-10 rounded-xl border-2 focus:border-indigo-500" />
        </div>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-48 rounded-xl"><SelectValue placeholder="Semua Kategori" /></SelectTrigger>
          <SelectContent className="rounded-xl">
            <SelectItem value="all" className="rounded-lg">Semua Kategori</SelectItem>
            {allCategories.map((c) => (<SelectItem key={c.id} value={c.id} className="rounded-lg">{c.name}</SelectItem>))}
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-56 rounded-xl"><SelectValue placeholder="Filter Status (Aset/Jasa)" /></SelectTrigger>
          <SelectContent className="rounded-xl">
            <SelectItem value="all" className="rounded-lg">Semua Status</SelectItem>
            <SelectItem value="TERSEDIA" className="rounded-lg">(Aset) Tersedia</SelectItem>
            <SelectItem value="DIPINJAM" className="rounded-lg">(Aset) Dipinjam</SelectItem>
            <SelectItem value="TIDAK_AKTIF" className="rounded-lg">(Aset) Tidak Aktif</SelectItem>
            <SelectItem value="ACTIVE" className="rounded-lg">(Jasa) Aktif</SelectItem>
            <SelectItem value="INACTIVE" className="rounded-lg">(Jasa) Tidak Aktif</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="assets" className="space-y-6">
        <div className="flex items-center justify-between">
          <TabsList className="grid w-fit grid-cols-2 rounded-xl">
            <TabsTrigger value="assets" className="rounded-lg">Aset</TabsTrigger>
            <TabsTrigger value="services" className="rounded-lg">Jasa</TabsTrigger>
          </TabsList>
          {isAdmin && (
            <div className="flex gap-2">
              <Button onClick={() => { setEditingAsset(undefined); setAssetDialogOpen(true); }} className="rounded-xl bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-600 hover:to-violet-700"><Plus className="w-4 h-4 mr-2" /> Tambah Aset</Button>
              <Button onClick={() => { setEditingService(undefined); setServiceDialogOpen(true); }} variant="outline" className="rounded-xl"><Plus className="w-4 h-4 mr-2" /> Tambah Jasa</Button>
            </div>
          )}
        </div>

        {/* ASET */}
        <TabsContent value="assets" className="space-y-3">
          <DataTable data={pagedAssets} columns={assetColumns} searchable={false} />
          <Pagination total={assetTotal} page={assetPage} setPage={setAssetPage} pageSize={assetPageSize} setPageSize={setAssetPageSize} />
        </TabsContent>

        {/* JASA */}
        <TabsContent value="services" className="space-y-3">
          <DataTable data={pagedServices} columns={serviceColumns} searchable={false} />
          <Pagination total={serviceTotal} page={servicePage} setPage={setServicePage} pageSize={servicePageSize} setPageSize={setServicePageSize} />
        </TabsContent>
      </Tabs>

      {/* Dialogs */}
      <AssetFormInline open={assetDialogOpen} onOpenChange={setAssetDialogOpen} asset={editingAsset} onSave={handleSaveAsset} categories={assetCategories} />
      <ServiceFormInline open={serviceDialogOpen} onOpenChange={setServiceDialogOpen} service={editingService} onSave={handleSaveService} categories={serviceCategories} />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Konfirmasi Hapus</AlertDialogTitle>
            <AlertDialogDescription>
              Apakah Anda yakin ingin menghapus {itemToDelete?.type === "asset" ? "aset" : "jasa"} "{itemToDelete?.name}"? Tindakan ini tidak dapat dibatalkan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl">Batal</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="rounded-xl bg-red-600 hover:bg-red-700">Hapus</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}