"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, Users } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import { Role } from "@/types"
import { useToast } from "@/hooks/use-toast"
import Image from "next/image"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [role, setRole] = useState<Role | "">("")
  const [error, setError] = useState("")
  const { login, isLoading } = useAuth()
  const router = useRouter()
  const { toast } = useToast()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (!email || !password || !role) {
      setError("Semua field harus diisi")
      return
    }

    const success = await login(email, password, role as Role)

    if (success) {
      toast({
        title: "Login berhasil",
        description: "Selamat datang di UMC Media Hub",
      })
      router.push("/dashboard")
    } else {
      setError("Email, password, atau role tidak valid")
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
            <CardDescription className="text-base mt-2">Sistem Peminjaman Aset & Jasa Multimedia</CardDescription>
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

            <div className="space-y-2">
              <Label htmlFor="role" className="text-sm font-medium">
                Role (Demo)
              </Label>
              <Select value={role} onValueChange={(value) => setRole(value as Role)}>
                <SelectTrigger className="h-12 rounded-xl border-2 focus:border-indigo-500">
                  <SelectValue placeholder="Pilih role untuk demo" />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  <SelectItem value={Role.ADMIN} className="rounded-lg">
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4" />
                      Admin
                    </div>
                  </SelectItem>
                  <SelectItem value={Role.PEMINJAM} className="rounded-lg">
                    <div className="flex items-center gap-2">
                      <Image src="/logo.png" alt="Peminjam" width={16} height={16} className="rounded-sm" />
                      Peminjam
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
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
          </form>

          <div className="mt-8 p-4 bg-gray-50 rounded-xl">
            <p className="text-sm font-medium text-gray-700 mb-2">Demo Credentials:</p>
            <div className="space-y-1 text-xs text-gray-600">
              <p>
                <strong>Admin:</strong> admin@umc.ac.id (password: admin123)
              </p>
              <p>
                <strong>Peminjam:</strong> budi@student.umc.ac.id (password: budi123)
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}