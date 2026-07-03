"use client";

import { useEffect, useState, Suspense } from "react";
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

      // If user is a tenant, let's fetch compatibility scores in parallel
      if (isAuthenticated && user?.role === "TENANT" && fetchedListings.length > 0) {
        const withScores = await Promise.all(
          fetchedListings.map(async (listing: any) => {
            try {
              const scoreResponse = await api.post(`/api/v1/compatibility/listing/${listing.id}`);
              return {
                ...listing,
                matchScore: scoreResponse.data.data.overallScore,
              };
            } catch (err) {
              return listing;
            }
          })
        );
        setListings(withScores);
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
            <div className="flex justify-between items-center bg-card p-4 rounded-xl border border-border/50 shadow-sm">
              <span className="text-sm font-medium text-muted-foreground">
                Showing <strong className="text-foreground">{listings.length}</strong> of{" "}
                <strong className="text-foreground">{total}</strong> properties
              </span>
            </div>

            {loading ? (
              <div className="flex flex-col items-center justify-center py-32 text-center">
                <Loader2 className="h-10 w-10 text-primary animate-spin mb-4" />
                <p className="text-muted-foreground font-medium">Searching properties...</p>
              </div>
            ) : listings.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-fade-in">
                {listings.map((listing) => (
                  <ListingCard
                    key={listing.id}
                    id={listing.id}
                    title={listing.title}
                    price={listing.price}
                    location={`${listing.city}, ${listing.state}`}
                    type={listing.roomType === "ENTIRE" ? "Entire Place" : listing.roomType === "PRIVATE" ? "Private Room" : "Shared Room"}
                    imageUrl={listing.images && listing.images[0]?.url}
                    matchScore={listing.matchScore}
                    role="tenant"
                  />
                ))}
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
      <Footer />
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
