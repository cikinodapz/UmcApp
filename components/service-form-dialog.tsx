"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
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
import type { Service } from "@/types"
import { mockCategories } from "@/lib/mock"

interface ServiceFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  service?: Service
  onSave: (service: Partial<Service>) => void
}

export function ServiceFormDialog({ open, onOpenChange, service, onSave }: ServiceFormDialogProps) {
  const { toast } = useToast()
  const [formData, setFormData] = useState({
    code: service?.code || "",
    name: service?.name || "",
    categoryId: service?.categoryId || "",
    description: service?.description || "",
    unitRate: service?.unitRate?.toString() || "",
    isActive: service?.isActive ?? true,
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.code || !formData.name || !formData.unitRate) {
      toast({
        title: "Error",
        description: "Mohon lengkapi semua field yang wajib diisi",
        variant: "destructive",
      })
      return
    }

    const serviceData: Partial<Service> = {
      ...formData,
      unitRate: Number.parseInt(formData.unitRate),
    }

    onSave(serviceData)
    onOpenChange(false)
    toast({
      title: "Berhasil",
      description: `Jasa ${service ? "diperbarui" : "ditambahkan"} successfully`,
    })
  }

  const handleChange = (field: string, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] rounded-2xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">{service ? "Edit Jasa" : "Tambah Jasa Baru"}</DialogTitle>
          <DialogDescription>
            {service ? "Perbarui informasi jasa" : "Tambahkan jasa baru ke inventaris"}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="code">Kode Jasa *</Label>
              <Input
                id="code"
                value={formData.code}
                onChange={(e) => handleChange("code", e.target.value)}
                placeholder="SVC-001"
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
            <Label htmlFor="name">Nama Jasa *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => handleChange("name", e.target.value)}
              placeholder="Jasa Fotografi Event"
              className="rounded-xl"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Deskripsi</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleChange("description", e.target.value)}
              placeholder="Layanan fotografer profesional untuk acara"
              className="rounded-xl"
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="unitRate">Tarif per Unit (IDR) *</Label>
            <Input
              id="unitRate"
              type="number"
              value={formData.unitRate}
              onChange={(e) => handleChange("unitRate", e.target.value)}
              placeholder="2000000"
              className="rounded-xl"
              required
            />
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="isActive"
              checked={formData.isActive}
              onCheckedChange={(checked) => handleChange("isActive", checked)}
            />
            <Label htmlFor="isActive">Jasa Aktif</Label>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="rounded-xl">
              Batal
            </Button>
            <Button
              type="submit"
              className="rounded-xl bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-600 hover:to-violet-700"
            >
              {service ? "Perbarui" : "Tambah"} Jasa
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
