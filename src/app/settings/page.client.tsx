
"use client";

import React, { useState, useEffect } from "react";
import {
  Bell,
  Lock,
  User,
  MapPin,
  Gift,
  Ticket,
  Crown,
  Copy,
  Mail,
} from "lucide-react";
import { useAuth } from "~/lib/hooks/usrAuth";
import {
  loyaltyService,
  MembershipTier,
  // DiscountType,
  type CRM,
  type Coupon,
  type CouponPackage,
  type LoyaltyReward,
} from "~/service/loyalty";

import { Button } from "~/ui/primitives/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/ui/primitives/card";
import { Input } from "~/ui/primitives/input";
import { Label } from "~/ui/primitives/label";
import { Switch } from "~/ui/primitives/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/ui/primitives/tabs";
import { Progress } from "~/ui/primitives/progress";
import { Badge } from "~/ui/primitives/badge";
// import { Textarea } from "~/ui/primitives/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/ui/primitives/select";

// Mock Address Service (replace with real service later)
interface Address {
  id: string;
  type: "SHIPPING" | "BILLING";
  firstName: string;
  lastName: string;
  address1: string;
  address2?: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  isDefault: boolean;
}

const mockAddresses: Address[] = [
  {
    id: "1",
    type: "SHIPPING",
    firstName: "John",
    lastName: "Doe",
    address1: "123 Main St",
    address2: "Apt 4B",
    city: "New York",
    state: "NY",
    zipCode: "10001",
    country: "USA",
    isDefault: true,
  },
];

