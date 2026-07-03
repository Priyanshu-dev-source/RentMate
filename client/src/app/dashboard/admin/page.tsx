"use client";

import { motion } from "framer-motion";
import { 
  Users, 
  Home, 
  Activity, 
  AlertTriangle,
  TrendingUp,
  ShieldCheck,
  CheckCircle,
  XCircle
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const stats = [
  { name: "Total Users", value: "12,450", icon: Users, change: "+12% this month", changeType: "positive" },
  { name: "Active Listings", value: "3,842", icon: Home, change: "+5% this week", changeType: "positive" },
  { name: "Avg Match Rate", value: "84%", icon: Activity, change: "+2% from last month", changeType: "positive" },
  { name: "Reports/Flags", value: "12", icon: AlertTriangle, change: "-4 pending resolution", changeType: "negative" },
];

const recentUsers = [
  { id: 1, name: "David Kim", email: "david.k@example.com", role: "Tenant", status: "Active", joined: "Today" },
  { id: 2, name: "Sarah Jenkins", email: "s.jenkins@example.com", role: "Owner", status: "Pending", joined: "Yesterday" },
  { id: 3, name: "Marcus Johnson", email: "marcus.j@example.com", role: "Tenant", status: "Active", joined: "2 days ago" },
  { id: 4, name: "Elena Rodriguez", email: "elena.r@example.com", role: "Owner", status: "Suspended", joined: "1 week ago" },
];

const recentListings = [
  { id: 1, title: "Luxury Penthouse", owner: "Sarah Jenkins", status: "Under Review", date: "Today" },
  { id: 2, title: "Cozy Studio in Brooklyn", owner: "Mike Tyson", status: "Active", date: "Yesterday" },
  { id: 3, title: "Shared Room - Downtown", owner: "Alex Smith", status: "Reported", date: "2 days ago" },
];

export default function AdminDashboard() {
  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Admin Overview</h1>
          <p className="text-muted-foreground mt-1">Monitor platform health, users, and listings.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="shadow-sm">
            Generate Report
          </Button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat, i) => (
          <motion.div
            key={stat.name}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: i * 0.1 }}
          >
            <Card className="p-4">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {stat.name}
                </CardTitle>
                <stat.icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                <p className="text-xs text-muted-foreground mt-1 flex items-center">
                  {stat.changeType === "positive" && <TrendingUp className="h-3 w-3 mr-1 text-emerald-500" />}
                  {stat.change}
                </p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Recent Users Table */}
        <Card className="shadow-sm border-border/50">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div>
              <CardTitle>Recent Users</CardTitle>
              <CardDescription>Latest sign-ups across the platform.</CardDescription>
            </div>
            <Button variant="ghost" size="sm">View All</Button>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentUsers.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-medium text-sm">{user.name}</div>
                          <div className="text-xs text-muted-foreground">{user.email}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-xs font-normal">
                        {user.role}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge 
                        variant={user.status === "Active" ? "default" : user.status === "Pending" ? "secondary" : "destructive"} 
                        className="text-[10px]"
                      >
                        {user.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" className="h-8">Review</Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Listing Overview */}
        <Card className="shadow-sm border-border/50">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div>
              <CardTitle>Listing Moderation</CardTitle>
              <CardDescription>Listings requiring attention or review.</CardDescription>
            </div>
            <Button variant="ghost" size="sm">View All</Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 pt-2">
              {recentListings.map((listing) => (
                <div key={listing.id} className="flex items-center justify-between p-3 rounded-lg border border-border/50 bg-card hover:bg-muted/50 transition-colors">
                  <div className="space-y-1">
                    <p className="text-sm font-semibold flex items-center gap-2">
                      {listing.title}
                      {listing.status === "Reported" && <AlertTriangle className="h-3 w-3 text-destructive" />}
                    </p>
                    <p className="text-xs text-muted-foreground">Owner: {listing.owner} &bull; {listing.date}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="icon" className="h-7 w-7 text-emerald-500 hover:text-emerald-600 hover:bg-emerald-50">
                      <CheckCircle className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="icon" className="h-7 w-7 text-destructive hover:text-destructive hover:bg-destructive/10">
                      <XCircle className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Analytics Placeholder */}
      <Card className="shadow-sm border-border/50 overflow-hidden">
        <CardHeader>
          <CardTitle>Platform Growth</CardTitle>
          <CardDescription>User registrations vs Listings created over the last 30 days.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-64 w-full bg-muted/30 rounded-xl flex items-center justify-center border border-dashed border-border/60">
            <div className="flex flex-col items-center text-muted-foreground">
              <Activity className="h-8 w-8 mb-2 opacity-50" />
              <p className="text-sm font-medium">Chart visualization placeholder</p>
              <p className="text-xs opacity-70">Will be integrated with Recharts in Phase 7</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
