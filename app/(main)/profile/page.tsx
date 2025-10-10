"use client"

import { useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { fetchData } from "@/lib/api"
import { useToast } from "@/hooks/use-toast"
import { Button } from "@/components/ui/button"
import Swal from 'sweetalert2'

type ApiUser = {
  id: string
  name: string
  email: string
  phone?: string
  photoUrl?: string
  role?: string
  status?: string
  createdAt?: string
  updatedAt?: string
}

export default function ProfilePage() {
  const { toast } = useToast()
  const router = useRouter()
  const [user, setUser] = useState<ApiUser | null>(null)
  const [loading, setLoading] = useState(false)
  const [photoUploading, setPhotoUploading] = useState(false)
  const fileRef = useRef<HTMLInputElement | null>(null)

  const [pwd, setPwd] = useState({ currentPassword: "", newPassword: "", confirmPassword: "" })

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true)
        const resp = await fetchData("/auth/me")
        setUser(resp?.user || resp)
      } catch (e: any) {
        toast({ title: "Gagal memuat profil", description: e?.message || "Coba lagi nanti", variant: "destructive" })
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [toast])

  const initials = (name?: string) =>
    (name || "?")
      .split(" ")
      .filter(Boolean)
      .map((n) => n[0])
      .join("")
      .toUpperCase()

  const pickPhoto = () => fileRef.current?.click()

  const uploadPhoto = async (file?: File) => {
    if (!file) return
    try {
      setPhotoUploading(true)
      const form = new FormData()
      form.append("photo", file)
      const resp = await fetchData("/auth/photo", { method: "PATCH", data: form })
      const updated = resp?.user || resp
      setUser((prev) => ({ ...(prev as ApiUser), photoUrl: updated?.photoUrl }))
      toast({ title: "Foto diperbarui", description: "Foto profil berhasil diunggah" })
    } catch (e: any) {
      toast({ title: "Gagal unggah foto", description: e?.message || "Periksa format/ukuran file", variant: "destructive" })
    } finally {
      setPhotoUploading(false)
    }
  }

  const changePassword = async () => {
    if (pwd.newPassword !== pwd.confirmPassword) {
      toast({ title: "Error", description: "Password baru tidak cocok", variant: "destructive" })
      return
    }
    try {
      setLoading(true)
      await fetchData("/auth/change-password", {
        method: "PATCH",
        data: { oldPassword: pwd.currentPassword, newPassword: pwd.newPassword },
      })
      setPwd({ currentPassword: "", newPassword: "", confirmPassword: "" })
      await Swal.fire({
        icon: 'success',
        title: 'Berhasil',
        text: 'Password berhasil diubah. Silakan login kembali.',
        confirmButtonText: 'OK'
      })
      try {
        localStorage.removeItem('token')
        localStorage.removeItem('umcmediahub-user')
      } catch {}
      router.replace('/auth/login')
    } catch (e: any) {
      toast({ title: "Gagal mengubah password", description: e?.message || "Coba lagi", variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Profil</h1>
        <p className="text-gray-600 mt-2">Kelola informasi profil dan keamanan akun Anda</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900">Informasi Profil</h2>
            <button
              onClick={pickPhoto}
              disabled={photoUploading}
              className="px-4 py-2 bg-gray-100 text-gray-900 rounded-xl hover:bg-gray-200 transition-colors disabled:opacity-60"
            >
              {photoUploading ? "Mengunggah..." : "Ubah Foto"}
            </button>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => uploadPhoto(e.target.files?.[0] || undefined)}
            />
          </div>

          <div className="flex items-center mb-6">
            {user?.photoUrl ? (
              <img src={user.photoUrl} alt="Foto Profil" className="w-16 h-16 rounded-2xl object-cover border" />
            ) : (
              <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center text-white text-xl font-bold">
                {initials(user?.name)}
              </div>
            )}
            <div className="ml-4">
              <h3 className="text-lg font-semibold text-gray-900">{user?.name || (loading ? "Memuat..." : "-")}</h3>
              <p className="text-gray-600 capitalize">{user?.role || "peminjam"}</p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Nama Lengkap</label>
              <input type="text" value={user?.name || ""} disabled className="w-full px-4 py-3 border border-gray-300 rounded-xl disabled:bg-gray-50" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
              <input type="email" value={user?.email || ""} disabled className="w-full px-4 py-3 border border-gray-300 rounded-xl disabled:bg-gray-50" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">No. Telepon</label>
              <input type="tel" value={user?.phone || ""} disabled className="w-full px-4 py-3 border border-gray-300 rounded-xl disabled:bg-gray-50" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Ubah Password</h2>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Password Saat Ini</label>
              <input type="password" value={pwd.currentPassword} onChange={(e) => setPwd((p) => ({ ...p, currentPassword: e.target.value }))} className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Password Baru</label>
              <input type="password" value={pwd.newPassword} onChange={(e) => setPwd((p) => ({ ...p, newPassword: e.target.value }))} className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Konfirmasi Password Baru</label>
              <input type="password" value={pwd.confirmPassword} onChange={(e) => setPwd((p) => ({ ...p, confirmPassword: e.target.value }))} className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent" />
            </div>
          </div>

          <Button
            onClick={changePassword}
            disabled={loading}
            size="lg"
            className="w-full mt-8 h-12 bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-600 hover:to-violet-700"
          >
            {loading ? "Memproses..." : "Ubah Password"}
          </Button>
        </div>
      </div>
    </div>
  )
}
