"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Badge } from "@/components/ui/Badge";
import { useToast } from "@/components/ui/Toast";
import {
  User,
  Sprout,
  Sliders,
  Bell,
  Shield,
  LogOut,
  CheckCircle2,
} from "lucide-react";

export default function SettingsPage() {
  const router = useRouter();
  const { user, signOut } = useAuth();
  const { success, error: toastError } = useToast();

  const [activeTab, setActiveTab] = useState<
    "profile" | "farm" | "preferences" | "notifications" | "security"
  >("profile");

  // Profile fields
  const [name, setName] = useState(user?.name || "");
  const [email] = useState(user?.email || "");
  const [phone, setPhone] = useState(user?.phone_number || "");
  const [language, setLanguage] = useState(user?.preferred_language || "English");

  // Preferences
  const [unitSystem, setUnitSystem] = useState("metric");
  const [refreshInterval, setRefreshInterval] = useState("30");

  // Notifications
  const [rainAlerts, setRainAlerts] = useState(true);
  const [sprayAlerts, setSprayAlerts] = useState(true);

  // Security
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    success("Profile preferences updated.");
  };

  const handleLogout = async () => {
    await signOut();
    router.replace("/login");
  };

  const navItems = [
    { key: "profile", label: "Profile", icon: User },
    { key: "farm", label: "Farm", icon: Sprout },
    { key: "preferences", label: "Preferences", icon: Sliders },
    { key: "notifications", label: "Notifications", icon: Bell },
    { key: "security", label: "Security", icon: Shield },
  ];

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-neutral-900 tracking-tight">
          Settings
        </h1>
        <p className="text-xs text-neutral-500 mt-0.5">
          Manage your personal profile, unit preferences, and security.
        </p>
      </div>

      {/* Settings Navigation Tabs */}
      <div className="flex items-center gap-1 overflow-x-auto border-b border-neutral-200 pb-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.key;
          return (
            <button
              key={item.key}
              onClick={() => setActiveTab(item.key as any)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                isActive
                  ? "bg-primary-50 text-primary-700 font-semibold"
                  : "text-neutral-500 hover:text-neutral-800 hover:bg-neutral-100"
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{item.label}</span>
            </button>
          );
        })}
      </div>

      {/* 1. Profile Section */}
      {activeTab === "profile" && (
        <Card className="p-6 shadow-card space-y-4">
          <div>
            <h2 className="text-sm font-semibold text-neutral-900">
              Personal Information
            </h2>
            <p className="text-xs text-neutral-500 mt-0.5">
              Your identity and contact preferences across Agrimind.
            </p>
          </div>

          <form onSubmit={handleSaveProfile} className="space-y-4">
            <Input
              label="Full Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Surya Sharma"
            />

            <Input
              label="Email Address"
              value={email}
              disabled
              helperText="Managed by account authentication."
            />

            <Input
              label="Phone Number (SMS Advisories)"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+91 98765 43210"
            />

            <Select
              label="Interface Language"
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
            >
              <option value="English">English</option>
              <option value="Hindi">Hindi (हिंदी)</option>
              <option value="Punjabi">Punjabi (ਪੰਜਾਬੀ)</option>
              <option value="Tamil">Tamil (தமிழ்)</option>
              <option value="Telugu">Telugu (తెలుగు)</option>
            </Select>

            <div className="pt-2">
              <Button type="submit" size="sm">
                Save Profile
              </Button>
            </div>
          </form>
        </Card>
      )}

      {/* 2. Farm Section Shortcut */}
      {activeTab === "farm" && (
        <Card className="p-6 shadow-card space-y-4">
          <div>
            <h2 className="text-sm font-semibold text-neutral-900">
              Farm Configuration
            </h2>
            <p className="text-xs text-neutral-500 mt-0.5">
              Soil, geographic location, coordinates, and irrigation setups.
            </p>
          </div>

          <p className="text-xs text-neutral-600 leading-relaxed">
            Your farm parameters are configured in the dedicated Farm workspace. Click below to view or edit acreage, coordinates, and NPK values.
          </p>

          <Link href="/farm">
            <Button size="sm">Open Farm Settings</Button>
          </Link>
        </Card>
      )}

      {/* 3. Preferences Section */}
      {activeTab === "preferences" && (
        <Card className="p-6 shadow-card space-y-4">
          <div>
            <h2 className="text-sm font-semibold text-neutral-900">
              Application Preferences
            </h2>
            <p className="text-xs text-neutral-500 mt-0.5">
              Display units and data telemetry refresh intervals.
            </p>
          </div>

          <div className="space-y-4">
            <Select
              label="Measurement Units"
              value={unitSystem}
              onChange={(e) => setUnitSystem(e.target.value)}
            >
              <option value="metric">Metric (Celsius, kg/ha, mm)</option>
              <option value="imperial">Imperial (Fahrenheit, lbs/acre, inches)</option>
            </Select>

            <Select
              label="Weather Auto-Refresh Interval"
              value={refreshInterval}
              onChange={(e) => setRefreshInterval(e.target.value)}
            >
              <option value="15">Every 15 minutes</option>
              <option value="30">Every 30 minutes (Standard)</option>
              <option value="60">Every 1 hour</option>
            </Select>

            <Button size="sm" onClick={() => success("Preferences saved.")}>
              Save Preferences
            </Button>
          </div>
        </Card>
      )}

      {/* 4. Notifications Section */}
      {activeTab === "notifications" && (
        <Card className="p-6 shadow-card space-y-4">
          <div>
            <h2 className="text-sm font-semibold text-neutral-900">
              Advisory Notifications
            </h2>
            <p className="text-xs text-neutral-500 mt-0.5">
              Control when Agrimind alerts you about weather and field risks.
            </p>
          </div>

          <div className="space-y-3">
            <label className="flex items-center justify-between p-3 rounded-lg border border-neutral-200 cursor-pointer hover:bg-neutral-50">
              <div>
                <span className="text-xs font-semibold text-neutral-800 block">
                  Rain & Frost Warnings
                </span>
                <span className="text-[11px] text-neutral-500">
                  Notify when rainfall probability exceeds 60% within 24 hours.
                </span>
              </div>
              <input
                type="checkbox"
                checked={rainAlerts}
                onChange={(e) => setRainAlerts(e.target.checked)}
                className="w-4 h-4 rounded text-primary-600 focus:ring-primary-600"
              />
            </label>

            <label className="flex items-center justify-between p-3 rounded-lg border border-neutral-200 cursor-pointer hover:bg-neutral-50">
              <div>
                <span className="text-xs font-semibold text-neutral-800 block">
                  High Wind Drift Alerts
                </span>
                <span className="text-[11px] text-neutral-500">
                  Alert when wind speed exceeds 20 km/h prior to scheduled spraying.
                </span>
              </div>
              <input
                type="checkbox"
                checked={sprayAlerts}
                onChange={(e) => setSprayAlerts(e.target.checked)}
                className="w-4 h-4 rounded text-primary-600 focus:ring-primary-600"
              />
            </label>
          </div>

          <Button size="sm" onClick={() => success("Notification rules updated.")}>
            Save Notifications
          </Button>
        </Card>
      )}

      {/* 5. Security Section */}
      {activeTab === "security" && (
        <Card className="p-6 shadow-card space-y-4">
          <div>
            <h2 className="text-sm font-semibold text-neutral-900">
              Security & Credentials
            </h2>
            <p className="text-xs text-neutral-500 mt-0.5">
              Update password and review active local authentication token.
            </p>
          </div>

          <div className="space-y-4">
            <Input
              label="Current Password"
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="••••••••"
            />
            <Input
              label="New Password"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="At least 6 characters"
            />
            <Button
              size="sm"
              onClick={() => {
                success("Password updated.");
                setCurrentPassword("");
                setNewPassword("");
              }}
            >
              Update Password
            </Button>
          </div>
        </Card>
      )}

      {/* Section 6: Logout */}
      <Card className="p-6 shadow-card flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-neutral-900">
            Sign out of Agrimind
          </h3>
          <p className="text-xs text-neutral-500 mt-0.5">
            End active session on this device.
          </p>
        </div>

        <Button
          variant="destructive"
          size="sm"
          onClick={handleLogout}
          leftIcon={<LogOut className="w-3.5 h-3.5" />}
        >
          Sign Out
        </Button>
      </Card>
    </div>
  );
}
