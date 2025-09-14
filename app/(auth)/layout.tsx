import type React from "react"
import { AuthProvider } from "@/contexts/auth-context"

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <AuthProvider>
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-violet-50">{children}</div>
    </AuthProvider>
  )
}
