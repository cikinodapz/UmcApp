"use client";

import { useEffect, useState } from "react";
import Swal from "sweetalert2";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { formatCurrency } from "@/lib/format";
import { fetchData } from "@/lib/api";
import {
  CheckCircle2,
  Clock3,
  CreditCard,
  Loader2,
  XCircle,
} from "lucide-react";

type BookingItem = {
  id: string;
  bookingId: string;
  itemType: "ASET" | "JASA";
  assetId: string | null;
  serviceId: string | null;
  qty: number;
  price: string;
  asset?: { name: string; code: string } | null;
  service?: { name: string; code: string } | null;
};

type Booking = {
  id: string;
  userId: string;
  type: "ASET" | "JASA";
  startDatetime: string;
  endDatetime: string;
  status: "MENUNGGU" | string; // assume others possible
  approvedBy: string | null;
  approvedAt: string | null;
  notes: string;
  createdAt: string;
  updatedAt: string;
  items: BookingItem[];
};

function EmptyState({ text, hint }: { text: string; hint?: React.ReactNode }) {
  return (
    <div className="rounded-2xl border p-10 text-center text-gray-600">
      <p className="font-medium">{text}</p>
      {hint && <p className="text-sm text-gray-500 mt-1">{hint}</p>}
    </div>
  );
}

