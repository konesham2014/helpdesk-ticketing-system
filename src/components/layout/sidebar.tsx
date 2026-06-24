"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import {
  LayoutDashboard,
  Ticket,
  Users,
  Activity,
  ChevronLeft,
  ChevronRight,
  HelpCircle,
  Shield,
  LogOut,
  UserCircle,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { signOut } from "next-auth/react";

interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
  roles: string[];
}

interface SidebarProps {
  onClose?: () => void;
}

const navItems: NavItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard, roles: ["CUSTOMER", "AGENT", "ADMIN"] },
  { label: "Tickets", href: "/tickets", icon: Ticket, roles: ["CUSTOMER", "AGENT", "ADMIN"] },
  { label: "Users", href: "/users", icon: Users, roles: ["ADMIN"] },
  { label: "Activity", href: "/activity", icon: Activity, roles: ["AGENT", "ADMIN"] },
];

export function Sidebar({ onClose }: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false);
  const pathname = usePathname();
  const { data: session } = useSession();

  const userRole = session?.user?.role || "CUSTOMER";
  const userName = session?.user?.name || "User";

  const filteredNav = navItems.filter((item) =>
    item.roles.includes(userRole)
  );

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <aside
      className={cn(
        "h-screen bg-card border-r border-border flex flex-col",
        collapsed ? "w-[70px]" : "w-[260px]"
      )}
    >
      {/* Logo */}
      <div className="h-16 flex items-center justify-between px-4 border-b border-border">
        <Link href="/dashboard" className="flex items-center gap-2" onClick={onClose}>
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center shrink-0">
            <HelpCircle className="w-5 h-5 text-primary-foreground" />
          </div>
          {!collapsed && (
            <span className="font-bold text-lg tracking-tight">HelpDesk</span>
          )}
        </Link>
        <div className="flex items-center gap-1">
          {/* Mobile close button */}
          {onClose && (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 lg:hidden"
              onClick={onClose}
            >
              <X className="w-4 h-4" />
            </Button>
          )}
          {/* Desktop collapse button */}
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 hidden lg:flex"
            onClick={() => setCollapsed(!collapsed)}
          >
            {collapsed ? (
              <ChevronRight className="w-4 h-4" />
            ) : (
              <ChevronLeft className="w-4 h-4" />
            )}
          </Button>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4 px-2 space-y-1 overflow-y-auto">
        {filteredNav.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onClose}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                isActive
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-accent hover:text-foreground"
              )}
            >
              <Icon className="w-5 h-5 shrink-0" />
              {!collapsed && <span className="truncate">{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* User Profile */}
      <div className="border-t border-border p-3">
        <div className={cn("flex items-center gap-3", collapsed && "justify-center")}>
          <Avatar className="w-8 h-8 shrink-0">
            <AvatarFallback className="bg-primary/10 text-primary text-xs font-bold">
              {getInitials(userName)}
            </AvatarFallback>
          </Avatar>
          {!collapsed && (
            <div className="flex-1 min-w-0 overflow-hidden">
              <p className="text-sm font-medium truncate">{userName}</p>
              <div className="flex items-center gap-1">
                {userRole === "ADMIN" && <Shield className="w-3 h-3 text-amber-500" />}
                <span className="text-xs text-muted-foreground capitalize">
                  {userRole.toLowerCase()}
                </span>
              </div>
            </div>
          )}
        </div>
        {!collapsed && (
          <div className="mt-3 flex gap-2">
            <Link href="/profile" className="flex-1" onClick={onClose}>
              <Button variant="outline" size="sm" className="w-full gap-1">
                <UserCircle className="w-3.5 h-3.5" />
                Profile
              </Button>
            </Link>
            <Button
              variant="ghost"
              size="sm"
              className="gap-1 text-muted-foreground"
              onClick={async () => {
                await signOut({ redirect: false });
                window.location.href = "/login";
              }}
            >
              <LogOut className="w-3.5 h-3.5" />
              Logout
            </Button>
          </div>
        )}
        {collapsed && (
          <Button
            variant="ghost"
            size="icon"
            className="w-full mt-2"
            onClick={async () => {
              await signOut({ redirect: false });
              window.location.href = "/login";
            }}
          >
            <LogOut className="w-4 h-4 text-muted-foreground" />
          </Button>
        )}
      </div>
    </aside>
  );
}