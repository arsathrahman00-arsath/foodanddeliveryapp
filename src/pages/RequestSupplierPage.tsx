import React, { useState, useEffect } from "react";
import { format } from "date-fns";
import { CalendarIcon, ClipboardList, Download, Loader2, Search } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { cn, toProperCase } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { dayRequirementsApi, itemCategoryApi, supplierRequisitionApi } from "@/lib/api";
import { generateSupplierReqPdf } from "@/lib/generateSupplierReqPdf";

interface RecipeData {
  recipe_code: string;
  recipe_type: string;
}

interface SupplierItem {
  item_name: string;
  cat_name: string;
  unit_short: string;
  day_req_qty: string | number;
  request_qty: string;
}

interface CategoryData {
  cat_name: string;
  cat_code: string;
}

const RequestSupplierPage: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();

  // Form state
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();
  const [recipeTypes, setRecipeTypes] = useState<RecipeData[]>([]);
  const [selectedRecipeCode, setSelectedRecipeCode] = useState("");
  const [suppliers, setSuppliers] = useState<{ sup_name: string; sup_code: string }[]>([]);
  const [selectedSupplier, setSelectedSupplier] = useState("");
  const [categories, setCategories] = useState<CategoryData[]>([]);
  const [selectedCatCode, setSelectedCatCode] = useState("");

  // Data state
  const [items, setItems] = useState<SupplierItem[]>([]);
  const [selectedIndices, setSelectedIndices] = useState<Set<number>>(new Set());
  const [isLoadingRecipes, setIsLoadingRecipes] = useState(false);
  const [isLoadingItems, setIsLoadingItems] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  // Fetch categories on mount
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const catRes = await itemCategoryApi.getAll();
        if (catRes.status === "success" && catRes.data) {
          setCategories(Array.isArray(catRes.data) ? catRes.data : []);
        }
      } catch (error) {
        console.error("Failed to fetch categories:", error);
      }
    };
    fetchCategories();
  }, []);

  // Fetch recipe types when date changes
  useEffect(() => {
    if (!selectedDate) {
      setRecipeTypes([]);
      setSelectedRecipeCode("");
      return;
    }
    const fetchRecipes = async () => {
      setIsLoadingRecipes(true);
      try {
        const formattedDate = format(selectedDate, "yyyy-MM-dd");
        const response = await dayRequirementsApi.getByDate(formattedDate);
        if (response.status === "success" && response.data) {
          const recipes = response.data.recipes || [];
          setRecipeTypes(recipes);
          if (recipes.length > 0) {
            setSelectedRecipeCode(recipes[0].recipe_code);
          } else {
            setSelectedRecipeCode("");
          }
        } else {
          setRecipeTypes([]);
          setSelectedRecipeCode("");
        }
      } catch (error) {
        console.error("Failed to fetch recipes:", error);
        setRecipeTypes([]);
        setSelectedRecipeCode("");
      } finally {
        setIsLoadingRecipes(false);
      }
    };
    fetchRecipes();
  }, [selectedDate]);

  // Fetch suppliers when category changes
  useEffect(() => {
    setSelectedSupplier("");
    setSuppliers([]);
    if (!selectedCatCode) return;
    const fetchSuppliersByCategory = async () => {
      try {
        const response = await supplierRequisitionApi.getSuppliersByCategory(selectedCatCode);
        const res = response as any;
        const parsed: { sup_name: string; sup_code: string }[] = [];
        if (response.status === "success" && res.sup_name) {
          const names = Array.isArray(res.sup_name) ? res.sup_name : [res.sup_name];
          const codes = Array.isArray(res.sup_code) ? res.sup_code : [res.sup_code || ""];
          names.forEach((n: string, i: number) => parsed.push({ sup_name: n, sup_code: codes[i] || "" }));
        } else if (response.status === "success" && response.data) {
          const arr = Array.isArray(response.data) ? response.data : [];
          arr.forEach((s: any) => parsed.push({ sup_name: s.sup_name || s, sup_code: s.sup_code || "" }));
        }
        setSuppliers(parsed);
      } catch (error) {
        console.error("Failed to fetch suppliers by category:", error);
        setSuppliers([]);
      }
    };
    fetchSuppliersByCategory();
  }, [selectedCatCode]);

  // Clear items when filters change
  useEffect(() => {
    setItems([]);
    setSelectedIndices(new Set());
  }, [selectedDate, selectedRecipeCode, selectedSupplier, selectedCatCode]);

  const selectedCategory = categories.find((c) => c.cat_code === selectedCatCode);
  const selectedRecipe = recipeTypes.find((r) => r.recipe_code === selectedRecipeCode);

  const canFetch = selectedDate && selectedRecipeCode && selectedSupplier && selectedCatCode;

  const updateRequestQty = (index: number, value: string) => {
    setItems(prev => prev.map((item, i) => i === index ? { ...item, request_qty: value } : item));
  };

  const toggleSelection = (index: number) => {
    setSelectedIndices(prev => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIndices.size === items.length) {
      setSelectedIndices(new Set());
    } else {
      setSelectedIndices(new Set(items.map((_, i) => i)));
    }
  };

  const handleFetchItems = async () => {
    if (!selectedDate || !selectedRecipeCode || !selectedCatCode) return;
    const selectedSup = suppliers.find(s => s.sup_name === selectedSupplier);

    setIsLoadingItems(true);
    try {
      const formattedDate = format(selectedDate, "yyyy-MM-dd");
      const response = await supplierRequisitionApi.getItems({
        sup_code: selectedSup?.sup_code || "",
        cat_code: selectedCatCode,
        day_req_date: formattedDate,
        recipe_code: selectedRecipeCode,
      });

      if (response.status === "success" && response.data) {
        const raw = Array.isArray(response.data) ? response.data : [];
        const mapped = raw.map((item: any) => ({
          ...item,
          request_qty: String(Number(item.day_req_qty) || 0),
        }));
        setItems(mapped);
        setSelectedIndices(new Set(mapped.map((_: any, i: number) => i)));
      } else {
        setItems([]);
        setSelectedIndices(new Set());
        toast({
          title: "No Data",
          description: response.message || "No items found for the selected filters",
        });
      }
    } catch (error) {
      console.error("Failed to fetch supplier items:", error);
      toast({ title: "Error", description: "Failed to fetch items", variant: "destructive" });
    } finally {
      setIsLoadingItems(false);
    }
  };

  const handleDownloadPdf = async () => {
    if (!selectedDate || !selectedRecipe || !selectedCategory) return;
    const selectedItems = items.filter((_, i) => selectedIndices.has(i));
    if (selectedItems.length === 0) {
      toast({ title: "No Selection", description: "Please select at least one item to download", variant: "destructive" });
      return;
    }
    setIsDownloading(true);
    try {
      const result = await generateSupplierReqPdf({
        date: format(selectedDate, "yyyy-MM-dd"),
        recipeType: selectedRecipe.recipe_type,
        supplierName: selectedSupplier,
        categoryName: selectedCategory.cat_name,
        items: selectedItems,
      });
      const { handlePdfResult } = await import("@/lib/handlePdfResult");
      handlePdfResult(result);
    } catch (error) {
      console.error("PDF generation failed:", error);
      toast({ title: "Error", description: "Failed to generate PDF", variant: "destructive" });
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card className="shadow-warm border-0">
        <CardHeader className="pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-warm flex items-center justify-center">
              <ClipboardList className="w-5 h-5 text-primary-foreground" />
            </div>
            <div>
              <CardTitle className="text-xl">Request For Supplier</CardTitle>
              <CardDescription>Generate supplier requisition requests based on daily requirements</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Filter Controls */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {/* Date Picker */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Date</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn("w-full justify-start text-left font-normal", !selectedDate && "text-muted-foreground")}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {selectedDate ? format(selectedDate, "PPP") : "Pick a date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 z-[200]" align="start">
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={setSelectedDate}
                    initialFocus
                    className="p-3 pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* Recipe Type */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Recipe Type</label>
              <Select value={selectedRecipeCode} onValueChange={setSelectedRecipeCode} disabled={!selectedDate || isLoadingRecipes}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder={isLoadingRecipes ? "Loading..." : "Select recipe type"} />
                </SelectTrigger>
                <SelectContent className="z-[200] bg-popover">
                  {recipeTypes.map((r) => (
                    <SelectItem key={r.recipe_code} value={r.recipe_code}>
                      {r.recipe_type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Category */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Category</label>
              <Select value={selectedCatCode} onValueChange={setSelectedCatCode}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent className="z-[200] bg-popover">
                  {categories.map((c) => (
                    <SelectItem key={c.cat_code} value={c.cat_code}>{c.cat_name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Supplier */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Supplier</label>
              <Select value={selectedSupplier} onValueChange={setSelectedSupplier}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select supplier" />
                </SelectTrigger>
                <SelectContent className="z-[200] bg-popover">
                  {suppliers.map((s) => (
                    <SelectItem key={s.sup_code || s.sup_name} value={s.sup_name}>{s.sup_name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 mb-6">
            <Button onClick={handleFetchItems} disabled={!canFetch || isLoadingItems} className="gap-2">
              {isLoadingItems ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
              Get Items
            </Button>
            {items.length > 0 && (
              <Button onClick={handleDownloadPdf} variant="outline" disabled={isDownloading || selectedIndices.size === 0} className="gap-2">
                {isDownloading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                Download PDF ({selectedIndices.size})
              </Button>
            )}
          </div>

          {/* Items Table */}
          {isLoadingItems ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
              <span className="ml-2 text-muted-foreground">Loading items...</span>
            </div>
          ) : items.length > 0 ? (
            <div className="rounded-lg border overflow-hidden">
              <Table>
                <TableHeader>
                   <TableRow className="bg-muted/50">
                     <TableHead className="w-12">
                       <Checkbox
                         checked={selectedIndices.size === items.length && items.length > 0}
                         onCheckedChange={toggleSelectAll}
                         aria-label="Select all"
                       />
                     </TableHead>
                     <TableHead className="w-12">#</TableHead>
                     <TableHead>Item Name</TableHead>
                     <TableHead>Category</TableHead>
                     <TableHead>Unit</TableHead>
                     <TableHead className="text-right">Req Qty</TableHead>
                     <TableHead className="text-right">Request Qty</TableHead>
                   </TableRow>
                 </TableHeader>
                 <TableBody>
                   {items.map((item, index) => (
                     <TableRow key={index} data-state={selectedIndices.has(index) ? "selected" : undefined}>
                       <TableCell>
                         <Checkbox
                           checked={selectedIndices.has(index)}
                           onCheckedChange={() => toggleSelection(index)}
                           aria-label={`Select ${item.item_name}`}
                         />
                       </TableCell>
                       <TableCell className="font-medium">{index + 1}</TableCell>
                       <TableCell>{toProperCase(item.item_name)}</TableCell>
                       <TableCell>{toProperCase(item.cat_name)}</TableCell>
                       <TableCell>{item.unit_short}</TableCell>
                       <TableCell className="text-right">{Number(item.day_req_qty).toFixed(2)}</TableCell>
                       <TableCell className="text-right">
                         <Input
                           type="number"
                           value={item.request_qty}
                           onChange={(e) => updateRequestQty(index, e.target.value)}
                           className="w-24 text-right ml-auto"
                           min="0"
                           step="0.01"
                         />
                       </TableCell>
                     </TableRow>
                   ))}
                 </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              Select all filters and click "Get Items" to view supplier requisition data.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default RequestSupplierPage;
