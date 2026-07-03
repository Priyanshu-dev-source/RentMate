import Link from "next/link";
import { Home } from "lucide-react";

export function Footer() {
  return (
    <footer className="w-full mt-auto border-t border-border/60 bg-muted/40 py-12 md:py-8 lg:py-4">
      <div className="container mx-auto px-4 md:px-8">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-4 lg:grid-cols-5">
          <div className="col-span-2 lg:col-span-2 flex flex-col items-start">
            <Link href="/" className="mb-4 flex items-center space-x-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
                <Home className="h-5 w-5 text-primary-foreground" />
              </div>
              <span className="font-bold text-xl">RentMate</span>
            </Link>
            <p className="max-w-xs text-sm text-muted-foreground">
              Finding the perfect room and compatible flatmates has never been easier. We make renting seamless and stress-free.
            </p>
          </div>
          
          <div>
            <h3 className="mb-4 text-sm font-semibold text-foreground">Platform</h3>
            <ul className="space-y-3 text-sm text-muted-foreground">
              <li><Link href="/search" className="hover:text-primary transition-colors">Find a Room</Link></li>
              <li><Link href="/tenants" className="hover:text-primary transition-colors">Find Flatmates</Link></li>
              <li><Link href="/pricing" className="hover:text-primary transition-colors">Pricing</Link></li>
            </ul>
          </div>
          
          <div>
            <h3 className="mb-4 text-sm font-semibold text-foreground">Company</h3>
            <ul className="space-y-3 text-sm text-muted-foreground">
              <li><Link href="/about" className="hover:text-primary transition-colors">About Us</Link></li>
              <li><Link href="/contact" className="hover:text-primary transition-colors">Contact</Link></li>
              <li><Link href="/careers" className="hover:text-primary transition-colors">Careers</Link></li>
            </ul>
          </div>
          
          <div>
            <h3 className="mb-4 text-sm font-semibold text-foreground">Legal</h3>
            <ul className="space-y-3 text-sm text-muted-foreground">
              <li><Link href="/privacy" className="hover:text-primary transition-colors">Privacy Policy</Link></li>
              <li><Link href="/terms" className="hover:text-primary transition-colors">Terms of Service</Link></li>
              <li><Link href="/cookies" className="hover:text-primary transition-colors">Cookie Policy</Link></li>
            </ul>
          </div>
        </div>
        
        <div className="mt-12 w-full pt-3 border-t border-border/40 flex flex-col md:flex-row justify-center items-center gap-4">
          <p className="text-xs text-muted-foreground text-center">
            &copy; {new Date().getFullYear()} RentMate Inc. All rights reserved.
          </p>
          <div className="flex items-center space-x-4 text-muted-foreground">
            {/* Social Icons would go here */}
          </div>
        </div>
      </div>
    </footer>
  );
}
