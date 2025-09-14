"use client";

import type React from "react";
import { AuthProvider } from "@/contexts/auth-context";
import { AuthGuard } from "@/components/auth-guard";
import { AppSidebar } from "@/components/app-sidebar";
import { Topbar } from "@/components/topbar";
import { PeminjamNavbar } from "@/components/peminjam-navbar";
import { useAuth } from "@/contexts/auth-context";
import { Role } from "@/types";

function MainLayoutContent({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();

  if (!user) {
    return null;
  }

  // Admin Layout - Sidebar + Topbar
  if (user.role === Role.ADMIN) {
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

  // Peminjam Layout - Top Navigation
  return (
    <div className="min-h-screen bg-gray-50">
      <PeminjamNavbar />
      <main className="py-6">
        <div className="max-w-7xl mx-auto px-4">{children}</div>
      </main>
    </div>
  );
}

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthProvider>
      <AuthGuard>
        <MainLayoutContent>{children}</MainLayoutContent>
      </AuthGuard>
    </AuthProvider>
  );
}
