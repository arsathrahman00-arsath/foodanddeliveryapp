import React from "react";
import { useAuth } from "@/contexts/AuthContext";
import {
  MapPin, Tag, Ruler, Package, Truck, BookOpen, UtensilsCrossed,
  CalendarDays, ClipboardList, ListChecks, PackageCheck, Flame,
  SprayCan, Utensils, Send, Eye, ChevronRight,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";

interface QuickAction {
  title: string;
  description: string;
  icon: React.ElementType;
  to: string;
  gradient: string;
}

const quickActions: QuickAction[] = [
  { title: "Cooking", description: "Log activity", icon: Flame, to: "/dashboard/cooking", gradient: "bg-gradient-warm" },
  { title: "Cleaning", description: "Log cleaning", icon: SprayCan, to: "/dashboard/cleaning/material", gradient: "bg-gradient-sage" },
  { title: "Packing", description: "Pack items", icon: PackageCheck, to: "/dashboard/packing", gradient: "bg-gradient-warm" },
  { title: "Delivery", description: "Track delivery", icon: Send, to: "/dashboard/delivery", gradient: "bg-gradient-sage" },
];

interface ModuleLink {
  title: string;
  icon: React.ElementType;
  to: string;
}

const moduleGroups: { label: string; items: ModuleLink[] }[] = [
  {
    label: "Master Data",
    items: [
      { title: "Location", icon: MapPin, to: "/dashboard/location" },
      { title: "Category", icon: Tag, to: "/dashboard/item-category" },
      { title: "Unit", icon: Ruler, to: "/dashboard/unit" },
      { title: "Item", icon: Package, to: "/dashboard/item" },
      { title: "Supplier", icon: Truck, to: "/dashboard/supplier" },
      { title: "Recipe Type", icon: BookOpen, to: "/dashboard/recipe-type" },
      { title: "Recipe", icon: UtensilsCrossed, to: "/dashboard/recipe" },
    ],
  },
  {
    label: "Planning & Prep",
    items: [
      { title: "Schedule", icon: CalendarDays, to: "/dashboard/schedule" },
      { title: "Requirement", icon: ClipboardList, to: "/dashboard/requirement" },
      { title: "Purchase Req", icon: ListChecks, to: "/dashboard/day-requirements" },
      { title: "Material Receipt", icon: Package, to: "/dashboard/material-receipt" },
      { title: "Supplier Req", icon: ClipboardList, to: "/dashboard/request-supplier" },
    ],
  },
  {
    label: "Distribution",
    items: [
      { title: "Allocation", icon: Utensils, to: "/dashboard/food-allocation" },
      { title: "Delivery", icon: Send, to: "/dashboard/delivery" },
      { title: "View Media", icon: Eye, to: "/dashboard/view-media" },
    ],
  },
];

const DashboardHome: React.FC = () => {
  const { user, allowedRoutes } = useAuth();

  return (
    <div className="animate-fade-in space-y-6">
      {/* Greeting */}
      <div>
        <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-foreground">
          Hi, <span className="text-gradient-warm">{user?.user_name}</span>
        </h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          {user?.role_selection && <span className="capitalize">{user.role_selection}</span>}
          {user?.user_code && <span> · {user.user_code}</span>}
        </p>
      </div>

      {/* Quick Actions — horizontal scroll on mobile */}
      <div>
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">Quick Actions</h2>
        <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4 sm:mx-0 sm:px-0 sm:grid sm:grid-cols-4 sm:overflow-visible snap-x">
          {quickActions
            .filter((a) => allowedRoutes.has(a.to))
            .map((action) => (
              <Link key={action.to} to={action.to} className="snap-start">
                <Card className="min-w-[120px] sm:min-w-0 border-0 shadow-md hover:shadow-lg transition-shadow active:scale-[0.97]">
                  <CardContent className="p-4 flex flex-col items-center text-center gap-2">
                    <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center", action.gradient)}>
                      <action.icon className="w-6 h-6 text-primary-foreground" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-foreground">{action.title}</p>
                      <p className="text-[10px] text-muted-foreground">{action.description}</p>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
        </div>
      </div>

      {/* Module Groups */}
      {moduleGroups.map((group) => {
        const visible = group.items.filter((item) => allowedRoutes.has(item.to));
        if (visible.length === 0) return null;

        return (
          <div key={group.label}>
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">{group.label}</h2>
            <Card className="border shadow-sm overflow-hidden">
              <CardContent className="p-0">
                {visible.map((item, idx) => (
                  <Link
                    key={item.to}
                    to={item.to}
                    className={cn(
                      "flex items-center gap-3 px-4 py-3.5 touch-target transition-colors hover:bg-muted/50 active:bg-muted",
                      idx < visible.length - 1 && "border-b border-border"
                    )}
                  >
                    <div className="w-9 h-9 rounded-xl bg-muted flex items-center justify-center shrink-0">
                      <item.icon className="w-4 h-4 text-muted-foreground" />
                    </div>
                    <span className="flex-1 text-sm font-medium text-foreground">{item.title}</span>
                    <ChevronRight className="w-4 h-4 text-muted-foreground" />
                  </Link>
                ))}
              </CardContent>
            </Card>
          </div>
        );
      })}
    </div>
  );
};

export default DashboardHome;
