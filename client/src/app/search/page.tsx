"use client";

import { useEffect, useState, Suspense, useMemo } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { 
  Search, 
  MapPin, 
  Building, 
  DollarSign, 
  SlidersHorizontal,
  Loader2,
  Sparkles
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { ListingCard } from "@/components/cards/ListingCard";
import { api } from "@/lib/api";
import { useAuthStore } from "@/store/useAuthStore";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";

const amenitiesList = [
  "WiFi",
  "Kitchen",
  "Washer",
  "Dryer",
  "Air Conditioning",
  "Heating",
  "Dedicated Workspace",
  "TV",
  "Gym",
  "Pool",
];

function SearchPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, isAuthenticated } = useAuthStore();

  // Search & Filter States
  const [query, setQuery] = useState(searchParams.get("query") || "");
  const [city, setCity] = useState(searchParams.get("city") || "");
  const [minPrice, setMinPrice] = useState(searchParams.get("minPrice") || "");
  const [maxPrice, setMaxPrice] = useState(searchParams.get("maxPrice") || "");
  const [propertyType, setPropertyType] = useState<string>(searchParams.get("propertyType") || "ALL");
  const [roomType, setRoomType] = useState<string>(searchParams.get("roomType") || "ALL");
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>([]);
  
  // Results & UI states
  const [listings, setListings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);

  // AI Smart Search States
  const [aiEnvironment, setAiEnvironment] = useState("");
  const [aiPreferences, setAiPreferences] = useState("");
  const [aiHabits, setAiHabits] = useState("");
  const [aiScores, setAiScores] = useState<Record<string, { score: number; explanation: string }>>({});
  const [aiLoading, setAiLoading] = useState(false);
  const [aiApplied, setAiApplied] = useState(false);

  const handleAISmartSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!aiEnvironment.trim() && !aiPreferences.trim() && !aiHabits.trim()) return;
    setAiLoading(true);
    try {
      const listingIds = listings.map((l) => l.id);
      const response = await api.post("/api/v1/compatibility/search/ai", {
        environment: aiEnvironment,
        preferences: aiPreferences,
        habits: aiHabits,
        listingIds,
      });
      setAiScores(response.data.data || {});
      setAiApplied(true);
    } catch (err) {
      console.error("AI Search failed:", err);
    } finally {
      setAiLoading(false);
    }
  };

  const handleResetAISmartSearch = () => {
    setAiEnvironment("");
    setAiPreferences("");
    setAiHabits("");
    setAiScores({});
    setAiApplied(false);
  };

  const displayedListings = useMemo(() => {
    if (!aiApplied || Object.keys(aiScores).length === 0) {
      return listings;
    }
    return [...listings].sort((a, b) => {
      const scoreA = aiScores[a.id]?.score ?? 0;
      const scoreB = aiScores[b.id]?.score ?? 0;
      return scoreB - scoreA;
    });
  }, [listings, aiScores, aiApplied]);

  // Fetch listings on filter change
  const fetchListings = async () => {
    setLoading(true);
    try {
      const params: Record<string, any> = {
        page: 1,
        limit: 20,
      };

      if (query) params.searchQuery = query;
      if (city) params.city = city;
      if (minPrice) params.minPrice = Number(minPrice);
      if (maxPrice) params.maxPrice = Number(maxPrice);
      if (propertyType !== "ALL") params.propertyType = propertyType;
      if (roomType !== "ALL") params.roomType = roomType;
      if (selectedAmenities.length > 0) params.amenities = selectedAmenities;

      const response = await api.get("/api/v1/listings", { params });
      const fetchedListings = response.data.data.listings || [];
      setTotal(response.data.data.total || 0);

      // If user is a tenant, let's fetch compatibility scores in batch
      if (isAuthenticated && user?.role === "TENANT" && fetchedListings.length > 0) {
        try {
          const listingIds = fetchedListings.map((l: any) => l.id);
          const scoreResponse = await api.post("/api/v1/compatibility/listings/batch", { listingIds });
          const scores = scoreResponse.data.data || {};
          const withScores = fetchedListings.map((listing: any) => ({
            ...listing,
            matchScore: scores[listing.id]?.score ?? 0,
          }));
          setListings(withScores);
        } catch (err) {
          console.error("Failed to fetch compatibility scores in batch:", err);
          setListings(fetchedListings);
        }
      } else {
        setListings(fetchedListings);
      }
    } catch (err) {
      console.error("Failed to fetch listings:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchListings();
  }, [searchParams, isAuthenticated, user]);

  const handleApplyFilters = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const params = new URLSearchParams();
    if (query) params.set("query", query);
    if (city) params.set("city", city);
    if (minPrice) params.set("minPrice", minPrice);
    if (maxPrice) params.set("maxPrice", maxPrice);
    if (propertyType !== "ALL") params.set("propertyType", propertyType);
    if (roomType !== "ALL") params.set("roomType", roomType);
    
    router.push(`/search?${params.toString()}`);
  };

  const toggleAmenity = (amenity: string) => {
    setSelectedAmenities(prev =>
      prev.includes(amenity)
        ? prev.filter(a => a !== amenity)
        : [...prev, amenity]
    );
  };

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
      <Navbar />
      <main className="flex-1 container mx-auto px-4 md:px-8 py-8 space-y-8">
        
        {/* Header */}
        <div className="space-y-2">
          <h1 className="text-3xl font-extrabold tracking-tight md:text-4xl flex items-center gap-2">
            <Sparkles className="text-primary h-8 w-8 animate-pulse" />
            Explore Available Spaces
          </h1>
          <p className="text-muted-foreground text-lg">
            Find and compare living spaces matching your lifestyle.
          </p>
        </div>

        {/* Layout Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          
          {/* Filters Sidebar */}
          <Card className="lg:col-span-1 border-border/50 shadow-lg bg-card/60 backdrop-blur-md h-fit sticky top-20">
            <CardContent className="p-6 space-y-6">
              <div className="flex items-center justify-between pb-4 border-b border-border/40">
                <h2 className="font-bold text-lg flex items-center gap-2">
                  <SlidersHorizontal className="h-5 w-5 text-primary" />
                  Filters
                </h2>
                {(query || city || minPrice || maxPrice || propertyType !== "ALL" || roomType !== "ALL" || selectedAmenities.length > 0) && (
                  <Button
                    variant="link"
                    size="sm"
                    className="h-auto p-0 text-xs text-muted-foreground hover:text-primary"
                    onClick={() => {
                      setQuery("");
                      setCity("");
                      setMinPrice("");
                      setMaxPrice("");
                      setPropertyType("ALL");
                      setRoomType("ALL");
                      setSelectedAmenities([]);
                      router.push("/search");
                    }}
                  >
                    Reset All
                  </Button>
                )}
              </div>

              <form onSubmit={handleApplyFilters} className="space-y-6">
                {/* Search Term */}
                <div className="space-y-2">
                  <label className="text-sm font-semibold">Keywords</label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Title, description..."
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      className="pl-9 bg-background/50 border-border/60"
                    />
                  </div>
                </div>

                {/* City */}
                <div className="space-y-2">
                  <label className="text-sm font-semibold">City</label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="e.g. Mumbai, Bangalore"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      className="pl-9 bg-background/50 border-border/60"
                    />
                  </div>
                </div>

                {/* Price Range */}
                <div className="space-y-2">
                  <label className="text-sm font-semibold">Price Range ($/mo)</label>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="relative">
                      <DollarSign className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                      <Input
                        type="number"
                        placeholder="Min"
                        value={minPrice}
                        onChange={(e) => setMinPrice(e.target.value)}
                        className="pl-8 bg-background/50 border-border/60 text-sm"
                      />
                    </div>
                    <div className="relative">
                      <DollarSign className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                      <Input
                        type="number"
                        placeholder="Max"
                        value={maxPrice}
                        onChange={(e) => setMaxPrice(e.target.value)}
                        className="pl-8 bg-background/50 border-border/60 text-sm"
                      />
                    </div>
                  </div>
                </div>

                {/* Property Type */}
                <div className="space-y-2">
                  <label className="text-sm font-semibold">Property Type</label>
                  <div className="grid grid-cols-2 gap-2">
                    {["ALL", "APARTMENT", "HOUSE", "STUDIO", "CONDO", "VILLA"].map((t) => (
                      <button
                        key={t}
                        type="button"
                        onClick={() => setPropertyType(t)}
                        className={`py-2 px-3 rounded-lg border text-xs font-semibold transition-all text-center ${
                          propertyType === t
                            ? "border-primary bg-primary/10 text-primary shadow-sm"
                            : "border-border/60 bg-background/30 hover:bg-muted/40 text-muted-foreground"
                        }`}
                      >
                        {t === "ALL" ? "Any Type" : t.charAt(0) + t.slice(1).toLowerCase()}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Room Type */}
                <div className="space-y-2">
                  <label className="text-sm font-semibold">Room Type</label>
                  <div className="grid grid-cols-1 gap-2">
                    {["ALL", "ENTIRE", "PRIVATE", "SHARED"].map((t) => (
                      <button
                        key={t}
                        type="button"
                        onClick={() => setRoomType(t)}
                        className={`py-2 px-4 rounded-lg border text-xs font-semibold transition-all text-left ${
                          roomType === t
                            ? "border-primary bg-primary/10 text-primary"
                            : "border-border/60 bg-background/30 hover:bg-muted/40 text-muted-foreground"
                        }`}
                      >
                        {t === "ALL" ? "Any Room" : t === "ENTIRE" ? "Entire Place" : t.charAt(0) + t.slice(1).toLowerCase() + " Room"}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Amenities */}
                <div className="space-y-3">
                  <label className="text-sm font-semibold">Amenities</label>
                  <div className="grid grid-cols-1 gap-2.5 max-h-48 overflow-y-auto pr-1">
                    {amenitiesList.map((amenity) => (
                      <div key={amenity} className="flex items-center space-x-2.5">
                        <Checkbox
                          id={`search-amenity-${amenity}`}
                          checked={selectedAmenities.includes(amenity)}
                          onCheckedChange={() => toggleAmenity(amenity)}
                        />
                        <label
                          htmlFor={`search-amenity-${amenity}`}
                          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                        >
                          {amenity}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>

                <Button type="submit" className="w-full rounded-full shadow-md">
                  Apply Filters
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Listings Results Grid */}
          <div className="lg:col-span-3 space-y-6">
            {/* AI Search Assistant Form */}
            {isAuthenticated && user?.role === "TENANT" && (
              <Card className="border-primary/20 bg-primary/5 shadow-sm p-4 overflow-hidden relative">
                {/* Decorative glow */}
                <div className="absolute -top-10 -right-10 w-24 h-24 bg-primary/25 rounded-full blur-2xl pointer-events-none" />
                <CardContent className="p-4 space-y-4">
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-primary animate-pulse" />
                    <div>
                      <h3 className="font-bold text-sm">AI Compatibility Search Assistant</h3>
                      <p className="text-xs text-muted-foreground">Describe your ideal house, routine, and rules to rank these listings using LLM reasoning.</p>
                    </div>
                  </div>

                  <form onSubmit={handleAISmartSearch} className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">1. House Environment</label>
                      <input
                        type="text"
                        placeholder="e.g. Quiet environment for studying, wfh space"
                        value={aiEnvironment}
                        onChange={(e) => setAiEnvironment(e.target.value)}
                        className="flex h-9 w-full rounded-lg border border-border/60 bg-background/60 px-3 py-1 text-xs shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">2. Rules & Comforts</label>
                      <input
                        type="text"
                        placeholder="e.g. Pet friendly, occasional guest rules"
                        value={aiPreferences}
                        onChange={(e) => setAiPreferences(e.target.value)}
                        className="flex h-9 w-full rounded-lg border border-border/60 bg-background/60 px-3 py-1 text-xs shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">3. Your Habits / Routine</label>
                      <input
                        type="text"
                        placeholder="e.g. Night owl schedule, cooking vegetarian food"
                        value={aiHabits}
                        onChange={(e) => setAiHabits(e.target.value)}
                        className="flex h-9 w-full rounded-lg border border-border/60 bg-background/60 px-3 py-1 text-xs shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                      />
                    </div>

                    <div className="md:col-span-3 flex justify-end gap-2 pt-2 border-t border-border/30 mt-2">
                      {aiApplied && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={handleResetAISmartSearch}
                          className="rounded-full text-xs"
                        >
                          Clear AI Filters
                        </Button>
                      )}
                      <Button
                        type="submit"
                        size="sm"
                        disabled={aiLoading || (!aiEnvironment && !aiPreferences && !aiHabits)}
                        className="rounded-full text-xs shadow-md font-semibold hover:bg-gray-600 text-white"
                      >
                        {aiLoading ? (
                          <>
                            <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> Querying OpenAI...
                          </>
                        ) : (
                          <>
                            <Sparkles className="mr-1.5 h-3.5 w-3.5" /> Rank Listings by AI
                          </>
                        )}
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            )}

            <div className="flex justify-between items-center bg-card p-4 rounded-xl border border-border/50 shadow-sm">
              <span className="text-sm font-medium text-muted-foreground">
                Showing <strong className="text-foreground">{displayedListings.length}</strong> of{" "}
                <strong className="text-foreground">{total}</strong> properties
              </span>
            </div>

            {loading ? (
              <div className="flex flex-col items-center justify-center py-32 text-center">
                <Loader2 className="h-10 w-10 text-primary animate-spin mb-4" />
                <p className="text-muted-foreground font-medium">Searching properties...</p>
              </div>
            ) : displayedListings.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-fade-in">
                {displayedListings.map((listing) => {
                  const customMatch = aiScores[listing.id];
                  return (
                    <div key={listing.id} className="relative flex flex-col h-full bg-card rounded-2xl border border-border/50 overflow-hidden shadow-sm transition-all hover:shadow-md">
                      <div className="flex-1">
                        <ListingCard
                          id={listing.id}
                          title={listing.title}
                          price={listing.price}
                          location={`${listing.city}, ${listing.state}`}
                          type={listing.roomType === "ENTIRE" ? "Entire Place" : listing.roomType === "PRIVATE" ? "Private Room" : "Shared Room"}
                          imageUrl={listing.images && listing.images[0]?.url}
                          matchScore={customMatch ? customMatch.score : listing.matchScore}
                          role="tenant"
                        />
                      </div>
                      {customMatch && (
                        <div className="px-4 pb-4 pt-3.5 bg-primary/5 border-t border-border/40">
                          <p className="text-[11px] font-bold text-primary flex items-center gap-1">
                            <Sparkles className="h-3 w-3 animate-pulse" /> AI Match Analysis
                          </p>
                          <p className="text-[11px] text-muted-foreground mt-1 leading-relaxed">
                            {customMatch.explanation}
                          </p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-24 text-center border border-dashed rounded-xl border-border/60 bg-muted/10">
                <div className="h-16 w-16 bg-muted rounded-full flex items-center justify-center mb-4">
                  <Search className="h-8 w-8 text-muted-foreground" />
                </div>
                <h2 className="text-xl font-semibold mb-2">No listings found</h2>
                <p className="text-muted-foreground max-w-sm mb-6">
                  We couldn't find any listings matching your filters. Try clearing your search parameters.
                </p>
                <Button
                  variant="outline"
                  onClick={() => {
                    setQuery("");
                    setCity("");
                    setMinPrice("");
                    setMaxPrice("");
                    setPropertyType("ALL");
                    setRoomType("ALL");
                    setSelectedAmenities([]);
                    router.push("/search");
                  }}
                >
                  Clear All Filters
                </Button>
              </div>
            )}
          </div>
        </div>
      </main>
      {/* <Footer /> */}
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={
      <div className="flex flex-col min-h-screen bg-background">
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="h-10 w-10 text-primary animate-spin" />
        </div>
      </div>
    }>
      <SearchPageContent />
    </Suspense>
  );
}
