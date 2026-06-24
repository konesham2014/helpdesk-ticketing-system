"use client";

import { Sidebar } from "@/components/layout/sidebar";
import { useSession } from "next-auth/react";
import { redirect } from "next/navigation";
import { Skeleton } from "@/components/ui/skeleton";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { status } = useSession();

  if (status === "loading") {
    return (
      <div className="flex h-screen">
        <div className="w-[260px] border-r border-border p-4 space-y-4">
          <Skeleton className="h-8 w-32" />
          <div className="space-y-2">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        </div>
        <div className="flex-1 p-8 space-y-4">
          <Skeleton className="h-8 w-64" />
          <div className="grid grid-cols-4 gap-4">
            <Skeleton className="h-32" />
            <Skeleton className="h-32" />
            <Skeleton className="h-32" />
            <Skeleton className="h-32" />
          </div>
        </div>
      </div>
    );
  }

  if (status === "unauthenticated") {
    redirect("/login");
  }

  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      <main className="flex-1 ml-[260px] overflow-auto">
        <div className="p-6 lg:p-8 max-w-7xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
