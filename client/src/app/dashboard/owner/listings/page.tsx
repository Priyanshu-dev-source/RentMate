"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { PlusCircle, Search, SlidersHorizontal, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ListingCard } from "@/components/cards/ListingCard";
import { api } from "@/lib/api";

export default function MyListingsPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [listings, setListings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchOwnerListings = async () => {
    setLoading(true);
    try {
      const response = await api.get("/api/v1/listings/owner/all");
      setListings(response.data.data || []);
    } catch (err) {
      console.error("Failed to load owner listings:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOwnerListings();
  }, []);

  const handleDelete = async (id: string | number) => {
    if (confirm("Are you sure you want to delete this listing?")) {
      try {
        await api.delete(`/api/v1/listings/${id}`);
        setListings(prev => prev.filter(l => l.id !== id));
      } catch (err: any) {
        alert(err.response?.data?.message || "Failed to delete listing");
      }
    }
  };

  const handleMarkFilled = async (id: string | number) => {
    try {
      await api.patch(`/api/v1/listings/${id}/fill`);
      setListings(prev => prev.map(l => l.id === id ? { ...l, status: "FILLED" } : l));
    } catch (err: any) {
      alert(err.response?.data?.message || "Failed to mark listing as filled");
    }
  };

  const filteredListings = listings.filter(l => 
    l.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
    `${l.city} ${l.state}`.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex h-[70vh] items-center justify-center">
        <div className="flex flex-col items-center">
          <Loader2 className="h-10 w-10 text-primary animate-spin mb-4" />
          <p className="text-muted-foreground font-semibold">Loading your listings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">My Listings</h1>
          <p className="text-muted-foreground mt-1">Manage your properties and track their performance.</p>
        </div>
        <Button size="lg" className="rounded-full shadow-sm" onClick={() => router.push("/dashboard/owner/listings/create")}>
          <PlusCircle className="mr-2 h-5 w-5" />
          Create New Listing
        </Button>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-center bg-card p-4 rounded-xl border border-border/50 shadow-sm">
        <div className="relative w-full sm:max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Search listings by title or location..." 
            className="pl-9 w-full bg-background border-border/50"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Button variant="outline" className="w-full sm:w-auto">
            <SlidersHorizontal className="mr-2 h-4 w-4" />
            Filter
          </Button>
        </div>
      </div>

      {/* Listings Grid */}
      {filteredListings.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-fade-in">
          {filteredListings.map((listing) => (
            <ListingCard 
              key={listing.id} 
              id={listing.id}
              title={listing.title}
              price={listing.price}
              location={`${listing.city}, ${listing.state}`}
              type={listing.roomType === "ENTIRE" ? "Entire Place" : listing.roomType === "PRIVATE" ? "Private Room" : "Shared Room"}
              status={listing.status === "ACTIVE" ? "Active" : listing.status === "DRAFT" ? "Draft" : "Filled"}
              views={listing.viewCount || 0}
              inquiries={0} // Can be dynamically set if needed
              imageUrl={listing.images && listing.images[0]?.url}
              role="owner"
              onDelete={handleDelete}
              onMarkFilled={handleMarkFilled}
            />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-20 text-center border border-dashed rounded-xl border-border/60 bg-muted/20">
          <div className="h-16 w-16 bg-muted rounded-full flex items-center justify-center mb-4">
            <Search className="h-8 w-8 text-muted-foreground" />
          </div>
          <h2 className="text-xl font-semibold mb-2">No listings found</h2>
          <p className="text-muted-foreground max-w-sm mb-6">
            We couldn't find any listings matching your search. Try adjusting your filters.
          </p>
          <Button variant="outline" onClick={() => setSearchQuery("")}>
            Clear Search
          </Button>
        </div>
      )}
    </div>
  );
}
