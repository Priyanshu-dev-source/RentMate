"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Home, LogOut, LayoutDashboard, User } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ThemeToggle } from "@/components/common/ThemeToggle";
import { useAuthStore } from "@/store/useAuthStore";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

export function Navbar() {
  const router = useRouter();
  const { user, isAuthenticated, login, register, logout, checkAuth, error, clearError } = useAuthStore();

  // Auth check on mount
  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  // Dialog open state tracking
  const [signInOpen, setSignInOpen] = useState(false);
  const [signUpOpen, setSignUpOpen] = useState(false);

  // Form states
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);

  const [registerFirstName, setRegisterFirstName] = useState("");
  const [registerLastName, setRegisterLastName] = useState("");
  const [registerEmail, setRegisterEmail] = useState("");
  const [registerPassword, setRegisterPassword] = useState("");
  const [registerRole, setRegisterRole] = useState<"TENANT" | "OWNER">("TENANT");
  const [registerLoading, setRegisterLoading] = useState(false);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginEmail || !loginPassword) return;
    setLoginLoading(true);
    try {
      const loggedUser = await login({ email: loginEmail, password: loginPassword });
      setSignInOpen(false);
      // Redirect based on role
      if (loggedUser.role === "OWNER") {
        router.push("/dashboard/owner");
      } else if (loggedUser.role === "ADMIN") {
        router.push("/dashboard/admin");
      } else {
        router.push("/dashboard/tenant");
      }
    } catch (err) {
      // Error is set in store
    } finally {
      setLoginLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!registerFirstName || !registerLastName || !registerEmail || !registerPassword) return;
    setRegisterLoading(true);
    try {
      const registeredUser = await register({
        firstName: registerFirstName,
        lastName: registerLastName,
        email: registerEmail,
        password: registerPassword,
        role: registerRole,
      });
      setSignUpOpen(false);
      if (registeredUser.role === "OWNER") {
        router.push("/dashboard/owner");
      } else if (registeredUser.role === "ADMIN") {
        router.push("/dashboard/admin");
      } else {
        router.push("/dashboard/tenant");
      }
    } catch (err) {
      // Error is set in store
    } finally {
      setRegisterLoading(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    router.push("/");
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-16 items-center px-4 md:px-8">
        <div className="mr-4 flex">
          <Link href="/" className="mr-6 flex items-center space-x-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
              <Home className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="font-bold sm:inline-block">RentMate</span>
          </Link>
          <nav className="hidden md:flex items-center space-x-6 text-sm font-medium">
            <Link
              href="/search"
              className="transition-colors hover:text-foreground/80 text-foreground/60"
            >
              Find a Room
            </Link>
            <Link
              href="/tenants"
              className="transition-colors hover:text-foreground/80 text-foreground/60"
            >
              Find Flatmates
            </Link>
          </nav>
        </div>

        <div className="flex flex-1 items-center justify-between space-x-2 md:justify-end">
          <div className="w-full flex-1 md:w-auto md:flex-none"></div>
          <nav className="flex items-center gap-2">
            <ThemeToggle />

            {isAuthenticated && user ? (
              <DropdownMenu>
                <DropdownMenuTrigger
                  render={
                    <button className={cn(buttonVariants({ variant: "ghost", className: "flex items-center gap-x-2 rounded-full p-1 border border-border/50" }))}>
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="bg-primary/10 text-primary font-bold">
                          {user.firstName?.charAt(0) || ""}{user.lastName?.charAt(0) || ""}
                        </AvatarFallback>
                      </Avatar>
                      <span className="hidden md:inline-block text-xs font-semibold px-1 text-muted-foreground">
                        {user.firstName || ""}
                      </span>
                    </button>
                  }
                />
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>My Account</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => router.push(user.role === "OWNER" ? "/dashboard/owner" : "/dashboard/tenant")}>
                    <LayoutDashboard className="mr-2 h-4 w-4" /> Dashboard
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => router.push("/profile")}>
                    <User className="mr-2 h-4 w-4" /> Profile
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout} className="text-destructive">
                    <LogOut className="mr-2 h-4 w-4" /> Sign out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <>
                <Dialog open={signInOpen} onOpenChange={(open) => { setSignInOpen(open); if(!open) clearError(); }}>
                  <DialogTrigger render={<button className={cn(buttonVariants({ variant: "ghost", className: "rounded-full" }))} />}>
                    Sign In
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                      <DialogTitle>Sign In</DialogTitle>
                      <DialogDescription>
                        Welcome back! Please enter your details to sign in.
                      </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleSignIn} className="flex flex-col gap-4 py-4">
                      {error && (
                        <div className="bg-destructive/10 text-destructive text-sm p-3 rounded-lg border border-destructive/20 font-medium">
                          {error}
                        </div>
                      )}
                      <div className="flex flex-col gap-2">
                        <label className="text-sm font-medium" htmlFor="email">Email</label>
                        <input
                          id="email"
                          type="email"
                          required
                          placeholder="name@example.com"
                          value={loginEmail}
                          onChange={(e) => setLoginEmail(e.target.value)}
                          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                        />
                      </div>
                      <div className="flex flex-col gap-2">
                        <label className="text-sm font-medium" htmlFor="password">Password</label>
                        <input
                          id="password"
                          type="password"
                          required
                          value={loginPassword}
                          onChange={(e) => setLoginPassword(e.target.value)}
                          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                        />
                      </div>
                      <Button className="w-full rounded-full hover:bg-gray-600 transition-all duration-200" type="submit" disabled={loginLoading}>
                        {loginLoading ? "Signing In..." : "Sign In"}
                      </Button>
                    </form>
                  </DialogContent>
                </Dialog>

                <Dialog open={signUpOpen} onOpenChange={(open) => { setSignUpOpen(open); if(!open) clearError(); }}>
                  <DialogTrigger render={<button className={cn(buttonVariants({ className: "rounded-full shadow-sm" }))} />}>
                    Get Started
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-xl px-8">
                    <DialogHeader>
                      <DialogTitle>Create an Account</DialogTitle>
                      <DialogDescription>
                        Join thousands of users finding their perfect living situation.
                      </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleSignUp} className="flex flex-col gap-4 py-2 max-h-[80vh] overflow-y-auto">
                      {error && (
                        <div className="bg-destructive/10 text-destructive text-sm p-3 rounded-lg border border-destructive/20 font-medium">
                          {error}
                        </div>
                      )}
                      <div className="grid grid-cols-2 gap-2">
                        <div className="flex flex-col gap-2">
                          <label className="text-sm font-medium" htmlFor="first-name">First Name</label>
                          <input
                            id="first-name"
                            type="text"
                            required
                            placeholder="John"
                            value={registerFirstName}
                            onChange={(e) => setRegisterFirstName(e.target.value)}
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                          />
                        </div>
                        <div className="flex flex-col gap-2">
                          <label className="text-sm font-medium" htmlFor="last-name">Last Name</label>
                          <input
                            id="last-name"
                            type="text"
                            required
                            placeholder="Doe"
                            value={registerLastName}
                            onChange={(e) => setRegisterLastName(e.target.value)}
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                          />
                        </div>
                      </div>
                      <div className="flex flex-col gap-2">
                        <label className="text-sm font-medium" htmlFor="signup-email">Email</label>
                        <input
                          id="signup-email"
                          type="email"
                          required
                          placeholder="name@example.com"
                          value={registerEmail}
                          onChange={(e) => setRegisterEmail(e.target.value)}
                          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                        />
                      </div>
                      <div className="flex flex-col gap-2">
                        <label className="text-sm font-medium" htmlFor="signup-password">Password</label>
                        <input
                          id="signup-password"
                          type="password"
                          required
                          placeholder="At least 6 characters"
                          value={registerPassword}
                          onChange={(e) => setRegisterPassword(e.target.value)}
                          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                        />
                      </div>
                      <div className="flex flex-col gap-2">
                        <label className="text-sm font-medium">I want to find a...</label>
                        <div className="grid grid-cols-2 gap-4">
                          <button
                            type="button"
                            onClick={() => setRegisterRole("TENANT")}
                            className={`py-3 px-4 rounded-xl border text-sm font-semibold transition-all ${
                              registerRole === "TENANT"
                                ? "border-primary bg-primary/10 text-primary"
                                : "border-border hover:bg-muted/50"
                            }`}
                          >
                            Room / Flatmate
                          </button>
                          <button
                            type="button"
                            onClick={() => setRegisterRole("OWNER")}
                            className={`py-3 px-4 rounded-xl border text-sm font-semibold transition-all ${
                              registerRole === "OWNER"
                                ? "border-primary bg-primary/10 text-primary"
                                : "border-border hover:bg-muted/50"
                            }`}
                          >
                            Tenant (Owner)
                          </button>
                        </div>
                      </div>
                      <Button className="w-full rounded-full mt-2" type="submit" disabled={registerLoading}>
                        {registerLoading ? "Creating Account..." : "Create Account"}
                      </Button>
                    </form>
                  </DialogContent>
                </Dialog>
              </>
            )}
          </nav>
        </div>
      </div>
    </header>
  );
}
