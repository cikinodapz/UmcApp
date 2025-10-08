"use client"

import type React from "react"
import { useState, useEffect, useCallback } from "react"
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

declare global {
  interface Window {
    google?: any
  }
}

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [googleLoaded, setGoogleLoaded] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const script = document.createElement("script")
    script.src = "https://accounts.google.com/gsi/client"
    script.async = true
    script.defer = true
    script.onload = () => setGoogleLoaded(true)
    document.body.appendChild(script)
    return () => {
      document.body.removeChild(script)
    }
  }, [])

  const handleGoogleResponse = useCallback(async (response: any) => {
    if (!response?.credential) {
      setError("Gagal mendapatkan credential dari Google")
      return
    }
    setError("")
    setIsLoading(true)
    try {
      const loginResponse = await fetchData("/auth/google", {
        method: "POST",
        data: { idToken: response.credential }, // atau credential: response.credential
      })
      await handleLoginSuccess(loginResponse)
    } catch (err: any) {
      const errorMessage =
        err?.response?.data?.message || err?.message || "Login Google gagal"
      setError(errorMessage)
      await Swal.fire({ icon: "error", title: "Login Google gagal", text: errorMessage })
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    if (!googleLoaded || !window.google) return
    window.google.accounts.id.initialize({
      client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
      callback: handleGoogleResponse,
      auto_select: false,
      cancel_on_tap_outside: true,
    })
    // Render tombol resmi Google sebagai fallback (disembunyikan)
    const el = document.getElementById("google-signin-button")
    if (el) {
      window.google.accounts.id.renderButton(el, {
        theme: "outline",
        size: "large",
        text: "signin_with",
        width: "100%",
        logo_alignment: "left",
      })
    }
  }, [googleLoaded, handleGoogleResponse])

  const resolveRole = async (loginResp: any, token?: string): Promise<Role | null> => {
    const roleFromLogin: Role | undefined =
      loginResp?.user?.role || loginResp?.role || loginResp?.data?.user?.role
    if (roleFromLogin === "ADMIN" || roleFromLogin === "PEMINJAM") return roleFromLogin

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

  const handleLoginSuccess = async (response: any) => {
    if (response?.token) {
      localStorage.setItem("token", response.token)
    }
    const role = await resolveRole(response, response?.token)
    if (role) localStorage.setItem("role", role)

    await Swal.fire({
      icon: "success",
      title: "Login berhasil",
      text: "Selamat datang di UMC Media Hub 👋",
      timer: 1200,
      showConfirmButton: false,
    })

    if (role === "PEMINJAM") router.push("/home")
    else if (role === "ADMIN") router.push("/dashboard")
    else {
      await Swal.fire({
        icon: "info",
        title: "Perlu hak akses",
        text: "Role tidak terdeteksi. Silakan coba lagi atau hubungi admin.",
      })
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
      await handleLoginSuccess(response)
    } catch (err: any) {
      const errorMessage =
        err?.response?.data?.message || err?.message || "Email atau password salah"
      setError(errorMessage)
      await Swal.fire({ icon: "error", title: "Login gagal", text: errorMessage })
    } finally {
      setIsLoading(false)
    }
  }

  // Tombol Google kustom → panggil One Tap / chooser
  const handleCustomGoogleClick = () => {
    if (!window.google) return
    window.google.accounts.id.prompt((notification: any) => {
      // Fallback: kalau prompt gagal tampil, klik tombol resmi yang disembunyikan
      if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
        const fallback = document.querySelector<HTMLDivElement>("#google-signin-button div[role=button]")
        if (fallback) fallback.click()
      }
    })
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

            {/* Tombol Masuk (password) – tetap seperti punyamu */}
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
          </form>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="bg-white px-2 text-muted-foreground">Atau masuk dengan</span>
            </div>
          </div>

          {/* TOMBOL GOOGLE KUSTOM: bentuk mirip, warna tetap putih */}
          <Button
            type="button"
            onClick={handleCustomGoogleClick}
            disabled={!googleLoaded || isLoading}
            aria-label="Masuk dengan Google"
            className="w-full h-12 rounded-xl bg-white text-gray-900 border-2 border-gray-200 hover:bg-gray-50 font-medium shadow-sm hover:shadow transition-all duration-200 flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Masuk dengan Google...</span>
              </>
            ) : (
              <>
                {/* Ikon Google full-color agar kontras di background putih */}
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="18"
                  height="18"
                  viewBox="0 0 48 48"
                  className="shrink-0"
                  aria-hidden="true"
                >
                  <path fill="#FFC107" d="M43.611 20.083H42V20H24v8h11.303C33.602 32.167 29.223 35 24 35c-7.18 0-13-5.82-13-13s5.82-13 13-13c3.313 0 6.315 1.234 8.594 3.252l5.657-5.657C34.754 3.053 29.648 1 24 1 11.85 1 2 10.85 2 23s9.85 22 22 22c12.15 0 22-9.85 22-22 0-1.474-.153-2.911-.389-4.417z"/>
                  <path fill="#FF3D00" d="M6.306 14.691l6.571 4.814C14.48 16.146 18.861 13 24 13c3.313 0 6.315 1.234 8.594 3.252l5.657-5.657C34.754 3.053 29.648 1 24 1 15.317 1 7.83 6.13 4.306 13.309z"/>
                  <path fill="#4CAF50" d="M24 45c5.136 0 9.718-1.97 13.211-5.178l-6.1-5.159C29.87 36.927 27.085 38 24 38c-5.198 0-9.556-3.315-11.146-7.946l-6.54 5.036C9.797 41.826 16.38 45 24 45z"/>
                  <path fill="#1976D2" d="M43.611 20.083H42V20H24v8h11.303C34.623 31.324 29.223 35 24 35c-5.198 0-9.556-3.315-11.146-7.946l-6.54 5.036C9.797 41.826 16.38 45 24 45c12.15 0 22-9.85 22-22 0-1.474-.153-2.911-.389-4.417z"/>
                </svg>
                <span className="font-medium">Masuk dengan Google</span>
              </>
            )}
          </Button>

          {/* Tombol resmi Google (fallback) – disembunyikan */}
          <div id="google-signin-button" className="w-full sr-only" />

          <p className="text-center text-sm text-muted-foreground mt-6">
            Belum punya akun?{" "}
            <Link
              href="/auth/register"
              className="font-medium text-indigo-600 hover:text-indigo-700 underline-offset-4 hover:underline"
            >
              Daftar di sini
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
