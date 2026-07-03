"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { 
  Building, 
  Users, 
  Eye, 
  MessageSquare,
  PlusCircle,
  TrendingUp,
  Loader2
} from "lucide-react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useAuthStore } from "@/store/useAuthStore";
import { api } from "@/lib/api";

export default function OwnerDashboard() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [listings, setListings] = useState<any[]>([]);
  const [interests, setInterests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      // 1. Fetch all listings owned by this user
      const listingsResponse = await api.get("/api/v1/listings/owner/all");
      const ownerListings = listingsResponse.data.data || [];
      setListings(ownerListings);

      // 2. Fetch interests for all owner listings in parallel
      const interestPromises = ownerListings.map(async (listing: any) => {
        try {
          const res = await api.get(`/api/v1/interests/listing/${listing.id}`);
          return res.data.data || [];
        } catch (err) {
          return [];
        }
      });
      const allInterestsGrouped = await Promise.all(interestPromises);
      const flattenedInterests = allInterestsGrouped.flat().sort(
        (a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      setInterests(flattenedInterests);
    } catch (err) {
      console.error("Failed to load owner dashboard data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="flex h-[70vh] items-center justify-center">
        <div className="flex flex-col items-center">
          <Loader2 className="h-10 w-10 text-primary animate-spin mb-4" />
          <p className="text-muted-foreground font-semibold">Loading dashboard overview...</p>
        </div>
      </div>
    );
  }

  // Calculate statistics
  const activeListingsCount = listings.filter((l) => l.status === "ACTIVE").length;
  const totalViews = listings.reduce((acc, curr) => acc + (curr.viewCount || 0), 0);
  const totalInquiries = interests.length;
  const pendingInterests = interests.filter((i) => i.status === "PENDING").length;

  const stats = [
    { name: "Active Listings", value: activeListingsCount.toString(), icon: Building, change: "Current published rooms", changeType: "neutral" },
    { name: "Total Views", value: totalViews.toLocaleString(), icon: Eye, change: "All time views", changeType: "positive" },
    { name: "Interested Tenants", value: totalInquiries.toString(), icon: Users, change: `${pendingInterests} pending review`, changeType: "positive" },
    { name: "Pending Interests", value: pendingInterests.toString(), icon: MessageSquare, change: "Needs attention", changeType: "neutral" },
  ];

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Welcome back, {user?.firstName}</h1>
          <p className="text-muted-foreground mt-1">Here's an overview of your properties and tenant interactions.</p>
        </div>
        <Button size="lg" className="rounded-full shadow-sm hover:bg-gray-700 transition-all duration-200" onClick={() => router.push("/dashboard/owner/listings/create")}>
          <PlusCircle className="mr-2 h-5 w-5" />
          Create Listing
        </Button>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat, i) => (
          <motion.div
            key={stat.name}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: i * 0.1 }}
          >
            <Card className="p-4">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {stat.name}
                </CardTitle>
                <stat.icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                <p className="text-xs text-muted-foreground mt-1 flex items-center">
                  {stat.changeType === "positive" && <TrendingUp className="h-3 w-3 mr-1 text-emerald-500" />}
                  {stat.change}
                </p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      <div className="grid gap-6 md:grid-cols-7 lg:grid-cols-7">
        {/* Recent Listings */}
        <Card className="md:col-span-4 shadow-sm border-border/50 p-4">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Recent Listings</CardTitle>
              <CardDescription>Manage your property portfolio.</CardDescription>
            </div>
            <Button variant="ghost" size="sm" onClick={() => router.push("/dashboard/owner/listings")}>View All</Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {listings.slice(0, 3).map((listing) => (
                <div key={listing.id} className="flex items-center justify-between p-4 rounded-xl border border-border/50 bg-card hover:bg-muted/50 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-lg bg-muted flex items-center justify-center">
                      <Building className="h-6 w-6 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold">{listing.title}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs font-medium">${listing.price}/mo</span>
                        <span className="text-muted-foreground text-xs">&bull;</span>
                        <span className="text-xs text-muted-foreground">{listing.viewCount || 0} views</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <Badge variant={listing.status === "ACTIVE" ? "default" : "secondary"}>
                      {listing.status}
                    </Badge>
                  </div>
                </div>
              ))}
              {listings.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-6">No listings created yet.</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Recent Interests */}
        <Card className="md:col-span-3 shadow-sm border-border/50 p-4">
          <CardHeader>
            <CardTitle>Recent Interests</CardTitle>
            <CardDescription>Tenants interested in your properties.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {interests.slice(0, 4).map((interest) => (
                <div key={interest.id} className="flex items-start gap-4">
                  <Avatar className="h-10 w-10 border border-border">
                    <AvatarFallback className="bg-primary/10 text-primary font-bold">
                      {interest.tenant?.user?.firstName?.charAt(0) || "T"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium leading-none">
                        {interest.tenant?.user?.firstName} {interest.tenant?.user?.lastName}
                      </p>
                      <span className="text-[10px] text-muted-foreground">
                        {new Date(interest.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground line-clamp-1">{interest.listing?.title}</p>
                    <div className="flex items-center gap-2 pt-1">
                      <Badge variant="outline" className="text-[10px] h-5 bg-emerald-500/10 text-emerald-600 border-emerald-500/20">
                        {interest.status}
                      </Badge>
                      <Button variant="link" size="sm" className="h-auto p-0 text-[10px]" onClick={() => router.push(`/chat?user=${interest.tenant?.userId}`)}>
                        Message
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
              {interests.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-6">No interest requests received yet.</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
