"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { 
  User as UserIcon, 
  Mail, 
  Phone, 
  Building, 
  Check, 
  X, 
  Loader2, 
  Compass, 
  MessageSquare, 
  ChevronLeft,
  Moon,
  Users,
  Home,
  Wind,
  Dog,
  Wine,
  ShieldCheck,
  CheckCircle,
  Briefcase
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { api } from "@/lib/api";
import { useAuthStore } from "@/store/useAuthStore";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";

export default function PublicProfilePage() {
  const router = useRouter();
  const params = useParams();
  const { user: currentUser, isAuthenticated } = useAuthStore();

  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const fetchProfileDetails = async () => {
    if (!params.id) return;
    setLoading(true);
    setError(false);
    try {
      const response = await api.get(`/api/v1/profile/${params.id}`);
      setProfile(response.data.data);
    } catch (err) {
      console.error("Failed to load profile details:", err);
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfileDetails();
  }, [params.id]);

  if (loading) {
    return (
      <div className="flex flex-col min-h-screen bg-background">
        <Navbar />
        <div className="flex-1 flex flex-col items-center justify-center py-20">
          <Loader2 className="h-10 w-10 text-primary animate-spin mb-4" />
          <p className="text-muted-foreground font-semibold">Loading profile...</p>
        </div>
        <Footer />
      </div>
    );
  }

  if (error || !profile || !profile.user) {
    return (
      <div className="flex flex-col min-h-screen bg-background">
        <Navbar />
        <div className="flex-1 flex flex-col items-center justify-center py-20 text-center">
          <h2 className="text-2xl font-bold text-destructive mb-2">Profile not found</h2>
          <p className="text-muted-foreground max-w-sm mb-6">
            The profile you are looking for does not exist or may have been deactivated.
          </p>
          <Button onClick={() => router.push("/")} className="rounded-full shadow-md">
            Go to Home
          </Button>
        </div>
        <Footer />
      </div>
    );
  }

  const { user, tenantProfile, ownerProfile } = profile;
  const isSelf = currentUser && currentUser.id === user.id;

  return (
    <div className="bg-background min-h-screen flex flex-col">
      <Navbar />

      {/* Sticky Sub-Header */}
      <div className="sticky top-16 z-40 bg-background/85 backdrop-blur-md border-b border-border/40">
        <div className="max-w-4xl mx-auto px-4 md:px-8 h-16 flex items-center justify-between">
          <Button variant="ghost" size="sm" onClick={() => router.back()} className="-ml-2">
            <ChevronLeft className="h-5 w-5 mr-1" /> Back
          </Button>
          {!isSelf && isAuthenticated && (
            <Button 
              size="sm" 
              className="rounded-full shadow-sm"
              onClick={() => router.push(`/chat?user=${user.id}`)}
            >
              <MessageSquare className="h-4 w-4 mr-2" /> Message
            </Button>
          )}
        </div>
      </div>

      <div className="flex-1 max-w-4xl mx-auto px-4 md:px-8 py-8 space-y-8 w-full">
        {/* Banner Section */}
        <div className="flex flex-col sm:flex-row items-center gap-6 pb-6 border-b border-border/40">
          <Avatar className="h-24 w-24 border-4 border-primary/20 shadow-md">
            <AvatarImage src={user.avatar} />
            <AvatarFallback className="bg-primary/10 text-primary text-3xl font-extrabold">
              {user.firstName?.charAt(0) || <UserIcon className="h-10 w-10" />}
            </AvatarFallback>
          </Avatar>

          <div className="text-center sm:text-left space-y-2">
            <h1 className="text-3xl font-extrabold tracking-tight">
              {user.firstName} {user.lastName}
            </h1>
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 mt-1 text-sm text-muted-foreground font-semibold">
              {user.email && (
                <span className="flex items-center gap-1">
                  <Mail className="h-4 w-4 text-primary" /> {user.email}
                </span>
              )}
              {user.phone && (
                <span className="flex items-center gap-1">
                  <Phone className="h-4 w-4 text-primary" /> {user.phone}
                </span>
              )}
            </div>
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 pt-1">
              <Badge variant="default" className="font-semibold tracking-wider">
                {user.role}
              </Badge>
              {user.role === "OWNER" && ownerProfile?.companyName && (
                <Badge variant="outline" className="text-muted-foreground border-border/50">
                  <Building className="h-3 w-3 mr-1" /> {ownerProfile.companyName}
                </Badge>
              )}
              {user.role === "OWNER" && ownerProfile?.isVerified && (
                <Badge variant="secondary" className="bg-emerald-500/10 text-emerald-600 border-none flex items-center font-bold">
                  <CheckCircle className="h-3 w-3 mr-1" /> Verified Owner
                </Badge>
              )}
            </div>
          </div>
        </div>

        {/* Bio Section */}
        {user.bio && (
          <section className="space-y-3">
            <h3 className="text-xl font-bold">About Me</h3>
            <p className="text-muted-foreground leading-relaxed whitespace-pre-line text-base">
              {user.bio}
            </p>
          </section>
        )}

        {/* Profile specific information details */}
        {user.role === "TENANT" && tenantProfile && (
          <div className="space-y-8">
            <Separator />
            
            <section className="space-y-6">
              <h3 className="text-xl font-bold flex items-center gap-2">
                <Compass className="h-6 w-6 text-primary" /> Lifestyle Preferences & Routine
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Hygiene & Routine Card */}
                <Card className="border-border/50 bg-card/50 shadow-sm p-4">
                  <CardHeader>
                    <CardTitle className="text-base font-bold flex items-center gap-2">
                      <Moon className="h-5 w-5 text-primary" /> Daily Habits & Hygiene
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6 mt-4">
                    {/* Cleanliness rating */}
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm font-semibold">
                        <span>Cleanliness Level</span>
                        <span className="text-primary">{tenantProfile.cleanliness || 3}/5</span>
                      </div>
                      <div className="w-full bg-secondary h-2.5 rounded-full overflow-hidden">
                        <div 
                          className="bg-primary h-full rounded-full transition-all duration-500" 
                          style={{ width: `${(tenantProfile.cleanliness || 3) * 20}%` }}
                        />
                      </div>
                      <p className="text-[11px] text-muted-foreground font-semibold">
                        {(tenantProfile.cleanliness || 3) <= 2 ? "Prefers a relaxed cleaning schedule." : (tenantProfile.cleanliness || 3) === 3 ? "Maintains a moderate, standard level of tidiness." : "Extremely neat; expects immaculately clean common spaces."}
                      </p>
                    </div>

                    <div className="space-y-4">
                      <div className="flex justify-between items-center text-sm border-b border-border/30 pb-2">
                        <span className="text-muted-foreground font-medium">Sleep Schedule</span>
                        <Badge variant="outline" className="font-semibold capitalize text-xs">
                          {tenantProfile.sleepSchedule?.replace("_", " ") || "Flexible"}
                        </Badge>
                      </div>
                      <div className="flex justify-between items-center text-sm border-b border-border/30 pb-2">
                        <span className="text-muted-foreground font-medium">Noise Toleration</span>
                        <Badge variant="outline" className="font-semibold capitalize text-xs">
                          {tenantProfile.noiseLevel || "Moderate"}
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Social & Dietary Card */}
                <Card className="border-border/50 bg-card/50 shadow-sm p-4">
                  <CardHeader>
                    <CardTitle className="text-base font-bold flex items-center gap-2">
                      <Users className="h-5 w-5 text-primary" /> Social & Dining Preferences
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4 mt-4">
                    <div className="flex justify-between items-center text-sm border-b border-border/30 pb-2">
                      <span className="text-muted-foreground font-medium">Guest Policy</span>
                      <Badge variant="outline" className="font-semibold capitalize text-xs">
                        {tenantProfile.guestPolicy || "Occasionally"}
                      </Badge>
                    </div>
                    <div className="flex justify-between items-center text-sm border-b border-border/30 pb-2">
                      <span className="text-muted-foreground font-medium">Dietary Habits</span>
                      <Badge variant="outline" className="font-semibold capitalize text-xs">
                        {tenantProfile.diet?.replace("_", "-") || "Any Diet"}
                      </Badge>
                    </div>
                    <div className="flex justify-between items-center text-sm border-b border-border/30 pb-2">
                      <span className="text-muted-foreground font-medium">Work Routine</span>
                      <Badge variant="outline" className="font-semibold capitalize text-xs">
                        {tenantProfile.workSchedule || "Hybrid"}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Budget & General habits checklist */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                
                {/* Budget card */}
                <Card className="md:col-span-1 border-border/50 bg-card/50 shadow-sm flex flex-col justify-center p-4">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-bold text-muted-foreground flex items-center gap-1.5">
                      <Home className="h-4 w-4 text-primary" /> Budget Range
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-2">
                    <div className="text-2xl font-extrabold text-primary">
                      ${tenantProfile.budgetMin || 0} - ${tenantProfile.budgetMax || 0}
                      <span className="text-xs text-muted-foreground font-normal"> /mo</span>
                    </div>
                    <p className="text-[10px] text-muted-foreground mt-1 font-medium">
                      Estimated rental target.
                    </p>
                  </CardContent>
                </Card>

                {/* General habits cards */}
                <Card className="md:col-span-2 border-border/50 bg-card/50 shadow-sm p-4">
                  <CardContent className="grid grid-cols-3 gap-2 h-full items-center">
                    
                    <div className="flex flex-col items-center justify-center p-3 rounded-xl border border-border/40 bg-muted/15 text-center">
                      <Wind className={`h-5 w-5 mb-2 ${tenantProfile.smoking ? "text-primary" : "text-muted-foreground/45"}`} />
                      <span className="text-xs font-semibold">Smoking</span>
                      <Badge variant="ghost" className={`text-[10px] mt-1 h-5 ${tenantProfile.smoking ? "text-emerald-600 bg-emerald-500/10 font-bold" : "text-muted-foreground"}`}>
                        {tenantProfile.smoking ? "OK / Yes" : "No / Avoid"}
                      </Badge>
                    </div>

                    <div className="flex flex-col items-center justify-center p-3 rounded-xl border border-border/40 bg-muted/15 text-center">
                      <Dog className={`h-5 w-5 mb-2 ${tenantProfile.pets ? "text-primary" : "text-muted-foreground/45"}`} />
                      <span className="text-xs font-semibold">Pets</span>
                      <Badge variant="ghost" className={`text-[10px] mt-1 h-5 ${tenantProfile.pets ? "text-emerald-600 bg-emerald-500/10 font-bold" : "text-muted-foreground"}`}>
                        {tenantProfile.pets ? "Yes" : "No"}
                      </Badge>
                    </div>

                    <div className="flex flex-col items-center justify-center p-3 rounded-xl border border-border/40 bg-muted/15 text-center">
                      <Wine className={`h-5 w-5 mb-2 ${tenantProfile.drinking ? "text-primary" : "text-muted-foreground/45"}`} />
                      <span className="text-xs font-semibold">Drinking</span>
                      <Badge variant="ghost" className={`text-[10px] mt-1 h-5 ${tenantProfile.drinking ? "text-emerald-600 bg-emerald-500/10 font-bold" : "text-muted-foreground"}`}>
                        {tenantProfile.drinking ? "OK / Yes" : "No"}
                      </Badge>
                    </div>

                  </CardContent>
                </Card>
              </div>
            </section>
          </div>
        )}

        {user.role === "OWNER" && ownerProfile && (
          <div className="space-y-6">
            <Separator />
            <section className="space-y-4">
              <h3 className="text-xl font-bold flex items-center gap-2">
                <Briefcase className="h-6 w-6 text-primary" /> Property Management Profile
              </h3>
              <Card className="border-border/50 bg-card/50 shadow-sm p-4">
                <CardContent className="space-y-4 mt-4">
                  {ownerProfile.companyName && (
                    <div className="flex justify-between items-center text-sm border-b border-border/30 pb-2">
                      <span className="text-muted-foreground font-semibold flex items-center gap-1">
                        <Building className="h-4 w-4 text-primary" /> Company / Agency
                      </span>
                      <span className="font-bold text-foreground">{ownerProfile.companyName}</span>
                    </div>
                  )}
                  <div className="flex justify-between items-center text-sm pb-2">
                    <span className="text-muted-foreground font-semibold flex items-center gap-1">
                      <ShieldCheck className="h-4 w-4 text-primary" /> Verification Status
                    </span>
                    <Badge variant={ownerProfile.isVerified ? "default" : "secondary"} className="font-bold">
                      {ownerProfile.isVerified ? "VERIFIED" : "PENDING VERIFICATION"}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            </section>
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
}
