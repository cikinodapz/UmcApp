"use client";

import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, Package, Image as ImageIcon, ShoppingCart, CheckCircle2, Calendar, Clock, User } from "lucide-react";
import { fetchData } from "@/lib/api";
import { formatCurrency } from "@/lib/format";
import { useToast } from "@/hooks/use-toast";
import Image from "next/image";

type Category = {
  id: string;
  name: string;
};

type ServicePackage = {
  id: string;
  name: string;
  description: string | null;
  unitRate: string;
  features: string[] | null;
  createdAt: string;
  updatedAt: string;
};

type Service = {
  id: string;
  name: string;
  description: string | null;
  unitRate: string;
  isActive: boolean;
  photoUrl: string;
  createdAt: string;
  updatedAt: string;
  category: Category | null;
  Package: ServicePackage[];
};

export default function ServiceDetailPage() {
  const { toast } = useToast();
  const router = useRouter();
  const searchParams = useSearchParams();
  const serviceId = searchParams.get("id");

  const [service, setService] = useState<Service | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedPackage, setSelectedPackage] = useState<ServicePackage | null>(null);
  const [showBookingDialog, setShowBookingDialog] = useState(false);
  const [adding, setAdding] = useState(false);
  // Form fields for /cart payload
  const [quantity, setQuantity] = useState<number>(1);
  const [notes, setNotes] = useState<string>("");

  useEffect(() => {
    const loadServiceDetail = async () => {
      if (!serviceId) {
        toast({
          title: "Error",
          description: "ID layanan tidak valid",
          variant: "destructive",
        });
        router.push("/katalog");
        return;
      }

      try {
        setLoading(true);
        const data: Service = await fetchData(`/services/${serviceId}`, { method: "GET" });
        
        if (!data.isActive) {
          toast({
            title: "Layanan tidak tersedia",
            description: "Layanan ini sedang tidak aktif",
            variant: "destructive",
          });
          router.push("/katalog");
          return;
        }

        setService(data);
        
        // Set paket pertama sebagai default jika ada paket
        if (data.Package && data.Package.length > 0) {
          setSelectedPackage(data.Package[0]);
        }
      } catch (error: any) {
        toast({
          title: "Error",
          description: error?.response?.data?.message || "Gagal memuat detail layanan",
          variant: "destructive",
        });
        router.push("/katalog");
      } finally {
        setLoading(false);
      }
    };

    loadServiceDetail();
  }, [serviceId, router, toast]);

  const handlePackageSelect = (pkg: ServicePackage) => {
    setSelectedPackage(pkg);
  };

  const handleAddToCart = async () => {
    if (!service) return;
    try {
      setAdding(true);

      const payload: any = {
        serviceId: service.id,
        quantity: Number.isFinite(quantity) && quantity > 0 ? quantity : 1,
      };
      if (selectedPackage) payload.packageId = selectedPackage.id;
      if (notes?.trim()) payload.notes = notes.trim();

      const resp = await fetchData("/cart", {
        method: "POST",
        data: payload,
      });

      toast({
        title: resp?.message || "Berhasil ditambahkan",
        description: `${selectedPackage ? "Paket" : "Layanan"} "${
          selectedPackage?.name || service.name
        }" ditambahkan ke keranjang.`,
      });

      setShowBookingDialog(false);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error?.response?.data?.message || "Gagal menambahkan ke keranjang",
        variant: "destructive",
      });
    } finally {
      setAdding(false);
    }
  };

  const handleBookNow = () => {
    if (!service) return;
    setShowBookingDialog(true);
  };

  if (loading) {
    return <ServiceDetailSkeleton />;
  }

  if (!service) {
    return (
      <div className="container max-w-4xl mx-auto px-4 py-8">
        <div className="text-center py-16">
          <Package className="w-12 h-12 mx-auto text-gray-400 mb-3" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Layanan tidak ditemukan</h3>
          <Button onClick={() => router.push("/katalog")} className="mt-4">
            Kembali ke Katalog
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container max-w-6xl mx-auto px-4 py-8">
      {/* Header dengan tombol kembali */}
      <div className="mb-6">
        <Button
          variant="ghost"
          onClick={() => router.push("/katalog")}
          className="mb-4 hover:bg-gray-100"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Kembali ke Katalog
        </Button>
        
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{service.name}</h1>
            <p className="text-gray-600 mt-2">{service.description || "Tidak ada deskripsi"}</p>
          </div>
          {/* <Button 
            onClick={handleBookNow}
            className="bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-600 hover:to-violet-700"
            size="lg"
          >
            <ShoppingCart className="w-4 h-4 mr-2" />
            Pesan Sekarang
          </Button> */}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Kolom kiri - Gambar dan info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Gambar utama */}
          <Card className="overflow-hidden rounded-2xl">
            <CardContent className="p-0">
              <div className="relative h-80 md:h-96 bg-gray-100">
                {service.photoUrl ? (
                  <Image
                    src={toServicePhoto(service.photoUrl) || ""}
                    alt={service.name}
                    fill
                    className="object-cover"
                    priority
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <ImageIcon className="w-16 h-16 text-gray-400" />
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Informasi layanan */}
          <Card className="rounded-2xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="w-5 h-5" />
                Informasi Layanan
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <Calendar className="w-5 h-5 text-indigo-500" />
                  <div>
                    <p className="text-sm text-gray-500">Dibuat</p>
                    <p className="font-medium">
                      {new Date(service.createdAt).toLocaleDateString("id-ID")}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <Clock className="w-5 h-5 text-indigo-500" />
                  <div>
                    <p className="text-sm text-gray-500">Terakhir Diupdate</p>
                    <p className="font-medium">
                      {new Date(service.updatedAt).toLocaleDateString("id-ID")}
                    </p>
                  </div>
                </div>
              </div>

              {service.category && (
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <User className="w-5 h-5 text-indigo-500" />
                  <div>
                    <p className="text-sm text-gray-500">Kategori</p>
                    <Badge variant="secondary" className="mt-1">
                      {service.category.name}
                    </Badge>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Kolom kanan - Paket dan harga */}
        <div className="space-y-6">
          <Card className="rounded-2xl sticky top-6">
            <CardHeader>
              <CardTitle>Pilihan Paket</CardTitle>
              <CardDescription>
                Pilih paket yang sesuai dengan kebutuhan Anda
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue={service.Package.length > 0 ? "packages" : "basic"} className="w-full">
                {service.Package.length > 0 && (
                  <TabsList className="grid w-full grid-cols-2 rounded-xl mb-4">
                    <TabsTrigger value="packages">Paket</TabsTrigger>
                    <TabsTrigger value="basic">Dasar</TabsTrigger>
                  </TabsList>
                )}
                
                {service.Package.length > 0 ? (
                  <TabsContent value="packages" className="space-y-3">
                    {service.Package.map((pkg) => (
                      <div
                        key={pkg.id}
                        className={`p-4 border rounded-xl cursor-pointer transition-all ${
                          selectedPackage?.id === pkg.id
                            ? "border-indigo-500 bg-indigo-50"
                            : "border-gray-200 hover:border-indigo-300"
                        }`}
                        onClick={() => handlePackageSelect(pkg)}
                      >
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className="font-medium text-gray-900">{pkg.name}</h4>
                              {selectedPackage?.id === pkg.id && (
                                <CheckCircle2 className="w-4 h-4 text-indigo-500" />
                              )}
                            </div>
                            {pkg.description && (
                              <p className="text-sm text-gray-600 mb-2">{pkg.description}</p>
                            )}
                            {pkg.features && pkg.features.length > 0 && (
                              <ul className="text-xs text-gray-500 space-y-1">
                                {pkg.features.map((feature, index) => (
                                  <li key={index}>• {feature}</li>
                                ))}
                              </ul>
                            )}
                          </div>
                          <p className="text-indigo-600 font-semibold text-lg ml-4">
                            {formatCurrency(Number(pkg.unitRate))}
                          </p>
                        </div>
                      </div>
                    ))}
                  </TabsContent>
                ) : null}

                <TabsContent value="basic">
                  <div className="p-4 border rounded-xl border-gray-200 bg-gray-50">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h4 className="font-medium text-gray-900">Layanan Dasar</h4>
                        <p className="text-sm text-gray-600 mt-1">
                          Layanan standar tanpa paket khusus
                        </p>
                      </div>
                      <p className="text-indigo-600 font-semibold text-lg">
                        {formatCurrency(Number(service.unitRate))}
                      </p>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>

              <div className="mt-6 p-4 bg-gradient-to-r from-indigo-50 to-violet-50 rounded-xl">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-gray-700 font-medium">Total:</span>
                  <span className="text-2xl font-bold text-indigo-600">
                    {formatCurrency(Number(selectedPackage?.unitRate || service.unitRate))}
                  </span>
                </div>
                <Button 
                  onClick={handleBookNow}
                  className="w-full mt-3 bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-600 hover:to-violet-700"
                  size="lg"
                >
                  <ShoppingCart className="w-4 h-4 mr-2" />
                  Pesan Sekarang
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Dialog Konfirmasi Pesanan */}
      <Dialog open={showBookingDialog} onOpenChange={setShowBookingDialog}>
        <DialogContent className="max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle>Konfirmasi Pesanan</DialogTitle>
            <DialogDescription>
              Anda akan memesan {selectedPackage ? "paket" : "layanan"} berikut:
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="flex justify-between items-start">
              <div>
                <h4 className="font-medium text-gray-900">
                  {selectedPackage ? selectedPackage.name : service.name}
                </h4>
                {selectedPackage?.description && (
                  <p className="text-sm text-gray-600 mt-1">{selectedPackage.description}</p>
                )}
              </div>
              <p className="text-indigo-600 font-semibold text-lg">
                {formatCurrency(Number(selectedPackage?.unitRate || service.unitRate))}
              </p>
            </div>
            
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Package className="w-4 h-4" />
              <span>Kategori: {service.category?.name || "Tidak ada kategori"}</span>
            </div>

            {/* Quantity & Notes */}
            <div className="grid grid-cols-1 gap-3">
              <div className="space-y-1.5">
                <label className="text-sm text-gray-600">Jumlah</label>
                <Input
                  type="number"
                  min={1}
                  value={quantity}
                  onChange={(e) => setQuantity(parseInt(e.target.value || "1", 10))}
                  className="rounded-xl"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm text-gray-600">Catatan (opsional)</label>
                <Input
                  placeholder='Contoh: "Untuk project wedding"'
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="rounded-xl"
                />
              </div>
            </div>
          </div>

          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={() => setShowBookingDialog(false)}
              className="flex-1"
            >
              Batal
            </Button>
            <Button
              onClick={handleAddToCart}
              disabled={adding || quantity < 1}
              className="flex-1 bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-600 hover:to-violet-700"
            >
              <ShoppingCart className="w-4 h-4 mr-2" />
              {adding ? 'Menambahkan...' : 'Tambah ke Keranjang'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function ServiceDetailSkeleton() {
  return (
    <div className="container max-w-6xl mx-auto px-4 py-8">
      <div className="mb-6">
        <Skeleton className="h-10 w-32 mb-4" />
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="space-y-2">
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-4 w-96" />
          </div>
          <Skeleton className="h-10 w-40" />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <Skeleton className="h-96 w-full rounded-2xl" />
          <Skeleton className="h-48 w-full rounded-2xl" />
        </div>
        
        <div className="space-y-6">
          <div className="sticky top-6 space-y-4">
            <Skeleton className="h-48 w-full rounded-2xl" />
            <Skeleton className="h-32 w-full rounded-2xl" />
          </div>
        </div>
      </div>
    </div>
  );
}
  const toServicePhoto = (p?: string | null) => {
    if (!p) return null;
    if (/^https?:\/\//i.test(p)) return p;
    const base = process.env.NEXT_PUBLIC_API_URL || "";
    const path = p.startsWith("/uploads/") ? p : `/uploads/${p}`;
    return `${base}${path}`;
  };
