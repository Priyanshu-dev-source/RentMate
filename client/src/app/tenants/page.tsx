"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { 
  Sparkles, 
  Check, 
  Trash2, 
  Home, 
  Moon, 
  Users, 
  ShieldAlert,
  Save,
  Dog,
  Wine,
  Wind,
  Loader2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useAuthStore } from "@/store/useAuthStore";
import { api } from "@/lib/api";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";

export default function TenantsPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading: authLoading } = useAuthStore();
  
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

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const fetchPreferences = async () => {
    if (!isAuthenticated || user?.role !== "TENANT") return;
    setLoading(true);
    try {
      const response = await api.get("/api/v1/tenants/preferences");
      const data = response.data.data;
      if (data) {
        setCleanliness(data.cleanliness || 3);
        setSleepSchedule(data.sleepSchedule || "flexible");
        setSmoking(data.smoking || false);
        setPets(data.pets || false);
        setDrinking(data.drinking || false);
        setGuestPolicy(data.guestPolicy || "occasionally");
        setNoiseLevel(data.noiseLevel || "moderate");
        setDiet(data.diet || "any");
        setWorkSchedule(data.workSchedule || "hybrid");
        setBudgetMin(data.budgetMin || 500);
        setBudgetMax(data.budgetMax || 2500);
      }
    } catch (err) {
      console.error("Failed to load preferences:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchPreferences();
    }
  }, [isAuthenticated, user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSuccessMsg("");
    setErrorMsg("");

    try {
      await api.put("/api/v1/tenants/preferences", {
        cleanliness: Number(cleanliness),
        sleepSchedule,
        smoking,
        pets,
        drinking,
        guestPolicy,
        noiseLevel,
        diet,
        workSchedule,
        budgetMin: Number(budgetMin),
        budgetMax: Number(budgetMax),
      });
      setSuccessMsg("Preferences saved successfully!");
      setTimeout(() => setSuccessMsg(""), 3000);
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || "Failed to update preferences");
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
        
        {/* Banner header */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-6 border-b border-border/40">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight md:text-4xl flex items-center gap-2">
              <Sparkles className="h-8 w-8 text-primary animate-pulse" />
              Roommate Lifestyle Profile
            </h1>
            <p className="text-muted-foreground mt-1.5 text-base">
              Set your habits and budgets to get matched with listings and flatmates.
            </p>
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
                <CardDescription>You must be signed in as a Tenant to edit preferences.</CardDescription>
              </div>
            </CardHeader>
            <CardContent className="pt-2 text-sm text-muted-foreground">
              Please click "Sign In" or "Get Started" in the header to create/login to a Tenant account.
            </CardContent>
          </Card>
        ) : user?.role !== "TENANT" ? (
          <Card className="border-destructive/30 bg-destructive/5 max-w-xl mx-auto shadow-md">
            <CardHeader className="flex flex-row items-center gap-4 space-y-0">
              <div className="h-10 w-10 bg-destructive/10 rounded-full flex items-center justify-center text-destructive">
                <ShieldAlert className="h-5 w-5" />
              </div>
              <div>
                <CardTitle>Role Access Restricted</CardTitle>
                <CardDescription>Only Tenants can define lifestyle profiles.</CardDescription>
              </div>
            </CardHeader>
            <CardContent className="pt-2 text-sm text-muted-foreground">
              Your profile is registered as an Owner. Roommate matching preferences are reserved for Tenant profiles.
            </CardContent>
          </Card>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            
            {successMsg && (
              <div className="p-4 bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 rounded-xl font-medium text-sm flex items-center gap-2">
                <Check className="h-5 w-5" /> {successMsg}
              </div>
            )}

            {errorMsg && (
              <div className="p-4 bg-destructive/10 text-destructive border border-destructive/20 rounded-xl font-medium text-sm">
                {errorMsg}
              </div>
            )}

            {/* Core Preferences Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Habits */}
              <Card className="border-border/50 shadow-sm">
                <CardHeader>
                  <CardTitle className="text-lg font-bold flex items-center gap-2">
                    <Moon className="h-5 w-5 text-primary" /> Daily Routine & Hygiene
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Cleanliness Slider */}
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <Label htmlFor="cleanliness" className="font-semibold">Cleanliness Level ({cleanliness}/5)</Label>
                      <span className="text-xs text-muted-foreground">
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
              <Card className="border-border/50 shadow-sm">
                <CardHeader>
                  <CardTitle className="text-lg font-bold flex items-center gap-2">
                    <Users className="h-5 w-5 text-primary" /> Social & Dietary Habits
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
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
            <Card className="border-border/50 shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg font-bold flex items-center gap-2">
                  <Home className="h-5 w-5 text-primary" /> Budget & General Habits
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                
                {/* Budget Min/Max */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="budget-min" className="font-semibold">Minimum Budget ($)</Label>
                    <input
                      id="budget-min"
                      type="number"
                      value={budgetMin}
                      min={0}
                      onChange={(e) => setBudgetMin(Number(e.target.value))}
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="budget-max" className="font-semibold">Maximum Budget ($)</Label>
                    <input
                      id="budget-max"
                      type="number"
                      value={budgetMax}
                      min={0}
                      onChange={(e) => setBudgetMax(Number(e.target.value))}
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    />
                  </div>
                </div>

                {/* Habit Flags */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4 border-t border-border/40">
                  <div className="flex items-center space-x-3 bg-muted/20 p-4 rounded-xl border border-border/40">
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
                  
                  <div className="flex items-center space-x-3 bg-muted/20 p-4 rounded-xl border border-border/40">
                    <Checkbox
                      id="pets"
                      checked={pets}
                      onCheckedChange={(checked) => setPets(!!checked)}
                    />
                    <label htmlFor="pets" className="text-sm font-semibold flex items-center gap-2 cursor-pointer select-none">
                      <Dog className="h-4 w-4 text-primary" />
                      Owns / Comfortable with Pets
                    </label>
                  </div>

                  <div className="flex items-center space-x-3 bg-muted/20 p-4 rounded-xl border border-border/40">
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
      <Footer />
    </div>
  );
}
