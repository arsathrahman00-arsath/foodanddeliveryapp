import React, { useState, useEffect } from "react";
import { format } from "date-fns";
import { CalendarIcon, DollarSign, Loader2, Plus, Save, Search } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { cn, formatDateForTable, numericOnly } from "@/lib/utils";
import { recipeCostApi, recipeTypeListApi, getApiErrorMessage } from "@/lib/api";

interface RecipeCostRecord {
  day_rcp_date: string;
  recipe_type: string;
  total_rate: number | string;
  created_by: string;
}

interface RecipeTypeOption {
  recipe_type: string;
  recipe_code: number | string;
  recipe_perkg: number;
  recipe_totpkt: number;
}

interface IngredientRow {
  recipe_type: string;
  item_name: string;
  item_code: number | string;
  cat_name: string;
  unit_short: string;
  req_qty: number;
  item_rate: number;
}

const RecipeCostPage: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();

  // Table state
  const [records, setRecords] = useState<RecipeCostRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  // Dialog state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();
  const [recipeTypes, setRecipeTypes] = useState<RecipeTypeOption[]>([]);
  const [selectedRecipeCode, setSelectedRecipeCode] = useState("");
  const [ingredients, setIngredients] = useState<IngredientRow[]>([]);
  const [isLoadingRecipeTypes, setIsLoadingRecipeTypes] = useState(false);
  const [isLoadingIngredients, setIsLoadingIngredients] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch existing records
  const fetchRecords = async () => {
    setIsLoading(true);
    try {
      const response = await recipeCostApi.getAll();
      if (response.status === "success" && Array.isArray(response.data)) {
        setRecords(response.data);
      }
    } catch (error) {
      console.error("Failed to fetch recipe costs:", error);
      toast({ title: "Error", description: getApiErrorMessage(error), variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRecords();
  }, []);

  // Fetch recipe types when dialog opens
  useEffect(() => {
    if (!dialogOpen) return;
    const fetchRecipeTypes = async () => {
      setIsLoadingRecipeTypes(true);
      try {
        const response = await recipeTypeListApi.getAll();
        if (response.status === "success" && Array.isArray(response.data)) {
          setRecipeTypes(response.data);
        }
      } catch (error) {
        console.error("Failed to fetch recipe types:", error);
        toast({ title: "Error", description: getApiErrorMessage(error), variant: "destructive" });
      } finally {
        setIsLoadingRecipeTypes(false);
      }
    };
    fetchRecipeTypes();
  }, [dialogOpen]);

  // Fetch ingredients when recipe type is selected
  useEffect(() => {
    if (!dialogOpen || !selectedRecipeCode) {
      setIngredients([]);
      return;
    }
    const selectedType = recipeTypes.find(
      (rt) => String(rt.recipe_code) === selectedRecipeCode
    );
    if (!selectedType) return;

    const fetchIngredients = async () => {
      setIsLoadingIngredients(true);
      try {
        const response = await recipeCostApi.getIngredients();
        if (response.status === "success" && Array.isArray(response.data)) {
          const filtered = response.data
            .filter((item: any) => item.recipe_type === selectedType.recipe_type)
            .map((item: any) => ({
              ...item,
              req_qty: Number(item.req_qty) || 0,
              item_rate: Number(item.item_rate) || 0,
            }));
          setIngredients(filtered);
        }
      } catch (error) {
        console.error("Failed to fetch ingredients:", error);
        toast({ title: "Error", description: getApiErrorMessage(error), variant: "destructive" });
      } finally {
        setIsLoadingIngredients(false);
      }
    };
    fetchIngredients();
  }, [selectedRecipeCode, dialogOpen]);

  // Update ingredient field
  const updateIngredient = (index: number, field: "req_qty" | "item_rate", value: string) => {
    setIngredients((prev) =>
      prev.map((item, i) =>
        i === index ? { ...item, [field]: Number(value) || 0 } : item
      )
    );
  };

  const grandTotal = ingredients.reduce(
    (sum, item) => sum + item.req_qty * item.item_rate,
    0
  );

  // Reset dialog
  const resetDialog = () => {
    setSelectedDate(undefined);
    setSelectedRecipeCode("");
    setIngredients([]);
  };

  // Submit
  const handleSubmit = async () => {
    if (!selectedDate || !selectedRecipeCode || ingredients.length === 0) {
      toast({
        title: "Validation Error",
        description: "Please select a date, recipe type, and ensure ingredients are loaded",
        variant: "destructive",
      });
      return;
    }

    const hasIncomplete = ingredients.some((item) => item.item_rate <= 0);
    if (hasIncomplete) {
      toast({
        title: "Validation Error",
        description: "Please enter a unit rate for all items",
        variant: "destructive",
      });
      return;
    }

    const selectedType = recipeTypes.find(
      (rt) => String(rt.recipe_code) === selectedRecipeCode
    );
    if (!selectedType) return;

    setIsSubmitting(true);
    try {
      const formattedDate = format(selectedDate, "yyyy-MM-dd");

      for (const item of ingredients) {
        const totalRate = (item.req_qty * item.item_rate).toFixed(2);
        await recipeCostApi.create({
          day_rcp_date: formattedDate,
          recipe_type: selectedType.recipe_type,
          recipe_code: String(selectedType.recipe_code),
          cat_name: item.cat_name || "",
          cat_code: "",
          item_name: item.item_name,
          item_code: String(item.item_code),
          unit_short: item.unit_short,
          req_qty: String(item.req_qty),
          item_rate: String(item.item_rate),
          total_rate: totalRate,
          created_by: user?.user_name || "",
        });
      }

      toast({ title: "Success", description: "Recipe cost saved successfully" });
      resetDialog();
      setDialogOpen(false);
      fetchRecords();
    } catch (error) {
      console.error("Failed to save recipe cost:", error);
      toast({ title: "Error", description: getApiErrorMessage(error), variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filtered records
  const filteredRecords = searchQuery.trim()
    ? records.filter((r) => {
        const q = searchQuery.toLowerCase();
        return (
          formatDateForTable(r.day_rcp_date).toLowerCase().includes(q) ||
          (r.recipe_type && r.recipe_type.toLowerCase().includes(q)) ||
          String(r.total_rate).includes(q) ||
          (r.created_by && r.created_by.toLowerCase().includes(q))
        );
      })
    : records;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <DollarSign className="w-6 h-6 text-primary" />
            Daily Recipe Cost
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Track ingredient costs for recipe types on a daily basis
          </p>
        </div>
        <Button onClick={() => setDialogOpen(true)} className="gap-2">
          <Plus className="w-4 h-4" />
          Add Recipe Cost
        </Button>
      </div>

      {/* Data Table */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <CardTitle className="text-lg">Cost Records</CardTitle>
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search records..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          ) : filteredRecords.length === 0 ? (
            <p className="text-center py-12 text-muted-foreground">No records found</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>#</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Recipe Type</TableHead>
                    <TableHead className="text-right">Total Rate</TableHead>
                    <TableHead>Created By</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredRecords.map((record, index) => (
                    <TableRow key={index}>
                      <TableCell>{index + 1}</TableCell>
                      <TableCell>{formatDateForTable(record.day_rcp_date)}</TableCell>
                      <TableCell>{record.recipe_type}</TableCell>
                      <TableCell className="text-right font-medium">
                        ₹{Number(record.total_rate).toFixed(2)}
                      </TableCell>
                      <TableCell>{record.created_by}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Recipe Cost Dialog */}
      <Dialog
        open={dialogOpen}
        onOpenChange={(open) => {
          // Only allow closing via X button or programmatic close
          if (!open) return;
          setDialogOpen(open);
        }}
      >
        <DialogContent
          className="max-w-4xl max-h-[90vh] overflow-y-auto"
          onPointerDownOutside={(e) => e.preventDefault()}
          onEscapeKeyDown={(e) => e.preventDefault()}
        >
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-primary" />
              Add Daily Recipe Cost
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 mt-2">
            {/* Date & Recipe Type Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Date Picker */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Date</label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !selectedDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {selectedDate ? format(selectedDate, "dd-MM-yyyy") : "Select date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={selectedDate}
                      onSelect={setSelectedDate}
                      initialFocus
                      className={cn("p-3 pointer-events-auto")}
                    />
                  </PopoverContent>
                </Popover>
              </div>

              {/* Recipe Type */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Recipe Type</label>
                <Select
                  value={selectedRecipeCode}
                  onValueChange={setSelectedRecipeCode}
                  disabled={isLoadingRecipeTypes}
                >
                  <SelectTrigger>
                    <SelectValue
                      placeholder={
                        isLoadingRecipeTypes ? "Loading..." : "Select recipe type"
                      }
                    />
                  </SelectTrigger>
                  <SelectContent className="bg-background">
                    {recipeTypes.map((rt) => (
                      <SelectItem
                        key={rt.recipe_code}
                        value={String(rt.recipe_code)}
                      >
                        {rt.recipe_type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Ingredients Grid */}
            {isLoadingIngredients ? (
              <div className="flex justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
              </div>
            ) : ingredients.length > 0 ? (
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-foreground">
                  Ingredients ({ingredients.length})
                </h3>
                <div className="overflow-x-auto border rounded-lg">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>#</TableHead>
                        <TableHead>Category</TableHead>
                        <TableHead>Item Name</TableHead>
                        <TableHead>Unit</TableHead>
                        <TableHead className="text-right">Req Qty</TableHead>
                        <TableHead className="text-right">Unit Rate (₹)</TableHead>
                        <TableHead className="text-right">Total (₹)</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {ingredients.map((item, index) => {
                        const totalRate = item.req_qty * item.item_rate;
                        return (
                          <TableRow key={index}>
                            <TableCell>{index + 1}</TableCell>
                            <TableCell>{item.cat_name}</TableCell>
                            <TableCell>{item.item_name}</TableCell>
                            <TableCell>{item.unit_short}</TableCell>
                            <TableCell className="text-right">
                              <Input
                                type="number"
                                value={item.req_qty || ""}
                                onChange={(e) =>
                                  updateIngredient(index, "req_qty", e.target.value)
                                }
                                onKeyDown={numericOnly}
                                className="w-20 text-right ml-auto"
                                min="0"
                              />
                            </TableCell>
                            <TableCell className="text-right">
                              <Input
                                type="number"
                                value={item.item_rate || ""}
                                onChange={(e) =>
                                  updateIngredient(index, "item_rate", e.target.value)
                                }
                                onKeyDown={numericOnly}
                                className="w-24 text-right ml-auto"
                                min="0"
                                step="0.01"
                              />
                            </TableCell>
                            <TableCell className="text-right font-medium">
                              ₹{totalRate.toFixed(2)}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                      {/* Grand Total Row */}
                      <TableRow className="bg-muted/50 font-bold">
                        <TableCell colSpan={6} className="text-right">
                          Grand Total
                        </TableCell>
                        <TableCell className="text-right">
                          ₹{grandTotal.toFixed(2)}
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </div>
              </div>
            ) : selectedRecipeCode ? (
              <p className="text-center py-6 text-muted-foreground">
                No ingredients found for this recipe type
              </p>
            ) : null}

            {/* Action Buttons */}
            <div className="flex justify-end gap-3 pt-2">
              <Button
                variant="outline"
                onClick={() => {
                  resetDialog();
                  setDialogOpen(false);
                }}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={
                  isSubmitting ||
                  !selectedDate ||
                  !selectedRecipeCode ||
                  ingredients.length === 0
                }
                className="gap-2"
              >
                {isSubmitting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
                Save Recipe Cost
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default RecipeCostPage;
