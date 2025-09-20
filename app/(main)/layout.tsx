"use client";

import type React from "react";
import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { AuthProvider, useAuth } from "@/contexts/auth-context";
import { AuthGuard } from "@/components/auth-guard";
import { AppSidebar } from "@/components/app-sidebar";
import { Topbar } from "@/components/topbar";
import { PeminjamNavbar } from "@/components/peminjam-navbar";
import { Role } from "@/types";

// DAFTAR PREFIX RUTE ADMIN — tambahkan semua rute admin-mu di sini
const ADMIN_PREFIXES = [
  "/dashboard",
  "/inventory",
  "/pemesanan",
  "/payments",
  "/returns",
  "/fines",
  "/feedback",
  "/notifications",
  "/settings",
];

function isInAdminSection(pathname: string) {
  return ADMIN_PREFIXES.some(
    (p) => pathname === p || pathname.startsWith(p + "/")
  );
}

function MainLayoutContent({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  if (isLoading) return null;
  if (!user) return null;

  const isAdmin = user.role === Role.ADMIN;
  const adminSection = isInAdminSection(pathname);

  // Hard guard: non-admin tidak boleh masuk area admin
  useEffect(() => {
    if (adminSection && !isAdmin) router.replace("/home");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [adminSection, isAdmin]);

  if (isAdmin && adminSection) {
    // Layout ADMIN: hanya saat berada di salah satu rute admin
    return (
      <div className="flex h-screen bg-gray-50">
        <AppSidebar />
        <div className="flex-1 flex flex-col overflow-hidden">
          <Topbar />
          <main className="flex-1 overflow-y-auto p-6">
            <div className="max-w-7xl mx-auto">{children}</div>
          </main>
        </div>
      </div>
    );
  }

  // Layout PEMINJAM / halaman non-admin
  return (
    <div className="min-h-screen bg-gray-50">
      <PeminjamNavbar />
      <main className="py-6">
        <div className="max-w-7xl mx-auto px-4">{children}</div>
      </main>
    </div>
  );
}

export default function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <AuthGuard>
        <MainLayoutContent>{children}</MainLayoutContent>
      </AuthGuard>
    </AuthProvider>
  );
}
