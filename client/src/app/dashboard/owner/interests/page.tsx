"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Search, Mail, Filter, Building, User, Check, X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Card } from "@/components/ui/card";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { api } from "@/lib/api";

export default function InterestedTenantsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [interests, setInterests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchInterests = async () => {
    setLoading(true);
    try {
      // 1. Fetch all listings owned by this user
      const listingsResponse = await api.get("/api/v1/listings/owner/all");
      const ownerListings = listingsResponse.data.data || [];

      // 2. Fetch interests for all owner listings in parallel
      const interestPromises = ownerListings.map(async (listing: any) => {
        try {
          const res = await api.get(`/api/v1/interests/listing/${listing.id}`);
          return (res.data.data || []).map((i: any) => ({
            ...i,
            listingTitle: listing.title,
          }));
        } catch (err) {
          console.error(`Failed to fetch interests for listing ${listing.id}`, err);
          return [];
        }
      });
      const allInterestsGrouped = await Promise.all(interestPromises);
      const flattenedInterests = allInterestsGrouped.flat().sort(
        (a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      setInterests(flattenedInterests);
    } catch (err) {
      console.error("Failed to load owner interests data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInterests();
  }, []);

  const handleUpdateStatus = async (interestId: string, status: "ACCEPTED" | "REJECTED") => {
    try {
      await api.patch(`/api/v1/interests/${interestId}/status`, { status });
      setInterests((prev) =>
        prev.map((i) => (i.id === interestId ? { ...i, status } : i))
      );
    } catch (err) {
      console.error(`Failed to update status to ${status} for interest request ${interestId}:`, err);
    }
  };

  const filteredInterests = interests.filter(interest => {
    const tenantUser = interest.tenant?.user || {};
    const tenantName = `${tenantUser.firstName || ""} ${tenantUser.lastName || ""}`.trim();
    const listingTitle = interest.listingTitle || "";

    const matchesSearch = tenantName.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          listingTitle.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "All" || interest.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Interested Tenants</h1>
          <p className="text-muted-foreground mt-1">Review and contact people interested in your listings.</p>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-center bg-card p-4 rounded-xl border border-border/50 shadow-sm">
        <div className="relative w-full sm:max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Search by tenant or listing name..." 
            className="pl-9 w-full bg-background border-border/50"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Select value={statusFilter} onValueChange={(val:any) => val && setStatusFilter(val)}>
            <SelectTrigger className="w-[150px]">
              <Filter className="mr-2 h-4 w-4" />
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="All">All Statuses</SelectItem>
              <SelectItem value="PENDING">Pending</SelectItem>
              <SelectItem value="ACCEPTED">Accepted</SelectItem>
              <SelectItem value="REJECTED">Declined</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* List */}
      <div className="space-y-4">
        {loading ? (
          <div className="flex flex-col items-center py-20">
            <Loader2 className="h-10 w-10 text-primary animate-spin mb-4" />
            <p className="text-muted-foreground font-semibold">Loading interests...</p>
          </div>
        ) : filteredInterests.length > 0 ? (
          filteredInterests.map((interest) => {
            const tenantUser = interest.tenant?.user || {};
            const tenantName = `${tenantUser.firstName || "Deleted"} ${tenantUser.lastName || "User"}`;
            const dateStr = new Date(interest.createdAt).toLocaleDateString([], { month: "short", day: "numeric", year: "numeric" });
            const isPending = interest.status === "PENDING";
            const isAccepted = interest.status === "ACCEPTED";
            const isRejected = interest.status === "REJECTED";

            return (
              <Card key={interest.id} className="shadow-sm border-border/50 hover:border-primary/30 transition-colors overflow-hidden">
                <div className="flex flex-col md:flex-row">
                  <div className="p-6 flex-1">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-4">
                        <Avatar className="h-12 w-12 border-2 border-primary/20">
                          <AvatarFallback>{tenantName.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div>
                          <h3 className="font-semibold text-lg flex items-center gap-2">
                            {tenantName}
                            <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 text-xs font-semibold">
                              {interest.matchScore || 0}% Match
                            </Badge>
                          </h3>
                          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground mt-1">
                            <span className="flex items-center gap-1">
                              <Building className="h-3.5 w-3.5" />
                              <Link href={`/listing/${interest.listingId}`} className="hover:text-primary hover:underline">
                                {interest.listingTitle}
                              </Link>
                            </span>
                            <span>&bull;</span>
                            <span>{dateStr}</span>
                          </div>
                        </div>
                      </div>
                      
                      <Badge 
                        variant={isPending ? "outline" : isAccepted ? "secondary" : "destructive"}
                        className={isPending ? "bg-amber-500/10 text-amber-600 border-amber-500/20" : isAccepted ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20" : ""}
                      >
                        {isPending ? "Pending" : isAccepted ? "Accepted" : "Declined"}
                      </Badge>
                    </div>
                    
                    {interest.message && (
                      <div className="bg-muted/30 p-4 rounded-lg border border-border/40 text-sm italic text-muted-foreground">
                        "{interest.message}"
                      </div>
                    )}
                  </div>
                  
                  <div className="bg-muted/10 p-6 md:w-64 border-t md:border-t-0 md:border-l border-border/50 flex flex-col justify-center gap-3">
                    {isPending && (
                      <div className="flex gap-2">
                        <Button 
                          onClick={() => handleUpdateStatus(interest.id, "ACCEPTED")}
                          className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white text-xs h-9 px-2"
                        >
                          <Check className="mr-1 h-3.5 w-3.5" /> Accept
                        </Button>
                        <Button 
                          onClick={() => handleUpdateStatus(interest.id, "REJECTED")}
                          variant="destructive"
                          className="flex-1 text-xs h-9 px-2"
                        >
                          <X className="mr-1 h-3.5 w-3.5" /> Decline
                        </Button>
                      </div>
                    )}
                    <Button 
                      className="w-full h-9" 
                      render={<Link href={`/chat?user=${tenantUser.id}`} />}
                      disabled={!tenantUser.id}
                    >
                      <Mail className="mr-2 h-4 w-4" /> Message
                    </Button>
                    <Button 
                      variant="outline" 
                      className="w-full h-9" 
                      render={<Link href={`/profile/${tenantUser.id}`} />}
                      disabled={!tenantUser.id}
                    >
                      <User className="mr-2 h-4 w-4" /> View Profile
                    </Button>
                  </div>
                </div>
              </Card>
            );
          })
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-center border border-dashed rounded-xl border-border/60 bg-muted/20">
            <div className="h-16 w-16 bg-muted rounded-full flex items-center justify-center mb-4">
              <Search className="h-8 w-8 text-muted-foreground" />
            </div>
            <h2 className="text-xl font-semibold mb-2">No interests found</h2>
            <p className="text-muted-foreground max-w-sm mb-6">
              There are no tenants matching your current filters.
            </p>
            <Button variant="outline" onClick={() => { setSearchQuery(""); setStatusFilter("All"); }}>
              Clear Filters
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
