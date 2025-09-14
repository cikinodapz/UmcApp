"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import type { Asset } from "@/types"
import { Condition, AssetStatus } from "@/types"
import { mockCategories } from "@/lib/mock"

interface AssetFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  asset?: Asset
  onSave: (asset: Partial<Asset>) => void
}

export function AssetFormDialog({ open, onOpenChange, asset, onSave }: AssetFormDialogProps) {
  const { toast } = useToast()
  const [formData, setFormData] = useState({
    code: asset?.code || "",
    name: asset?.name || "",
    categoryId: asset?.categoryId || "",
    specification: asset?.specification || "",
    conditionNow: asset?.conditionNow || Condition.BAIK,
    status: asset?.status || AssetStatus.TERSEDIA,
    dailyRate: asset?.dailyRate?.toString() || "",
    stock: asset?.stock?.toString() || "",
    photoUrl: asset?.photoUrl || "",
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.code || !formData.name || !formData.dailyRate || !formData.stock) {
      toast({
        title: "Error",
        description: "Mohon lengkapi semua field yang wajib diisi",
        variant: "destructive",
      })
      return
    }

    const assetData: Partial<Asset> = {
      ...formData,
      dailyRate: Number.parseInt(formData.dailyRate),
      stock: Number.parseInt(formData.stock),
      acquisitionDate: asset?.acquisitionDate || new Date().toISOString().split("T")[0],
    }

    onSave(assetData)
    onOpenChange(false)
    toast({
      title: "Berhasil",
      description: `Aset ${asset ? "diperbarui" : "ditambahkan"} successfully`,
    })
  }

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] rounded-2xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">{asset ? "Edit Aset" : "Tambah Aset Baru"}</DialogTitle>
          <DialogDescription>
            {asset ? "Perbarui informasi aset" : "Tambahkan aset baru ke inventaris"}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="code">Kode Aset *</Label>
              <Input
                id="code"
                value={formData.code}
                onChange={(e) => handleChange("code", e.target.value)}
                placeholder="CAM-001"
                className="rounded-xl"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="categoryId">Kategori</Label>
              <Select value={formData.categoryId} onValueChange={(value) => handleChange("categoryId", value)}>
                <SelectTrigger className="rounded-xl">
                  <SelectValue placeholder="Pilih kategori" />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  {mockCategories.map((category) => (
                    <SelectItem key={category.id} value={category.id} className="rounded-lg">
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="name">Nama Aset *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => handleChange("name", e.target.value)}
              placeholder="Canon EOS R5"
              className="rounded-xl"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="specification">Spesifikasi</Label>
            <Textarea
              id="specification"
              value={formData.specification}
              onChange={(e) => handleChange("specification", e.target.value)}
              placeholder="Mirrorless Camera 45MP, 8K Video"
              className="rounded-xl"
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="conditionNow">Kondisi</Label>
              <Select value={formData.conditionNow} onValueChange={(value) => handleChange("conditionNow", value)}>
                <SelectTrigger className="rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  <SelectItem value={Condition.BAIK} className="rounded-lg">
                    Baik
                  </SelectItem>
                  <SelectItem value={Condition.RUSAK_RINGAN} className="rounded-lg">
                    Rusak Ringan
                  </SelectItem>
                  <SelectItem value={Condition.RUSAK_BERAT} className="rounded-lg">
                    Rusak Berat
                  </SelectItem>
                  <SelectItem value={Condition.HILANG} className="rounded-lg">
                    Hilang
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select value={formData.status} onValueChange={(value) => handleChange("status", value)}>
                <SelectTrigger className="rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  <SelectItem value={AssetStatus.TERSEDIA} className="rounded-lg">
                    Tersedia
                  </SelectItem>
                  <SelectItem value={AssetStatus.DIPINJAM} className="rounded-lg">
                    Dipinjam
                  </SelectItem>
                  <SelectItem value={AssetStatus.TIDAK_AKTIF} className="rounded-lg">
                    Tidak Aktif
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="dailyRate">Tarif Harian (IDR) *</Label>
              <Input
                id="dailyRate"
                type="number"
                value={formData.dailyRate}
                onChange={(e) => handleChange("dailyRate", e.target.value)}
                placeholder="500000"
                className="rounded-xl"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="stock">Stok *</Label>
              <Input
                id="stock"
                type="number"
                value={formData.stock}
                onChange={(e) => handleChange("stock", e.target.value)}
                placeholder="2"
                className="rounded-xl"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="photoUrl">URL Foto</Label>
            <Input
              id="photoUrl"
              value={formData.photoUrl}
              onChange={(e) => handleChange("photoUrl", e.target.value)}
              placeholder="/canon-eos-r5.jpg"
              className="rounded-xl"
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="rounded-xl">
              Batal
            </Button>
            <Button
              type="submit"
              className="rounded-xl bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-600 hover:to-violet-700"
            >
              {asset ? "Perbarui" : "Tambah"} Aset
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
