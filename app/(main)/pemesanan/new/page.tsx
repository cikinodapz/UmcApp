"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent } from "@/components/ui/card"
import { Wizard } from "@/components/wizard"
import { DateRangePicker } from "@/components/date-range-picker"
import { ItemPickerDialog } from "@/components/item-picker-dialog"
import { useAuth } from "@/contexts/auth-context"
import { formatCurrency, formatDateTime } from "@/lib/format"
import { Calendar, Package, FileText, Plus } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import type { DateRange } from "react-day-picker"

interface SelectedItem {
  id: string
  type: "asset" | "service"
  name: string
  price: number
  qty: number
  maxQty: number
}

export default function NewBookingPage() {
  const { user } = useAuth()
  const router = useRouter()
  const { toast } = useToast()
  const [currentStep, setCurrentStep] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  const [itemPickerOpen, setItemPickerOpen] = useState(false)

  // Form data
  const [dateRange, setDateRange] = useState<DateRange | undefined>()
  const [selectedItems, setSelectedItems] = useState<SelectedItem[]>([])
  const [notes, setNotes] = useState("")

  // Calculate totals
  const subtotal = selectedItems.reduce((sum, item) => sum + item.price * item.qty, 0)
  const days =
    dateRange?.from && dateRange?.to
      ? Math.ceil((dateRange.to.getTime() - dateRange.from.getTime()) / (1000 * 60 * 60 * 24)) + 1
      : 1
  const total = subtotal * days

  const canGoNext = () => {
    switch (currentStep) {
      case 0:
        return dateRange?.from && dateRange?.to
      case 1:
        return selectedItems.length > 0
      case 2:
        return true
      default:
        return false
    }
  }

  const handleNext = () => {
    if (currentStep < 2) {
      setCurrentStep(currentStep + 1)
    }
  }

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleFinish = async () => {
    setIsLoading(true)

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 2000))

    // In a real app, this would make an API call to create the booking
    console.log("Creating booking:", {
      userId: user?.id,
      dateRange,
      selectedItems,
      notes,
      total,
    })

    toast({
      title: "Booking Berhasil Dibuat",
      description: "Booking Anda telah dibuat dan menunggu konfirmasi admin",
    })

    router.push("/bookings")
  }

  const steps = [
    {
      title: "Pilih Tanggal",
      description: "Tentukan rentang tanggal peminjaman",
      content: (
        <div className="space-y-6">
          <div className="text-center">
            <Calendar className="w-16 h-16 mx-auto text-indigo-500 mb-4" />
            <h3 className="text-lg font-medium mb-2">Kapan Anda membutuhkan aset/jasa?</h3>
            <p className="text-gray-600">Pilih tanggal mulai dan selesai peminjaman</p>
          </div>
          <div className="max-w-md mx-auto">
            <Label htmlFor="dateRange" className="text-base font-medium">
              Rentang Tanggal
            </Label>
            <DateRangePicker
              value={dateRange}
              onChange={setDateRange}
              placeholder="Pilih tanggal mulai dan selesai"
              className="mt-2"
            />
            {dateRange?.from && dateRange?.to && (
              <div className="mt-4 p-4 bg-indigo-50 rounded-xl">
                <p className="text-sm text-indigo-800">
                  <strong>Durasi:</strong> {days} hari
                </p>
                <p className="text-sm text-indigo-800">
                  <strong>Dari:</strong> {formatDateTime(dateRange.from.toISOString())}
                </p>
                <p className="text-sm text-indigo-800">
                  <strong>Sampai:</strong> {formatDateTime(dateRange.to.toISOString())}
                </p>
              </div>
            )}
          </div>
        </div>
      ),
    },
    {
      title: "Pilih Item",
      description: "Pilih aset dan jasa yang ingin Anda booking",
      content: (
        <div className="space-y-6">
          <div className="text-center">
            <Package className="w-16 h-16 mx-auto text-indigo-500 mb-4" />
            <h3 className="text-lg font-medium mb-2">Pilih Aset & Jasa</h3>
            <p className="text-gray-600">Tambahkan item yang ingin Anda booking</p>
          </div>

          <div className="max-w-2xl mx-auto">
            <Button
              onClick={() => setItemPickerOpen(true)}
              variant="outline"
              className="w-full h-16 rounded-xl border-2 border-dashed border-gray-300 hover:border-indigo-500 hover:bg-indigo-50"
            >
              <Plus className="w-6 h-6 mr-2" />
              Tambah Aset & Jasa
            </Button>

            {selectedItems.length > 0 && (
              <div className="mt-6 space-y-4">
                <h4 className="font-medium">Item Terpilih ({selectedItems.length})</h4>
                {selectedItems.map((item, index) => (
                  <Card key={`${item.type}-${item.id}`} className="rounded-xl">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h5 className="font-medium">{item.name}</h5>
                          <p className="text-sm text-gray-500 capitalize">{item.type}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-medium">
                            {formatCurrency(item.price)} x {item.qty}
                          </p>
                          <p className="text-sm text-gray-500">= {formatCurrency(item.price * item.qty)}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
                <div className="p-4 bg-indigo-50 rounded-xl">
                  <div className="flex justify-between items-center">
                    <span className="font-medium text-indigo-900">Subtotal per hari:</span>
                    <span className="font-bold text-indigo-900">{formatCurrency(subtotal)}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      ),
    },
    {
      title: "Konfirmasi",
      description: "Tinjau dan konfirmasi booking Anda",
      content: (
        <div className="space-y-6">
          <div className="text-center">
            <FileText className="w-16 h-16 mx-auto text-indigo-500 mb-4" />
            <h3 className="text-lg font-medium mb-2">Konfirmasi Booking</h3>
            <p className="text-gray-600">Tinjau detail booking sebelum mengirim</p>
          </div>

          <div className="max-w-2xl mx-auto space-y-6">
            {/* Date Summary */}
            <Card className="rounded-xl">
              <CardContent className="p-6">
                <h4 className="font-medium mb-4">Detail Tanggal</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-gray-500">Tanggal Mulai</p>
                    <p className="font-medium">
                      {dateRange?.from ? formatDateTime(dateRange.from.toISOString()) : "-"}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-500">Tanggal Selesai</p>
                    <p className="font-medium">{dateRange?.to ? formatDateTime(dateRange.to.toISOString()) : "-"}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Durasi</p>
                    <p className="font-medium">{days} hari</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Items Summary */}
            <Card className="rounded-xl">
              <CardContent className="p-6">
                <h4 className="font-medium mb-4">Item Booking ({selectedItems.length})</h4>
                <div className="space-y-3">
                  {selectedItems.map((item) => (
                    <div key={`${item.type}-${item.id}`} className="flex justify-between items-center">
                      <div>
                        <p className="font-medium">{item.name}</p>
                        <p className="text-sm text-gray-500 capitalize">
                          {item.type} • Qty: {item.qty}
                        </p>
                      </div>
                      <p className="font-medium">{formatCurrency(item.price * item.qty)}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Total */}
            <Card className="rounded-xl bg-gradient-to-r from-indigo-500 to-violet-600 text-white">
              <CardContent className="p-6">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-indigo-100">Total Pembayaran</p>
                    <p className="text-sm text-indigo-200">
                      {formatCurrency(subtotal)} x {days} hari
                    </p>
                  </div>
                  <p className="text-2xl font-bold">{formatCurrency(total)}</p>
                </div>
              </CardContent>
            </Card>

            {/* Notes */}
            <div className="space-y-2">
              <Label htmlFor="notes" className="text-base font-medium">
                Catatan (Opsional)
              </Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Tambahkan catatan untuk booking ini..."
                className="rounded-xl"
                rows={3}
              />
            </div>
          </div>
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Buat Booking Baru</h1>
        <p className="text-gray-600 mt-2">Ikuti langkah-langkah untuk membuat booking aset dan jasa</p>
      </div>

      {/* Wizard */}
      <Wizard
        steps={steps}
        currentStep={currentStep}
        onStepChange={setCurrentStep}
        onNext={handleNext}
        onPrevious={handlePrevious}
        onFinish={handleFinish}
        canGoNext={canGoNext()}
        canGoPrevious={currentStep > 0}
        isLoading={isLoading}
      />

      {/* Item Picker Dialog */}
      <ItemPickerDialog
        open={itemPickerOpen}
        onOpenChange={setItemPickerOpen}
        selectedItems={selectedItems}
        onSelect={setSelectedItems}
      />
    </div>
  )
}
