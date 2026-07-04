"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/useAuthStore";
import Link from "next/link";
import { motion } from "framer-motion";
import { Search, Users, ShieldCheck, MapPin, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Footer } from "@/components/layout/Footer";
import { Navbar } from "@/components/layout/Navbar";

const fadeIn = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6 } }
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

export default function Home() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuthStore();

  useEffect(() => {
    if (isAuthenticated && user) {
      if (user.role === "OWNER") {
        router.push("/dashboard/owner");
      } else if (user.role === "ADMIN") {
        router.push("/dashboard/admin");
      } else {
        router.push("/dashboard/tenant");
      }
    }
  }, [isAuthenticated, user, router]);

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar/>
      <section className="relative pt-24 md:pt-17 pb-20 px-16 overflow-hidden">
        {/* Background Decorative Elements */}
        <div className="absolute top-1/2 left-0 -translate-y-1/2 w-[800px] h-[800px] bg-primary/10 rounded-full blur-3xl -z-10" />
        <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-blue-400/10 rounded-full blur-3xl -z-10" />

        <div className="container mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Left Content */}
            <motion.div
              initial="hidden"
              animate="visible"
              variants={staggerContainer}
              className="flex flex-col items-start text-left max-w-2xl"
            >
              {/* <motion.div variants={fadeIn} className="inline-flex items-center rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-sm text-primary mb-8">
                <span className="flex h-2 w-2 rounded-full bg-primary mr-2"></span>
                Your seamless renting experience starts here
              </motion.div> */}
              
              <motion.h1 variants={fadeIn} className="text-5xl md:text-6xl lg:text-7xl font-extrabold tracking-tight mb-8 text-foreground">
                Find Your Perfect <br className="hidden md:block" />
                <span className="text-transparent bg-clip-text bg-blue-400/80">Room & Flatmate</span>
              </motion.h1>
              
              <motion.p variants={fadeIn} className="text-lg w-[400px] text-muted-foreground mb-10 leading-relaxed">
                Stop scrolling endlessly. Our smart matching algorithm pairs you with compatible flatmates and beautiful spaces that feel like home.
              </motion.p>
              
              <motion.div variants={fadeIn} className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
                <Button size="lg" variant="outline" className="rounded-full px-8 h-14 text-lg" render={<Link href="/search" />}>
                  <Search className="mr-2 h-5 w-5" /> Browse Listings
                </Button>
                <Button size="lg" variant="outline" className="rounded-full px-8 h-14 text-lg" render={<Link href="/tenants" />}>
                  <Users className="mr-2 h-5 w-5" /> Find Flatmates
                </Button>
              </motion.div>
            </motion.div>

            {/* Right Image */}
            <motion.div 
              initial="hidden"
              animate="visible"
              variants={{
                hidden: { opacity: 0, scale: 0.95, x: 20 },
                visible: { opacity: 1, scale: 1, x: 0, transition: { duration: 0.8, delay: 0.2 } }
              }}
              className="w-full relative rounded-3xl overflow-hidden shadow-2xl border border-border/50 bg-background/50 backdrop-blur-sm p-2 aspect-[4/3] lg:aspect-[4/3]"
            >
              <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent z-10 rounded-3xl pointer-events-none" />
              <img src="/images/hero.png" alt="Modern collaborative apartment living" className="w-full h-full object-cover rounded-2xl" />
            </motion.div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-muted/30">       
      <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold mb-4">Why Choose RentMate?</h2>
            <p className="text-primary-foreground/80 text-lg mb-10 max-w-2xl mx-auto relative z-10">Everything you need to find, vet, and secure your next living arrangement in one fluid platform.</p>
          </div>

          <motion.div 
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={staggerContainer}
            className="grid grid-cols-1 md:grid-cols-3 gap-8 px-8"
          >
            {/* Feature 1 */}
            <motion.div variants={fadeIn} className="bg-card p-8 rounded-3xl shadow-sm border border-border/50 hover:border-primary/30 hover:scale-[105%] hover:shadow-2xl transition-all">
              <div className="h-14 w-14 bg-primary/10 rounded-2xl flex items-center justify-center mb-6">
                <MapPin className="h-7 w-7 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Prime Locations</h3>
              <p className="text-muted-foreground leading-relaxed">
                Discover verified listings in the best neighborhoods. Our dynamic map search makes finding the right area effortless.
              </p>
            </motion.div>

            {/* Feature 2 */}
            <motion.div variants={fadeIn} className="bg-card p-8 rounded-3xl shadow-sm border border-border/50 hover:border-primary/30 hover:scale-[105%] hover:shadow-2xl transition-all">
              <div className="h-14 w-14 bg-primary/10 rounded-2xl flex items-center justify-center mb-6">
                <Users className="h-7 w-7 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Smart Compatibility</h3>
              <p className="text-muted-foreground leading-relaxed">
                Our proprietary algorithm matches you with flatmates based on lifestyle, habits, and preferences to ensure harmony.
              </p>
            </motion.div>

            {/* Feature 3 */}
            <motion.div variants={fadeIn} className="bg-card p-8 rounded-3xl shadow-sm border border-border/50 hover:border-primary/30 hover:scale-[105%] hover:shadow-2xl transition-all">
              <div className="h-14 w-14 bg-primary/10 rounded-2xl flex items-center justify-center mb-6">
                <ShieldCheck className="h-7 w-7 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Verified Users</h3>
              <p className="text-muted-foreground leading-relaxed">
                Every owner and tenant is verified. Say goodbye to scams and hello to a secure, transparent renting ecosystem.
              </p>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-10 px-4">
        <motion.div 
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={fadeIn}
          className="container mx-auto bg-primary text-primary-foreground rounded-3xl p-10 md:p-16 text-center max-w-5xl relative overflow-hidden"
        >
          <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-white/10 to-transparent pointer-events-none" />
          <h2 className="text-3xl md:text-5xl font-bold mb-6 relative z-10">Ready to find your next home?</h2>
          <p className="text-primary-foreground/80 text-lg mb-10 max-w-2xl mx-auto relative z-10">
            Join thousands of users who have already found their perfect living situation through our platform.
          </p>
          <Button size="lg" variant="secondary" className="rounded-full px-8 h-14 text-lg font-semibold relative z-10">
            Create an Account <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        </motion.div>
      </section>
      <Footer/>
    </div>
  );
}
