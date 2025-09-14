"use client"

import { useState } from "react"
import { useAuth } from "@/contexts/auth-context"
import { useToast } from "@/hooks/use-toast"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { DataTable } from "@/components/data-table"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Plus, Pencil, Trash2 } from "lucide-react"
import { categories } from "@/lib/mock"
import type { Category } from "@/types"

export default function CategoriesPage() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)
  const [formData, setFormData] = useState({
    name: "",
    description: "",
  })

  // Only admin can access this page
  if (user?.role !== "admin") {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-500">Akses ditolak. Halaman ini hanya untuk admin.</p>
      </div>
    )
  }

  const handleSubmit = () => {
    if (editingCategory) {
      console.log("Updating category:", editingCategory.id, formData)
      toast({
        title: "Berhasil",
        description: "Kategori berhasil diperbarui",
      })
    } else {
      console.log("Creating category:", formData)
      toast({
        title: "Berhasil",
        description: "Kategori berhasil ditambahkan",
      })
    }

    setIsDialogOpen(false)
    setEditingCategory(null)
    setFormData({ name: "", description: "" })
  }

  const handleEdit = (category: Category) => {
    setEditingCategory(category)
    setFormData({
      name: category.name,
      description: category.description,
    })
    setIsDialogOpen(true)
  }

  const handleDelete = (category: Category) => {
    if (confirm(`Apakah Anda yakin ingin menghapus kategori "${category.name}"?`)) {
      console.log("Deleting category:", category.id)
      toast({
        title: "Berhasil",
        description: "Kategori berhasil dihapus",
      })
    }
  }

  const columns = [
    {
      accessorKey: "name",
      header: "Nama Kategori",
    },
    {
      accessorKey: "description",
      header: "Deskripsi",
    },
    {
      id: "actions",
      header: "Aksi",
      cell: ({ row }: { row: { original: Category } }) => (
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => handleEdit(row.original)} className="rounded-xl">
            <Pencil className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleDelete(row.original)}
            className="rounded-xl text-red-600 hover:text-red-700"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Kelola Kategori</h1>
          <p className="text-gray-600 mt-2">Kelola kategori aset dan jasa</p>
        </div>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-indigo-600 hover:bg-indigo-700 rounded-xl">
              <Plus className="h-4 w-4 mr-2" />
              Tambah Kategori
            </Button>
          </DialogTrigger>
          <DialogContent className="rounded-2xl">
            <DialogHeader>
              <DialogTitle>{editingCategory ? "Edit Kategori" : "Tambah Kategori Baru"}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="name">Nama Kategori</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="rounded-xl"
                />
              </div>
              <div>
                <Label htmlFor="description">Deskripsi</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="rounded-xl"
                />
              </div>
              <Button onClick={handleSubmit} className="w-full rounded-xl">
                {editingCategory ? "Perbarui" : "Tambah"} Kategori
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-200">
        <DataTable columns={columns} data={categories} searchKey="name" searchPlaceholder="Cari kategori..." />
      </div>
    </div>
  )
}
