"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { DataTable } from "@/components/data-table";
import { StatusBadge } from "@/components/status-badge";
import { useAuth } from "@/contexts/auth-context";
import { mockBookings, mockBookingItems, mockUsers } from "@/lib/mock";
import { BookingStatus, Role } from "@/types";
import { formatCurrency, formatDateTime } from "@/lib/format";
import { Plus, Eye, Trash2, Calendar, Edit } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function BookingsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [statusFilter, setStatusFilter] = useState("");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [bookingToDelete, setBookingToDelete] = useState<{
    id: string;
    userName: string;
  } | null>(null);

  const isAdmin = user?.role === Role.ADMIN;

  // Get bookings with user and item details
  const bookingsWithDetails = mockBookings
    .filter((booking) => (isAdmin ? true : booking.userId === user?.id))
    .map((booking) => {
      const bookingUser = mockUsers.find((u) => u.id === booking.userId);
      const items = mockBookingItems.filter(
        (item) => item.bookingId === booking.id
      );
      const totalAmount = items.reduce((sum, item) => sum + item.price, 0);

      return {
        ...booking,
        userName: bookingUser?.name || "Unknown",
        userEmail: bookingUser?.email || "",
        itemCount: items.length,
        totalAmount,
      };
    })
    .filter(
      (booking) =>
        !statusFilter ||
        statusFilter === "all" ||
        booking.status === statusFilter
    )
    .sort(
      (a, b) =>
        new Date(b.startDatetime).getTime() -
        new Date(a.startDatetime).getTime()
    );

  // Define columns for bookings table
  const bookingColumns = [
    {
      key: "id",
      title: "ID Booking",
      render: (value: string) => (
        <span className="font-mono text-sm bg-gray-100 px-2 py-1 rounded-md">
          {value.slice(-8)}
        </span>
      ),
    },
    ...(isAdmin
      ? [
          {
            key: "userName",
            title: "Peminjam",
            render: (value: string, item: any) => (
              <div>
                <p className="font-medium">{value}</p>
                <p className="text-sm text-gray-500">{item.userEmail}</p>
              </div>
            ),
          },
        ]
      : []),
    {
      key: "startDatetime",
      title: "Tanggal Mulai",
      render: (value: string) => formatDateTime(value),
      sortable: true,
    },
    {
      key: "endDatetime",
      title: "Tanggal Selesai",
      render: (value: string) => formatDateTime(value),
    },
    {
      key: "itemCount",
      title: "Jumlah Item",
      render: (value: number) => `${value} item`,
    },
    {
      key: "totalAmount",
      title: "Total",
      render: (value: number) => formatCurrency(value),
    },
    {
      key: "status",
      title: "Status",
      render: (value: string) => <StatusBadge status={value} />,
    },
    {
      key: "actions",
      title: "Aksi",
      render: (_: any, booking: any) => (
        <div className="flex items-center gap-2">
          <Button asChild variant="ghost" size="sm" className="rounded-lg">
            <Link href={`/bookings/${booking.id}`}>
              <Eye className="w-4 h-4" />
            </Link>
          </Button>
          <Button asChild variant="ghost" size="sm" className="rounded-lg">
            <Link href={`/bookings/${booking.id}/edit`}>
              <Edit className="w-4 h-4" />
            </Link>
          </Button>

          {(isAdmin ||
            (booking.status === BookingStatus.MENUNGGU &&
              booking.userId === user?.id)) && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setBookingToDelete({
                  id: booking.id,
                  userName: booking.userName,
                });
                setDeleteDialogOpen(true);
              }}
              className="rounded-lg text-red-600 hover:text-red-700"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          )}
        </div>
      ),
    },
  ];

  const handleDelete = () => {
    if (bookingToDelete) {
      // In a real app, this would make an API call
      console.log("Deleting booking:", bookingToDelete.id);
      toast({
        title: "Berhasil",
        description: `Booking berhasil dihapus`,
      });
      setBookingToDelete(null);
      setDeleteDialogOpen(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            {isAdmin ? "Kelola Pemesanan" : "Booking Saya"}
          </h1>
          <p className="text-gray-600 mt-2">
            {isAdmin
              ? "Kelola semua pemesanan pengguna"
              : "Lihat dan kelola booking Anda"}
          </p>
        </div>
        <Button
          asChild
          className="rounded-xl bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-600 hover:to-violet-700"
        >
          <Link href="/bookings/new">
            <Plus className="w-4 h-4 mr-2" />
            Buat Pemesanan Baru
          </Link>
        </Button>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4 p-4 bg-white rounded-2xl shadow-sm border">
        <Calendar className="w-5 h-5 text-gray-400" />
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-48 rounded-xl">
            <SelectValue placeholder="Semua Status" />
          </SelectTrigger>
          <SelectContent className="rounded-xl">
            <SelectItem value="all" className="rounded-lg">
              Semua Status
            </SelectItem>
            <SelectItem value={BookingStatus.MENUNGGU} className="rounded-lg">
              Menunggu
            </SelectItem>
            <SelectItem
              value={BookingStatus.DIKONFIRMASI}
              className="rounded-lg"
            >
              Dikonfirmasi
            </SelectItem>
            <SelectItem value={BookingStatus.DITOLAK} className="rounded-lg">
              Ditolak
            </SelectItem>
            <SelectItem value={BookingStatus.DIBATALKAN} className="rounded-lg">
              Dibatalkan
            </SelectItem>
            <SelectItem value={BookingStatus.SELESAI} className="rounded-lg">
              Selesai
            </SelectItem>
          </SelectContent>
        </Select>
        <div className="text-sm text-gray-500">
          Menampilkan {bookingsWithDetails.length} pemesanan
        </div>
      </div>

      {/* Bookings Table */}
      <DataTable
        data={bookingsWithDetails}
        columns={bookingColumns}
        searchPlaceholder="Cari booking..."
        pageSize={10}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Konfirmasi Hapus Booking</AlertDialogTitle>
            <AlertDialogDescription>
              Apakah Anda yakin ingin menghapus booking ini? Tindakan ini tidak
              dapat dibatalkan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl">Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="rounded-xl bg-red-600 hover:bg-red-700"
            >
              Hapus
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
