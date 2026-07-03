"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Sidebar } from "@/components/layout/Sidebar";
import { ThemeToggle } from "@/components/common/ThemeToggle";
import { Bell, Search, Menu, LogOut } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useAuthStore } from "@/store/useAuthStore";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, isAuthenticated, isLoading, logout, checkAuth } = useAuthStore();

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  // Protect dashboard routes
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/");
    }
  }, [isLoading, isAuthenticated, router]);

  // Verify role permission for the current path
  useEffect(() => {
    if (!isLoading && isAuthenticated && user) {
      const roleLower = user.role.toLowerCase();
      const expectedDashboardPath = `/dashboard/${roleLower}`;

      // Redirect if on exactly '/dashboard' or '/dashboard/'
      if (pathname === "/dashboard" || pathname === "/dashboard/") {
        router.push(expectedDashboardPath);
        return;
      }

      // If user is accessing a dashboard path of another role, redirect them to their own
      if (pathname.startsWith("/dashboard/admin") && user.role !== "ADMIN") {
        router.push(expectedDashboardPath);
      } else if (pathname.startsWith("/dashboard/owner") && user.role !== "OWNER") {
        router.push(expectedDashboardPath);
      } else if (pathname.startsWith("/dashboard/tenant") && user.role !== "TENANT") {
        router.push(expectedDashboardPath);
      }
    }
  }, [isLoading, isAuthenticated, user, pathname, router]);

  const handleSignOut = async () => {
    await logout();
    router.push("/");
  };

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-muted/20">
        <div className="animate-pulse flex flex-col items-center">
          <div className="h-12 w-12 bg-primary/20 rounded-full mb-4"></div>
          <div className="h-4 w-32 bg-muted rounded"></div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return null; // redirecting
  }

  const userInitials = `${user.firstName?.charAt(0) || ""}${user.lastName?.charAt(0) || ""}`;

  return (
    <div className="flex h-screen overflow-hidden bg-muted/20">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-64 flex-col fixed inset-y-0 z-50">
        <Sidebar role={user.role.toLowerCase() as any} />
      </aside>

      {/* Main Content Area */}
      <div className="flex flex-col flex-1 md:pl-64 h-full">
        {/* Top Header */}
        <header className="sticky top-0 z-40 flex h-16 shrink-0 items-center gap-x-4 border-b border-border/40 bg-background px-4 shadow-sm sm:gap-x-6 sm:px-6 lg:px-8">
          <Button variant="ghost" size="icon" className="md:hidden">
            <Menu className="h-5 w-5" />
            <span className="sr-only">Open sidebar</span>
          </Button>

          {/* Separator for mobile */}
          <div className="h-6 w-px bg-border md:hidden" aria-hidden="true" />

          <div className="flex flex-1 gap-x-4 self-stretch lg:gap-x-6">
            <form className="relative flex flex-1" action="#" method="GET">
              <label htmlFor="search-field" className="sr-only">
                Search
              </label>
              <Search
                className="pointer-events-none absolute inset-y-0 left-0 h-full w-5 text-muted-foreground"
                aria-hidden="true"
              />
              <Input
                id="search-field"
                className="block h-full w-full border-0 bg-transparent py-0 pl-8 pr-0 text-foreground placeholder:text-muted-foreground focus-visible:ring-0 sm:text-sm"
                placeholder="Search..."
                type="search"
                name="search"
              />
            </form>
            <div className="flex items-center gap-x-4 lg:gap-x-6">
              <ThemeToggle />
              
              <Button variant="ghost" size="icon" className="relative" onClick={() => router.push("/notifications")}>
                <Bell className="h-5 w-5" />
                <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-primary" />
                <span className="sr-only">View notifications</span>
              </Button>

              {/* Separator */}
              <div className="hidden lg:block lg:h-6 lg:w-px lg:bg-border" aria-hidden="true" />

              {/* Profile dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger
                  render={
                    <button className={cn(buttonVariants({ variant: "ghost", className: "flex items-center gap-x-2 rounded-full p-1 border border-border/50" }))}>
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="bg-primary/10 text-primary font-semibold text-xs">
                          {userInitials}
                        </AvatarFallback>
                      </Avatar>
                    </button>
                  }
                />
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>My Account</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => router.push("/profile")}>Profile</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => router.push("/settings")}>Settings</DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem className="text-destructive" onClick={handleSignOut}>
                    <LogOut className="h-4 w-4 mr-2 inline-block" /> Sign out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto outline-none">
          {children}
        </main>
      </div>
    </div>
  );
}
