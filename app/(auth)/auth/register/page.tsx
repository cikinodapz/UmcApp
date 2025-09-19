"use client"

import type React from "react"
import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, Eye, EyeOff } from "lucide-react"
import Swal from "sweetalert2"
import { fetchData } from "@/lib/api"

export default function RegisterPage() {
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [phone, setPhone] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const validate = () => {
    if (!name || !email || !phone || !password || !confirmPassword) {
      return "Semua field wajib diisi"
    }
    if (name.trim().length < 3) {
      return "Nama minimal 3 karakter"
    }
    // Email sangat basic check
    if (!/^\S+@\S+\.\S+$/.test(email)) {
      return "Format email tidak valid"
    }
    // Phone hanya angka 10-15 digit
    if (!/^\d{10,15}$/.test(phone.replace(/\D/g, ""))) {
      return "No. HP harus 10–15 digit angka"
    }
    if (password.length < 6) {
      return "Password minimal 6 karakter"
    }
    if (password !== confirmPassword) {
      return "Konfirmasi password tidak cocok"
    }
    return ""
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    const v = validate()
    if (v) {
      setError(v)
      await Swal.fire({
        icon: "warning",
        title: "Input belum valid",
        text: v,
      })
      return
    }

    setIsLoading(true)
    try {
      const payload = {
        name: name.trim(),
        email: email.trim().toLowerCase(),
        phone: phone.replace(/\D/g, ""),
        password,
      }

      await fetchData("/auth/register", {
        method: "POST",
        data: payload,
      })

      await Swal.fire({
        icon: "success",
        title: "Registrasi berhasil",
        text: "Akun kamu sudah dibuat. Silakan login.",
        timer: 1600,
        showConfirmButton: false,
      })

      router.push("/auth/login")
    } catch (err: any) {
      const errorMessage =
        err?.response?.data?.message || err?.message || "Registrasi gagal. Coba lagi."
      setError(errorMessage)
      await Swal.fire({
        icon: "error",
        title: "Registrasi gagal",
        text: errorMessage,
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-2xl border-0 bg-white/80 backdrop-blur-sm">
        <CardHeader className="text-center space-y-4">
          <div className="mx-auto w-26 h-26 flex items-center justify-center">
            <Image
              src="/logo.png"
              alt="UMC Media Hub Logo"
              width={100}
              height={100}
              className="rounded-2xl"
            />
          </div>
          <div>
            <CardTitle className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent">
              Buat Akun
            </CardTitle>
            <CardDescription className="text-base mt-2">
              Daftar untuk mengakses UMC Media Hub
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="name">Nama Lengkap</Label>
              <Input
                id="name"
                placeholder="Masukkan nama lengkap"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="h-12 rounded-xl border-2 focus:border-indigo-500 transition-colors"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="nama@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-12 rounded-xl border-2 focus:border-indigo-500 transition-colors"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">No. HP</Label>
              <Input
                id="phone"
                inputMode="numeric"
                placeholder="08xxxxxxxxxx"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="h-12 rounded-xl border-2 focus:border-indigo-500 transition-colors"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Minimal 6 karakter"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-12 rounded-xl border-2 pr-12 focus:border-indigo-500 transition-colors"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((s) => !s)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-lg hover:bg-black/5"
                  aria-label={showPassword ? "Sembunyikan password" : "Tampilkan password"}
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Konfirmasi Password</Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="Ulangi password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="h-12 rounded-xl border-2 pr-12 focus:border-indigo-500 transition-colors"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword((s) => !s)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-lg hover:bg-black/5"
                  aria-label={showConfirmPassword ? "Sembunyikan password" : "Tampilkan password"}
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
              </div>
            </div>

            {error && (
              <Alert className="rounded-xl border-red-200 bg-red-50">
                <AlertDescription className="text-red-800">{error}</AlertDescription>
              </Alert>
            )}

            <Button
              type="submit"
              className="w-full h-12 rounded-xl !bg-indigo-600 hover:!bg-indigo-700 !text-white font-medium shadow-lg hover:shadow-xl transition-all duration-200 !border-0"
              disabled={isLoading}
              style={{
                background: "linear-gradient(to right, rgb(99, 102, 241), rgb(139, 92, 246))",
                color: "white",
              }}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin !text-white" />
                  <span className="!text-white">Mendaftarkan...</span>
                </>
              ) : (
                <span className="!text-white font-medium">Daftar</span>
              )}
            </Button>

            <p className="text-center text-sm text-muted-foreground">
              Sudah punya akun?{" "}
              <Link
                href="/auth/login"
                className="font-medium text-indigo-600 hover:text-indigo-700 underline-offset-4 hover:underline"
              >
                Masuk di sini
              </Link>
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
