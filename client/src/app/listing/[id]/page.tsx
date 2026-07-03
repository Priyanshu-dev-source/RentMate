"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { 
  MapPin, 
  Users, 
  Check, 
  Share2, 
  Heart, 
  ChevronLeft,
  Calendar,
  ShieldCheck,
  Building,
  Loader2,
  Sparkles,
  MessageCircle,
  Clock,
  ArrowRight
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { api } from "@/lib/api";
import { useAuthStore } from "@/store/useAuthStore";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";

export default function ListingDetailsPage() {
  const router = useRouter();
  const params = useParams();
  const { user, isAuthenticated } = useAuthStore();

  const [listing, setListing] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isSaved, setIsSaved] = useState(false);
  const [activeImage, setActiveImage] = useState(0);
  
  // Compatibility & Interest States
  const [compatibilityScore, setCompatibilityScore] = useState<number | null>(null);
  const [interestStatus, setInterestStatus] = useState<string | null>(null);
  const [interestId, setInterestId] = useState<string | null>(null);
  
  // Modal states
  const [interestModalOpen, setInterestModalOpen] = useState(false);
  const [interestMessage, setInterestMessage] = useState("");
  const [submittingInterest, setSubmittingInterest] = useState(false);

  const fetchListingDetails = async () => {
    setLoading(true);
    try {
      const response = await api.get(`/api/v1/listings/${params.id}`);
      const data = response.data.data;
      setListing(data);

      // Check if this listing is saved
      if (isAuthenticated) {
        const savedResponse = await api.get("/api/v1/listings/user/saved");
        const savedList = savedResponse.data.data || [];
        const isSavedCheck = savedList.some((item: any) => item.listingId === params.id);
        setIsSaved(isSavedCheck);

        // Fetch compatibility score if current user is a tenant
        if (user?.role === "TENANT") {
          try {
            const compResponse = await api.post(`/api/v1/compatibility/listing/${params.id}`);
            setCompatibilityScore(compResponse.data.data.overallScore);
          } catch (err) {
            console.error("Failed to load compatibility score:", err);
          }

          // Fetch sent interest status
          try {
            const interestResponse = await api.get("/api/v1/interests/tenant/all");
            const sentInterests = interestResponse.data.data || [];
            const matchingInterest = sentInterests.find((interest: any) => interest.listingId === params.id);
            if (matchingInterest) {
              setInterestStatus(matchingInterest.status);
              setInterestId(matchingInterest.id);
            }
          } catch (err) {
            console.error("Failed to fetch interest request state:", err);
          }
        }
      }
    } catch (err) {
      console.error("Failed to fetch listing details:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (params.id) {
      fetchListingDetails();
    }
  }, [params.id, isAuthenticated, user]);

  const handleToggleSave = async () => {
    if (!isAuthenticated) {
      alert("Please log in to save listings.");
      return;
    }
    try {
      if (isSaved) {
        await api.delete(`/api/v1/listings/${params.id}/save`);
        setIsSaved(false);
      } else {
        await api.post(`/api/v1/listings/${params.id}/save`);
        setIsSaved(true);
      }
    } catch (err) {
      console.error("Failed to toggle save listing status:", err);
    }
  };

  const handleExpressInterest = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittingInterest(true);
    try {
      const response = await api.post("/api/v1/interests", {
        listingId: params.id,
        message: interestMessage,
      });
      const data = response.data.data;
      setInterestStatus(data.status);
      setInterestId(data.id);
      setInterestModalOpen(false);
      setInterestMessage("");
    } catch (err: any) {
      alert(err.response?.data?.message || "Failed to express interest");
    } finally {
      setSubmittingInterest(false);
    }
  };

  const handleCancelInterest = async () => {
    if (!interestId) return;
    if (confirm("Are you sure you want to withdraw your interest request?")) {
      try {
        await api.delete(`/api/v1/interests/${interestId}`);
        setInterestStatus(null);
        setInterestId(null);
      } catch (err) {
        console.error("Failed to withdraw interest request:", err);
      }
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col min-h-screen bg-background">
        <Navbar />
        <div className="flex-1 flex flex-col items-center justify-center py-20">
          <Loader2 className="h-10 w-10 text-primary animate-spin mb-4" />
          <p className="text-muted-foreground font-semibold">Loading listing details...</p>
        </div>
        <Footer />
      </div>
    );
  }

  if (!listing) {
    return (
      <div className="flex flex-col min-h-screen bg-background">
        <Navbar />
        <div className="flex-1 flex flex-col items-center justify-center py-20 text-center">
          <h2 className="text-2xl font-bold text-destructive mb-2">Listing not found</h2>
          <p className="text-muted-foreground max-w-sm mb-6">
            The listing may have been removed or is no longer available.
          </p>
          <Button onClick={() => router.push("/search")}>Back to Browse</Button>
        </div>
        <Footer />
      </div>
    );
  }

  const isOwnerOfListing = user?.id && listing.owner?.userId === user.id;
  const imageUrls = listing.images && listing.images.length > 0
    ? listing.images.map((img: any) => img.url)
    : ["/images/hero.png"];

  return (
    <div className="bg-background min-h-screen flex flex-col">
      <Navbar />
      
      {/* Top Nav bar */}
      <div className="sticky top-16 z-40 bg-background/85 backdrop-blur-md border-b border-border/40">
        <div className="max-w-7xl mx-auto px-4 md:px-8 h-16 flex items-center justify-between">
          <Button variant="ghost" size="sm" onClick={() => router.push("/search")} className="-ml-2">
            <ChevronLeft className="h-5 w-5 mr-1" /> Back to Search
          </Button>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" className="rounded-full">
              <Share2 className="h-4 w-4" />
            </Button>
            <Button 
              variant="ghost" 
              size="icon" 
              className={`rounded-full ${isSaved ? "text-rose-500 hover:text-rose-600" : ""}`}
              onClick={handleToggleSave}
            >
              <Heart className={`h-4 w-4 ${isSaved ? "fill-current" : ""}`} />
            </Button>
          </div>
        </div>
      </div>

      <div className="flex-1 max-w-7xl mx-auto px-4 md:px-8 py-8 space-y-8 w-full">
        {/* Title Section */}
        <div className="flex flex-col md:flex-row justify-between items-start gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <Badge variant="secondary" className="uppercase font-semibold">
                {listing.roomType} / {listing.propertyType}
              </Badge>
              {compatibilityScore !== null && (
                <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 border-none flex items-center gap-1 font-bold">
                  <Sparkles className="h-3 w-3" />
                  {compatibilityScore}% Compatibility Score
                </Badge>
              )}
            </div>
            <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight mb-2 text-foreground">{listing.title}</h1>
            <div className="flex items-center text-muted-foreground text-sm font-semibold">
              <MapPin className="h-4 w-4 mr-1 text-primary" />
              {listing.address}, {listing.city}, {listing.state}
            </div>
          </div>
          <div className="text-left md:text-right">
            <div className="text-4xl font-bold text-primary">
              ${listing.price.toLocaleString()}
              <span className="text-lg text-muted-foreground font-normal">/mo</span>
            </div>
            {listing.deposit && (
              <p className="text-xs text-muted-foreground mt-1">
                Deposit: ${listing.deposit.toLocaleString()}
              </p>
            )}
          </div>
        </div>

        {/* Gallery */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 h-[300px] md:h-[450px]">
          <div className="md:col-span-3 rounded-2xl overflow-hidden bg-muted relative border border-border/50">
            <img 
              src={imageUrls[activeImage]} 
              alt="Main listing photo" 
              className="w-full h-full object-cover"
            />
          </div>
          <div className="hidden md:flex flex-col gap-4 overflow-y-auto pr-1">
            {imageUrls.map((img: string, idx: number) => (
              <div 
                key={idx} 
                className={`aspect-[4/3] rounded-xl overflow-hidden bg-muted cursor-pointer border-2 transition-all ${
                  activeImage === idx ? 'border-primary scale-98 shadow-sm' : 'border-transparent opacity-80 hover:opacity-100'
                }`}
                onClick={() => setActiveImage(idx)}
              >
                <img src={img} alt={`Thumbnail ${idx}`} className="w-full h-full object-cover" />
              </div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 md:gap-12 pt-4">
          
          {/* Main Info */}
          <div className="lg:col-span-2 space-y-8">
            <section>
              <h2 className="text-2xl font-bold mb-4">About this place</h2>
              <p className="text-muted-foreground leading-relaxed whitespace-pre-line text-base">
                {listing.description}
              </p>
            </section>

            <Separator />

            {listing.amenities && listing.amenities.length > 0 && (
              <>
                <section>
                  <h2 className="text-2xl font-bold mb-4">Amenities</h2>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-y-4 gap-x-8">
                    {listing.amenities.map((amenity: string) => (
                      <div key={amenity} className="flex items-center gap-3">
                        <div className="h-6 w-6 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-600">
                          <Check className="h-4 w-4" />
                        </div>
                        <span className="text-foreground text-sm font-semibold">{amenity}</span>
                      </div>
                    ))}
                  </div>
                </section>
                <Separator />
              </>
            )}

            {listing.rules && listing.rules.length > 0 && (
              <>
                <section>
                  <h2 className="text-2xl font-bold mb-4">Rules & Guidelines</h2>
                  <ul className="list-disc pl-5 space-y-2 text-muted-foreground">
                    {listing.rules.map((rule: string) => (
                      <li key={rule} className="text-sm font-medium">{rule}</li>
                    ))}
                  </ul>
                </section>
                <Separator />
              </>
            )}

            <section>
              <h2 className="text-2xl font-bold mb-4">Space Specifications</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card className="bg-muted/30 shadow-none border-none">
                  <CardContent className="p-4 flex flex-col items-center justify-center text-center">
                    <Calendar className="h-6 w-6 text-primary mb-2" />
                    <p className="text-xs text-muted-foreground">Available From</p>
                    <p className="font-semibold text-sm">
                      {listing.availableFrom ? new Date(listing.availableFrom).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "Immediate"}
                    </p>
                  </CardContent>
                </Card>

                <Card className="bg-muted/30 shadow-none border-none">
                  <CardContent className="p-4 flex flex-col items-center justify-center text-center">
                    <Building className="h-6 w-6 text-primary mb-2" />
                    <p className="text-xs text-muted-foreground">Bedrooms</p>
                    <p className="font-semibold text-sm">{listing.bedrooms || 1} Bed</p>
                  </CardContent>
                </Card>

                <Card className="bg-muted/30 shadow-none border-none">
                  <CardContent className="p-4 flex flex-col items-center justify-center text-center">
                    <Users className="h-6 w-6 text-primary mb-2" />
                    <p className="text-xs text-muted-foreground">Max Occupants</p>
                    <p className="font-semibold text-sm">{listing.maxOccupants || 1} Person</p>
                  </CardContent>
                </Card>

                <Card className="bg-muted/30 shadow-none border-none">
                  <CardContent className="p-4 flex flex-col items-center justify-center text-center">
                    <ShieldCheck className="h-6 w-6 text-primary mb-2" />
                    <p className="text-xs text-muted-foreground">Furnishing</p>
                    <p className="font-semibold text-sm uppercase">{listing.furnishing || "Unfurnished"}</p>
                  </CardContent>
                </Card>
              </div>
            </section>
          </div>

          {/* Sticky Sidebar */}
          <div>
            <div className="sticky top-32 space-y-6">
              
              {/* Interaction Call to Action Card */}
              <Card className="shadow-lg border border-border/50">
                <CardContent className="p-6">
                  {isOwnerOfListing ? (
                    <div className="space-y-4">
                      <h3 className="font-bold text-lg">My Listing Portal</h3>
                      <p className="text-sm text-muted-foreground">
                        You are the owner of this property. Manage edits and configurations in your owner workspace.
                      </p>
                      <Button size="lg" className="w-full" onClick={() => router.push(`/dashboard/owner/listings/${listing.id}/edit`)}>
                        Edit Listing Details
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      <h3 className="font-bold text-lg">Contact Room Owner</h3>
                      <div className="flex items-center gap-4">
                        <Avatar className="h-12 w-12 border-2 border-primary/20">
                          <AvatarFallback className="bg-primary/10 text-primary font-bold">
                            {listing.owner?.user?.firstName?.charAt(0) || "O"}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-semibold">
                            {listing.owner?.user?.firstName} {listing.owner?.user?.lastName}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Property Owner Profile
                          </p>
                        </div>
                      </div>

                      {/* Interest state trigger display */}
                      {interestStatus === "PENDING" && (
                        <div className="space-y-3">
                          <div className="bg-warning/10 text-warning text-xs p-3 rounded-xl border border-warning/20 font-semibold flex items-center gap-1.5">
                            <Clock className="h-4 w-4" /> Request Sent (Pending Approval)
                          </div>
                          <Button variant="outline" size="lg" className="w-full text-destructive hover:bg-destructive/5" onClick={handleCancelInterest}>
                            Withdraw Interest Request
                          </Button>
                        </div>
                      )}

                      {interestStatus === "ACCEPTED" && (
                        <div className="space-y-3">
                          <div className="bg-emerald-500/10 text-emerald-600 text-xs p-3 rounded-xl border border-emerald-500/20 font-semibold flex items-center gap-1.5 animate-pulse">
                            <Check className="h-4 w-4" /> Owner Accepted Interest!
                          </div>
                          <Button size="lg" className="w-full bg-emerald-500 hover:bg-emerald-600" onClick={() => router.push(`/chat?user=${listing.owner?.userId}`)}>
                            <MessageCircle className="mr-2 h-4 w-4" /> Open Chat Room
                          </Button>
                        </div>
                      )}

                      {interestStatus === "REJECTED" && (
                        <div className="bg-destructive/10 text-destructive text-xs p-3 rounded-xl border border-destructive/20 font-semibold">
                          Interest request was declined.
                        </div>
                      )}

                      {!interestStatus && (
                        <Dialog open={interestModalOpen} onOpenChange={setInterestModalOpen}>
                          <DialogTrigger render={<Button size="lg" className="w-full" disabled={!isAuthenticated || user?.role !== "TENANT"} />}>
                            {!isAuthenticated
                              ? "Log In to Message"
                              : user?.role !== "TENANT"
                              ? "Tenants Only"
                              : "Express Interest"}
                          </DialogTrigger>
                          <DialogContent className="sm:max-w-md">
                            <DialogHeader>
                              <DialogTitle>Express Interest</DialogTitle>
                              <DialogDescription>
                                Tell the owner a bit about yourself and why you're interested. This will calculate compatibility and notify them!
                              </DialogDescription>
                            </DialogHeader>
                            <form onSubmit={handleExpressInterest} className="space-y-4 py-2">
                              <div className="space-y-2">
                                <label className="text-sm font-semibold" htmlFor="message">Intro Message</label>
                                <Textarea
                                  id="message"
                                  placeholder="Hi! I'm interested in renting your room..."
                                  value={interestMessage}
                                  onChange={(e) => setInterestMessage(e.target.value)}
                                  maxLength={500}
                                  className="min-h-[100px]"
                                />
                                <p className="text-[10px] text-right text-muted-foreground">
                                  {interestMessage.length}/500 characters
                                </p>
                              </div>
                              <Button type="submit" className="w-full rounded-full hover:bg-gray-700" disabled={submittingInterest}>
                                {submittingInterest ? "Submitting..." : "Send Request"}
                              </Button>
                            </form>
                          </DialogContent>
                        </Dialog>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Compatibility summary card */}
              {compatibilityScore !== null && (
                <Card className="border-border/40 bg-emerald-500/5 dark:bg-emerald-500/10">
                  <CardContent className="p-5 flex items-start gap-4">
                    <div className="h-10 w-10 shrink-0 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-600">
                      <Sparkles className="h-5 w-5" />
                    </div>
                    <div>
                      <h4 className="font-bold text-sm text-foreground">
                        {compatibilityScore >= 80 ? "Perfect Match!" : compatibilityScore >= 60 ? "Good Compatibility" : "Fair Match"}
                      </h4>
                      <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">
                        Based on lifestyle habits, routines and cleanliness parameters, your match score is{" "}
                        <strong className="text-emerald-600">{compatibilityScore}%</strong>.
                      </p>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
