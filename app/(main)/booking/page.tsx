"use client";

import { useEffect, useState, useCallback } from "react";
import { fetchData } from "@/lib/api";
import { Button } from "@/components/ui/button";
import Swal from 'sweetalert2';
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { StatusBadge } from "@/components/status-badge";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { useToast } from "@/components/ui/use-toast";
import { formatCurrency, formatDate } from "@/lib/format";
import Image from "next/image";

type Service = {
  id: string;
  name: string;
};

 type BookingItem = {
  id: string;
  type: string;
  quantity: number;
  unitPrice: string;
  subtotal: string;
  notes?: string | null;
  service?: { id: string; name: string; photoUrl?: string | null } | null;
  package?: { id: string; name: string; unitRate?: string | null; features?: string[] | null } | null;
 };

type Booking = {
  id: string;
  userId: string;
  type: string;
  status: string;
  startDate: string;
  endDate: string;
  totalAmount: string;
  notes?: string | null;
  items: BookingItem[];
  user?: { id: string; name: string; email: string } | null;
};

function toServicePhoto(p?: string | null) {
  if (!p) return null;
  if (/^https?:\/\//i.test(p)) return p;
  const base = process.env.NEXT_PUBLIC_API_URL || "";
  const path = p.startsWith("/uploads/") ? p : `/uploads/${p}`;
  return `${base}${path}`;
}

export default function BookingPage() {
  const { toast } = useToast();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  const loadBookings = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchData("/bookings");
      // API may return array or object with data
      const list: Booking[] = Array.isArray(data) ? data : (data?.data ?? []);
      setBookings(list);
    } catch (e: any) {
      setError(e?.message ?? "Gagal memuat data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadBookings();
  }, [loadBookings]);

    const handleCancel = async (id: string) => {
    const res = await Swal.fire({
      title: 'Batalkan booking?',
      text: 'Tindakan ini akan membatalkan booking terkait.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Ya, batalkan',
      cancelButtonText: 'Tidak',
      reverseButtons: true,
      confirmButtonColor: '#ef4444',
    });

    if (!res.isConfirmed) return;

    try {
      setCancellingId(id);
      await fetchData(`/bookings/${id}`, { method: 'DELETE' });
      await Swal.fire({
        title: 'Dibatalkan',
        text: 'Booking berhasil dibatalkan',
        icon: 'success',
        confirmButtonText: 'OK',
      });
      await loadBookings();
    } catch (e: any) {
      await Swal.fire({
        title: 'Gagal',
        text: e?.message ?? 'Terjadi kesalahan',
        icon: 'error',
        confirmButtonText: 'OK',
      });
    } finally {
      setCancellingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Booking</h1>
        <p className="text-sm text-muted-foreground">Daftar pemesanan terbaru Anda</p>
      </div>

      {loading && (
        <div className="text-sm text-muted-foreground">Memuat data booking...</div>
      )}

      {error && (
        <div className="text-sm text-red-600">{error}</div>
      )}

      {!loading && !error && (
        <div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {bookings.length === 0 ? (
              <div className="col-span-full text-center text-sm text-muted-foreground py-8">
                Belum ada booking.
              </div>
            ) : (
              bookings.map((b) => (
                                <Card key={b.id} className="flex flex-col border-muted/50 hover:shadow-md transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex flex-col sm:flex-row items-start justify-between gap-3">
                      <div className="flex items-start gap-3 min-w-0">
                        <Avatar className="h-9 w-9">
                          <AvatarImage src="/placeholder-user.jpg" alt={b.user?.name ?? '-'} />
                          <AvatarFallback>{(b.user?.name ?? '-').split(' ').map(s=>s[0]).join('').slice(0,2).toUpperCase()}</AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                          <CardTitle className="text-base truncate" title={b.user?.name ?? '-' }>{b.user?.name ?? '-'}</CardTitle>
                          <CardDescription className="truncate" title={b.user?.email ?? ''}>{b.user?.email ?? ''}</CardDescription>
                          <div className="font-mono text-[11px] text-muted-foreground truncate" title={b.id}>{b.id}</div>
                        </div>
                      </div>
                      <StatusBadge status={b.status} />
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant="secondary" className="rounded-md">{b.type}</Badge>
                      <Badge variant="outline" className="rounded-md">{b.items?.length ?? 0} item</Badge>
                    </div>
                    <Separator />
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                      <div className="space-y-1">
                        <div className="text-muted-foreground">Mulai</div>
                        <div className="font-medium">{formatDate(b.startDate)}</div>
                      </div>
                      <div className="space-y-1">
                        <div className="text-muted-foreground">Selesai</div>
                        <div className="font-medium">{formatDate(b.endDate)}</div>
                      </div>
                      <div className="space-y-1 col-span-2">
                        <div className="text-muted-foreground">Total</div>
                        <div className="text-lg font-semibold">{formatCurrency(Number(b.totalAmount))}</div>
                      </div>
                    </div>
                    {b.notes ? (
                      <div className="text-sm text-muted-foreground line-clamp-2" title={b.notes}>Catatan: {b.notes}</div>
                    ) : null}

                    {/* Detail Pesanan */}
                    {b.items && b.items.length > 0 ? (
                      <div className="space-y-3">
                        <div className="text-sm font-medium">Detail Pesanan</div>
                        <div className="space-y-3">
                          {b.items.map((it) => {
                            const img = toServicePhoto(it.service?.photoUrl || null);
                            const features = it.package?.features || [];
                            const shown = features.slice(0,3);
                            const more = Math.max(0, features.length - shown.length);
                            return (
                              <div key={it.id} className="flex items-start gap-3">
                                <div className="h-14 w-14 rounded-md overflow-hidden bg-muted flex-shrink-0">
                                  {img ? (
                                    <Image src={img} alt={it.service?.name || "Service"} width={56} height={56} className="h-full w-full object-cover" />
                                  ) : (
                                    <div className="h-full w-full flex items-center justify-center text-xs text-muted-foreground">No Img</div>
                                  )}
                                </div>
                                <div className="min-w-0 flex-1 space-y-1">
                                  <div className="flex items-center gap-2 min-w-0">
                                    <div className="font-medium truncate" title={it.service?.name || ""}>{it.service?.name || "-"}</div>
                                    {it.package?.name ? (
                                      <Badge variant="outline" className="rounded-md whitespace-nowrap">{it.package?.name}</Badge>
                                    ) : null}
                                  </div>
                                  <div className="text-sm text-muted-foreground">
                                    {it.quantity} x {formatCurrency(Number(it.unitPrice))} • Subtotal {formatCurrency(Number(it.subtotal))}
                                  </div>
                                  {shown.length > 0 ? (
                                    <div className="flex flex-wrap gap-1 pt-1">
                                      {shown.map((f, idx) => (
                                        <Badge key={idx} variant="secondary" className="rounded-md text-[10px] py-0 px-1.5">{f}</Badge>
                                      ))}
                                      {more > 0 ? (
                                        <Badge variant="outline" className="rounded-md text-[10px] py-0 px-1.5">+{more} lagi</Badge>
                                      ) : null}
                                    </div>
                                  ) : null}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ) : null}
                  </CardContent>
                  <CardFooter className="mt-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                    <div className="text-xs text-muted-foreground">
                      {formatDate(b.startDate)} — {formatDate(b.endDate)}
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="destructive"
                        size="sm"
                        className="min-w-[108px]"
                        disabled={cancellingId === b.id || b.status === 'DIBATALKAN'}
                        onClick={() => handleCancel(b.id)}
                      >
                        {cancellingId === b.id ? 'Membatalkan...' : 'Batalkan'}
                      </Button>
                    </div>
                  </CardFooter>
                </Card>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}



