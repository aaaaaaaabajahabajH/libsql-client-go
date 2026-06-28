import type { Metadata } from "next";
import { Bell, Lock, Palette, Globe } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

export const metadata: Metadata = {
  title: "Settings",
  description: "Manage your account settings and preferences.",
};

export default function SettingsPage() {
  return (
    <div className="space-y-6 max-w-2xl animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground mt-1">
          Manage your preferences and account configuration.
        </p>
      </div>

      {/* Notifications */}
      <Card className="border-border/50">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Bell className="h-4 w-4 text-muted-foreground" />
            <CardTitle className="text-base">Notifications</CardTitle>
          </div>
          <CardDescription>
            Choose how and when you receive notifications.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {[
            {
              id: "email-updates",
              label: "Email Updates",
              desc: "Receive product news and feature announcements",
              default: true,
            },
            {
              id: "credit-alerts",
              label: "Credit Alerts",
              desc: "Notify me when credits fall below 100",
              default: true,
            },
            {
              id: "weekly-report",
              label: "Weekly Report",
              desc: "Weekly summary of your AI tool usage",
              default: false,
            },
            {
              id: "marketing",
              label: "Marketing Emails",
              desc: "Promotions, tips, and special offers",
              default: false,
            },
          ].map((item, i, arr) => (
            <div key={item.id}>
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor={item.id} className="font-medium text-sm cursor-pointer">
                    {item.label}
                  </Label>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {item.desc}
                  </p>
                </div>
                <Switch id={item.id} defaultChecked={item.default} />
              </div>
              {i < arr.length - 1 && <Separator className="mt-4" />}
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Appearance */}
      <Card className="border-border/50">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Palette className="h-4 w-4 text-muted-foreground" />
            <CardTitle className="text-base">Appearance</CardTitle>
          </div>
          <CardDescription>Customize the look and feel.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label className="font-medium text-sm">Dark Mode</Label>
              <p className="text-xs text-muted-foreground mt-0.5">
                Switch between light and dark theme
              </p>
            </div>
            <Switch id="dark-mode" />
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div>
              <Label className="font-medium text-sm">Compact View</Label>
              <p className="text-xs text-muted-foreground mt-0.5">
                Show more content with reduced spacing
              </p>
            </div>
            <Switch id="compact-view" />
          </div>
        </CardContent>
      </Card>

      {/* Language & Region */}
      <Card className="border-border/50">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Globe className="h-4 w-4 text-muted-foreground" />
            <CardTitle className="text-base">Language & Region</CardTitle>
          </div>
          <CardDescription>
            Set your preferred language and timezone.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Language and region settings coming soon.
          </p>
        </CardContent>
      </Card>

      {/* Security */}
      <Card className="border-border/50">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Lock className="h-4 w-4 text-muted-foreground" />
            <CardTitle className="text-base">Security</CardTitle>
          </div>
          <CardDescription>
            Manage your password and account security.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <Button variant="outline" size="sm">
            Change Password
          </Button>
          <div className="flex items-center justify-between">
            <div>
              <Label className="font-medium text-sm">Two-Factor Authentication</Label>
              <p className="text-xs text-muted-foreground mt-0.5">
                Add an extra layer of security to your account
              </p>
            </div>
            <Switch id="2fa" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