export function SettingsPageClient() {
  const { user } = useAuth();

  // State management
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  // Loyalty states
  const [loyaltyData, setLoyaltyData] = useState<CRM | null>(null);
  const [userCoupons, setUserCoupons] = useState<Coupon[]>([]);
  const [availablePackages, setAvailablePackages] = useState<CouponPackage[]>(
    []
  );
  const [availableRewards, setAvailableRewards] = useState<LoyaltyReward[]>([]);

  // Address states
  const [addresses, setAddresses] = useState<Address[]>(mockAddresses);
  const [editingAddress, setEditingAddress] = useState<Address | null>(null);
  const [showAddressForm, setShowAddressForm] = useState(false);

  // Profile states
  const [profileData, setProfileData] = useState({
    firstName: user?.username?.split(" ")[0] || "",
    lastName: user?.username?.split(" ")[1] || "",
    email: user?.email || "",
    phone: "",
    dateOfBirth: "",
    timezone: "UTC",
    language: "en",
    currency: "USD",
  });

  console.log("i m user"+user+ "my name "+ user?.username);

  // Load loyalty data
  useEffect(() => {
    if (user?.id) {
      loadLoyaltyData();
    }
  }, [user?.id]);

  const loadLoyaltyData = async () => {
    if (!user?.id) return;

    try {
      setLoading(true);
      const [crm, coupons, packages, rewards] = await Promise.all([
        loyaltyService.getCRMByUserId(user.id).catch(() => null),
        loyaltyService.getUserCoupons(user.id).catch(() => []),
        loyaltyService.getAllCouponPackages().catch(() => []),
        loyaltyService.getActiveRewards(user.id).catch(() => []),
      ]);

      setLoyaltyData(crm);
      setUserCoupons(coupons);
      setAvailablePackages(packages);
      setAvailableRewards(rewards);
    } catch (err) {
      console.error("Error loading loyalty data:", err);
    } finally {
      setLoading(false);
    }
  };

  const handlePurchaseCouponPackage = async (packageType: string) => {
    if (!user?.id) return;

    try {
      setLoading(true);
      const coupon = await loyaltyService.purchaseCouponPackage(
        user.id,
        packageType
      );
      setMessage(`Coupon purchased successfully! Code: ${coupon.code}`);
      loadLoyaltyData(); // Refresh data
    } catch (err) {
      setError("Failed to purchase coupon. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setMessage("Coupon code copied to clipboard!");
    setTimeout(() => setMessage(""), 3000);
  };

  const getTierColor = (tier: MembershipTier) => {
    return loyaltyService.getTierColor(tier);
  };

  const calculateProgress = () => {
    if (!loyaltyData) return 0;
    return loyaltyService.calculateTierProgress(
      loyaltyData.totalPoints,
      loyaltyData.membershipLevel
    );
  };

  const validCoupons = loyaltyService.filterValidCoupons(userCoupons);
  const expiredCoupons = loyaltyService.filterExpiredCoupons(userCoupons);
  const usedCoupons = loyaltyService.filterUsedCoupons(userCoupons);

  return (
    <div className="container space-y-6 p-4 md:p-8">
      <div className="space-y-0.5">
        <h2 className="text-2xl font-bold tracking-tight">Settings</h2>
        <p className="text-muted-foreground">
          Manage your account settings and preferences.
        </p>
      </div>

      {/* Messages */}
      {message && (
        <div className="rounded-md bg-green-50 p-4 text-sm text-green-700 border border-green-200">
          {message}
        </div>
      )}

      {error && (
        <div className="rounded-md bg-red-50 p-4 text-sm text-red-700 border border-red-200">
          {error}
        </div>
      )}

      <Tabs className="space-y-4" defaultValue="profile">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger className="flex items-center gap-2" value="profile">
            <User className="h-4 w-4" />
            Profile
          </TabsTrigger>
          <TabsTrigger className="flex items-center gap-2" value="loyalty">
            <Crown className="h-4 w-4" />
            Loyalty
          </TabsTrigger>
          <TabsTrigger className="flex items-center gap-2" value="addresses">
            <MapPin className="h-4 w-4" />
            Addresses
          </TabsTrigger>
          <TabsTrigger
            className="flex items-center gap-2"
            value="notifications"
          >
            <Bell className="h-4 w-4" />
            Notifications
          </TabsTrigger>
          <TabsTrigger className="flex items-center gap-2" value="security">
            <Lock className="h-4 w-4" />
            Security
          </TabsTrigger>
        </TabsList>

        {/* Enhanced Profile Tab */}
        <TabsContent className="space-y-6" value="profile">
          {/* Account Summary Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Account Summary
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <h3 className="font-semibold text-blue-900">Member Since</h3>
                  <p className="text-2xl font-bold text-blue-600">
                    {loyaltyData
                      ? new Date(loyaltyData.joinDate).getFullYear()
                      : new Date().getFullYear()}
                  </p>
                </div>
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <h3 className="font-semibold text-green-900">
                    Loyalty Points
                  </h3>
                  <p className="text-2xl font-bold text-green-600">
                    {loyaltyData?.totalPoints.toLocaleString() || "0"}
                  </p>
                </div>
                <div className="text-center p-4 bg-purple-50 rounded-lg">
                  <h3 className="font-semibold text-purple-900">
                    Current Tier
                  </h3>
                  <p
                    className="text-2xl font-bold"
                    style={{
                      color: loyaltyData
                        ? getTierColor(loyaltyData.membershipLevel)
                        : "#6B7280",
                    }}
                  >
                    {loyaltyData?.membershipLevel || "Bronze"}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Personal Information Card */}
          <Card>
            <CardHeader>
              <CardTitle>Personal Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="firstName">First Name</Label>
                  <Input
                    id="firstName"
                    value={profileData.firstName}
                    onChange={(e) =>
                      setProfileData((prev) => ({
                        ...prev,
                        firstName: e.target.value,
                      }))
                    }
                    placeholder="Enter your first name"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input
                    id="lastName"
                    value={profileData.lastName}
                    onChange={(e) =>
                      setProfileData((prev) => ({
                        ...prev,
                        lastName: e.target.value,
                      }))
                    }
                    placeholder="Enter your last name"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    value={profileData.email}
                    onChange={(e) =>
                      setProfileData((prev) => ({
                        ...prev,
                        email: e.target.value,
                      }))
                    }
                    placeholder="Enter your email"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={profileData.phone}
                    onChange={(e) =>
                      setProfileData((prev) => ({
                        ...prev,
                        phone: e.target.value,
                      }))
                    }
                    placeholder="Enter your phone number"
                  />
                </div>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="dateOfBirth">Date of Birth</Label>
                <Input
                  id="dateOfBirth"
                  type="date"
                  value={profileData.dateOfBirth}
                  onChange={(e) =>
                    setProfileData((prev) => ({
                      ...prev,
                      dateOfBirth: e.target.value,
                    }))
                  }
                />
              </div>

              <Button>Save Changes</Button>
            </CardContent>
          </Card>

          {/* Preferences Card */}
          <Card>
            <CardHeader>
              <CardTitle>Preferences</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="timezone">Timezone</Label>
                  <Select
                    value={profileData.timezone}
                    onValueChange={(value) =>
                      setProfileData((prev) => ({ ...prev, timezone: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select timezone" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="UTC">UTC</SelectItem>
                      <SelectItem value="America/New_York">
                        Eastern Time
                      </SelectItem>
                      <SelectItem value="America/Chicago">
                        Central Time
                      </SelectItem>
                      <SelectItem value="America/Denver">
                        Mountain Time
                      </SelectItem>
                      <SelectItem value="America/Los_Angeles">
                        Pacific Time
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="language">Language</Label>
                  <Select
                    value={profileData.language}
                    onValueChange={(value) =>
                      setProfileData((prev) => ({ ...prev, language: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select language" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="en">English</SelectItem>
                      <SelectItem value="es">Spanish</SelectItem>
                      <SelectItem value="fr">French</SelectItem>
                      <SelectItem value="de">German</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="currency">Currency</Label>
                  <Select
                    value={profileData.currency}
                    onValueChange={(value) =>
                      setProfileData((prev) => ({ ...prev, currency: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select currency" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="USD">USD ($)</SelectItem>
                      <SelectItem value="EUR">EUR (€)</SelectItem>
                      <SelectItem value="GBP">GBP (£)</SelectItem>
                      <SelectItem value="CAD">CAD (C$)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Button>Save Preferences</Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Loyalty & Coupons Tab */}
        <TabsContent className="space-y-6" value="loyalty">
          {/* Loyalty Status Card */}
          {loyaltyData && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Crown
                    className="h-5 w-5"
                    style={{ color: getTierColor(loyaltyData.membershipLevel) }}
                  />
                  Loyalty Status
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-semibold">
                        Current Tier: {loyaltyData.membershipLevel}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {loyaltyData.totalPoints.toLocaleString()} points
                      </p>
                    </div>
                    <Badge
                      variant="secondary"
                      className="text-white"
                      style={{
                        backgroundColor: getTierColor(
                          loyaltyData.membershipLevel
                        ),
                      }}
                    >
                      {loyaltyData.membershipLevel}
                    </Badge>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Progress to next tier</span>
                      <span>{calculateProgress()}%</span>
                    </div>
                    <Progress value={calculateProgress()} className="h-2" />
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Active Coupons Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Ticket className="h-5 w-5" />
                Active Coupons ({validCoupons.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {validCoupons.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {validCoupons.map((coupon) => (
                    <div
                      key={coupon.id}
                      className="border rounded-lg p-4 bg-green-50 border-green-200"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-bold text-lg">{coupon.code}</h4>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleCopyCode(coupon.code)}
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                      </div>
                      <p className="text-green-600 font-semibold mb-1">
                        {loyaltyService.formatDiscount(
                          coupon.discountType,
                          coupon.discountValue
                        )}
                      </p>
                      <p className="text-sm text-gray-600">
                        Min purchase: ${coupon.minPurchaseAmount}
                      </p>
                      {coupon.maxDiscountAmount && (
                        <p className="text-sm text-gray-600">
                          Max discount: ${coupon.maxDiscountAmount}
                        </p>
                      )}
                      <p className="text-sm text-gray-600">
                        Expires in:{" "}
                        {loyaltyService.getDaysUntilExpiration(
                          coupon.expirationDate
                        )}{" "}
                        days
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground">
                  No active coupons available.
                </p>
              )}
            </CardContent>
          </Card>

          {/* Coupon Store Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Gift className="h-5 w-5" />
                Coupon Store
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {availablePackages.map((pkg, index) => (
                  <div
                    key={index}
                    className="border rounded-lg p-4 hover:shadow-md transition-shadow"
                  >
                    <h4 className="font-semibold mb-2">{pkg.packageName}</h4>
                    <p className="text-sm text-gray-600 mb-3">
                      {pkg.description}
                    </p>
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-indigo-600">
                        {pkg.pointsCost} points
                      </span>
                      <Button
                        size="sm"
                        onClick={() =>
                          handlePurchaseCouponPackage(pkg.packageName)
                        }
                        disabled={
                          !loyaltyData ||
                          loyaltyData.totalPoints < pkg.pointsCost
                        }
                      >
                        {!loyaltyData ||
                        loyaltyData.totalPoints < pkg.pointsCost
                          ? "Not enough points"
                          : "Purchase"}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Coupon History */}
          {(usedCoupons.length > 0 || expiredCoupons.length > 0) && (
            <Card>
              <CardHeader>
                <CardTitle>Coupon History</CardTitle>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="used">
                  <TabsList>
                    <TabsTrigger value="used">
                      Used ({usedCoupons.length})
                    </TabsTrigger>
                    <TabsTrigger value="expired">
                      Expired ({expiredCoupons.length})
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="used" className="space-y-2">
                    {usedCoupons.map((coupon) => (
                      <div
                        key={coupon.id}
                        className="border rounded-lg p-3 bg-gray-50"
                      >
                        <div className="flex justify-between items-center">
                          <div>
                            <h5 className="font-semibold text-gray-700">
                              {coupon.code}
                            </h5>
                            <p className="text-sm text-gray-500">
                              {loyaltyService.formatDiscount(
                                coupon.discountType,
                                coupon.discountValue
                              )}
                            </p>
                          </div>
                          <Badge variant="secondary">Used</Badge>
                        </div>
                      </div>
                    ))}
                  </TabsContent>

                  <TabsContent value="expired" className="space-y-2">
                    {expiredCoupons.map((coupon) => (
                      <div
                        key={coupon.id}
                        className="border rounded-lg p-3 bg-red-50 border-red-200"
                      >
                        <div className="flex justify-between items-center">
                          <div>
                            <h5 className="font-semibold text-red-700">
                              {coupon.code}
                            </h5>
                            <p className="text-sm text-red-500">
                              {loyaltyService.formatDiscount(
                                coupon.discountType,
                                coupon.discountValue
                              )}
                            </p>
                          </div>
                          <Badge variant="destructive">Expired</Badge>
                        </div>
                      </div>
                    ))}
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Addresses Tab */}
        <TabsContent className="space-y-4" value="addresses">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Saved Addresses</h3>
            <Button onClick={() => setShowAddressForm(true)}>
              Add New Address
            </Button>
          </div>

          {/* Address Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {addresses.map((address) => (
              <Card
                key={address.id}
                className={address.isDefault ? "border-green-500" : ""}
              >
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <MapPin className="h-4 w-4" />
                      {address.type}
                    </span>
                    {address.isDefault && (
                      <Badge
                        variant="secondary"
                        className="bg-green-100 text-green-800"
                      >
                        Default
                      </Badge>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-1 text-sm">
                    <p className="font-medium">
                      {address.firstName} {address.lastName}
                    </p>
                    <p>{address.address1}</p>
                    {address.address2 && <p>{address.address2}</p>}
                    <p>
                      {address.city}, {address.state} {address.zipCode}
                    </p>
                    <p>{address.country}</p>
                  </div>
                  <div className="flex gap-2 mt-4">
                    <Button size="sm" variant="outline">
                      Edit
                    </Button>
                    <Button size="sm" variant="outline">
                      Delete
                    </Button>
                    {!address.isDefault && (
                      <Button size="sm" variant="outline">
                        Set as Default
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Address Form Modal (simplified) */}
          {showAddressForm && (
            <Card>
              <CardHeader>
                <CardTitle>Add New Address</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label>First Name</Label>
                    <Input placeholder="First name" />
                  </div>
                  <div className="grid gap-2">
                    <Label>Last Name</Label>
                    <Input placeholder="Last name" />
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label>Address Line 1</Label>
                  <Input placeholder="Street address" />
                </div>
                <div className="grid gap-2">
                  <Label>Address Line 2 (Optional)</Label>
                  <Input placeholder="Apartment, suite, etc." />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="grid gap-2">
                    <Label>City</Label>
                    <Input placeholder="City" />
                  </div>
                  <div className="grid gap-2">
                    <Label>State</Label>
                    <Input placeholder="State" />
                  </div>
                  <div className="grid gap-2">
                    <Label>ZIP Code</Label>
                    <Input placeholder="ZIP code" />
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button>Save Address</Button>
                  <Button
                    variant="outline"
                    onClick={() => setShowAddressForm(false)}
                  >
                    Cancel
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Enhanced Notifications Tab */}
        <TabsContent className="space-y-4" value="notifications">
          {/* Order Notifications */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Order Notifications
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between space-x-2">
                <div className="space-y-0.5">
                  <Label htmlFor="order-confirmation">
                    Order Confirmations
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Get notified when your order is confirmed
                  </p>
                </div>
                <Switch id="order-confirmation" defaultChecked />
              </div>
              <div className="flex items-center justify-between space-x-2">
                <div className="space-y-0.5">
                  <Label htmlFor="shipping-updates">Shipping Updates</Label>
                  <p className="text-sm text-muted-foreground">
                    Track your package with shipping notifications
                  </p>
                </div>
                <Switch id="shipping-updates" defaultChecked />
              </div>
              <div className="flex items-center justify-between space-x-2">
                <div className="space-y-0.5">
                  <Label htmlFor="delivery-notifications">
                    Delivery Notifications
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Know when your package has been delivered
                  </p>
                </div>
                <Switch id="delivery-notifications" defaultChecked />
              </div>
            </CardContent>
          </Card>

          {/* Loyalty Notifications */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Crown className="h-5 w-5" />
                Loyalty & Rewards
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between space-x-2">
                <div className="space-y-0.5">
                  <Label htmlFor="points-earned">Points Earned</Label>
                  <p className="text-sm text-muted-foreground">
                    Get notified when you earn loyalty points
                  </p>
                </div>
                <Switch id="points-earned" defaultChecked />
              </div>
              <div className="flex items-center justify-between space-x-2">
                <div className="space-y-0.5">
                  <Label htmlFor="tier-upgrades">Tier Upgrades</Label>
                  <p className="text-sm text-muted-foreground">
                    Celebrate when you reach a new tier
                  </p>
                </div>
                <Switch id="tier-upgrades" defaultChecked />
              </div>
              <div className="flex items-center justify-between space-x-2">
                <div className="space-y-0.5">
                  <Label htmlFor="coupon-expiry">Coupon Expiry Warnings</Label>
                  <p className="text-sm text-muted-foreground">
                    Get reminded before your coupons expire
                  </p>
                </div>
                <Switch id="coupon-expiry" defaultChecked />
              </div>
            </CardContent>
          </Card>

          {/* Marketing Notifications */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="h-5 w-5" />
                Marketing & Promotions
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between space-x-2">
                <div className="space-y-0.5">
                  <Label htmlFor="promotional-emails">Promotional Emails</Label>
                  <p className="text-sm text-muted-foreground">
                    Receive exclusive offers and promotions
                  </p>
                </div>
                <Switch id="promotional-emails" />
              </div>
              <div className="flex items-center justify-between space-x-2">
                <div className="space-y-0.5">
                  <Label htmlFor="new-arrivals">New Arrivals</Label>
                  <p className="text-sm text-muted-foreground">
                    Be the first to know about new products
                  </p>
                </div>
                <Switch id="new-arrivals" />
              </div>
              <div className="flex items-center justify-between space-x-2">
                <div className="space-y-0.5">
                  <Label htmlFor="sale-alerts">Sale Alerts</Label>
                  <p className="text-sm text-muted-foreground">
                    Get notified about sales and discounts
                  </p>
                </div>
                <Switch id="sale-alerts" />
              </div>
            </CardContent>
          </Card>

          {/* Account Security Notifications */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lock className="h-5 w-5" />
                Account Security
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between space-x-2">
                <div className="space-y-0.5">
                  <Label htmlFor="login-alerts">Login Alerts</Label>
                  <p className="text-sm text-muted-foreground">
                    Get notified of new login attempts
                  </p>
                </div>
                <Switch id="login-alerts" defaultChecked />
              </div>
              <div className="flex items-center justify-between space-x-2">
                <div className="space-y-0.5">
                  <Label htmlFor="password-changes">Password Changes</Label>
                  <p className="text-sm text-muted-foreground">
                    Confirmation for password updates
                  </p>
                </div>
                <Switch id="password-changes" defaultChecked />
              </div>
            </CardContent>
          </Card>

          <Button>Save Notification Preferences</Button>
        </TabsContent>

        {/* Security Tab (Enhanced) */}
        <TabsContent className="space-y-4" value="security">
          <Card>
            <CardHeader>
              <CardTitle>Change Password</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="current-password">Current Password</Label>
                <Input
                  id="current-password"
                  placeholder="Enter current password"
                  type="password"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="new-password">New Password</Label>
                <Input
                  id="new-password"
                  placeholder="Enter new password"
                  type="password"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="confirm-password">Confirm New Password</Label>
                <Input
                  id="confirm-password"
                  placeholder="Confirm new password"
                  type="password"
                />
              </div>
              <Button>Update Password</Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Two-Factor Authentication</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between space-x-2">
                <div className="space-y-0.5">
                  <Label>Two-Factor Authentication</Label>
                  <p className="text-sm text-muted-foreground">
                    Add an extra layer of security to your account
                  </p>
                </div>
                <Switch id="2fa" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Login Sessions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-medium">Current Session</p>
                    <p className="text-sm text-muted-foreground">
                      Chrome on Windows • Active now
                    </p>
                  </div>
                  <Badge variant="secondary">Active</Badge>
                </div>
              </div>
              <Button variant="outline" className="mt-4">
                Sign out all other sessions
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
