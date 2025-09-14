"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import Image from "next/image"
import { Mic, Video, Lightbulb, Star, ArrowRight, CheckCircle } from "lucide-react"

const features = [
  {
    icon: Mic,
    title: "Audio Equipment",
    description: "Mikrofon, recorder, dan sistem audio profesional",
  },
  {
    icon: Video,
    title: "Video Production",
    description: "Gimbal, tripod, dan peralatan produksi video",
  },
  {
    icon: Lightbulb,
    title: "Lighting Setup",
    description: "LED panel, softbox, dan sistem pencahayaan studio",
  },
  {
    icon: Mic,
    title: "Peralatan Profesional",
    description: "Kamera DSLR, mirrorless, dan aksesoris berkualitas tinggi",
  },
]

const stats = [
  { value: "500+", label: "Peralatan Tersedia" },
  { value: "1000+", label: "Mahasiswa Terlayani" },
  { value: "50+", label: "Jenis Kategori" },
  { value: "24/7", label: "Dukungan Online" },
]

const testimonials = [
  {
    name: "Ahmad Rizki",
    role: "Mahasiswa Film & TV",
    content: "Peralatan berkualitas tinggi dengan harga terjangkau. Sangat membantu untuk project kuliah!",
    rating: 5,
  },
  {
    name: "Sari Indah",
    role: "Mahasiswa Komunikasi",
    content: "Proses booking mudah dan cepat. Staff sangat membantu dalam memberikan panduan penggunaan.",
    rating: 5,
  },
  {
    name: "Budi Santoso",
    role: "Mahasiswa Desain",
    content: "Koleksi peralatan lengkap dan selalu terawat dengan baik. Recommended!",
    rating: 5,
  },
]

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Header with Navigation */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-200">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-14 h-14 flex items-center justify-center">
                <Image
                  src="/logo.png"
                  alt="UMC Media Hub Logo"
                  width={60}
                  height={60}
                  className="rounded-xl"
                />
              </div>
              <div>
                <h1 className="text-xl font-bold bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent">
                  UMC Media Hub
                </h1>
                <p className="text-xs text-gray-500">Rental Multimedia</p>
              </div>
            </div>
            <nav className="hidden md:flex items-center gap-8 mx-auto">
              <Link href="#hero" className="text-gray-600 hover:text-indigo-600 font-medium transition-colors">
                Beranda
              </Link>
              <Link href="#features" className="text-gray-600 hover:text-indigo-600 font-medium transition-colors">
                Fitur
              </Link>
              <Link href="#equipment" className="text-gray-600 hover:text-indigo-600 font-medium transition-colors">
                Peralatan
              </Link>
              <Link href="#testimonials" className="text-gray-600 hover:text-indigo-600 font-medium transition-colors">
                Testimoni
              </Link>
              <Link href="#cta" className="text-gray-600 hover:text-indigo-600 font-medium transition-colors">
                Kontak
              </Link>
            </nav>
            <Button
              asChild
              className="rounded-xl bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-600 hover:to-violet-700 text-white font-bold shadow-lg hover:shadow-xl transition-all duration-300 px-6 py-3"
              style={{ backgroundColor: "#4f46e5", color: "#ffffff" }}
            >
              <Link href="/auth/login">
                Masuk
                <ArrowRight className="w-4 h-4 ml-2" />
              </Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section id="hero" className="py-20 bg-gradient-to-br from-indigo-50 via-white to-violet-50">
        <div className="container mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-8">
              <div className="space-y-4">
                <Badge className="rounded-xl bg-indigo-100 text-indigo-700 hover:bg-indigo-100">
                  <Star className="w-4 h-4 mr-2" />
                  Platform Rental Terpercaya
                </Badge>
                <h1 className="text-5xl font-bold text-gray-900 leading-tight">
                  Sewa Peralatan{" "}
                  <span className="bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent">
                    Multimedia
                  </span>{" "}
                  Profesional
                </h1>
                <p className="text-xl text-gray-600 leading-relaxed">
                  Akses mudah ke peralatan multimedia berkualitas tinggi untuk mendukung project kreatif Anda. Dari
                  kamera profesional hingga sistem audio terdepan.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-4">
                <Button
                  asChild
                  size="lg"
                  className="rounded-xl !bg-indigo-600 !text-white bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-600 hover:to-violet-700 text-lg px-8 py-6"
                  style={{ backgroundColor: "#4f46e5", color: "#ffffff" }}
                >
                  <Link href="/auth/login">
                    Mulai Sewa Sekarang
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </Link>
                </Button>
                <Button
                  variant="outline"
                  size="lg"
                  className="rounded-xl border-2 border-indigo-200 hover:bg-indigo-50 text-lg px-8 py-6 bg-transparent"
                >
                  Lihat Katalog
                </Button>
              </div>

              <div className="flex items-center gap-8 pt-4">
                {stats.map((stat, index) => (
                  <div key={index} className="text-center">
                    <div className="text-2xl font-bold text-indigo-600">{stat.value}</div>
                    <div className="text-sm text-gray-500">{stat.label}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="relative">
              <div className="relative z-10">
                <Image
                  src="/canon-eos-r5-camera.jpg"
                  alt="Professional Camera Equipment"
                  width={600}
                  height={400}
                  className="rounded-2xl shadow-2xl"
                />
              </div>
              <div className="absolute -top-4 -right-4 w-full h-full bg-gradient-to-br from-indigo-500 to-violet-600 rounded-2xl opacity-20"></div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-white">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Mengapa Memilih{" "}
              <span className="bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent">
                UMC Media Hub?
              </span>
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Kami menyediakan solusi lengkap untuk kebutuhan multimedia Anda dengan layanan terbaik
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => {
              const Icon = feature.icon
              return (
                <Card
                  key={index}
                  className="rounded-2xl border-0 shadow-lg hover:shadow-xl transition-all duration-300 group"
                >
                  <CardContent className="p-8 text-center">
                    <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300">
                      <Icon className="w-8 h-8 text-white" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-3">{feature.title}</h3>
                    <p className="text-gray-600 leading-relaxed">{feature.description}</p>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </div>
      </section>

      {/* Equipment Showcase */}
      <section id="equipment" className="py-20 bg-gradient-to-br from-gray-50 to-indigo-50">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Peralatan Unggulan</h2>
            <p className="text-xl text-gray-600">Koleksi peralatan multimedia terlengkap dan terbaru</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                name: "Canon EOS R5",
                category: "Kamera Mirrorless",
                price: "Rp 500.000/hari",
                image: "/canon-eos-r5-camera.jpg",
                features: ["45MP Full Frame", "8K Video", "Image Stabilization"],
              },
              {
                name: "Sony A7 III",
                category: "Kamera Mirrorless",
                price: "Rp 400.000/hari",
                image: "/sony-a7-iii-camera.jpg",
                features: ["24MP Full Frame", "4K Video", "693 AF Points"],
              },
              {
                name: "Rode VideoMic Pro",
                category: "Audio Equipment",
                price: "Rp 150.000/hari",
                image: "/rode-videomic-pro-microphone.jpg",
                features: ["Directional Mic", "Battery Powered", "Shock Mount"],
              },
            ].map((item, index) => (
              <Card
                key={index}
                className="rounded-2xl border-0 shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden group"
              >
                <div className="relative h-48 overflow-hidden">
                  <Image
                    src={item.image || "/placeholder.svg"}
                    alt={item.name}
                    fill
                    className="object-cover group-hover:scale-110 transition-transform duration-300"
                  />
                </div>
                <CardContent className="p-6">
                  <div className="space-y-3">
                    <Badge className="rounded-lg bg-indigo-100 text-indigo-700">{item.category}</Badge>
                    <h3 className="text-xl font-bold text-gray-900">{item.name}</h3>
                    <p className="text-lg font-semibold text-indigo-600">{item.price}</p>
                    <ul className="space-y-1">
                      {item.features.map((feature, idx) => (
                        <li key={idx} className="flex items-center text-sm text-gray-600">
                          <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                          {feature}
                        </li>
                      ))}
                    </ul>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section id="testimonials" className="py-20 bg-white">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Apa Kata Mereka?</h2>
            <p className="text-xl text-gray-600">Testimoni dari mahasiswa yang telah menggunakan layanan kami</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <Card key={index} className="rounded-2xl border-0 shadow-lg">
                <CardContent className="p-8">
                  <div className="space-y-4">
                    <div className="flex gap-1">
                      {[...Array(testimonial.rating)].map((_, i) => (
                        <Star key={i} className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                      ))}
                    </div>
                    <p className="text-gray-600 leading-relaxed">"{testimonial.content}"</p>
                    <div>
                      <p className="font-semibold text-gray-900">{testimonial.name}</p>
                      <p className="text-sm text-gray-500">{testimonial.role}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section id="cta" className="py-20 bg-gradient-to-r from-indigo-500 to-violet-600">
        <div className="container mx-auto px-6 text-center">
          <div className="max-w-3xl mx-auto space-y-8">
            <h2 className="text-4xl font-bold text-white">Siap Memulai Project Kreatif Anda?</h2>
            <p className="text-xl text-indigo-100 leading-relaxed">
              Bergabunglah dengan ribuan mahasiswa yang telah mempercayai UMC Media Hub untuk mendukung project
              multimedia mereka.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                asChild
                size="lg"
                className="rounded-xl bg-white text-indigo-600 hover:bg-gray-100 text-lg px-8 py-6"
              >
                <Link href="/auth/login">
                  Daftar Sekarang
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Link>
              </Button>
              <Button
                variant="outline"
                size="lg"
                className="rounded-xl border-2 border-white text-white hover:bg-white hover:text-indigo-600 text-lg px-8 py-6 bg-transparent"
              >
                Hubungi Kami
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 bg-gray-900">
        <div className="container mx-auto px-6">
          <div className="grid md:grid-cols-4 gap-8">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 flex items-center justify-center">
                  <Image
                    src="/logo.png"
                    alt="UMC Media Hub Logo"
                    width={40}
                    height={40}
                    className="rounded-xl"
                  />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">UMC Media Hub</h3>
                  <p className="text-sm text-gray-400">Rental Multimedia</p>
                </div>
              </div>
              <p className="text-gray-400">
                Platform rental peralatan multimedia terpercaya untuk mendukung kreativitas mahasiswa.
              </p>
            </div>

            <div>
              <h4 className="font-semibold text-white mb-4">Layanan</h4>
              <ul className="space-y-2 text-gray-400">
                <li>Rental Kamera</li>
                <li>Audio Equipment</li>
                <li>Video Production</li>
                <li>Lighting Setup</li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold text-white mb-4">Dukungan</h4>
              <ul className="space-y-2 text-gray-400">
                <li>Panduan Penggunaan</li>
                <li>FAQ</li>
                <li>Kontak Support</li>
                <li>Tutorial</li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold text-white mb-4">Kontak</h4>
              <ul className="space-y-2 text-gray-400">
                <li>Email: info@umcmediahub.ac.id</li>
                <li>Phone: (021) 123-4567</li>
                <li>Alamat: Kampus UMC</li>
                <li>Jam: 08:00 - 17:00 WIB</li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-800 mt-8 pt-8 text-center">
            <p className="text-gray-400">© 2024 UMC Media Hub. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}