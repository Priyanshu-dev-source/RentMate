import Link from "next/link";
import { MapPin, Users, ArrowRight, MoreHorizontal, Check, Edit, Trash2 } from "lucide-react";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export interface ListingCardProps {
  id: string | number;
  title: string;
  price: number;
  location: string;
  type: string;
  imageUrl?: string;
  matchScore?: number;
  status?: "Active" | "Draft" | "Filled";
  views?: number;
  inquiries?: number;
  role?: "owner" | "tenant";
  onDelete?: (id: string | number) => void;
  onMarkFilled?: (id: string | number) => void;
}

export function ListingCard({
  id,
  title,
  price,
  location,
  type,
  imageUrl = "/images/hero.png",
  matchScore,
  status = "Active",
  views = 0,
  inquiries = 0,
  role = "tenant",
  onDelete,
  onMarkFilled,
}: ListingCardProps) {
  return (
    <Card className="overflow-hidden group hover:shadow-xl hover:border-primary/30 transition-all duration-300">
      {/* Image Container */}
      <div className="relative aspect-[4/3] overflow-hidden bg-muted">
        <img
          src={imageUrl}
          alt={title}
          className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-500"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent pointer-events-none" />
        
        {/* Top Badges */}
        <div className="absolute top-3 left-3 right-3 flex justify-between items-start">
          <Badge variant="secondary" className="bg-background/90 backdrop-blur-sm shadow-sm font-medium">
            {type}
          </Badge>
          
          {role === "owner" && (
            <Badge 
              variant={status === "Active" ? "default" : status === "Filled" ? "secondary" : "outline"} 
              className="shadow-sm"
            >
              {status}
            </Badge>
          )}
          
          {role === "tenant" && matchScore && (
            <Badge variant="outline" className="bg-emerald-500/90 text-white border-none shadow-sm backdrop-blur-sm">
              {matchScore}% Match
            </Badge>
          )}
        </div>

        {/* Bottom Image Info */}
        <div className="absolute bottom-3 left-3 right-3">
          <h3 className="text-white font-semibold text-lg line-clamp-1">{title}</h3>
          <div className="flex items-center text-white/80 text-xs mt-1">
            <MapPin className="h-3 w-3 mr-1" />
            {location}
          </div>
        </div>
      </div>

      <CardContent className="p-4">
        <div className="flex justify-between items-end">
          <div>
            <div className="text-2xl font-bold text-primary">
              ${price.toLocaleString()}
              <span className="text-sm font-normal text-muted-foreground">/mo</span>
            </div>
          </div>
          
          {role === "owner" && (
            <div className="flex gap-3 text-xs text-muted-foreground text-right">
              <div>
                <strong className="block text-foreground">{views}</strong>
                views
              </div>
              <div>
                <strong className="block text-foreground">{inquiries}</strong>
                inquiries
              </div>
            </div>
          )}
        </div>
      </CardContent>

      <CardFooter className="p-4 pt-0 border-t border-border/50 flex justify-between items-center bg-muted/20">
        {role === "owner" ? (
          <>
            <Button variant="outline" size="sm" className="w-full mr-2" render={<Link href={`/dashboard/owner/listings/${id}/edit`} />}>
              <Edit className="h-4 w-4 mr-2" /> Edit
            </Button>
            
            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <Button variant="ghost" size="icon" className="h-9 w-9 shrink-0">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                }
              />
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuLabel>Listing Actions</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem render={<Link href={`/listing/${id}`} />}>
                  <ArrowRight className="h-4 w-4 mr-2" /> View Listing
                </DropdownMenuItem>
                <DropdownMenuItem render={<Link href={`/dashboard/owner/interests?listing=${id}`} />}>
                  <Users className="h-4 w-4 mr-2" /> View Interested
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                {status !== "Filled" && (
                  <DropdownMenuItem onClick={() => onMarkFilled?.(id)}>
                    <Check className="h-4 w-4 mr-2" /> Mark as Filled
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem onClick={() => onDelete?.(id)} className="text-destructive focus:text-destructive">
                  <Trash2 className="h-4 w-4 mr-2" /> Delete Listing
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </>
        ) : (
          <Button className="w-full group-hover:bg-primary/90 transition-colors" render={<Link href={`/listing/${id}`} />}>
            View Details <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}
