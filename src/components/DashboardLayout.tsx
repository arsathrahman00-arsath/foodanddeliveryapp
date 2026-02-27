import React, { useState } from "react";
import { Outlet } from "react-router-dom";
import { useIsMobile } from "@/hooks/use-mobile";
import BottomNavBar from "@/components/BottomNavBar";
import MobileDrawerMenu from "@/components/MobileDrawerMenu";
import MobileHeader from "@/components/MobileHeader";
import DashboardSidebar from "@/components/DashboardSidebar";

const DashboardLayout: React.FC = () => {
  const isMobile = useIsMobile();
  const [menuOpen, setMenuOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Desktop: keep existing sidebar layout
  if (!isMobile) {
    return (
      <div className="min-h-screen bg-background">
        <DashboardSidebar collapsed={sidebarCollapsed} onToggle={() => setSidebarCollapsed(prev => !prev)} />
        <main className={`min-h-screen transition-all duration-300 ${sidebarCollapsed ? "ml-16" : "ml-64"}`}>
          <div className="p-8">
            <Outlet />
          </div>
        </main>
      </div>
    );
  }

  // Mobile: bottom nav + header + drawer
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <MobileHeader />
      <main className="flex-1 page-container animate-fade-in">
        <Outlet />
      </main>
      <BottomNavBar onMenuOpen={() => setMenuOpen(true)} />
      <MobileDrawerMenu isOpen={menuOpen} onClose={() => setMenuOpen(false)} />
    </div>
  );
};

export default DashboardLayout;
