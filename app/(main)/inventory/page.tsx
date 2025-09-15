"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
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
import { DataTable } from "@/components/data-table"
import { StatusBadge } from "@/components/status-badge"
import { AssetFormDialog } from "@/components/asset-form-dialog"
import { ServiceFormDialog } from "@/components/service-form-dialog"
import { useAuth } from "@/contexts/auth-context"
import { mockAssets, mockServices, mockCategories } from "@/lib/mock"
import type { Asset, Service } from "@/types"
import { Role } from "@/types"
import { formatCurrency } from "@/lib/format"
import { Plus, Search, Edit, Trash2, Eye, Package } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import Image from "next/image"

export default function InventoryPage() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [searchQuery, setSearchQuery] = useState("")
  const [categoryFilter, setCategoryFilter] = useState("")
  const [statusFilter, setStatusFilter] = useState("")
  const [assetDialogOpen, setAssetDialogOpen] = useState(false)
  const [serviceDialogOpen, setServiceDialogOpen] = useState(false)
  const [editingAsset, setEditingAsset] = useState<Asset | undefined>()
  const [editingService, setEditingService] = useState<Service | undefined>()
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [itemToDelete, setItemToDelete] = useState<{ type: "asset" | "service"; id: string; name: string } | null>(null)

  const isAdmin = user?.role === Role.ADMIN

  // Filter assets
  const filteredAssets = mockAssets.filter((asset) => {
    const matchesSearch =
      asset.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      asset.code.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesCategory = !categoryFilter || categoryFilter === "all" || asset.categoryId === categoryFilter
    const matchesStatus = !statusFilter || statusFilter === "all" || asset.status === statusFilter
    return matchesSearch && matchesCategory && matchesStatus
  })

  // Filter services
  const filteredServices = mockServices.filter((service) => {
    const matchesSearch =
      service.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      service.code.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesCategory = !categoryFilter || categoryFilter === "all" || service.categoryId === categoryFilter
    const matchesStatus =
      !statusFilter || statusFilter === "all" || (statusFilter === "ACTIVE" ? service.isActive : !service.isActive)
    return matchesSearch && matchesCategory && matchesStatus
  })

  // Asset columns
  const assetColumns = [
    {
      key: "photoUrl",
      title: "Foto",
      render: (value: string, asset: Asset) => (
        <div className="w-12 h-12 rounded-lg overflow-hidden bg-gray-100 flex items-center justify-center">
          {value ? (
            <Image src={value || "/placeholder.svg"} alt={asset.name} width={48} height={48} className="object-cover" />
          ) : (
            <Package className="w-6 h-6 text-gray-400" />
          )}
        </div>
      ),
    },
    {
      key: "code",
      title: "Kode",
      render: (value: string) => <span className="font-mono text-sm bg-gray-100 px-2 py-1 rounded-md">{value}</span>,
    },
    {
      key: "name",
      title: "Nama Aset",
      render: (value: string, asset: Asset) => (
        <div>
          <p className="font-medium">{value}</p>
          {asset.specification && <p className="text-sm text-gray-500 truncate max-w-xs">{asset.specification}</p>}
        </div>
      ),
    },
    {
      key: "categoryId",
      title: "Kategori",
      render: (value: string) => {
        const category = mockCategories.find((c) => c.id === value)
        return category?.name || "-"
      },
    },
    {
      key: "conditionNow",
      title: "Kondisi",
      render: (value: string) => <StatusBadge status={value} />,
    },
    {
      key: "status",
      title: "Status",
      render: (value: string) => <StatusBadge status={value} />,
    },
    {
      key: "dailyRate",
      title: "Tarif/Hari",
      render: (value: number) => formatCurrency(value),
    },
    {
      key: "stock",
      title: "Stok",
      render: (value: number) => `${value} unit`,
    },
    ...(isAdmin
      ? [
          {
            key: "actions",
            title: "Aksi",
            render: (_: any, asset: Asset) => (
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setEditingAsset(asset)
                    setAssetDialogOpen(true)
                  }}
                  className="rounded-lg"
                >
                  <Edit className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setItemToDelete({ type: "asset", id: asset.id, name: asset.name })
                    setDeleteDialogOpen(true)
                  }}
                  className="rounded-lg text-red-600 hover:text-red-700"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            ),
          },
        ]
      : [
          {
            key: "actions",
            title: "Aksi",
            render: (_: any, asset: Asset) => (
              <Button variant="ghost" size="sm" className="rounded-lg">
                <Eye className="w-4 h-4" />
              </Button>
            ),
          },
        ]),
  ]

  // Service columns
  const serviceColumns = [
    {
      key: "code",
      title: "Kode",
      render: (value: string) => <span className="font-mono text-sm bg-gray-100 px-2 py-1 rounded-md">{value}</span>,
    },
    {
      key: "name",
      title: "Nama Jasa",
      render: (value: string, service: Service) => (
        <div>
          <p className="font-medium">{value}</p>
          {service.description && <p className="text-sm text-gray-500 truncate max-w-xs">{service.description}</p>}
        </div>
      ),
    },
    {
      key: "categoryId",
      title: "Kategori",
      render: (value: string) => {
        const category = mockCategories.find((c) => c.id === value)
        return category?.name || "-"
      },
    },
    {
      key: "unitRate",
      title: "Tarif/Unit",
      render: (value: number) => formatCurrency(value),
    },
    {
      key: "isActive",
      title: "Status",
      render: (value: boolean) => <StatusBadge status={value ? "ACTIVE" : "INACTIVE"} />,
    },
    ...(isAdmin
      ? [
          {
            key: "actions",
            title: "Aksi",
            render: (_: any, service: Service) => (
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setEditingService(service)
                    setServiceDialogOpen(true)
                  }}
                  className="rounded-lg"
                >
                  <Edit className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setItemToDelete({ type: "service", id: service.id, name: service.name })
                    setDeleteDialogOpen(true)
                  }}
                  className="rounded-lg text-red-600 hover:text-red-700"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            ),
          },
        ]
      : [
          {
            key: "actions",
            title: "Aksi",
            render: (_: any, service: Service) => (
              <Button variant="ghost" size="sm" className="rounded-lg">
                <Eye className="w-4 h-4" />
              </Button>
            ),
          },
        ]),
  ]

  const handleSaveAsset = (assetData: Partial<Asset>) => {
    // In a real app, this would make an API call
    console.log("Saving asset:", assetData)
    setEditingAsset(undefined)
  }

  const handleSaveService = (serviceData: Partial<Service>) => {
    // In a real app, this would make an API call
    console.log("Saving service:", serviceData)
    setEditingService(undefined)
  }

  const handleDelete = () => {
    if (itemToDelete) {
      // In a real app, this would make an API call
      console.log("Deleting:", itemToDelete)
      toast({
        title: "Berhasil",
        description: `${itemToDelete.type === "asset" ? "Aset" : "Jasa"} "${itemToDelete.name}" berhasil dihapus`,
      })
      setItemToDelete(null)
      setDeleteDialogOpen(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Inventaris</h1>
          <p className="text-gray-600 mt-2">
            {isAdmin ? "Kelola aset dan jasa multimedia" : "Jelajahi aset dan jasa yang tersedia"}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4 p-4 bg-white rounded-2xl shadow-sm border">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder="Cari aset atau jasa..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 rounded-xl border-2 focus:border-indigo-500"
          />
        </div>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-48 rounded-xl">
            <SelectValue placeholder="Semua Kategori" />
          </SelectTrigger>
          <SelectContent className="rounded-xl">
            <SelectItem value="all" className="rounded-lg">
              Semua Kategori
            </SelectItem>
            {mockCategories.map((category) => (
              <SelectItem key={category.id} value={category.id} className="rounded-lg">
                {category.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-48 rounded-xl">
            <SelectValue placeholder="Semua Status" />
          </SelectTrigger>
          <SelectContent className="rounded-xl">
            <SelectItem value="all" className="rounded-lg">
              Semua Status
            </SelectItem>
            <SelectItem value="TERSEDIA" className="rounded-lg">
              Tersedia
            </SelectItem>
            <SelectItem value="DIPINJAM" className="rounded-lg">
              Dipinjam
            </SelectItem>
            <SelectItem value="ACTIVE" className="rounded-lg">
              Aktif
            </SelectItem>
            <SelectItem value="INACTIVE" className="rounded-lg">
              Tidak Aktif
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="assets" className="space-y-6">
        <div className="flex items-center justify-between">
          <TabsList className="grid w-fit grid-cols-2 rounded-xl">
            <TabsTrigger value="assets" className="rounded-lg">
              Aset
            </TabsTrigger>
            <TabsTrigger value="services" className="rounded-lg">
              Jasa
            </TabsTrigger>
          </TabsList>
          {isAdmin && (
            <div className="flex gap-2">
              <Button
                onClick={() => {
                  setEditingAsset(undefined)
                  setAssetDialogOpen(true)
                }}
                className="rounded-xl bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-600 hover:to-violet-700"
              >
                <Plus className="w-4 h-4 mr-2" />
                Tambah Aset
              </Button>
              <Button
                onClick={() => {
                  setEditingService(undefined)
                  setServiceDialogOpen(true)
                }}
                variant="outline"
                className="rounded-xl"
              >
                <Plus className="w-4 h-4 mr-2" />
                Tambah Jasa
              </Button>
            </div>
          )}
        </div>

        <TabsContent value="assets">
          <DataTable data={filteredAssets} columns={assetColumns} searchable={false} pageSize={10} />
        </TabsContent>

        <TabsContent value="services">
          <DataTable data={filteredServices} columns={serviceColumns} searchable={false} pageSize={10} />
        </TabsContent>
      </Tabs>

      {/* Dialogs */}
      <AssetFormDialog
        open={assetDialogOpen}
        onOpenChange={setAssetDialogOpen}
        asset={editingAsset}
        onSave={handleSaveAsset}
      />

      <ServiceFormDialog
        open={serviceDialogOpen}
        onOpenChange={setServiceDialogOpen}
        service={editingService}
        onSave={handleSaveService}
      />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Konfirmasi Hapus</AlertDialogTitle>
            <AlertDialogDescription>
              Apakah Anda yakin ingin menghapus {itemToDelete?.type === "asset" ? "aset" : "jasa"} "{itemToDelete?.name}
              "? Tindakan ini tidak dapat dibatalkan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl">Batal</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="rounded-xl bg-red-600 hover:bg-red-700">
              Hapus
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
