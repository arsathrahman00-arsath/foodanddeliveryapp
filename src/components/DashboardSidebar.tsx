import React, { useState } from "react";
import { NavLink, useNavigate, useLocation } from "react-router-dom";
import {
  ChefHat, MapPin, Tag, Ruler, Package, Truck, BookOpen, UtensilsCrossed,
  LogOut, LayoutDashboard, User, ChevronDown, Database, Calendar, CalendarDays,
  ClipboardList, ChefHat as PrepIcon, ListChecks, PackageCheck, Utensils, Send,
  SprayCan, Flame, Droplets, Container, Sandwich, Archive, Eye, Settings,
  ShieldCheck, Settings2, PanelLeftClose, PanelLeftOpen,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  Collapsible, CollapsibleContent, CollapsibleTrigger,
} from "@/components/ui/collapsible";

interface NavItemProps {
  to: string;
  icon: React.ReactNode;
  label: string;
}

const NavItem: React.FC<NavItemProps> = ({ to, icon, label }) => (
  <NavLink
    to={to}
    className={({ isActive }) =>
      cn("sidebar-item", isActive && "sidebar-item-active")
    }
  >
    {icon}
    <span className="font-medium">{label}</span>
  </NavLink>
);

const masterMenuItems = [
  { to: "/dashboard/location", icon: <MapPin className="w-4 h-4" />, label: "Location" },
  { to: "/dashboard/item-category", icon: <Tag className="w-4 h-4" />, label: "Item Category" },
  { to: "/dashboard/unit", icon: <Ruler className="w-4 h-4" />, label: "Unit" },
  { to: "/dashboard/item", icon: <Package className="w-4 h-4" />, label: "Item" },
  { to: "/dashboard/supplier", icon: <Truck className="w-4 h-4" />, label: "Supplier" },
  { to: "/dashboard/recipe-type", icon: <BookOpen className="w-4 h-4" />, label: "Recipe Type" },
  { to: "/dashboard/recipe", icon: <UtensilsCrossed className="w-4 h-4" />, label: "Recipe for a Kg" },
  { to: "/dashboard/store-room", icon: <Archive className="w-4 h-4" />, label: "Store Room" },
  { to: "/dashboard/sop-details", icon: <ClipboardList className="w-4 h-4" />, label: "SOP Details" },
];

const deliveryPlanMenuItems = [
  { to: "/dashboard/schedule", icon: <CalendarDays className="w-4 h-4" />, label: "Schedule" },
  { to: "/dashboard/requirement", icon: <ClipboardList className="w-4 h-4" />, label: "Requirement" },
];

const preparationMenuItems = [
  { to: "/dashboard/day-requirements", icon: <ListChecks className="w-4 h-4" />, label: "Purchase Request" },
  { to: "/dashboard/material-receipt", icon: <Package className="w-4 h-4" />, label: "Material Receipt" },
  { to: "/dashboard/request-supplier", icon: <ClipboardList className="w-4 h-4" />, label: "Request For Supplier" },
  { to: "/dashboard/recipe-cost", icon: <CalendarDays className="w-4 h-4" />, label: "Daily Recipe Cost" },
];

const distributionMenuItems = [
  { to: "/dashboard/food-allocation", icon: <Utensils className="w-4 h-4" />, label: "Food Allocation" },
  { to: "/dashboard/delivery", icon: <Send className="w-4 h-4" />, label: "Delivery" },
];

const cleaningMenuItems = [
  { to: "/dashboard/cleaning/material", icon: <Droplets className="w-4 h-4" />, label: "Materials" },
  { to: "/dashboard/cleaning/vessel", icon: <Container className="w-4 h-4" />, label: "Vessel" },
  { to: "/dashboard/cleaning/prep", icon: <Sandwich className="w-4 h-4" />, label: "Preparation Area" },
  { to: "/dashboard/cleaning/pack", icon: <Archive className="w-4 h-4" />, label: "Packing Area" },
];

const settingsMenuItems = [
  { to: "/dashboard/settings/module-master", icon: <Settings2 className="w-4 h-4" />, label: "Module Master" },
  { to: "/dashboard/settings/user-rights", icon: <ShieldCheck className="w-4 h-4" />, label: "User Rights" },
];

interface MenuItem {
  to: string;
  icon: React.ReactNode;
  label: string;
}

interface CollapsibleMenuProps {
  label: string;
  icon: React.ReactNode;
  items: MenuItem[];
  isActive: boolean;
  defaultOpen: boolean;
}

