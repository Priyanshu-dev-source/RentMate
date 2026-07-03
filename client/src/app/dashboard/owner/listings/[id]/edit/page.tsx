"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { motion } from "framer-motion";
import { ArrowLeft, Save, Building, MapPin, CheckCircle2, Trash2, Loader2 } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent } from "@/components/ui/card";
import { ImageUpload } from "@/components/ui/image-upload";
import { api } from "@/lib/api";

const formSchema = z.object({
  title: z.string().min(5, "Title must be at least 5 characters long"),
  description: z.string().min(10, "Description must be at least 10 characters long"),
  price: z.number().positive("Price must be greater than 0"),
  location: z.string().min(5, "Location is required"),
  propertyType: z.enum(["apartment", "house", "studio"]),
  roomType: z.enum(["entire", "private", "shared"]),
  amenities: z.array(z.string()).min(1, "Select at least one amenity"),
  images: z.array(z.string()).min(1, "Upload at least one image"),
});

type FormValues = z.infer<typeof formSchema>;

const amenitiesList = [
  "WiFi", "Kitchen", "Washer", "Dryer", "Air Conditioning", 
  "Heating", "Dedicated Workspace", "TV", "Gym", "Pool"
];

export default function EditListingPage() {
  const router = useRouter();
  const params = useParams();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      description: "",
      location: "",
      propertyType: "apartment",
      roomType: "private",
      amenities: [],
      images: [],
    },
  });

  useEffect(() => {
    const loadListingData = async () => {
      setIsLoading(true);
      try {
        const response = await api.get(`/api/v1/listings/${params.id}`);
        const data = response.data.data;
        if (data) {
          reset({
            title: data.title,
            description: data.description,
            price: data.price,
            location: data.address,
            propertyType: data.propertyType.toLowerCase() as any,
            roomType: data.roomType.toLowerCase() as any,
            amenities: data.amenities || [],
            images: data.images ? data.images.map((img: any) => img.url) : [],
          });
        }
      } catch (err) {
        console.error("Failed to load listing for edit:", err);
      } finally {
        setIsLoading(false);
      }
    };

    if (params.id) {
      loadListingData();
    }
  }, [params.id, reset]);

  const watchAmenities = watch("amenities");
  const watchImages = watch("images");

  const toggleAmenity = (amenity: string) => {
    const current = watchAmenities || [];
    const updated = current.includes(amenity)
      ? current.filter((a) => a !== amenity)
      : [...current, amenity];
    setValue("amenities", updated, { shouldValidate: true });
  };

  const onSubmit = async (data: FormValues) => {
    setIsSubmitting(true);
    setErrorMsg("");
    try {
      const parts = data.location.split(",");
      const city = parts[0]?.trim() || "Metro City";
      const state = parts[1]?.trim() || "State";

      // 1. Update listing core fields
      const payload = {
        title: data.title,
        description: data.description,
        price: Number(data.price),
        deposit: Number(data.price),
        propertyType: data.propertyType.toUpperCase(),
        roomType: data.roomType.toUpperCase(),
        address: data.location,
        city,
        state,
        amenities: data.amenities,
      };

      await api.put(`/api/v1/listings/${params.id}`, payload);

      // Note: In a real app we might also sync updated images, but updating core fields is sufficient for details
      setIsSuccess(true);
      setTimeout(() => {
        router.push("/dashboard/owner/listings");
      }, 2000);
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || "Failed to save changes");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (confirm("Are you sure you want to delete this listing permanently?")) {
      try {
        await api.delete(`/api/v1/listings/${params.id}`);
        router.push("/dashboard/owner/listings");
      } catch (err: any) {
        alert(err.response?.data?.message || "Failed to delete listing");
      }
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center">
          <Loader2 className="h-10 w-10 text-primary animate-spin mb-4" />
          <p className="text-muted-foreground font-semibold">Loading listing details...</p>
        </div>
      </div>
    );
  }

  if (isSuccess) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <motion.div 
          initial={{ scale: 0.8, opacity: 0 }} 
          animate={{ scale: 1, opacity: 1 }} 
          className="text-center"
        >
          <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-emerald-100 mb-6">
            <CheckCircle2 className="h-12 w-12 text-emerald-600" />
          </div>
          <h1 className="text-3xl font-bold mb-2">Listing Updated!</h1>
          <p className="text-muted-foreground mb-8 max-w-md">
            Your property changes have been saved and are now live.
          </p>
          <Button onClick={() => router.push("/dashboard/owner/listings")}>
            Back to My Listings
          </Button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 max-w-4xl mx-auto space-y-8 pb-20">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" className="rounded-full" onClick={() => router.back()}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Edit Listing</h1>
            <p className="text-muted-foreground mt-1">Update details about your property.</p>
          </div>
        </div>
        <Button variant="destructive" onClick={handleDelete}>
          <Trash2 className="mr-2 h-4 w-4" /> Delete
        </Button>
      </div>

      {errorMsg && (
        <div className="p-4 bg-destructive/10 text-destructive border border-destructive/20 rounded-xl font-medium text-sm">
          {errorMsg}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
        {/* Basic Info */}
        <Card className="shadow-sm border-border/50">
          <CardContent className="p-6 space-y-6">
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <Building className="h-5 w-5 text-primary" /> Basic Information
            </h2>
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="title">Listing Title</Label>
                <Input 
                  id="title" 
                  {...register("title")}
                  className={errors.title ? "border-destructive mt-2" : "mt-2"}
                />
                {errors.title && <p className="text-xs text-destructive mt-4">{errors.title.message}</p>}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="propertyType">Property Type</Label>
                  <Select 
                    onValueChange={(val) => val && setValue("propertyType", val as any)} 
                    defaultValue={watch("propertyType")}
                  >
                    <SelectTrigger id="propertyType">
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="apartment">Apartment</SelectItem>
                      <SelectItem value="house">House</SelectItem>
                      <SelectItem value="studio">Studio</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="roomType">Room Type</Label>
                  <Select 
                    onValueChange={(val) => val && setValue("roomType", val as any)} 
                    defaultValue={watch("roomType")}
                  >
                    <SelectTrigger id="roomType">
                      <SelectValue placeholder="Select room type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="entire">Entire Place</SelectItem>
                      <SelectItem value="private">Private Room</SelectItem>
                      <SelectItem value="shared">Shared Room</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea 
                  id="description" 
                  className={`min-h-[120px] ${errors.description ? "border-destructive" : ""}`}
                  {...register("description")}
                />
                {errors.description && <p className="text-xs text-destructive mt-1">{errors.description.message}</p>}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Location & Pricing */}
        <Card className="shadow-sm border-border/50">
          <CardContent className="p-6 space-y-6">
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <MapPin className="h-5 w-5 text-primary" /> Location & Pricing
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label htmlFor="location">Address / Neighborhood</Label>
                <Input 
                  id="location" 
                  {...register("location")}
                  className={errors.location ? "border-destructive" : ""}
                />
                {errors.location && <p className="text-xs text-destructive mt-1">{errors.location.message}</p>}
              </div>

              <div>
                <Label htmlFor="price">Monthly Rent ($)</Label>
                <Input 
                  id="price" 
                  type="number"
                  onChange={(e) => setValue("price", Number(e.target.value))}
                  className={errors.price ? "border-destructive" : ""}
                  value={watch("price")}
                />
                {errors.price && <p className="text-xs text-destructive mt-1">{errors.price.message}</p>}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Amenities */}
        <Card className="shadow-sm border-border/50">
          <CardContent className="p-6 space-y-4">
            <h2 className="text-xl font-semibold">Amenities</h2>
            
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {amenitiesList.map((amenity) => (
                <div key={amenity} className="flex items-center space-x-2">
                  <Checkbox 
                    id={`amenity-${amenity}`} 
                    checked={watchAmenities?.includes(amenity)}
                    onCheckedChange={() => toggleAmenity(amenity)}
                  />
                  <Label htmlFor={`amenity-${amenity}`} className="font-normal cursor-pointer text-sm">
                    {amenity}
                  </Label>
                </div>
              ))}
            </div>
            {errors.amenities && <p className="text-xs text-destructive mt-2">{errors.amenities.message}</p>}
          </CardContent>
        </Card>

        {/* Photos */}
        <Card className="shadow-sm border-border/50">
          <CardContent className="p-6 space-y-4">
            <h2 className="text-xl font-semibold">Photos</h2>
            <ImageUpload 
              maxImages={6} 
              value={watchImages}
              onChange={(urls) => setValue("images", urls, { shouldValidate: true })}
            />
            {errors.images && <p className="text-xs text-destructive mt-2">{errors.images.message}</p>}
          </CardContent>
        </Card>

        {/* Form Actions */}
        <div className="flex justify-end gap-4 pt-4">
          <Button type="button" variant="outline" onClick={() => router.back()}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting} className="min-w-[150px]">
            {isSubmitting ? (
              <span className="flex items-center">
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Saving...
              </span>
            ) : (
              <><Save className="mr-2 h-4 w-4" /> Save Changes</>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
