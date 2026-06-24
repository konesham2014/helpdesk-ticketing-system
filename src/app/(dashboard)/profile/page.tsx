"use client";

import { useSession } from "next-auth/react";
import {
  User,
  Mail,
  Shield,
  Calendar,
  Ticket,
  CheckCircle2,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { getInitials } from "@/lib/utils";

export default function ProfilePage() {
  const { data: session } = useSession();

  if (!session?.user) {
    return null;
  }

  const user = session.user;

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Profile</h1>
        <p className="text-muted-foreground mt-1">
          Your account information and settings
        </p>
      </div>

      <Card className="border-0 shadow-sm">
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <Avatar className="w-20 h-20">
              <AvatarFallback className="bg-primary/10 text-primary text-2xl font-bold">
                {getInitials(user.name || "U")}
              </AvatarFallback>
            </Avatar>
            <div>
              <h2 className="text-xl font-bold">{user.name}</h2>
              <p className="text-muted-foreground">{user.email}</p>
              <div className="flex items-center gap-2 mt-2">
                {user.role === "ADMIN" && (
                  <Badge className="bg-amber-100 text-amber-700">
                    <Shield className="w-3 h-3 mr-1" />
                    Administrator
                  </Badge>
                )}
                {user.role === "AGENT" && (
                  <Badge className="bg-blue-100 text-blue-700">
                    <User className="w-3 h-3 mr-1" />
                    Support Agent
                  </Badge>
                )}
                {user.role === "CUSTOMER" && (
                  <Badge variant="outline">Customer</Badge>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-0 shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg">Account Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-3">
            <Mail className="w-4 h-4 text-muted-foreground" />
            <div>
              <p className="text-xs text-muted-foreground">Email Address</p>
              <p className="text-sm font-medium">{user.email}</p>
            </div>
          </div>
          <Separator />
          <div className="flex items-center gap-3">
            <Shield className="w-4 h-4 text-muted-foreground" />
            <div>
              <p className="text-xs text-muted-foreground">Role</p>
              <p className="text-sm font-medium capitalize">{user.role.toLowerCase()}</p>
            </div>
          </div>
          <Separator />
          <div className="flex items-center gap-3">
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            <div>
              <p className="text-xs text-muted-foreground">Account Status</p>
              <p className="text-sm font-medium text-emerald-600">Active</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
