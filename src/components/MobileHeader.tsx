import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { ChefHat, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

const pageTitles: Record<string, string> = {
  "/dashboard": "Home",
  "/dashboard/location": "Location",
  "/dashboard/item-category": "Item Category",
  "/dashboard/unit": "Unit",
  "/dashboard/item": "Item",
  "/dashboard/supplier": "Supplier",
  "/dashboard/recipe-type": "Recipe Type",
  "/dashboard/recipe": "Recipe",
  "/dashboard/schedule": "Schedule",
  "/dashboard/requirement": "Requirement",
  "/dashboard/day-requirements": "Purchase Request",
  "/dashboard/material-receipt": "Material Receipt",
  "/dashboard/request-supplier": "Supplier Request",
  "/dashboard/packing": "Packing",
  "/dashboard/cooking": "Cooking",
  "/dashboard/food-allocation": "Food Allocation",
  "/dashboard/delivery": "Delivery",
  "/dashboard/cleaning/material": "Materials Cleaning",
  "/dashboard/cleaning/vessel": "Vessel Cleaning",
  "/dashboard/cleaning/prep": "Prep Cleaning",
  "/dashboard/cleaning/pack": "Pack Cleaning",
  "/dashboard/view-media": "View Media",
  "/dashboard/settings/module-master": "Module Master",
  "/dashboard/settings/user-rights": "User Rights",
};

const MobileHeader: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const isHome = location.pathname === "/dashboard";
  const title = pageTitles[location.pathname] || "FPDA";

  return (
    <header className="mobile-header flex items-center gap-3">
      {!isHome ? (
        <Button
          variant="ghost"
          size="icon"
          className="touch-target -ml-2"
          onClick={() => navigate(-1)}
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>
      ) : (
        <div className="w-8 h-8 rounded-lg bg-gradient-warm flex items-center justify-center">
          <ChefHat className="w-4 h-4 text-primary-foreground" />
        </div>
      )}
      <h1 className="text-lg font-bold text-foreground truncate">{title}</h1>
    </header>
  );
};

export default MobileHeader;
