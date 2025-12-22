"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, Package, Image as ImageIcon, Info, ShoppingCart, CheckCircle2, Loader2 } from "lucide-react";
import { fetchData } from "@/lib/api";
import { formatCurrency } from "@/lib/format";
import { useToast } from "@/hooks/use-toast";
import Image from "next/image";
import { useRouter } from "next/navigation";

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
};

type Service = {
  id: string;
  name: string;
  description: string | null;
  unitRate: string;
  isActive: boolean;
  photoUrl: string;
  category: Category | null;
  Package: ServicePackage[];
};

export default function ServicesPage() {
  const { toast } = useToast();
  const [services, setServices] = useState<Service[]>([]);
  const [filteredServices, setFilteredServices] = useState<Service[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [selectedPackage, setSelectedPackage] = useState<ServicePackage | null>(null);

  // NEW: form state utk /cart
  const [quantity, setQuantity] = useState<number>(1);
  const [notes, setNotes] = useState<string>("");
  const [adding, setAdding] = useState<boolean>(false);

  // Hero images rotation
  const heroImages = [
    "/godox-led-video-light.jpg",
    "/dji-ronin-sc-gimbal.jpg",
    "/canon-eos-r5-camera.jpg",
    "/sony-a7-iii-camera.jpg",
    "/rode-videomic-pro-microphone.jpg",
  ];
  const [heroIndex, setHeroIndex] = useState<number>(0);
  useEffect(() => {
    const t = setInterval(() => {
      setHeroIndex((i) => (i + 1) % heroImages.length);
    }, 4500);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    const loadServices = async () => {
      try {
        setLoading(true);
        const data: Service[] = await fetchData("/services", { method: "GET" });
        const activeServices = data.filter((service) => service.isActive);
        setServices(activeServices);
        setFilteredServices(activeServices);

        const uniqueCategories = Array.from(
          new Map(
            activeServices
              .filter((s) => s.category)
              .map((s) => [s.category!.id, s.category!])
          ).values()
        );
        setCategories(uniqueCategories);
      } catch (error: any) {
        toast({
          title: "Error",
          description: error?.response?.data?.message || "Gagal memuat layanan",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };
    loadServices();
  }, [toast]);

  useEffect(() => {
    let result = services;
    if (search) {
      const searchLower = search.toLowerCase();
      result = result.filter(
        (service) =>
          service.name.toLowerCase().includes(searchLower) ||
          service.description?.toLowerCase().includes(searchLower) ||
          service.category?.name.toLowerCase().includes(searchLower)
      );
    }
    if (selectedCategory !== "all") {
      result = result.filter((service) => service.category?.id === selectedCategory);
    }
    setFilteredServices(result);
  }, [search, selectedCategory, services]);

  const handleServiceClick = (service: Service) => {
    setSelectedService(service);
    setSelectedPackage(null);
    // reset form /cart
    setQuantity(1);
    setNotes("");
  };

  const handlePackageSelect = (pkg: ServicePackage) => {
    setSelectedPackage(pkg);
  };

  const handleAddToCart = async () => {
    if (!selectedService) return;
    try {
      setAdding(true);

      // Susun payload sesuai contoh:
      // - Dengan paket: { serviceId, packageId, quantity, notes }
      // - Tanpa paket:  { serviceId, quantity, notes }
      const payload: any = {
        serviceId: selectedService.id,
        quantity: Number.isFinite(quantity) && quantity > 0 ? quantity : 1,
      };
      if (notes?.trim()) payload.notes = notes.trim();
      if (selectedPackage) payload.packageId = selectedPackage.id;

      const resp = await fetchData("/cart", {
        method: "POST",
        data: payload,
      });

      toast({
        title: resp?.message || "Berhasil ditambahkan",
        description: `${selectedPackage ? "Paket" : "Layanan"} "${
          selectedPackage?.name || selectedService.name
        }" ditambahkan ke keranjang.`,
      });

      // Tutup dialog & reset
      setSelectedService(null);
      setSelectedPackage(null);
      setQuantity(1);
      setNotes("");
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

  return (
    <div className="container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Header */}
      <div className="relative h-44 md:h-56 rounded-2xl overflow-hidden mb-8">
        {/* Rotating hero images */}
        {heroImages.map((src, idx) => (
          <Image
            key={src}
            src={src}
            alt="Layanan Multimedia UMC"
            fill
              priority={idx === heroIndex}
            className={`object-cover transition-opacity duration-700 ease-out ${idx === heroIndex ? "opacity-100" : "opacity-0"}`}
            aria-hidden={idx !== heroIndex}
          />
        ))}
        <div className="absolute inset-0 bg-black/40" />
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-6">
          <h1 className="text-3xl md:text-4xl font-semibold tracking-tight text-white">Layanan Multimedia</h1>
          <p className="mt-1 text-sm md:text-base text-white/90 w-full md:max-w-5xl whitespace-nowrap overflow-hidden text-ellipsis px-4 md:px-0">
            Jelajahi layanan profesional kami dengan pilihan paket yang relevan untuk kebutuhan Anda
          </p>
        </div>
      </div>

      {/* Filter Section */}
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between p-5 bg-white rounded-2xl shadow-sm border border-gray-100 mb-8">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder="Cari layanan, deskripsi, atau kategori..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 rounded-xl border-gray-200 focus-visible:ring-indigo-500"
          />
        </div>

        <div className="flex gap-3">
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="w-full sm:w-[180px] rounded-xl border-gray-200">
              <SelectValue placeholder="Semua Kategori" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Kategori</SelectItem>
              {categories.map((category) => (
                <SelectItem key={category.id} value={category.id}>
                  {category.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Badge variant="outline" className="h-10 px-4 rounded-xl border border-gray-200">
            <span className="text-gray-500">Total:</span>
            <span className="font-medium ml-1">{filteredServices.length}</span>
          </Badge>
        </div>
      </div>

      {/* Services Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <ServiceCardSkeleton key={i} />
          ))}
        </div>
      ) : filteredServices.length === 0 ? (
        <div className="text-center py-16 px-4">
          <Package className="w-12 h-12 mx-auto text-gray-400 mb-3" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Tidak ada layanan ditemukan</h3>
          <p className="text-gray-500">Coba ubah kata kunci atau kategori</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredServices.map((service) => (
            <ServiceCard key={service.id} service={service} onClick={() => handleServiceClick(service)} />
          ))}
        </div>
      )}

      {/* Dialog Detail */}
      <Dialog open={!!selectedService} onOpenChange={() => setSelectedService(null)}>
        <DialogContent className="max-w-3xl rounded-2xl p-6">
          {selectedService && (
            <>
              <DialogHeader>
                <DialogTitle className="text-xl font-semibold">{selectedService.name}</DialogTitle>
                <DialogDescription>{selectedService.description || "Tidak ada deskripsi"}</DialogDescription>
              </DialogHeader>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mt-4">
                <div className="relative h-56 rounded-xl overflow-hidden bg-gray-100">
                  {selectedService.photoUrl ? (
                    <Image src={toServicePhoto(selectedService.photoUrl) || ""} alt={selectedService.name} fill className="object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <ImageIcon className="w-10 h-10 text-gray-400" />
                    </div>
                  )}
                </div>

                <div className="space-y-4">
                  <div className="flex gap-2">
                    {selectedService.category && <Badge variant="secondary">{selectedService.category.name}</Badge>}
                    <Badge variant="outline">
                      {selectedService.Package.length > 0
                        ? `${selectedService.Package.length} Paket`
                        : "Layanan Dasar"}
                    </Badge>
                  </div>

                  <Tabs defaultValue={selectedService.Package.length > 0 ? "packages" : "basic"} className="w-full">
                    {selectedService.Package.length > 0 && (
                      <TabsList className="grid grid-cols-2 rounded-xl">
                        <TabsTrigger value="packages">Pilih Paket</TabsTrigger>
                        <TabsTrigger value="basic">Layanan Dasar</TabsTrigger>
                      </TabsList>
                    )}

                    <TabsContent value="packages" className="space-y-3 mt-3">
                      {selectedService.Package.map((pkg) => (
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
                            <div>
                              <div className="flex items-center gap-2 mb-1">
                                <h4 className="font-medium">{pkg.name}</h4>
                                {selectedPackage?.id === pkg.id && (
                                  <CheckCircle2 className="w-4 h-4 text-indigo-500" />
                                )}
                              </div>
                              {pkg.description && <p className="text-sm text-gray-600">{pkg.description}</p>}
                            </div>
                            <p className="text-indigo-600 font-semibold">
                              {formatCurrency(Number(pkg.unitRate))}
                            </p>
                          </div>
                        </div>
                      ))}
                    </TabsContent>

                    <TabsContent value="basic" className="mt-3">
                      <div className="p-4 border rounded-xl border-gray-200">
                        <div className="flex justify-between mb-2">
                          <h4 className="font-medium">Layanan Dasar</h4>
                          <p className="text-indigo-600 font-semibold">
                            {formatCurrency(Number(selectedService.unitRate))}
                          </p>
                        </div>
                        <p className="text-sm text-gray-600">Layanan standar tanpa paket khusus</p>
                      </div>
                    </TabsContent>
                  </Tabs>

                  {/* NEW: Form quantity & notes untuk payload /cart */}
                  <div className="grid grid-cols-2 gap-3">
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
                    <div className="space-y-1.5 col-span-1 md:col-span-1">
                      <label className="text-sm text-gray-600">Catatan (opsional)</label>
                      <Input
                        placeholder='Contoh: "Untuk project wedding"'
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        className="rounded-xl"
                      />
                    </div>
                  </div>

                  <Button
                    onClick={handleAddToCart}
                    disabled={adding || quantity < 1}
                    className="w-full rounded-xl bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-600 hover:to-violet-700"
                  >
                    {adding ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Menambahkan...
                      </>
                    ) : (
                      <>
                        <ShoppingCart className="w-4 h-4 mr-2" />
                        Tambah ke Keranjang
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function ServiceCard({ service, onClick }: { service: Service; onClick: () => void }) {
  const router = useRouter();

  const handleDetailClick = (e: React.MouseEvent) => {
    e.stopPropagation(); // Mencegah trigger onClick card
    router.push(`/katalog/detail?id=${service.id}`);
  };

  return (
    <Card
      className="group overflow-hidden rounded-2xl cursor-pointer transition-all hover:shadow-lg hover:shadow-indigo-50"
      onClick={onClick}
    >
      <div className="relative h-52 bg-gray-50">
        {service.photoUrl ? (
          <Image src={toServicePhoto(service.photoUrl) || ""} alt={service.name} fill className="object-cover group-hover:scale-105 transition" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <ImageIcon className="w-10 h-10 text-gray-400" />
          </div>
        )}
        {service.Package.length > 0 && (
          <Badge className="absolute top-3 right-3 bg-indigo-500/90 text-white shadow-sm">
            {service.Package.length} Paket
          </Badge>
        )}
      </div>
      <CardHeader className="pb-1">
        <CardTitle className="text-lg font-semibold group-hover:text-indigo-600">{service.name}</CardTitle>
        <CardDescription className="line-clamp-2 text-sm text-gray-600">
          {service.description || "Tidak ada deskripsi"}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex items-center justify-between pt-2">
        <div>
          <p className="text-xs text-gray-500">Mulai dari</p>
          <p className="text-xl font-bold text-indigo-600">{formatCurrency(Number(service.unitRate))}</p>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="rounded-lg border-gray-200 hover:bg-indigo-50"
          onClick={handleDetailClick}
        >
          <Info className="w-4 h-4 mr-1" />
          Detail
        </Button>
      </CardContent>
    </Card>
  );
}

function ServiceCardSkeleton() {
  return (
    <Card className="overflow-hidden rounded-2xl">
      <Skeleton className="h-52 w-full" />
      <div className="p-5 space-y-4">
        <Skeleton className="h-5 w-3/4" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-2/3" />
        <div className="flex justify-between items-center pt-2">
          <Skeleton className="h-6 w-20" />
          <Skeleton className="h-8 w-24 rounded-lg" />
        </div>
      </div>
    </Card>
  );
}
  const toServicePhoto = (p?: string | null) => {
    if (!p) return null;
    if (/^https?:\/\//i.test(p)) return p;
    const base = process.env.NEXT_PUBLIC_API_URL || "";
    const path = p.startsWith("/uploads/") ? p : `/uploads/${p}`;
    return `${base}${path}`;
  };
