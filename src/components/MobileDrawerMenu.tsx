import React from "react";
import { NavLink, useNavigate, useLocation } from "react-router-dom";
import {
  ChefHat, MapPin, Tag, Ruler, Package, Truck, BookOpen, UtensilsCrossed,
  LogOut, LayoutDashboard, User, Database, Calendar, CalendarDays,
  ClipboardList, ListChecks, PackageCheck, Utensils, Send,
  SprayCan, Flame, Droplets, Container, Sandwich, Archive, Eye, Settings,
  ShieldCheck, Settings2, X, ChevronRight,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";

interface MenuItem {
  to: string;
  icon: React.ReactNode;
  label: string;
}

interface MenuSection {
  label: string;
  icon: React.ReactNode;
  items: MenuItem[];
}

const menuSections: MenuSection[] = [
  {
    label: "Master Data",
    icon: <Database className="w-5 h-5" />,
    items: [
      { to: "/dashboard/location", icon: <MapPin className="w-5 h-5" />, label: "Location" },
      { to: "/dashboard/item-category", icon: <Tag className="w-5 h-5" />, label: "Item Category" },
      { to: "/dashboard/unit", icon: <Ruler className="w-5 h-5" />, label: "Unit" },
      { to: "/dashboard/item", icon: <Package className="w-5 h-5" />, label: "Item" },
      { to: "/dashboard/supplier", icon: <Truck className="w-5 h-5" />, label: "Supplier" },
      { to: "/dashboard/recipe-type", icon: <BookOpen className="w-5 h-5" />, label: "Recipe Type" },
      { to: "/dashboard/recipe", icon: <UtensilsCrossed className="w-5 h-5" />, label: "Recipe" },
    ],
  },
  {
    label: "Delivery Plan",
    icon: <Calendar className="w-5 h-5" />,
    items: [
      { to: "/dashboard/schedule", icon: <CalendarDays className="w-5 h-5" />, label: "Schedule" },
      { to: "/dashboard/requirement", icon: <ClipboardList className="w-5 h-5" />, label: "Requirement" },
    ],
  },
  {
    label: "Preparation",
    icon: <ChefHat className="w-5 h-5" />,
    items: [
      { to: "/dashboard/day-requirements", icon: <ListChecks className="w-5 h-5" />, label: "Purchase Request" },
      { to: "/dashboard/material-receipt", icon: <Package className="w-5 h-5" />, label: "Material Receipt" },
      { to: "/dashboard/request-supplier", icon: <ClipboardList className="w-5 h-5" />, label: "Supplier Request" },
    ],
  },
  {
    label: "Operations",
    icon: <Flame className="w-5 h-5" />,
    items: [
      { to: "/dashboard/packing", icon: <PackageCheck className="w-5 h-5" />, label: "Packing" },
      { to: "/dashboard/cooking", icon: <Flame className="w-5 h-5" />, label: "Cooking" },
    ],
  },
  {
    label: "Cleaning",
    icon: <SprayCan className="w-5 h-5" />,
    items: [
      { to: "/dashboard/cleaning/material", icon: <Droplets className="w-5 h-5" />, label: "Materials" },
      { to: "/dashboard/cleaning/vessel", icon: <Container className="w-5 h-5" />, label: "Vessel" },
      { to: "/dashboard/cleaning/prep", icon: <Sandwich className="w-5 h-5" />, label: "Prep Area" },
      { to: "/dashboard/cleaning/pack", icon: <Archive className="w-5 h-5" />, label: "Pack Area" },
    ],
  },
  {
    label: "Distribution",
    icon: <Utensils className="w-5 h-5" />,
    items: [
      { to: "/dashboard/food-allocation", icon: <Utensils className="w-5 h-5" />, label: "Food Allocation" },
      { to: "/dashboard/delivery", icon: <Send className="w-5 h-5" />, label: "Delivery" },
    ],
  },
  {
    label: "Media & Settings",
    icon: <Settings className="w-5 h-5" />,
    items: [
      { to: "/dashboard/view-media", icon: <Eye className="w-5 h-5" />, label: "View Media" },
      { to: "/dashboard/settings/module-master", icon: <Settings2 className="w-5 h-5" />, label: "Module Master" },
      { to: "/dashboard/settings/user-rights", icon: <ShieldCheck className="w-5 h-5" />, label: "User Rights" },
    ],
  },
];

interface MobileDrawerMenuProps {
  isOpen: boolean;
  onClose: () => void;
}

const MobileDrawerMenu: React.FC<MobileDrawerMenuProps> = ({ isOpen, onClose }) => {
  const { user, logout, allowedRoutes } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate("/auth");
    onClose();
  };

  const handleNavClick = () => {
    onClose();
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-[60] bg-foreground/40 backdrop-blur-sm animate-fade-in"
        onClick={onClose}
      />

      {/* Drawer */}
      <div className="fixed inset-y-0 right-0 z-[70] w-[85%] max-w-sm bg-background shadow-2xl animate-slide-in-left safe-top safe-bottom flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-4 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-warm flex items-center justify-center">
              <ChefHat className="w-5 h-5 text-primary-foreground" />
            </div>
            <div>
              <h2 className="font-bold text-foreground">FPDA</h2>
              <p className="text-xs text-muted-foreground">All Modules</p>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} className="touch-target">
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Menu items */}
        <ScrollArea className="flex-1">
          <div className="p-3 space-y-4">
            {/* Dashboard link */}
            <NavLink
              to="/dashboard"
              end
              onClick={handleNavClick}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-3 px-4 py-3 rounded-xl transition-colors touch-target",
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "text-foreground hover:bg-muted"
                )
              }
            >
              <LayoutDashboard className="w-5 h-5" />
              <span className="font-medium">Dashboard</span>
            </NavLink>

            {/* Sections */}
            {menuSections.map((section) => {
              const visibleItems = section.items.filter((item) => allowedRoutes.has(item.to));
              if (visibleItems.length === 0) return null;

              return (
                <div key={section.label}>
                  <div className="flex items-center gap-2 px-4 mb-1.5">
                    <span className="text-muted-foreground">{section.icon}</span>
                    <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      {section.label}
                    </span>
                  </div>
                  <div className="space-y-0.5">
                    {visibleItems.map((item) => (
                      <NavLink
                        key={item.to}
                        to={item.to}
                        onClick={handleNavClick}
                        className={({ isActive }) =>
                          cn(
                            "flex items-center gap-3 px-4 py-3 rounded-xl transition-colors touch-target",
                            isActive
                              ? "bg-primary/10 text-primary font-medium"
                              : "text-foreground hover:bg-muted"
                          )
                        }
                      >
                        {item.icon}
                        <span className="flex-1">{item.label}</span>
                        <ChevronRight className="w-4 h-4 text-muted-foreground" />
                      </NavLink>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </ScrollArea>

        {/* User section */}
        <div className="p-4 border-t border-border">
          <div className="flex items-center gap-3 mb-3 px-2">
            <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center">
              <User className="w-5 h-5 text-muted-foreground" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate">
                {user?.user_name || "User"}
              </p>
              <p className="text-xs text-muted-foreground capitalize">
                {user?.role_selection || "Guest"}
              </p>
            </div>
          </div>
          <Button
            variant="outline"
            className="w-full gap-2 touch-target"
            onClick={handleLogout}
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </Button>
        </div>
      </div>
    </>
  );
};

export default MobileDrawerMenu;