export default function BookingListPage() {
  const { toast } = useToast();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [bookingsLoading, setBookingsLoading] = useState<boolean>(false);
  const [bookingsBusy, setBookingsBusy] = useState<string | null>(null);

  // load bookings dari API
  const fetchBookings = async () => {
    setBookingsLoading(true);
    try {
      const data = await fetchData<{ bookings: Booking[] }>("/bookings", {
        method: "GET",
      });
      setBookings(data?.bookings || []);
    } catch (e: any) {
      const msg = e?.response?.data?.message || "Gagal memuat daftar booking";
      toast({ title: "Error", description: msg, variant: "destructive" });
    } finally {
      setBookingsLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // cancel booking
  async function cancelBooking(bookingId: string) {
    const result = await Swal.fire({
      title: "Batalkan booking?",
      text: "Tindakan ini tidak dapat dibatalkan.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Ya, batalkan",
      cancelButtonText: "Tidak",
      confirmButtonColor: "#ef4444",
      cancelButtonColor: "#6b7280",
      reverseButtons: true,
      focusCancel: true,
    });

    if (!result.isConfirmed) return;

    try {
      setBookingsBusy(`cancel-${bookingId}`);
      const data = await fetchData(`/bookings/${bookingId}/cancel`, {
        method: "PATCH",
      });

      await Swal.fire({
        title: "Dibatalkan",
        text: data.message || "Booking berhasil dibatalkan.",
        icon: "success",
        confirmButtonColor: "#16a34a",
      });

      await fetchBookings();
    } catch (e: any) {
      const msg = e?.response?.data?.message || "Gagal membatalkan booking";
      await Swal.fire({
        title: "Gagal",
        text: msg,
        icon: "error",
        confirmButtonColor: "#ef4444",
      });
    } finally {
      setBookingsBusy(null);
    }
  }

  // create payment
  async function createPayment(bookingId: string) {
    try {
      setBookingsBusy(`pay-${bookingId}`);
      const data = await fetchData(`/payments/create/${bookingId}`, {
        method: "POST",
      });
      toast({
        title: "Sukses",
        description: data.message || "Pembayaran berhasil dibuat.",
      });
      if (data.paymentUrl) {
        window.open(data.paymentUrl, "_blank");
      }
      await fetchBookings();
    } catch (e: any) {
      const msg = e?.response?.data?.message || "Gagal membuat pembayaran";
      toast({ title: "Error", description: msg, variant: "destructive" });
    } finally {
      setBookingsBusy(null);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Daftar Booking
          </h1>
          <p className="text-gray-600 mt-2">
            Lihat semua booking yang telah dibuat.
          </p>
        </div>
      </div>

      <div className="space-y-5">
        {bookingsLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <Loader2 className="w-8 h-8 animate-spin mx-auto text-gray-400" />
              <p className="text-gray-600 mt-2">Memuat data booking...</p>
            </div>
          </div>
        ) : bookings.length === 0 ? (
          <EmptyState
            text="Belum ada booking"
            hint={
              <div className="mt-2">
                <p className="text-sm">
                  Tambahkan item ke keranjang dan lakukan checkout di halaman pemesanan.
                </p>
              </div>
            }
          />
        ) : (
          <div className="space-y-6">
            {/* <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900">
                Daftar Booking
              </h2>
              <Badge variant="outline" className="rounded-md">
                Total: {bookings.length} booking
              </Badge>
            </div> */}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {bookings.map((b) => {
                const isBusy = bookingsBusy === `cancel-${b.id}` || bookingsBusy === `pay-${b.id}`;
                const total = b.items.reduce(
                  (sum, i) => sum + Number(i.price) * i.qty,
                  0
                );
                const isPending = b.status === "MENUNGGU";
                const isApproved =
                  b.status === "DISETUJUI" || b.status === "DIKONFIRMASI";
                const isRejected =
                  b.status === "DITOLAK" || b.status === "DIBATALKAN";

                return (
                  <Card
                    key={b.id}
                    className="rounded-2xl overflow-hidden hover:shadow-lg transition-shadow"
                  >
                    <CardHeader className="pb-4">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <CardTitle className="text-lg flex items-center gap-2">
                            Booking #{b.id.slice(0, 8)}
                            {isPending && (
                              <Clock3 className="w-4 h-4 text-amber-500" />
                            )}
                            {isApproved && (
                              <CheckCircle2 className="w-4 h-4 text-green-500" />
                            )}
                            {isRejected && (
                              <XCircle className="w-4 h-4 text-red-500" />
                            )}
                          </CardTitle>
                          <CardDescription className="text-xs">
                            Dibuat:{" "}
                            {new Date(b.createdAt).toLocaleDateString(
                              "id-ID"
                            )}
                          </CardDescription>
                        </div>
                        <Badge
                          variant={
                            isPending
                              ? "outline"
                              : isApproved
                              ? "secondary"
                              : "destructive"
                          }
                          className="rounded-md capitalize"
                        >
                          {b.status.toLowerCase()}
                        </Badge>
                      </div>

                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-500">Mulai:</span>
                          <span className="font-medium">
                            {new Date(b.startDatetime).toLocaleString(
                              "id-ID"
                            )}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500">Selesai:</span>
                          <span className="font-medium">
                            {new Date(b.endDatetime).toLocaleString("id-ID")}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500">Total:</span>
                          <span className="font-bold text-blue-600">
                            {formatCurrency(total)}
                          </span>
                        </div>
                      </div>

                      {b.notes && (
                        <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                          <p className="text-xs text-gray-600">
                            <span className="font-medium">Catatan:</span>{" "}
                            {b.notes}
                          </p>
                        </div>
                      )}
                    </CardHeader>

                    <CardContent className="space-y-4">
                      <div className="space-y-3">
                        <h4 className="font-medium text-sm text-gray-700">
                          Item Booking:
                        </h4>
                        {b.items.map((item, index) => (
                          <div
                            key={item.id}
                            className="flex justify-between items-center py-2 border-b last:border-b-0"
                          >
                            <div className="flex-1">
                              <p className="font-medium text-sm">
                                {item.asset?.name || item.service?.name}
                              </p>
                              <p className="text-xs text-gray-500">
                                {item.qty} ×{" "}
                                {formatCurrency(Number(item.price))}
                              </p>
                            </div>
                            <p className="font-semibold text-sm">
                              {formatCurrency(Number(item.price) * item.qty)}
                            </p>
                          </div>
                        ))}
                      </div>

                      {isPending && (
                        <Button
                          className="w-full h-12 rounded-xl !text-white font-medium shadow-lg hover:shadow-xl transition-all duration-200 !border-0 disabled:opacity-80 disabled:cursor-not-allowed"
                          onClick={() => cancelBooking(b.id)}
                          disabled={isBusy}
                          style={{
                            background: "linear-gradient(to right, rgb(248, 113, 113), rgb(220, 38, 38))",
                            color: "white",
                          }}
                        >
                          {isBusy ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin !text-white" />
                          ) : (
                            <XCircle className="mr-2 h-4 w-4 !text-white" />
                          )}
                          <span className="font-medium !text-white">Batalkan Booking</span>
                        </Button>
                      )}

                      {isApproved && (
                        <>
                          <div className="p-3 bg-green-50 rounded-lg">
                            <p className="text-xs text-green-700 text-center">
                              ✅ Booking telah disetujui pada{" "}
                              {b.approvedAt
                                ? new Date(b.approvedAt).toLocaleDateString(
                                    "id-ID"
                                  )
                                : "tanggal tidak tersedia"}
                            </p>
                          </div>
                          <Button
                            className="w-full h-12 rounded-xl !text-white font-medium shadow-lg hover:shadow-xl transition-all duration-200 !border-0 disabled:opacity-80 disabled:cursor-not-allowed"
                            onClick={() => createPayment(b.id)}
                            disabled={isBusy}
                            style={{
                              background: "linear-gradient(to right, rgb(99, 102, 241), rgb(139, 92, 246))",
                              color: "white",
                            }}
                          >
                            {isBusy ? (
                              <Loader2 className="mr-2 h-4 w-4 animate-spin !text-white" />
                            ) : (
                              <CreditCard className="mr-2 h-4 w-4 !text-white" />
                            )}
                            <span className="font-medium !text-white">Bayar Sekarang</span>
                          </Button>
                        </>
                      )}

                      {isRejected && (
                        <div className="p-3 bg-red-50 rounded-lg">
                          <p className="text-xs text-red-700 text-center">
                            ❌ Booking {b.status.toLowerCase()}
                          </p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
