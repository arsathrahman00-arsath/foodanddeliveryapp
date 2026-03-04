import React, { useState, useEffect } from "react";
import { format } from "date-fns";
import { CalendarIcon, DollarSign, Edit, Loader2, Plus, Save, Search, Trash2 } from "lucide-react";
import RecipeCostByDate from "@/components/RecipeCostByDate";
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { cn, formatDateForTable, numericOnly } from "@/lib/utils";
import { recipeCostApi, recipeTypeListApi, dayRequirementsApi, getApiErrorMessage } from "@/lib/api";

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
  cat_code: number | string;
  unit_short: string;
  req_qty: number;
  item_rate: number;
  _isManual?: boolean;
}

const RecipeCostPage: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();

  // Table state
  const [records, setRecords] = useState<RecipeCostRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [appliedSearchQuery, setAppliedSearchQuery] = useState("");

  // Dialog state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editRecord, setEditRecord] = useState<RecipeCostRecord | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();
  const [recipeTypes, setRecipeTypes] = useState<RecipeTypeOption[]>([]);
  const [selectedRecipeCode, setSelectedRecipeCode] = useState("");
  const [ingredients, setIngredients] = useState<IngredientRow[]>([]);
  const [isLoadingRecipeTypes, setIsLoadingRecipeTypes] = useState(false);
  const [isLoadingIngredients, setIsLoadingIngredients] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Delete state
  const [deleteRecord, setDeleteRecord] = useState<RecipeCostRecord | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

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

  // Fetch recipe types: date-based for Add mode, generic for Edit mode
  useEffect(() => {
    if (!dialogOpen) return;

    if (isEditMode) {
      // Edit mode: use generic list
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
    }
  }, [dialogOpen, isEditMode]);

  // Add mode: fetch recipe types by date
  useEffect(() => {
    if (!dialogOpen || isEditMode || !selectedDate) {
      if (!isEditMode) {
        setRecipeTypes([]);
        setSelectedRecipeCode("");
      }
      return;
    }
    const fetchByDate = async () => {
      setIsLoadingRecipeTypes(true);
      try {
        const formattedDate = format(selectedDate, "yyyy-MM-dd");
        const response = await dayRequirementsApi.getByDate(formattedDate);
        if (response.status === "success" && response.data) {
          const recipes = response.data.recipes || [];
          const mapped = recipes.map((r: any) => ({
            recipe_type: r.recipe_type,
            recipe_code: r.recipe_code,
            recipe_perkg: 0,
            recipe_totpkt: 0,
          }));
          setRecipeTypes(mapped);
          if (mapped.length > 0) {
            setSelectedRecipeCode(String(mapped[0].recipe_code));
          }
        }
      } catch (error) {
        console.error("Failed to fetch recipe types by date:", error);
        toast({ title: "Error", description: getApiErrorMessage(error), variant: "destructive" });
      } finally {
        setIsLoadingRecipeTypes(false);
      }
    };
    fetchByDate();
  }, [dialogOpen, isEditMode, selectedDate]);

  // Fetch ingredients when recipe type and date are selected
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
        let response;
        if (isEditMode && selectedDate) {
          const formattedDate = format(selectedDate, "yyyy-MM-dd");
          response = await recipeCostApi.getByDate({ day_rcp_date: formattedDate });
        } else {
          response = await recipeCostApi.getIngredients();
        }
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
  }, [selectedRecipeCode, selectedDate, dialogOpen, isEditMode]);

  // Update ingredient field
  const updateIngredient = (index: number, field: "req_qty" | "item_rate", value: string) => {
    setIngredients((prev) =>
      prev.map((item, i) =>
        i === index ? { ...item, [field]: Number(value) || 0 } : item
      )
    );
  };

  // Update manual ingredient text field
  const updateIngredientText = (index: number, field: "cat_name" | "item_name" | "unit_short", value: string) => {
    setIngredients((prev) =>
      prev.map((item, i) =>
        i === index ? { ...item, [field]: value } : item
      )
    );
  };

  // Add manual ingredient row
  const addManualIngredient = () => {
    const selectedType = recipeTypes.find((rt) => String(rt.recipe_code) === selectedRecipeCode);
    setIngredients((prev) => [
      ...prev,
      {
        recipe_type: selectedType?.recipe_type || "",
        item_name: "",
        item_code: "",
        cat_name: "",
        cat_code: "",
        unit_short: "",
        req_qty: 0,
        item_rate: 0,
        _isManual: true,
      } as IngredientRow & { _isManual?: boolean },
    ]);
  };

  // Remove manual ingredient row
  const removeManualIngredient = (index: number) => {
    setIngredients((prev) => prev.filter((_, i) => i !== index));
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
    setIsEditMode(false);
    setEditRecord(null);
  };

  // Open Add dialog
  const handleOpenAdd = () => {
    resetDialog();
    setDialogOpen(true);
  };

  // Open Edit dialog
  const handleOpenEdit = (record: RecipeCostRecord) => {
    setIsEditMode(true);
    setEditRecord(record);
    // Parse the date
    const dateParts = record.day_rcp_date.split("-");
    if (dateParts.length === 3) {
      setSelectedDate(new Date(record.day_rcp_date));
    } else {
      setSelectedDate(new Date(record.day_rcp_date));
    }
    setDialogOpen(true);
    // recipe code will be set after recipeTypes load
  };

  // Set recipe code once recipeTypes are loaded in edit mode
  useEffect(() => {
    if (isEditMode && editRecord && recipeTypes.length > 0 && !selectedRecipeCode) {
      const match = recipeTypes.find(
        (rt) => rt.recipe_type === editRecord.recipe_type
      );
      if (match) {
        setSelectedRecipeCode(String(match.recipe_code));
      }
    }
  }, [isEditMode, editRecord, recipeTypes]);

  // Submit (create or update)
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
        const payload = {
          day_rcp_date: formattedDate,
          recipe_type: selectedType.recipe_type,
          recipe_code: String(selectedType.recipe_code),
          cat_name: item.cat_name || "",
          cat_code: String(item.cat_code || ""),
          item_name: item.item_name,
          item_code: String(item.item_code),
          unit_short: item.unit_short,
          req_qty: String(item.req_qty),
          item_rate: String(item.item_rate),
          total_rate: totalRate,
          created_by: user?.user_name || "",
        };

        if (isEditMode) {
          await recipeCostApi.update(payload);
        } else {
          await recipeCostApi.create(payload);
        }
      }

      toast({
        title: "Success",
        description: isEditMode
          ? "Recipe cost updated successfully"
          : "Recipe cost saved successfully",
      });
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

  // Delete
  const handleDelete = async () => {
    if (!deleteRecord) return;
    setIsDeleting(true);
    try {
      await recipeCostApi.delete({
        day_rcp_date: deleteRecord.day_rcp_date,
        recipe_type: deleteRecord.recipe_type,
      });
      toast({ title: "Success", description: "Recipe cost deleted successfully" });
      setDeleteRecord(null);
      fetchRecords();
    } catch (error) {
      console.error("Failed to delete recipe cost:", error);
      toast({ title: "Error", description: getApiErrorMessage(error), variant: "destructive" });
    } finally {
      setIsDeleting(false);
    }
  };

  // Filtered records
  const filteredRecords = appliedSearchQuery.trim()
    ? records.filter((r) => {
        const q = appliedSearchQuery.toLowerCase();
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
        <Button onClick={handleOpenAdd} className="gap-2">
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
                onKeyDown={(e) => {
                  if (e.key === "Enter") setAppliedSearchQuery(searchQuery);
                }}
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
                    <TableHead className="text-center">Actions</TableHead>
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
                      <TableCell>
                        <div className="flex items-center justify-center gap-2">
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => handleOpenEdit(record)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-8 w-8 text-destructive hover:text-destructive"
                            onClick={() => setDeleteRecord(record)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recipe Cost By Date Section */}
      <RecipeCostByDate />

      {/* Add/Edit Recipe Cost Dialog */}
      <Dialog
        open={dialogOpen}
        onOpenChange={(open) => {
          if (!open) {
            resetDialog();
          }
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
              {isEditMode ? "Edit Daily Recipe Cost" : "Add Daily Recipe Cost"}
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
                      disabled={isEditMode}
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !selectedDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {selectedDate ? format(selectedDate, "dd-MM-yyyy") : "Select date"}
                    </Button>
                  </PopoverTrigger>
                  {!isEditMode && (
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={selectedDate}
                        onSelect={setSelectedDate}
                        initialFocus
                        className={cn("p-3 pointer-events-auto")}
                      />
                    </PopoverContent>
                  )}
                </Popover>
              </div>

              {/* Recipe Type */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Recipe Type</label>
                <Select
                  value={selectedRecipeCode}
                  onValueChange={setSelectedRecipeCode}
                  disabled={isLoadingRecipeTypes || isEditMode}
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
                        <TableHead className="w-10"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {ingredients.map((item, index) => {
                        const totalRate = item.req_qty * item.item_rate;
                        const isManual = !!(item as any)._isManual;
                        return (
                          <TableRow key={index}>
                            <TableCell>{index + 1}</TableCell>
                            <TableCell>
                              {isManual ? (
                                <Input
                                  value={item.cat_name}
                                  onChange={(e) => updateIngredientText(index, "cat_name", e.target.value)}
                                  placeholder="Category"
                                  className="w-28"
                                />
                              ) : (
                                item.cat_name
                              )}
                            </TableCell>
                            <TableCell>
                              {isManual ? (
                                <Input
                                  value={item.item_name}
                                  onChange={(e) => updateIngredientText(index, "item_name", e.target.value)}
                                  placeholder="Item name"
                                  className="w-32"
                                />
                              ) : (
                                item.item_name
                              )}
                            </TableCell>
                            <TableCell>
                              {isManual ? (
                                <Input
                                  value={item.unit_short}
                                  onChange={(e) => updateIngredientText(index, "unit_short", e.target.value)}
                                  placeholder="Unit"
                                  className="w-16"
                                />
                              ) : (
                                item.unit_short
                              )}
                            </TableCell>
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
                            <TableCell>
                              {isManual && (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 text-destructive hover:text-destructive"
                                  onClick={() => removeManualIngredient(index)}
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              )}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                      {/* Grand Total Row */}
                      <TableRow className="bg-muted/50 font-bold">
                        <TableCell colSpan={7} className="text-right">
                          Grand Total
                        </TableCell>
                        <TableCell className="text-right">
                          ₹{grandTotal.toFixed(2)}
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </div>
                {!isEditMode && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-2 mt-2"
                    onClick={addManualIngredient}
                  >
                    <Plus className="w-4 h-4" />
                    Add Manual Ingredient
                  </Button>
                )}
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
                {isEditMode ? "Update Recipe Cost" : "Save Recipe Cost"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteRecord} onOpenChange={(open) => !open && setDeleteRecord(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Recipe Cost</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete the recipe cost for{" "}
              <span className="font-semibold">{deleteRecord?.recipe_type}</span> on{" "}
              <span className="font-semibold">{deleteRecord ? formatDateForTable(deleteRecord.day_rcp_date) : ""}</span>?
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default RecipeCostPage;
