"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { 
  Compass, 
  Heart, 
  MessageCircle, 
  Search, 
  Sparkles,
  Loader2,
  MapPin,
  Building,
  Check,
  Clock,
  DollarSign
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { api } from "@/lib/api";
import { useAuthStore } from "@/store/useAuthStore";

export default function TenantDashboard() {
  const router = useRouter();
  const { user } = useAuthStore();

  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [savedListings, setSavedListings] = useState<any[]>([]);
  const [interests, setInterests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [locationFilter, setLocationFilter] = useState("");
  const [budgetFilter, setBudgetFilter] = useState("");

  const filteredRecommendations = recommendations.filter((listing) => {
    const matchesLocation = locationFilter
      ? listing.city?.toLowerCase().includes(locationFilter.toLowerCase()) ||
        listing.state?.toLowerCase().includes(locationFilter.toLowerCase())
      : true;
    const matchesBudget = budgetFilter
      ? listing.price <= Number(budgetFilter)
      : true;
    return matchesLocation && matchesBudget;
  });

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      // 1. Fetch active listings
      const listingsRes = await api.get("/api/v1/listings", { params: { limit: 10 } });
      const activeList = listingsRes.data.data.listings || [];

      // 2. Fetch compatibility for each listing in batch
      let scoredListings: any[] = [];
      if (activeList.length > 0) {
        try {
          const listingIds = activeList.map((l: any) => l.id);
          const compResponse = await api.post("/api/v1/compatibility/listings/batch", { listingIds });
          const scores = compResponse.data.data || {};
          scoredListings = activeList.map((listing: any) => ({
            ...listing,
            matchScore: scores[listing.id]?.score ?? 0,
          }));
        } catch (err) {
          console.error("Failed to fetch dashboard compatibility scores in batch:", err);
          scoredListings = activeList.map((listing: any) => ({ ...listing, matchScore: 0 }));
        }
      }

      // Sort by matchScore descending
      scoredListings.sort((a, b) => b.matchScore - a.matchScore);
      setRecommendations(scoredListings.slice(0, 3));

      // 3. Fetch saved listings
      const savedRes = await api.get("/api/v1/listings/user/saved");
      setSavedListings(savedRes.data.data || []);

      // 4. Fetch interests sent
      const interestsRes = await api.get("/api/v1/interests/tenant/all");
      setInterests(interestsRes.data.data || []);

    } catch (err) {
      console.error("Failed to load tenant dashboard data:", err);
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
          <p className="text-muted-foreground font-semibold">Generating recommendations...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Welcome, {user?.firstName}</h1>
          <p className="text-muted-foreground mt-1">Here are your roommate matches and listing recommendation activities.</p>
        </div>
        <Button size="lg" className="rounded-full shadow-sm hover:bg-gray-700" onClick={() => router.push("/search")}>
          <Search className="mr-2 h-5 w-5" />
          Find Rooms
        </Button>
      </div>

      {/* Top Section */}
      <div className="grid gap-6 md:grid-cols-3">
        {/* Recommendation card */}
        <Card className="md:col-span-2 border-primary/20 bg-primary/5 shadow-sm p-4">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary animate-pulse" />
              <CardTitle>Top Room Matches</CardTitle>
            </div>
            <CardDescription>Lifestyle-matched listings curated for your routine.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 mt-8">
            {/* Filter Section */}
            {recommendations.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6 p-4 rounded-xl bg-card/45 border border-border/40">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
                    <MapPin className="h-3 w-3 text-primary" /> Filter by City
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Mumbai, Bangalore"
                    value={locationFilter}
                    onChange={(e) => setLocationFilter(e.target.value)}
                    className="flex h-9 w-full rounded-lg border border-input bg-background/50 px-3 py-1 text-xs shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
                    <DollarSign className="h-3 w-3 text-primary" /> Max Budget ($/mo)
                  </label>
                  <input
                    type="number"
                    placeholder="e.g. 1500"
                    value={budgetFilter}
                    onChange={(e) => setBudgetFilter(e.target.value)}
                    className="flex h-9 w-full rounded-lg border border-input bg-background/50 px-3 py-1 text-xs shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  />
                </div>
              </div>
            )}

            {filteredRecommendations.map((listing) => (
              <div 
                key={listing.id} 
                className="flex items-center justify-between p-4 rounded-xl border border-border/50 bg-card hover:bg-muted/30 transition-all cursor-pointer"
                onClick={() => router.push(`/listing/${listing.id}`)}
              >
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-lg bg-muted flex items-center justify-center">
                    <Building className="h-6 w-6 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold">{listing.title}</p>
                    <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                      <MapPin className="h-3 w-3 text-primary" />
                      <span>{listing.city}, {listing.state}</span>
                      <span>&bull;</span>
                      <span className="font-semibold text-foreground">${listing.price}/mo</span>
                    </div>
                  </div>
                </div>
                <Badge className="bg-emerald-500/10 text-emerald-600 border-none hover:bg-emerald-500/10 font-bold">
                  {listing.matchScore}% Match
                </Badge>
              </div>
            ))}

            {filteredRecommendations.length === 0 && recommendations.length > 0 && (
              <div className="text-center py-6 text-muted-foreground text-sm border border-dashed border-border/60 rounded-xl bg-card/20">
                No matches found for the selected city and budget filters.
              </div>
            )}

            {recommendations.length === 0 && (
              <div className="text-center py-8">
                <Compass className="h-10 w-10 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">No matches found. Complete your lifestyle preferences to generate matches.</p>
                <Button variant="link" size="sm" onClick={() => router.push("/tenants")}>Set Preferences</Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Actions / Stats */}
        <Card className="shadow-sm border-border/50 p-4">
          <CardHeader>
            <CardTitle>Overview</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6 mt-4">
            <div className="flex items-center justify-between pb-4 border-b border-border/40">
              <span className="text-sm text-muted-foreground flex items-center gap-2">
                <Heart className="h-4 w-4 text-rose-500" /> Bookmarks
              </span>
              <strong className="text-lg">{savedListings.length} saved</strong>
            </div>
            <div className="flex items-center justify-between pb-4 border-b border-border/40">
              <span className="text-sm text-muted-foreground flex items-center gap-2">
                <MessageCircle className="h-4 w-4 text-primary" /> Interests Sent
              </span>
              <strong className="text-lg">{interests.length} sent</strong>
            </div>
            <Button className="w-full rounded-full" variant="outline" onClick={() => router.push("/tenants")}>
              Update Habits & Budget
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Activity Streams */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Sent requests status */}
        <Card className="shadow-sm border-border/50 p-4">
          <CardHeader>
            <CardTitle>Sent Requests Status</CardTitle>
            <CardDescription>Track status changes on properties you expressed interest in.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {interests.slice(0, 3).map((item) => (
              <div 
                key={item.id} 
                className="flex items-center justify-between p-4 rounded-xl border border-border/50 bg-card hover:bg-muted/30 transition-all cursor-pointer"
                onClick={() => router.push(`/listing/${item.listingId}`)}
              >
                <div>
                  <p className="text-sm font-semibold">{item.listing?.title}</p>
                  <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                    {item.status === "PENDING" ? (
                      <><Clock className="h-3 w-3 text-warning" /> Awaiting owner feedback</>
                    ) : item.status === "ACCEPTED" ? (
                      <><Check className="h-3 w-3 text-emerald-500" /> Request accepted</>
                    ) : (
                      "Declined"
                    )}
                  </p>
                </div>
                <Badge variant={item.status === "ACCEPTED" ? "default" : item.status === "PENDING" ? "secondary" : "destructive"}>
                  {item.status}
                </Badge>
              </div>
            ))}
            {interests.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-8">You haven't sent any interest requests yet.</p>
            )}
          </CardContent>
        </Card>

        {/* Saved Listings */}
        <Card className="shadow-sm border-border/50 p-4">
          <CardHeader>
            <CardTitle>Saved Bookmarks</CardTitle>
            <CardDescription>Quick links to rooms you bookmarked.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {savedListings.slice(0, 3).map((item) => (
              <div 
                key={item.id} 
                className="flex items-center justify-between p-4 rounded-xl border border-border/50 bg-card hover:bg-muted/30 transition-all cursor-pointer"
                onClick={() => router.push(`/listing/${item.listingId}`)}
              >
                <div>
                  <p className="text-sm font-semibold">{item.listing?.title}</p>
                  <p className="text-xs text-muted-foreground mt-1">${item.listing?.price}/mo &bull; {item.listing?.city}</p>
                </div>
                <Button variant="ghost" size="icon" className="text-rose-500">
                  <Heart className="h-4 w-4 fill-current" />
                </Button>
              </div>
            ))}
            {savedListings.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-8">No saved properties yet.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
