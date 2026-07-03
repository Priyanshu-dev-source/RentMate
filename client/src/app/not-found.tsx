"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Home } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] px-4 text-center">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-md"
      >
        <h1 className="text-9xl font-extrabold tracking-tighter text-primary/20 mb-4">404</h1>
        <h2 className="text-3xl font-bold mb-4">Page Not Found</h2>
        <p className="text-muted-foreground mb-8">
          Oops! The page you are looking for doesn't exist, has been removed, or is temporarily unavailable.
        </p>
        <Button size="lg" className="rounded-full px-8 h-12" render={<Link href="/" />}>
          <Home className="mr-2 h-4 w-4" /> Back to Home
        </Button>
      </motion.div>
    </div>
  );
}
