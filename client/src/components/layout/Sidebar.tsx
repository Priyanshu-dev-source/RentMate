"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Home,
  Users,
  Settings,
  MessageSquare,
  Bell,
  Heart,
  FileText,
  BarChart,
  LogOut,
  User,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { useAuthStore } from "@/store/useAuthStore";

interface SidebarProps {
  className?: string;
  role?: "owner" | "tenant" | "admin";
}

export function Sidebar({ className, role }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuthStore();

  // Determine role based on auth state, falls back to pathname or property
  const currentRole =
    role ||
    user?.role?.toLowerCase() ||
    (pathname.includes("/dashboard/owner")
      ? "owner"
      : pathname.includes("/dashboard/admin")
      ? "admin"
      : "tenant");

  const getLinks = () => {
    switch (currentRole) {
      case "owner":
        return [
          { name: "Overview", href: "/dashboard/owner", icon: LayoutDashboard },
          { name: "My Listings", href: "/dashboard/owner/listings", icon: Home },
          { name: "Create Listing", href: "/dashboard/owner/listings/create", icon: Home },
          { name: "Interests", href: "/dashboard/owner/interests", icon: Users },
          { name: "Messages", href: "/chat", icon: MessageSquare },
        ];
      case "admin":
        return [
          { name: "Dashboard", href: "/dashboard/admin", icon: LayoutDashboard },
          { name: "Users Management", href: "/dashboard/admin/users", icon: Users },
          { name: "Listings", href: "/dashboard/admin/listings", icon: Home },
          { name: "Analytics", href: "/dashboard/admin/analytics", icon: BarChart },
          { name: "Reports", href: "/dashboard/admin/reports", icon: FileText },
        ];
      case "tenant":
      default:
        return [
          { name: "Recommendations", href: "/dashboard/tenant", icon: LayoutDashboard },
          { name: "Browse Rooms", href: "/search", icon: SearchIcon },
          { name: "Saved Listings", href: "/dashboard/tenant/saved", icon: Heart },
          { name: "Interests Sent", href: "/dashboard/tenant/interests", icon: FileText },
          { name: "Messages", href: "/chat", icon: MessageSquare },
        ];
    }
  };

  const links = getLinks();

  const handleSignOut = async () => {
    await logout();
    router.push("/");
  };

  return (
    <div className={cn("flex flex-col h-screen border-r border-border/40 bg-card text-card-foreground", className)}>
      <div className="flex h-16 items-center px-6 border-b border-border/40">
        <Link href="/" className="flex items-center gap-2 font-bold text-lg">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
            <Home className="h-5 w-5 text-primary-foreground" />
          </div>
          RentMate
        </Link>
      </div>

      <ScrollArea className="flex-1 px-4 py-6">
        <div className="mb-4 px-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {currentRole} Menu
        </div>
        <nav className="flex flex-col gap-2">
          {links.map((link) => {
            const isActive =
              pathname === link.href ||
              (pathname.startsWith(link.href) &&
                link.href !== "/dashboard/owner" &&
                link.href !== "/dashboard/admin" &&
                link.href !== "/dashboard/tenant");

            return (
              <Button
                key={link.href}
                variant={isActive ? "secondary" : "ghost"}
                className={cn(
                  "justify-start w-full",
                  isActive ? "bg-secondary text-secondary-foreground font-medium" : "text-muted-foreground"
                )}
                onClick={() => router.push(link.href)}
              >
                <link.icon className="mr-3 h-5 w-5" />
                {link.name}
              </Button>
            );
          })}
        </nav>

        <Separator className="my-6" />

        <div className="mb-4 px-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          General
        </div>
        <nav className="flex flex-col gap-2">
          <Button variant="ghost" className="justify-start text-muted-foreground w-full" onClick={() => router.push("/profile")}>
            <User className="mr-3 h-5 w-5" /> Profile
          </Button>
          {/* <Button variant="ghost" className="justify-start text-muted-foreground w-full" onClick={() => router.push("/notifications")}>
            <Bell className="mr-3 h-5 w-5" /> Notifications
          </Button>
          <Button variant="ghost" className="justify-start text-muted-foreground w-full" onClick={() => router.push("/settings")}>
            <Settings className="mr-3 h-5 w-5" /> Settings
          </Button> */}
        </nav>
      </ScrollArea>

      <div className="p-4 border-t border-border/40">
        <Button
          variant="outline"
          className="w-full justify-start text-muted-foreground hover:text-destructive"
          onClick={handleSignOut}
        >
          <LogOut className="mr-3 h-5 w-5" /> Sign Out
        </Button>
      </div>
    </div>
  );
}

function SearchIcon(props: React.ComponentProps<"svg">) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="11" cy="11" r="8" />
      <path d="m21 21-4.3-4.3" />
    </svg>
  );
}
