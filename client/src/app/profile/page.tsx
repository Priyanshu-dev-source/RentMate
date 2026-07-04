"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { 
  User, 
  Sparkles, 
  Check, 
  Building, 
  Save, 
  Phone, 
  Mail, 
  FileText, 
  Camera, 
  Loader2, 
  ShieldAlert, 
  Moon, 
  Users, 
  Home, 
  Wind, 
  Dog, 
  Wine,
  MapPin,
  Clock
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuthStore } from "@/store/useAuthStore";
import { api } from "@/lib/api";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";

export default function ProfilePage() {
  const router = useRouter();
  const { user: authUser, isAuthenticated, isLoading: authLoading, checkAuth } = useAuthStore();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // User fields
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [bio, setBio] = useState("");
  const [avatar, setAvatar] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"TENANT" | "OWNER" | "ADMIN">("TENANT");

  // Tenant fields
  const [cleanliness, setCleanliness] = useState<number>(3);
  const [sleepSchedule, setSleepSchedule] = useState<"early_bird" | "night_owl" | "flexible">("flexible");
  const [smoking, setSmoking] = useState<boolean>(false);
  const [pets, setPets] = useState<boolean>(false);
  const [drinking, setDrinking] = useState<boolean>(false);
  const [guestPolicy, setGuestPolicy] = useState<"never" | "occasionally" | "frequently">("occasionally");
  const [noiseLevel, setNoiseLevel] = useState<"quiet" | "moderate" | "lively">("moderate");
  const [diet, setDiet] = useState<"vegetarian" | "vegan" | "non_vegetarian" | "any">("any");
  const [workSchedule, setWorkSchedule] = useState<"wfh" | "office" | "hybrid">("hybrid");
  const [budgetMin, setBudgetMin] = useState<number>(500);
  const [budgetMax, setBudgetMax] = useState<number>(2500);

  // Owner fields
  const [companyName, setCompanyName] = useState("");
  const [taxId, setTaxId] = useState("");

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const fetchProfileData = async () => {
    if (!isAuthenticated) return;
    setLoading(true);
    try {
      const response = await api.get("/api/v1/profile");
      const { user, tenantProfile, ownerProfile } = response.data.data;
      
      if (user) {
        setFirstName(user.firstName || "");
        setLastName(user.lastName || "");
        setPhone(user.phone || "");
        setBio(user.bio || "");
        setAvatar(user.avatar || "");
        setEmail(user.email || "");
        setRole(user.role);
      }

      if (tenantProfile) {
        setCleanliness(tenantProfile.cleanliness ?? 3);
        setSleepSchedule(tenantProfile.sleepSchedule || "flexible");
        setSmoking(tenantProfile.smoking ?? false);
        setPets(tenantProfile.pets ?? false);
        setDrinking(tenantProfile.drinking ?? false);
        setGuestPolicy(tenantProfile.guestPolicy || "occasionally");
        setNoiseLevel(tenantProfile.noiseLevel || "moderate");
        setDiet(tenantProfile.diet || "any");
        setWorkSchedule(tenantProfile.workSchedule || "hybrid");
        setBudgetMin(tenantProfile.budgetMin ?? 500);
        setBudgetMax(tenantProfile.budgetMax ?? 2500);
      }

      if (ownerProfile) {
        setCompanyName(ownerProfile.companyName || "");
        setTaxId(ownerProfile.taxId || "");
      }
    } catch (err) {
      console.error("Failed to load profile details:", err);
      setErrorMsg("Failed to load profile details");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchProfileData();
    }
  }, [isAuthenticated]);

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    
    setUploadingAvatar(true);
    setErrorMsg("");
    setSuccessMsg("");

    const formData = new FormData();
    formData.append("image", file);

    try {
      const response = await api.post("/api/v1/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      const imageUrl = response.data.data.url;
      setAvatar(imageUrl);
      setSuccessMsg("Avatar uploaded! Save profile to apply changes.");
      setTimeout(() => setSuccessMsg(""), 3000);
    } catch (err: any) {
      console.error("Failed to upload avatar:", err);
      setErrorMsg(err.response?.data?.message || "Failed to upload avatar image");
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleTriggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSuccessMsg("");
    setErrorMsg("");

    const payload: any = {
      firstName,
      lastName,
      phone,
      bio,
      avatar,
    };

    if (role === "TENANT") {
      payload.cleanliness = Number(cleanliness);
      payload.sleepSchedule = sleepSchedule;
      payload.smoking = smoking;
      payload.pets = pets;
      payload.drinking = drinking;
      payload.guestPolicy = guestPolicy;
      payload.noiseLevel = noiseLevel;
      payload.diet = diet;
      payload.workSchedule = workSchedule;
      payload.budgetMin = Number(budgetMin);
      payload.budgetMax = Number(budgetMax);
    } else if (role === "OWNER") {
      payload.companyName = companyName;
      payload.taxId = taxId;
    }

    try {
      await api.put("/api/v1/profile", payload);
      setSuccessMsg("Profile saved successfully!");
      // Sync auth state
      await checkAuth();
      setTimeout(() => setSuccessMsg(""), 3000);
    } catch (err: any) {
      console.error("Failed to update profile:", err);
      setErrorMsg(err.response?.data?.message || "Failed to update profile details");
    } finally {
      setSaving(false);
    }
  };

  if (authLoading || (isAuthenticated && loading)) {
    return (
      <div className="flex flex-col min-h-screen bg-background">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="h-10 w-10 text-primary animate-spin" />
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Navbar />
      <main className="flex-1 container mx-auto px-4 md:px-8 py-10 max-w-4xl space-y-8">
        
        {/* Profile Banner */}
        <div className="flex flex-col sm:flex-row items-center gap-6 pb-6 border-b border-border/40">
          <div className="relative group cursor-pointer" onClick={handleTriggerFileInput}>
            <Avatar className="h-24 w-24 border-4 border-primary/20 shadow-md">
              <AvatarImage src={avatar} />
              <AvatarFallback className="bg-primary/10 text-primary text-3xl font-extrabold">
                {firstName.charAt(0) || <User className="h-10 w-10" />}
              </AvatarFallback>
            </Avatar>
            <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              {uploadingAvatar ? (
                <Loader2 className="h-6 w-6 text-white animate-spin" />
              ) : (
                <Camera className="h-6 w-6 text-white" />
              )}
            </div>
            <input 
              type="file" 
              ref={fileInputRef} 
              className="hidden" 
              accept="image/*" 
              onChange={handleAvatarUpload}
              disabled={uploadingAvatar}
            />
          </div>

          <div className="text-center sm:text-left space-y-2">
            <h1 className="text-3xl font-extrabold tracking-tight">
              {firstName} {lastName}
            </h1>
            <p className="text-muted-foreground text-sm flex items-center justify-center sm:justify-start gap-1">
              <Mail className="h-3.5 w-3.5 text-primary" /> {email}
            </p>
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
              <Badge variant="default" className="font-semibold tracking-wider">
                {role}
              </Badge>
              {role === "OWNER" && companyName && (
                <Badge variant="outline" className="text-muted-foreground border-border/50">
                  <Building className="h-3 w-3 mr-1" /> {companyName}
                </Badge>
              )}
            </div>
          </div>
        </div>

        {!isAuthenticated ? (
          <Card className="border-warning/30 bg-warning/5 max-w-xl mx-auto shadow-md">
            <CardHeader className="flex flex-row items-center gap-4 space-y-0">
              <div className="h-10 w-10 bg-primary/10 rounded-full flex items-center justify-center text-primary">
                <ShieldAlert className="h-5 w-5" />
              </div>
              <div>
                <CardTitle>Authentication Required</CardTitle>
                <CardDescription>You must be signed in to edit your profile details.</CardDescription>
              </div>
            </CardHeader>
            <CardContent className="pt-2 text-sm text-muted-foreground">
              Please click "Sign In" or "Get Started" in the header to access your profile settings.
            </CardContent>
          </Card>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            
            {successMsg && (
              <div className="p-4 bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 rounded-xl font-medium text-sm flex items-center gap-2">
                <Check className="h-5 w-5 animate-bounce" /> {successMsg}
              </div>
            )}

            {errorMsg && (
              <div className="p-4 bg-destructive/10 text-destructive border border-destructive/20 rounded-xl font-medium text-sm">
                {errorMsg}
              </div>
            )}

            <Tabs defaultValue="personal" className="w-full">
              <TabsList className="grid w-full grid-cols-2 max-w-md bg-muted/60 p-1 rounded-xl">
                <TabsTrigger value="personal" className="rounded-lg font-semibold">Personal Info</TabsTrigger>
                <TabsTrigger value="details" className="rounded-lg font-semibold">
                  {role === "TENANT" ? "Lifestyle & Budget" : "Business Details"}
                </TabsTrigger>
              </TabsList>

              <TabsContent value="personal" className="mt-6">
                <Card className="border-border/50 shadow-sm p-4">
                  <CardHeader>
                    <CardTitle className="text-lg font-bold flex items-center gap-2">
                      <User className="h-5 w-5 text-primary" /> Personal Information
                    </CardTitle>
                    <CardDescription>Provide basic details and public contact information.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6 mt-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="first-name">First Name</Label>
                        <Input
                          id="first-name"
                          value={firstName}
                          onChange={(e) => setFirstName(e.target.value)}
                          placeholder="First Name"
                          required
                          className="bg-background border-border/50"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="last-name">Last Name</Label>
                        <Input
                          id="last-name"
                          value={lastName}
                          onChange={(e) => setLastName(e.target.value)}
                          placeholder="Last Name"
                          required
                          className="bg-background border-border/50"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="phone">Phone Number</Label>
                        <Input
                          id="phone"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          placeholder="+1234567890"
                          className="bg-background border-border/50"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="email">Email Address (Read-only)</Label>
                        <Input
                          id="email"
                          value={email}
                          disabled
                          className="bg-muted text-muted-foreground border-border/50 cursor-not-allowed"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="bio">Bio</Label>
                      <Textarea
                        id="bio"
                        value={bio}
                        onChange={(e) => setBio(e.target.value)}
                        placeholder="Tell flatmates or tenants about yourself..."
                        rows={4}
                        className="bg-background border-border/50"
                      />
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="details" className="mt-6">
                {role === "TENANT" ? (
                  <div className="space-y-6">
                    {/* Tenant Preferences */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      
                      {/* Habits */}
                      <Card className="border-border/50 shadow-sm p-4">
                        <CardHeader>
                          <CardTitle className="text-lg font-bold flex items-center gap-2">
                            <Moon className="h-5 w-5 text-primary" /> Daily Routine & Hygiene
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6 mt-4">
                          {/* Cleanliness Slider */}
                          <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                              <Label htmlFor="cleanliness" className="font-semibold">Cleanliness Level ({cleanliness}/5)</Label>
                              <span className="text-xs text-muted-foreground font-semibold">
                                {cleanliness <= 2 ? "Relaxed" : cleanliness === 3 ? "Moderate" : "Immaculate"}
                              </span>
                            </div>
                            <input
                              id="cleanliness"
                              type="range"
                              min={1}
                              max={5}
                              step={1}
                              value={cleanliness}
                              onChange={(e) => setCleanliness(Number(e.target.value))}
                              className="w-full h-2 bg-secondary rounded-lg appearance-none cursor-pointer accent-primary"
                            />
                          </div>

                          {/* Sleep Schedule */}
                          <div className="space-y-2">
                            <Label className="font-semibold">Sleep Schedule</Label>
                            <div className="grid grid-cols-3 gap-2">
                              {[
                                { val: "early_bird", label: "Early Bird" },
                                { val: "night_owl", label: "Night Owl" },
                                { val: "flexible", label: "Flexible" },
                              ].map((item) => (
                                <button
                                  key={item.val}
                                  type="button"
                                  onClick={() => setSleepSchedule(item.val as any)}
                                  className={`py-2.5 px-3 rounded-lg border text-xs font-semibold transition-all ${
                                    sleepSchedule === item.val
                                      ? "border-primary bg-primary/10 text-primary shadow-sm"
                                      : "border-border/60 hover:bg-muted/50 text-muted-foreground"
                                  }`}
                                >
                                  {item.label}
                                </button>
                              ))}
                            </div>
                          </div>

                          {/* Noise Level */}
                          <div className="space-y-2">
                            <Label className="font-semibold">Noise Toleration</Label>
                            <div className="grid grid-cols-3 gap-2">
                              {[
                                { val: "quiet", label: "Quiet" },
                                { val: "moderate", label: "Moderate" },
                                { val: "lively", label: "Lively" },
                              ].map((item) => (
                                <button
                                  key={item.val}
                                  type="button"
                                  onClick={() => setNoiseLevel(item.val as any)}
                                  className={`py-2.5 px-3 rounded-lg border text-xs font-semibold transition-all ${
                                    noiseLevel === item.val
                                      ? "border-primary bg-primary/10 text-primary shadow-sm"
                                      : "border-border/60 hover:bg-muted/50 text-muted-foreground"
                                  }`}
                                >
                                  {item.label}
                                </button>
                              ))}
                            </div>
                          </div>
                        </CardContent>
                      </Card>

                      {/* Preferences / Social */}
                      <Card className="border-border/50 shadow-sm p-4">
                        <CardHeader>
                          <CardTitle className="text-lg font-bold flex items-center gap-2">
                            <Users className="h-5 w-5 text-primary" /> Social & Dietary Habits
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6 mt-4">
                          {/* Guest Policy */}
                          <div className="space-y-2">
                            <Label className="font-semibold">Guest Policy</Label>
                            <div className="grid grid-cols-3 gap-2">
                              {[
                                { val: "never", label: "Never" },
                                { val: "occasionally", label: "Occasionally" },
                                { val: "frequently", label: "Frequently" },
                              ].map((item) => (
                                <button
                                  key={item.val}
                                  type="button"
                                  onClick={() => setGuestPolicy(item.val as any)}
                                  className={`py-2.5 px-3 rounded-lg border text-xs font-semibold transition-all ${
                                    guestPolicy === item.val
                                      ? "border-primary bg-primary/10 text-primary shadow-sm"
                                      : "border-border/60 hover:bg-muted/50 text-muted-foreground"
                                  }`}
                                >
                                  {item.label}
                                </button>
                              ))}
                            </div>
                          </div>

                          {/* Diet */}
                          <div className="space-y-2">
                            <Label className="font-semibold">Diet Preference</Label>
                            <div className="grid grid-cols-2 gap-2">
                              {[
                                { val: "vegetarian", label: "Vegetarian" },
                                { val: "vegan", label: "Vegan" },
                                { val: "non_vegetarian", label: "Non-Veg" },
                                { val: "any", label: "Any Diet" },
                              ].map((item) => (
                                <button
                                  key={item.val}
                                  type="button"
                                  onClick={() => setDiet(item.val as any)}
                                  className={`py-2.5 px-3 rounded-lg border text-xs font-semibold transition-all ${
                                    diet === item.val
                                      ? "border-primary bg-primary/10 text-primary shadow-sm"
                                      : "border-border/60 hover:bg-muted/50 text-muted-foreground"
                                  }`}
                                >
                                  {item.label}
                                </button>
                              ))}
                            </div>
                          </div>

                          {/* Work Schedule */}
                          <div className="space-y-2">
                            <Label className="font-semibold">Work Routine</Label>
                            <div className="grid grid-cols-3 gap-2">
                              {[
                                { val: "wfh", label: "WFH / Remote" },
                                { val: "office", label: "Office Commute" },
                                { val: "hybrid", label: "Hybrid" },
                              ].map((item) => (
                                <button
                                  key={item.val}
                                  type="button"
                                  onClick={() => setWorkSchedule(item.val as any)}
                                  className={`py-2.5 px-3 rounded-lg border text-xs font-semibold transition-all ${
                                    workSchedule === item.val
                                      ? "border-primary bg-primary/10 text-primary shadow-sm"
                                      : "border-border/60 hover:bg-muted/50 text-muted-foreground"
                                  }`}
                                >
                                  {item.label}
                                </button>
                              ))}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </div>

                    {/* Checkbox triggers & budget */}
                    <Card className="border-border/50 shadow-sm p-4">
                      <CardHeader>
                        <CardTitle className="text-lg font-bold flex items-center gap-2">
                          <Home className="h-5 w-5 text-primary" /> Budget & General Habits
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-6 mt-4">
                        
                        {/* Budget Min/Max */}
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="budget-min" className="font-semibold">Minimum Budget ($)</Label>
                            <Input
                              id="budget-min"
                              type="number"
                              value={budgetMin}
                              min={0}
                              onChange={(e) => setBudgetMin(Number(e.target.value))}
                              className="bg-background border-border/50"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="budget-max" className="font-semibold">Maximum Budget ($)</Label>
                            <Input
                              id="budget-max"
                              type="number"
                              value={budgetMax}
                              min={0}
                              onChange={(e) => setBudgetMax(Number(e.target.value))}
                              className="bg-background border-border/50"
                            />
                          </div>
                        </div>

                        {/* Habit Flags */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4 border-t border-border/40">
                          <div className="flex items-center space-x-3 bg-muted/25 p-4 rounded-xl border border-border/40">
                            <Checkbox
                              id="smoking"
                              checked={smoking}
                              onCheckedChange={(checked) => setSmoking(!!checked)}
                            />
                            <label htmlFor="smoking" className="text-sm font-semibold flex items-center gap-2 cursor-pointer select-none">
                              <Wind className="h-4 w-4 text-primary" />
                              Smoking OK / Yes
                            </label>
                          </div>
                          
                          <div className="flex items-center space-x-3 bg-muted/25 p-4 rounded-xl border border-border/40">
                            <Checkbox
                              id="pets"
                              checked={pets}
                              onCheckedChange={(checked) => setPets(!!checked)}
                            />
                            <label htmlFor="pets" className="text-sm font-semibold flex items-center gap-2 cursor-pointer select-none">
                              <Dog className="h-4 w-4 text-primary" />
                              Comfortable with Pets
                            </label>
                          </div>

                          <div className="flex items-center space-x-3 bg-muted/25 p-4 rounded-xl border border-border/40">
                            <Checkbox
                              id="drinking"
                              checked={drinking}
                              onCheckedChange={(checked) => setDrinking(!!checked)}
                            />
                            <label htmlFor="drinking" className="text-sm font-semibold flex items-center gap-2 cursor-pointer select-none">
                              <Wine className="h-4 w-4 text-primary" />
                              Drinking OK / Yes
                            </label>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                ) : (
                  /* Owner Business details */
                  <Card className="border-border/50 shadow-sm p-4">
                    <CardHeader>
                      <CardTitle className="text-lg font-bold flex items-center gap-2">
                        <Building className="h-5 w-5 text-primary" /> Business Profile
                      </CardTitle>
                      <CardDescription>Configure business and company registration details.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6 mt-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="company-name">Company Name</Label>
                          <Input
                            id="company-name"
                            value={companyName}
                            onChange={(e) => setCompanyName(e.target.value)}
                            placeholder="e.g. RentMate Properties"
                            className="bg-background border-border/50"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="tax-id">Tax ID / Business Registration No.</Label>
                          <Input
                            id="tax-id"
                            value={taxId}
                            onChange={(e) => setTaxId(e.target.value)}
                            placeholder="e.g. TAX-123456"
                            className="bg-background border-border/50"
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>
            </Tabs>

            <div className="flex justify-end pt-4">
              <Button type="submit" disabled={saving} className="rounded-full min-w-[150px] shadow-md">
                {saving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" /> Save Profile
                  </>
                )}
              </Button>
            </div>
          </form>
        )}
      </main>
      {/* <Footer /> */}
    </div>
  );
}
