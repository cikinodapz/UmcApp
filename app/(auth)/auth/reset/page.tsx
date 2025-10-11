"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2 } from "lucide-react"
import Swal from "sweetalert2"
import { fetchData } from "@/lib/api"
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp"

export default function ResetPasswordPage() {
  const [email, setEmail] = useState("")
  const [otp, setOtp] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    if (newPassword !== confirmPassword) {
      setError("Konfirmasi password tidak cocok")
      return
    }
    setLoading(true)
    try {
      await fetchData("/auth/password/reset", {
        method: "POST",
        data: { email, otp, newPassword },
      })
      await Swal.fire({ icon: "success", title: "Password diubah", text: "Silakan login dengan password baru." })
      router.push("/auth/login")
    } catch (err: any) {
      setError(err?.message || "Gagal reset password. Coba lagi.")
      await Swal.fire({ icon: "error", title: "Gagal", text: err?.message || "Coba lagi" })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-2xl border-0 bg-white/80 backdrop-blur-sm">
        <CardHeader className="text-center space-y-2">
          <CardTitle className="text-2xl font-bold">Reset Password</CardTitle>
          <CardDescription>Masukkan email, OTP, dan password baru</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="email@domain.com" />
            </div>

            <div className="space-y-2">
              <Label>Kode OTP</Label>
              <InputOTP maxLength={6} value={otp} onChange={setOtp}>
                <InputOTPGroup>
                  <InputOTPSlot index={0} />
                  <InputOTPSlot index={1} />
                  <InputOTPSlot index={2} />
                  <InputOTPSlot index={3} />
                  <InputOTPSlot index={4} />
                  <InputOTPSlot index={5} />
                </InputOTPGroup>
              </InputOTP>
            </div>

            <div className="space-y-2">
              <Label htmlFor="newPassword">Password Baru</Label>
              <Input id="newPassword" type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required placeholder="Minimal 6 karakter" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Konfirmasi Password</Label>
              <Input id="confirmPassword" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required />
            </div>

            {error && (
              <Alert className="rounded-xl border-red-200 bg-red-50">
                <AlertDescription className="text-red-800">{error}</AlertDescription>
              </Alert>
            )}

            <Button
              type="submit"
              disabled={loading || otp.length !== 6}
              className="w-full h-12 rounded-xl !bg-indigo-600 hover:!bg-indigo-700 !text-white font-medium shadow-lg hover:shadow-xl transition-all duration-200 !border-0"
              style={{
                background: "linear-gradient(to right, rgb(99, 102, 241), rgb(139, 92, 246))",
                color: "white",
              }}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin !text-white" />
                  <span className="!text-white">Menyimpan...</span>
                </>
              ) : (
                <span className="!text-white font-medium">Reset Password</span>
              )}
            </Button>

            <p className="text-center text-sm text-muted-foreground">
              Belum ada OTP? <Link href="/auth/forgot" className="text-indigo-600 hover:text-indigo-700 underline">Kirim OTP</Link>
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