const CollapsibleMenu: React.FC<CollapsibleMenuProps> = ({ label, icon, items, isActive, defaultOpen }) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  if (items.length === 0) return null;

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <CollapsibleTrigger asChild>
        <button
          className={cn(
            "sidebar-item w-full justify-between",
            isActive && "bg-sidebar-accent text-sidebar-accent-foreground"
          )}
        >
          <div className="flex items-center gap-3">
            {icon}
            <span className="font-medium">{label}</span>
          </div>
          <ChevronDown
            className={cn("w-4 h-4 transition-transform duration-200", isOpen && "rotate-180")}
          />
        </button>
      </CollapsibleTrigger>
      <CollapsibleContent className="pl-4 mt-1 space-y-1">
        {items.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              cn("sidebar-item text-sm py-2", isActive && "sidebar-item-active")
            }
          >
            {item.icon}
            <span className="font-medium">{item.label}</span>
          </NavLink>
        ))}
      </CollapsibleContent>
    </Collapsible>
  );
};

/** Filter menu items to only those in the allowedRoutes set */
const filterItems = (items: MenuItem[], allowedRoutes: Set<string>): MenuItem[] =>
  items.filter((item) => allowedRoutes.has(item.to));

interface DashboardSidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

const DashboardSidebar: React.FC<DashboardSidebarProps> = ({ collapsed, onToggle }) => {
  const { user, logout, allowedRoutes } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Filter each section by permissions
  const visibleMaster = filterItems(masterMenuItems, allowedRoutes);
  const visibleDeliveryPlan = filterItems(deliveryPlanMenuItems, allowedRoutes);
  const visiblePreparation = filterItems(preparationMenuItems, allowedRoutes);
  const visibleDistribution = filterItems(distributionMenuItems, allowedRoutes);
  const visibleCleaning = filterItems(cleaningMenuItems, allowedRoutes);
  const visibleSettings = filterItems(settingsMenuItems, allowedRoutes);

  const isMasterActive = visibleMaster.some(item => location.pathname === item.to);
  const isDeliveryPlanActive = visibleDeliveryPlan.some(item => location.pathname === item.to);
  const isPreparationActive = visiblePreparation.some(item => location.pathname === item.to);
  const isDistributionActive = visibleDistribution.some(item => location.pathname === item.to);
  const isCleaningActive = visibleCleaning.some(item => location.pathname === item.to);
  const isSettingsActive = visibleSettings.some(item => location.pathname === item.to);

  const handleLogout = () => {
    logout();
    navigate("/auth");
  };

  return (
    <aside className={cn(
      "fixed left-0 top-0 h-screen bg-sidebar flex flex-col shadow-xl z-50 transition-all duration-300",
      collapsed ? "w-16" : "w-64"
    )}>
      {/* Logo + Toggle */}
      <div className="p-4 border-b border-sidebar-border">
        <div className="flex items-center justify-between">
          {!collapsed && (
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-warm flex items-center justify-center shadow-lg">
                <ChefHat className="w-5 h-5 text-primary-foreground" />
              </div>
              <div>
                <h1 className="font-bold text-lg text-sidebar-foreground">FPDA</h1>
                <p className="text-xs text-sidebar-foreground/60">Master Data</p>
              </div>
            </div>
          )}
          <Button
            variant="ghost"
            size="icon"
            className="text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent"
            onClick={onToggle}
          >
            {collapsed ? <PanelLeftOpen className="w-5 h-5" /> : <PanelLeftClose className="w-5 h-5" />}
          </Button>
        </div>
      </div>

      {/* Navigation */}
      <nav className={cn("flex-1 space-y-1 overflow-y-auto", collapsed ? "p-2" : "p-4")}>
        {collapsed ? (
          <>
            <NavLink to="/dashboard" className={({ isActive }) => cn("sidebar-item justify-center p-2", isActive && "sidebar-item-active")} title="Dashboard">
              <LayoutDashboard className="w-5 h-5" />
            </NavLink>
            {visibleMaster.length > 0 && visibleMaster.map(item => (
              <NavLink key={item.to} to={item.to} className={({ isActive }) => cn("sidebar-item justify-center p-2", isActive && "sidebar-item-active")} title={item.label}>
                {item.icon}
              </NavLink>
            ))}
            {visibleDeliveryPlan.length > 0 && visibleDeliveryPlan.map(item => (
              <NavLink key={item.to} to={item.to} className={({ isActive }) => cn("sidebar-item justify-center p-2", isActive && "sidebar-item-active")} title={item.label}>
                {item.icon}
              </NavLink>
            ))}
            {visiblePreparation.length > 0 && visiblePreparation.map(item => (
              <NavLink key={item.to} to={item.to} className={({ isActive }) => cn("sidebar-item justify-center p-2", isActive && "sidebar-item-active")} title={item.label}>
                {item.icon}
              </NavLink>
            ))}
            {allowedRoutes.has("/dashboard/packing") && (
              <NavLink to="/dashboard/packing" className={({ isActive }) => cn("sidebar-item justify-center p-2", isActive && "sidebar-item-active")} title="Packing">
                <PackageCheck className="w-5 h-5" />
              </NavLink>
            )}
            {allowedRoutes.has("/dashboard/cooking") && (
              <NavLink to="/dashboard/cooking" className={({ isActive }) => cn("sidebar-item justify-center p-2", isActive && "sidebar-item-active")} title="Cooking">
                <Flame className="w-5 h-5" />
              </NavLink>
            )}
            {visibleCleaning.length > 0 && visibleCleaning.map(item => (
              <NavLink key={item.to} to={item.to} className={({ isActive }) => cn("sidebar-item justify-center p-2", isActive && "sidebar-item-active")} title={item.label}>
                {item.icon}
              </NavLink>
            ))}
            {visibleDistribution.length > 0 && visibleDistribution.map(item => (
              <NavLink key={item.to} to={item.to} className={({ isActive }) => cn("sidebar-item justify-center p-2", isActive && "sidebar-item-active")} title={item.label}>
                {item.icon}
              </NavLink>
            ))}
            {allowedRoutes.has("/dashboard/view-media") && (
              <NavLink to="/dashboard/view-media" className={({ isActive }) => cn("sidebar-item justify-center p-2", isActive && "sidebar-item-active")} title="View Media">
                <Eye className="w-5 h-5" />
              </NavLink>
            )}
            {visibleSettings.length > 0 && visibleSettings.map(item => (
              <NavLink key={item.to} to={item.to} className={({ isActive }) => cn("sidebar-item justify-center p-2", isActive && "sidebar-item-active")} title={item.label}>
                {item.icon}
              </NavLink>
            ))}
          </>
        ) : (
          <>
            <NavItem to="/dashboard" icon={<LayoutDashboard className="w-5 h-5" />} label="Dashboard" />
            {visibleMaster.length > 0 && (
              <CollapsibleMenu label="Master" icon={<Database className="w-5 h-5" />} items={visibleMaster} isActive={isMasterActive} defaultOpen={isMasterActive} />
            )}
            {visibleDeliveryPlan.length > 0 && (
              <CollapsibleMenu label="Delivery Plan" icon={<Calendar className="w-5 h-5" />} items={visibleDeliveryPlan} isActive={isDeliveryPlanActive} defaultOpen={isDeliveryPlanActive} />
            )}
            {visiblePreparation.length > 0 && (
              <CollapsibleMenu label="Preparation" icon={<PrepIcon className="w-5 h-5" />} items={visiblePreparation} isActive={isPreparationActive} defaultOpen={isPreparationActive} />
            )}
            {allowedRoutes.has("/dashboard/packing") && (
              <NavItem to="/dashboard/packing" icon={<PackageCheck className="w-5 h-5" />} label="Packing" />
            )}
            {allowedRoutes.has("/dashboard/cooking") && (
              <NavItem to="/dashboard/cooking" icon={<Flame className="w-5 h-5" />} label="Cooking" />
            )}
            {visibleCleaning.length > 0 && (
              <CollapsibleMenu label="Cleaning" icon={<SprayCan className="w-5 h-5" />} items={visibleCleaning} isActive={isCleaningActive} defaultOpen={isCleaningActive} />
            )}
            {visibleDistribution.length > 0 && (
              <CollapsibleMenu label="Distribution" icon={<Utensils className="w-5 h-5" />} items={visibleDistribution} isActive={isDistributionActive} defaultOpen={isDistributionActive} />
            )}
            {allowedRoutes.has("/dashboard/view-media") && (
              <NavItem to="/dashboard/view-media" icon={<Eye className="w-5 h-5" />} label="View Media" />
            )}
            {visibleSettings.length > 0 && (
              <CollapsibleMenu label="Settings" icon={<Settings className="w-5 h-5" />} items={visibleSettings} isActive={isSettingsActive} defaultOpen={isSettingsActive} />
            )}
          </>
        )}
      </nav>

      {/* User Section */}
      <div className={cn("border-t border-sidebar-border", collapsed ? "p-2" : "p-4")}>
        {!collapsed && (
          <div className="flex items-center gap-3 mb-4 px-2">
            <div className="w-9 h-9 rounded-lg bg-sidebar-accent flex items-center justify-center">
              <User className="w-4 h-4 text-sidebar-accent-foreground" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-sidebar-foreground truncate">
                {user?.user_name || "User"}
              </p>
              <p className="text-xs text-sidebar-foreground/60 capitalize">
                {user?.role_selection || "Guest"}
              </p>
            </div>
          </div>
        )}
        <Button
          variant="ghost"
          className={cn(
            "w-full text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent",
            collapsed ? "justify-center p-2" : "justify-start gap-3"
          )}
          onClick={handleLogout}
          title="Sign Out"
        >
          <LogOut className="w-4 h-4" />
          {!collapsed && "Sign Out"}
        </Button>
      </div>
    </aside>
  );
};

export default DashboardSidebar;
