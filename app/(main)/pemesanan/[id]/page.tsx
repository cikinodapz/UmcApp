"use client"

import { useState } from "react"
import { useParams } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { useToast } from "@/hooks/use-toast"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { StatusBadge } from "@/components/status-badge"
import { formatCurrency, formatDate } from "@/lib/format"
import { bookings, assets, services, payments, returns, fines, feedback } from "@/lib/mock"
import { Calendar, User, CreditCard, Package, MessageSquare, AlertTriangle } from "lucide-react"

export default function BookingDetailPage() {
  const params = useParams()
  const { user } = useAuth()
  const { toast } = useToast()
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false)
  const [isFeedbackDialogOpen, setIsFeedbackDialogOpen] = useState(false)
  const [paymentProof, setPaymentProof] = useState<File | null>(null)
  const [feedbackData, setFeedbackData] = useState({
    rating: 5,
    comment: "",
  })

  const bookingId = params.id as string
  const booking = bookings.find((b) => b.id === bookingId)

  if (!booking) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-500">Booking tidak ditemukan</p>
      </div>
    )
  }

  const bookingPayments = payments.filter((p) => p.bookingId === booking.id)
  const bookingReturns = returns.filter((r) => r.bookingId === booking.id)
  const bookingFines = fines.filter((f) => f.bookingId === booking.id)
  const bookingFeedback = feedback.filter((f) => f.bookingId === booking.id)

  const handlePaymentUpload = () => {
    if (!paymentProof) {
      toast({
        title: "Error",
        description: "Silakan pilih file bukti pembayaran",
        variant: "destructive",
      })
      return
    }

    console.log("Uploading payment proof:", paymentProof.name)
    toast({
      title: "Berhasil",
      description: "Bukti pembayaran berhasil diunggah",
    })
    setIsPaymentDialogOpen(false)
    setPaymentProof(null)
  }

  const handleFeedbackSubmit = () => {
    console.log("Submitting feedback:", feedbackData)
    toast({
      title: "Berhasil",
      description: "Feedback berhasil dikirim",
    })
    setIsFeedbackDialogOpen(false)
    setFeedbackData({ rating: 5, comment: "" })
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Detail Booking</h1>
          <p className="text-gray-600 mt-2">#{booking.id}</p>
        </div>
        <StatusBadge status={booking.status} />
      </div>

      {/* Main Info Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card className="rounded-2xl">
          <CardContent className="p-6">
            <div className="flex items-center">
              <Calendar className="h-8 w-8 text-indigo-600" />
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-500">Tanggal Booking</p>
                <p className="text-lg font-semibold">{formatDate(booking.startDate)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl">
          <CardContent className="p-6">
            <div className="flex items-center">
              <User className="h-8 w-8 text-indigo-600" />
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-500">Peminjam</p>
                <p className="text-lg font-semibold">{booking.borrowerName}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl">
          <CardContent className="p-6">
            <div className="flex items-center">
              <CreditCard className="h-8 w-8 text-indigo-600" />
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-500">Total</p>
                <p className="text-lg font-semibold">{formatCurrency(booking.totalAmount)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl">
          <CardContent className="p-6">
            <div className="flex items-center">
              <Package className="h-8 w-8 text-indigo-600" />
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-500">Items</p>
                <p className="text-lg font-semibold">{booking.items.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Information */}
      <Tabs defaultValue="items" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5 rounded-2xl">
          <TabsTrigger value="items" className="rounded-xl">
            Items
          </TabsTrigger>
          <TabsTrigger value="payments" className="rounded-xl">
            Pembayaran
          </TabsTrigger>
          <TabsTrigger value="returns" className="rounded-xl">
            Pengembalian
          </TabsTrigger>
          <TabsTrigger value="fines" className="rounded-xl">
            Denda
          </TabsTrigger>
          <TabsTrigger value="feedback" className="rounded-xl">
            Feedback
          </TabsTrigger>
        </TabsList>

        <TabsContent value="items">
          <Card className="rounded-2xl">
            <CardHeader>
              <CardTitle>Items yang Dibooking</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {booking.items.map((item) => {
                  const asset = assets.find((a) => a.id === item.itemId)
                  const service = services.find((s) => s.id === item.itemId)
                  const itemData = asset || service

                  return (
                    <div
                      key={item.itemId}
                      className="flex items-center justify-between p-4 border border-gray-200 rounded-xl"
                    >
                      <div className="flex items-center">
                        {asset && (
                          <img
                            src={asset.photoUrl || "/placeholder.svg"}
                            alt={asset.name}
                            className="w-16 h-16 object-cover rounded-xl mr-4"
                          />
                        )}
                        <div>
                          <h3 className="font-semibold">{itemData?.name}</h3>
                          <p className="text-sm text-gray-600">
                            {item.type === "asset" ? "Aset" : "Jasa"} • Qty: {item.quantity}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">{formatCurrency(item.price)}</p>
                        <p className="text-sm text-gray-600">per {item.type === "asset" ? "hari" : "unit"}</p>
                      </div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="payments">
          <Card className="rounded-2xl">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Riwayat Pembayaran</CardTitle>
              {user?.role === "peminjam" && booking.status === "approved" && (
                <Dialog open={isPaymentDialogOpen} onOpenChange={setIsPaymentDialogOpen}>
                  <DialogTrigger asChild>
                    <Button className="rounded-xl">Upload Bukti Bayar</Button>
                  </DialogTrigger>
                  <DialogContent className="rounded-2xl">
                    <DialogHeader>
                      <DialogTitle>Upload Bukti Pembayaran</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="payment-proof">File Bukti Pembayaran</Label>
                        <Input
                          id="payment-proof"
                          type="file"
                          accept="image/*"
                          onChange={(e) => setPaymentProof(e.target.files?.[0] || null)}
                          className="rounded-xl"
                        />
                      </div>
                      <Button onClick={handlePaymentUpload} className="w-full rounded-xl">
                        Upload Bukti Bayar
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              )}
            </CardHeader>
            <CardContent>
              {bookingPayments.length > 0 ? (
                <div className="space-y-4">
                  {bookingPayments.map((payment) => (
                    <div
                      key={payment.id}
                      className="flex items-center justify-between p-4 border border-gray-200 rounded-xl"
                    >
                      <div>
                        <p className="font-semibold">{formatCurrency(payment.amount)}</p>
                        <p className="text-sm text-gray-600">{formatDate(payment.paymentDate)}</p>
                      </div>
                      <StatusBadge status={payment.status} />
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-8">Belum ada pembayaran</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="returns">
          <Card className="rounded-2xl">
            <CardHeader>
              <CardTitle>Riwayat Pengembalian</CardTitle>
            </CardHeader>
            <CardContent>
              {bookingReturns.length > 0 ? (
                <div className="space-y-4">
                  {bookingReturns.map((returnItem) => (
                    <div key={returnItem.id} className="p-4 border border-gray-200 rounded-xl">
                      <div className="flex items-center justify-between mb-2">
                        <p className="font-semibold">Pengembalian #{returnItem.id}</p>
                        <StatusBadge status={returnItem.status} />
                      </div>
                      <p className="text-sm text-gray-600">Tanggal: {formatDate(returnItem.returnDate)}</p>
                      <p className="text-sm text-gray-600">Kondisi: {returnItem.condition}</p>
                      {returnItem.notes && <p className="text-sm text-gray-600 mt-2">Catatan: {returnItem.notes}</p>}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-8">Belum ada pengembalian</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="fines">
          <Card className="rounded-2xl">
            <CardHeader>
              <CardTitle>Denda</CardTitle>
            </CardHeader>
            <CardContent>
              {bookingFines.length > 0 ? (
                <div className="space-y-4">
                  {bookingFines.map((fine) => (
                    <div key={fine.id} className="p-4 border border-red-200 bg-red-50 rounded-xl">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center">
                          <AlertTriangle className="h-5 w-5 text-red-600 mr-2" />
                          <p className="font-semibold text-red-800">{fine.type}</p>
                        </div>
                        <p className="font-bold text-red-800">{formatCurrency(fine.amount)}</p>
                      </div>
                      <p className="text-sm text-red-700">{fine.reason}</p>
                      <StatusBadge status={fine.status} />
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-8">Tidak ada denda</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="feedback">
          <Card className="rounded-2xl">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Feedback</CardTitle>
              {user?.role === "peminjam" && booking.status === "completed" && (
                <Dialog open={isFeedbackDialogOpen} onOpenChange={setIsFeedbackDialogOpen}>
                  <DialogTrigger asChild>
                    <Button className="rounded-xl">
                      <MessageSquare className="h-4 w-4 mr-2" />
                      Beri Feedback
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="rounded-2xl">
                    <DialogHeader>
                      <DialogTitle>Berikan Feedback</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="rating">Rating (1-5)</Label>
                        <Input
                          id="rating"
                          type="number"
                          min="1"
                          max="5"
                          value={feedbackData.rating}
                          onChange={(e) =>
                            setFeedbackData({ ...feedbackData, rating: Number.parseInt(e.target.value) })
                          }
                          className="rounded-xl"
                        />
                      </div>
                      <div>
                        <Label htmlFor="comment">Komentar</Label>
                        <Textarea
                          id="comment"
                          value={feedbackData.comment}
                          onChange={(e) => setFeedbackData({ ...feedbackData, comment: e.target.value })}
                          className="rounded-xl"
                          rows={4}
                        />
                      </div>
                      <Button onClick={handleFeedbackSubmit} className="w-full rounded-xl">
                        Kirim Feedback
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              )}
            </CardHeader>
            <CardContent>
              {bookingFeedback.length > 0 ? (
                <div className="space-y-4">
                  {bookingFeedback.map((fb) => (
                    <div key={fb.id} className="p-4 border border-gray-200 rounded-xl">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center">
                          <div className="flex">
                            {[...Array(5)].map((_, i) => (
                              <span
                                key={i}
                                className={`text-lg ${i < fb.rating ? "text-yellow-400" : "text-gray-300"}`}
                              >
                                ★
                              </span>
                            ))}
                          </div>
                          <span className="ml-2 text-sm text-gray-600">({fb.rating}/5)</span>
                        </div>
                        <p className="text-sm text-gray-600">{formatDate(fb.createdAt)}</p>
                      </div>
                      <p className="text-gray-700">{fb.comment}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-8">Belum ada feedback</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
