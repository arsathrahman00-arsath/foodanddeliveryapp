import React from "react";
import { NavLink, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  ChefHat,
  SprayCan,
  Truck,
  Menu,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";

interface BottomNavItem {
  to: string;
  icon: React.ElementType;
  label: string;
  matchPaths?: string[];
}

const navItems: BottomNavItem[] = [
  {
    to: "/dashboard",
    icon: LayoutDashboard,
    label: "Home",
  },
  {
    to: "/dashboard/cooking",
    icon: ChefHat,
    label: "Cooking",
  },
  {
    to: "/dashboard/cleaning/material",
    icon: SprayCan,
    label: "Cleaning",
    matchPaths: ["/dashboard/cleaning"],
  },
  {
    to: "/dashboard/delivery",
    icon: Truck,
    label: "Delivery",
    matchPaths: ["/dashboard/delivery", "/dashboard/food-allocation"],
  },
];

interface BottomNavBarProps {
  onMenuOpen: () => void;
}

const BottomNavBar: React.FC<BottomNavBarProps> = ({ onMenuOpen }) => {
  const location = useLocation();
  const { allowedRoutes } = useAuth();

  const isActive = (item: BottomNavItem) => {
    if (location.pathname === item.to) return true;
    if (item.matchPaths) {
      return item.matchPaths.some((p) => location.pathname.startsWith(p));
    }
    return false;
  };

  // Filter nav items by permissions (Home is always visible)
  const visibleItems = navItems.filter(
    (item) => item.to === "/dashboard" || allowedRoutes.has(item.to)
  );

  return (
    <nav className="bottom-nav safe-bottom">
      <div className="flex items-stretch h-full">
        {visibleItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={cn(
              "bottom-nav-item touch-target",
              isActive(item) && "bottom-nav-item-active"
            )}
          >
            <item.icon className="w-5 h-5" />
            <span className="text-[10px] font-medium leading-tight">{item.label}</span>
          </NavLink>
        ))}
        <button
          onClick={onMenuOpen}
          className="bottom-nav-item touch-target"
          aria-label="Open menu"
        >
          <Menu className="w-5 h-5" />
          <span className="text-[10px] font-medium leading-tight">More</span>
        </button>
      </div>
    </nav>
  );
};

export default BottomNavBar;
