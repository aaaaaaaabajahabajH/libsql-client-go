import type { Metadata } from "next";
import { Camera, Mail, User, Building, Globe } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

export const metadata: Metadata = {
  title: "Profile",
  description: "Manage your profile and account details.",
};

export default function ProfilePage() {
  return (
    <div className="space-y-6 max-w-2xl animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Profile</h1>
        <p className="text-muted-foreground mt-1">
          Manage your personal information and account settings.
        </p>
      </div>

      {/* Avatar */}
      <Card className="border-border/50">
        <CardHeader>
          <CardTitle className="text-base">Profile Photo</CardTitle>
          <CardDescription>
            Your photo will be displayed across the platform.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-6">
            <div className="relative">
              <Avatar className="h-20 w-20">
                <AvatarFallback className="bg-primary/10 text-primary text-xl font-semibold">
                  JS
                </AvatarFallback>
              </Avatar>
              <button className="absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full border-2 border-background bg-primary text-primary-foreground hover:bg-primary/90 transition-colors">
                <Camera className="h-3.5 w-3.5" />
              </button>
            </div>
            <div>
              <p className="font-medium text-sm">Jane Smith</p>
              <p className="text-xs text-muted-foreground">jane@company.com</p>
              <Badge variant="secondary" className="mt-2 text-xs">
                Pro Plan
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Personal Info */}
      <Card className="border-border/50">
        <CardHeader>
          <CardTitle className="text-base">Personal Information</CardTitle>
          <CardDescription>Update your name and contact details.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="firstName">First Name</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input id="firstName" defaultValue="Jane" className="pl-9" />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName">Last Name</Label>
              <Input id="lastName" defaultValue="Smith" />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email Address</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="email"
                type="email"
                defaultValue="jane@company.com"
                className="pl-9"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="company">Company</Label>
              <div className="relative">
                <Building className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="company"
                  placeholder="Your company"
                  defaultValue="TechFlow"
                  className="pl-9"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="website">Website</Label>
              <div className="relative">
                <Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="website"
                  placeholder="https://yoursite.com"
                  className="pl-9"
                />
              </div>
            </div>
          </div>

          <div className="pt-2">
            <Button>Save Changes</Button>
          </div>
        </CardContent>
      </Card>

      {/* Danger Zone */}
      <Card className="border-destructive/30">
        <CardHeader>
          <CardTitle className="text-base text-destructive">Danger Zone</CardTitle>
          <CardDescription>
            Permanently delete your account and all associated data.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Separator className="mb-4" />
          <Button variant="destructive" size="sm">
            Delete Account
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
