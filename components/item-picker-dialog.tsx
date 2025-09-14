"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { mockAssets, mockServices, mockCategories } from "@/lib/mock"
import type { Asset, Service } from "@/types"
import { AssetStatus } from "@/types"
import { formatCurrency } from "@/lib/format"
import { Package, Search, Plus } from "lucide-react"
import Image from "next/image"

interface SelectedItem {
  id: string
  type: "asset" | "service"
  name: string
  price: number
  qty: number
  maxQty: number
}

interface ItemPickerDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSelect: (items: SelectedItem[]) => void
  selectedItems: SelectedItem[]
}

export function ItemPickerDialog({ open, onOpenChange, onSelect, selectedItems }: ItemPickerDialogProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [localSelectedItems, setLocalSelectedItems] = useState<SelectedItem[]>(selectedItems)

  // Filter available assets and services
  const availableAssets = mockAssets.filter(
    (asset) =>
      asset.status === AssetStatus.TERSEDIA &&
      (asset.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        asset.code.toLowerCase().includes(searchQuery.toLowerCase())),
  )

  const availableServices = mockServices.filter(
    (service) =>
      service.isActive &&
      (service.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        service.code.toLowerCase().includes(searchQuery.toLowerCase())),
  )

  const handleAddItem = (item: Asset | Service, type: "asset" | "service") => {
    const existingItem = localSelectedItems.find((selected) => selected.id === item.id && selected.type === type)

    if (existingItem) {
      // Increase quantity if not at max
      const maxQty = type === "asset" ? (item as Asset).stock : 999
      if (existingItem.qty < maxQty) {
        setLocalSelectedItems((prev) =>
          prev.map((selected) =>
            selected.id === item.id && selected.type === type ? { ...selected, qty: selected.qty + 1 } : selected,
          ),
        )
      }
    } else {
      // Add new item
      const newItem: SelectedItem = {
        id: item.id,
        type,
        name: item.name,
        price: type === "asset" ? (item as Asset).dailyRate : (item as Service).unitRate,
        qty: 1,
        maxQty: type === "asset" ? (item as Asset).stock : 999,
      }
      setLocalSelectedItems((prev) => [...prev, newItem])
    }
  }

  const handleUpdateQuantity = (id: string, type: "asset" | "service", qty: number) => {
    if (qty <= 0) {
      setLocalSelectedItems((prev) => prev.filter((item) => !(item.id === id && item.type === type)))
    } else {
      setLocalSelectedItems((prev) =>
        prev.map((item) => (item.id === id && item.type === type ? { ...item, qty } : item)),
      )
    }
  }

  const handleConfirm = () => {
    onSelect(localSelectedItems)
    onOpenChange(false)
  }

  const getSelectedQuantity = (id: string, type: "asset" | "service") => {
    const item = localSelectedItems.find((selected) => selected.id === id && selected.type === type)
    return item?.qty || 0
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[900px] max-h-[80vh] rounded-2xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">Pilih Aset & Jasa</DialogTitle>
          <DialogDescription>Pilih aset dan jasa yang ingin Anda booking</DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Cari aset atau jasa..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 rounded-xl"
            />
          </div>

          {/* Selected Items Summary */}
          {localSelectedItems.length > 0 && (
            <div className="p-4 bg-indigo-50 rounded-xl">
              <h4 className="font-medium text-indigo-900 mb-2">Item Terpilih ({localSelectedItems.length})</h4>
              <div className="flex flex-wrap gap-2">
                {localSelectedItems.map((item) => (
                  <Badge key={`${item.type}-${item.id}`} variant="secondary" className="rounded-lg">
                    {item.name} x{item.qty}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Tabs */}
          <Tabs defaultValue="assets" className="space-y-4">
            <TabsList className="grid w-full grid-cols-2 rounded-xl">
              <TabsTrigger value="assets" className="rounded-lg">
                Aset ({availableAssets.length})
              </TabsTrigger>
              <TabsTrigger value="services" className="rounded-lg">
                Jasa ({availableServices.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="assets" className="space-y-4 max-h-96 overflow-y-auto">
              {availableAssets.map((asset) => {
                const category = mockCategories.find((c) => c.id === asset.categoryId)
                const selectedQty = getSelectedQuantity(asset.id, "asset")

                return (
                  <div key={asset.id} className="flex items-center gap-4 p-4 border rounded-xl hover:bg-gray-50">
                    <div className="w-16 h-16 rounded-lg overflow-hidden bg-gray-100 flex items-center justify-center">
                      {asset.photoUrl ? (
                        <Image
                          src={asset.photoUrl || "/placeholder.svg"}
                          alt={asset.name}
                          width={64}
                          height={64}
                          className="object-cover"
                        />
                      ) : (
                        <Package className="w-8 h-8 text-gray-400" />
                      )}
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium">{asset.name}</h4>
                      <p className="text-sm text-gray-500">{asset.code}</p>
                      {category && <p className="text-sm text-gray-500">{category.name}</p>}
                      <p className="text-sm font-medium text-indigo-600">{formatCurrency(asset.dailyRate)}/hari</p>
                      <p className="text-xs text-gray-400">Stok: {asset.stock} unit</p>
                    </div>
                    <div className="flex items-center gap-2">
                      {selectedQty > 0 ? (
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleUpdateQuantity(asset.id, "asset", selectedQty - 1)}
                            className="w-8 h-8 p-0 rounded-lg"
                          >
                            -
                          </Button>
                          <span className="w-8 text-center font-medium">{selectedQty}</span>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleUpdateQuantity(asset.id, "asset", selectedQty + 1)}
                            disabled={selectedQty >= asset.stock}
                            className="w-8 h-8 p-0 rounded-lg"
                          >
                            +
                          </Button>
                        </div>
                      ) : (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleAddItem(asset, "asset")}
                          className="rounded-lg"
                        >
                          <Plus className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                )
              })}
            </TabsContent>

            <TabsContent value="services" className="space-y-4 max-h-96 overflow-y-auto">
              {availableServices.map((service) => {
                const category = mockCategories.find((c) => c.id === service.categoryId)
                const selectedQty = getSelectedQuantity(service.id, "service")

                return (
                  <div key={service.id} className="flex items-center gap-4 p-4 border rounded-xl hover:bg-gray-50">
                    <div className="w-16 h-16 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center">
                      <Package className="w-8 h-8 text-white" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium">{service.name}</h4>
                      <p className="text-sm text-gray-500">{service.code}</p>
                      {category && <p className="text-sm text-gray-500">{category.name}</p>}
                      {service.description && <p className="text-sm text-gray-600">{service.description}</p>}
                      <p className="text-sm font-medium text-indigo-600">{formatCurrency(service.unitRate)}/unit</p>
                    </div>
                    <div className="flex items-center gap-2">
                      {selectedQty > 0 ? (
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleUpdateQuantity(service.id, "service", selectedQty - 1)}
                            className="w-8 h-8 p-0 rounded-lg"
                          >
                            -
                          </Button>
                          <span className="w-8 text-center font-medium">{selectedQty}</span>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleUpdateQuantity(service.id, "service", selectedQty + 1)}
                            className="w-8 h-8 p-0 rounded-lg"
                          >
                            +
                          </Button>
                        </div>
                      ) : (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleAddItem(service, "service")}
                          className="rounded-lg"
                        >
                          <Plus className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                )
              })}
            </TabsContent>
          </Tabs>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} className="rounded-xl">
            Batal
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={localSelectedItems.length === 0}
            className="rounded-xl bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-600 hover:to-violet-700"
          >
            Konfirmasi ({localSelectedItems.length} item)
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
