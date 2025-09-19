"use client"

import type React from "react"
import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2 } from "lucide-react"
import Image from "next/image"
import { fetchData } from "@/lib/api"
import Swal from "sweetalert2"

type Role = "ADMIN" | "PEMINJAM"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const resolveRole = async (loginResp: any, token?: string): Promise<Role | null> => {
    // 1) Coba dari respons login langsung
    const roleFromLogin: Role | undefined =
      loginResp?.user?.role || loginResp?.role || loginResp?.data?.user?.role
    if (roleFromLogin === "ADMIN" || roleFromLogin === "PEMINJAM") return roleFromLogin

    // 2) Fallback: panggil /auth/me pakai token baru
    try {
      if (!token) return null
      const me = await fetchData("/auth/me", {
        method: "GET",
        headers: { Authorization: `Bearer ${token}` },
      })
      const roleFromMe: Role | undefined =
        me?.role || me?.user?.role || me?.data?.role || me?.data?.user?.role
      if (roleFromMe === "ADMIN" || roleFromMe === "PEMINJAM") return roleFromMe
      return null
    } catch {
      return null
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setIsLoading(true)

    if (!email || !password) {
      setIsLoading(false)
      setError("Email dan password wajib diisi")
      await Swal.fire({
        icon: "warning",
        title: "Input belum lengkap",
        text: "Email dan password wajib diisi.",
      })
      return
    }

    try {
      const response = await fetchData("/auth/login", {
        method: "POST",
        data: { email, password },
      })

      // Simpan token jika ada
      if (response?.token) {
        localStorage.setItem("token", response.token)
      }

      // Tentukan role (dari respons login atau fallback /auth/me)
      const role = await resolveRole(response, response?.token)

      if (role) {
        localStorage.setItem("role", role)
      }

      await Swal.fire({
        icon: "success",
        title: "Login berhasil",
        text: "Selamat datang di UMC Media Hub 👋",
        timer: 1200,
        showConfirmButton: false,
      })

      // Redirect sesuai role
      if (role === "PEMINJAM") {
        router.push("/home")
      } else if (role === "ADMIN") {
        router.push("/dashboard")
      } else {
        // fallback kalau role nggak ketemu: arahkan ke login lagi + info
        await Swal.fire({
          icon: "info",
          title: "Perlu hak akses",
          text: "Role tidak terdeteksi. Silakan coba lagi atau hubungi admin.",
        })
      }
    } catch (err: any) {
      const errorMessage =
        err?.response?.data?.message || err?.message || "Email atau password salah"

      setError(errorMessage)

      await Swal.fire({
        icon: "error",
        title: "Login gagal",
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
              UMC Media Hub
            </CardTitle>
            <CardDescription className="text-base mt-2">
              Sistem Peminjaman Aset & Jasa Multimedia
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium">
                Email
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="Masukkan email Anda"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-12 rounded-xl border-2 focus:border-indigo-500 transition-colors"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-medium">
                Password
              </Label>
              <Input
                id="password"
                type="password"
                placeholder="Masukkan password Anda"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="h-12 rounded-xl border-2 focus:border-indigo-500 transition-colors"
                required
              />
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
                  <span className="!text-white">Masuk...</span>
                </>
              ) : (
                <span className="!text-white font-medium">Masuk</span>
              )}
            </Button>

            <p className="text-center text-sm text-muted-foreground">
              Belum punya akun?{" "}
              <Link
                href="/auth/register"
                className="font-medium text-indigo-600 hover:text-indigo-700 underline-offset-4 hover:underline"
              >
                Daftar di sini
              </Link>
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
