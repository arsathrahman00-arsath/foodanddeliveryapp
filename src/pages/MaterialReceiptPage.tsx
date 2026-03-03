import React, { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { format } from "date-fns";
import { Plus, Loader2, Search, CalendarIcon, Package, Trash2, Save, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { materialReceiptApi } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { cn, toProperCase, formatDateForTable, numericOnly } from "@/lib/utils";

interface MatRecRecord {
  mat_rec_date: string;
  cat_name: string;
  sup_name: string;
  item_name: string;
  unit_short: string;
  mat_rec_qty: number | string;
}

interface CategoryData {
  cat_name: string;
  cat_code: string;
}

interface ItemRow {
  item_name: string;
  unit_short: string;
  day_req_qty: string;
  received_qty: string;
  selected: boolean;
}

interface CategoryTab {
  id: string;
  cat_name: string;
  cat_code: string;
  supplierName: string;
  supplierCode: string;
  supplierOptions: { sup_name: string; sup_code: string }[];
  supplierError: string;
  isLoadingSupplier: boolean;
  items: ItemRow[];
  isLoadingItems: boolean;
}

const standardizeUnit = (unit: string): string => {
  if (!unit) return "";
  return unit.charAt(0).toUpperCase() + unit.slice(1).toLowerCase();
};

const MaterialReceiptPage: React.FC = () => {
  const { toast } = useToast();
  const { user } = useAuth();

  // Records list state
  const [records, setRecords] = useState<MatRecRecord[]>([]);
  const [isLoadingRecords, setIsLoadingRecords] = useState(true);
  const [recordSearch, setRecordSearch] = useState("");

  // Dialog state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [showCloseWarning, setShowCloseWarning] = useState(false);
  const formInteracted = useRef(false);

  // Form state
  const today = new Date();
  const [receiptDate] = useState<Date>(today);
  const [purchaseReqDate, setPurchaseReqDate] = useState<Date | undefined>();
  const [purchaseType, setPurchaseType] = useState<string>("");
  const [categories, setCategories] = useState<CategoryData[]>([]);
  const [isLoadingCategories, setIsLoadingCategories] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [categoryTabs, setCategoryTabs] = useState<CategoryTab[]>([]);
  const [activeTabId, setActiveTabId] = useState<string>("");

  // Fetch records
  const fetchRecords = async () => {
    setIsLoadingRecords(true);
    try {
      const response = await materialReceiptApi.getAll();
      if (response.status === "success" && Array.isArray(response.data)) {
        setRecords(response.data);
      }
    } catch (error) {
      console.error("Failed to fetch material receipts:", error);
    } finally {
      setIsLoadingRecords(false);
    }
  };

  useEffect(() => { fetchRecords(); }, []);

  // Fetch categories when dialog opens
  useEffect(() => {
    if (!dialogOpen) return;
    const fetchCategories = async () => {
      setIsLoadingCategories(true);
      try {
        const response = await materialReceiptApi.getCategories();
        if (response.status === "success" && response.data) {
          setCategories(Array.isArray(response.data) ? response.data : []);
        }
      } catch (error) {
        console.error("Failed to fetch categories:", error);
      } finally {
        setIsLoadingCategories(false);
      }
    };
    fetchCategories();
  }, [dialogOpen]);

  const filteredRecords = recordSearch.trim()
    ? records.filter((r) => {
        const q = recordSearch.toLowerCase();
        return (
          r.item_name?.toLowerCase().includes(q) ||
          r.cat_name?.toLowerCase().includes(q) ||
          r.sup_name?.toLowerCase().includes(q)
        );
      })
    : records;

  // Form logic
  const usedCatCodes = useMemo(() => categoryTabs.map(t => t.cat_code), [categoryTabs]);
  const availableCategories = useMemo(
    () => categories.filter(c => !usedCatCodes.includes(c.cat_code)),
    [categories, usedCatCodes]
  );

  const fetchSupplierForTab = async (tabId: string, catCode: string) => {
    try {
      const response = await materialReceiptApi.getSuppliersByCategory(catCode);
      const options: { sup_name: string; sup_code: string }[] = [];
      let errorMsg = "";
      if (response.status === "success") {
        const res = response as any;
        const topSupName = res.sup_name;
        const topSupCode = res.sup_code;
        const data = response.data;
        if (topSupName) {
          const names = Array.isArray(topSupName) ? topSupName : [topSupName];
          const codes = Array.isArray(topSupCode) ? topSupCode : [topSupCode || ""];
          names.forEach((n: string, i: number) => options.push({ sup_name: n, sup_code: codes[i] || "" }));
        } else if (data) {
          if (Array.isArray(data)) data.forEach((d: any) => { if (d.sup_name) options.push({ sup_name: d.sup_name, sup_code: d.sup_code || "" }); });
          else if (data.sup_name) options.push({ sup_name: data.sup_name, sup_code: data.sup_code || "" });
        }
      } else if (response.status === "error") {
        errorMsg = (response as any).message || "Supplier not found for this category";
      }
      setCategoryTabs(prev => prev.map(tab =>
        tab.id === tabId ? { ...tab, supplierOptions: options, supplierName: options.length === 1 ? options[0].sup_name : "", supplierCode: options.length === 1 ? options[0].sup_code : "", supplierError: options.length === 0 && !errorMsg ? "No supplier found" : errorMsg, isLoadingSupplier: false } : tab
      ));
    } catch (error) {
      setCategoryTabs(prev => prev.map(tab =>
        tab.id === tabId ? { ...tab, isLoadingSupplier: false, supplierError: "Failed to fetch supplier" } : tab
      ));
    }
  };

  const addCategoryTab = useCallback((catName: string) => {
    const cat = categories.find(c => c.cat_name === catName);
    if (!cat) return;
    const tabId = `tab-${cat.cat_code}-${Date.now()}`;
    const newTab: CategoryTab = {
      id: tabId, cat_name: cat.cat_name, cat_code: cat.cat_code,
      supplierName: "", supplierCode: "", supplierOptions: [], supplierError: "",
      isLoadingSupplier: true, items: [], isLoadingItems: false,
    };
    setCategoryTabs(prev => [...prev, newTab]);
    setActiveTabId(tabId);
    fetchSupplierForTab(tabId, cat.cat_code);
  }, [categories]);

  const fetchItemsForTab = async (tabId: string, catName: string, supCode?: string) => {
    if (!purchaseReqDate || !purchaseType) return;
    const tab = categoryTabs.find(t => t.id === tabId);
    const resolvedSupCode = supCode || tab?.supplierCode || "";
    setCategoryTabs(prev => prev.map(t => t.id === tabId ? { ...t, isLoadingItems: true } : t));
    try {
      const response = await materialReceiptApi.getItemsByDateAndCategory({
        day_req_date: format(purchaseReqDate, "yyyy-MM-dd"),
        purc_type: purchaseType,
        cat_name: catName,
        sup_code: resolvedSupCode,
      });
      if (response.status === "success" && response.data) {
        const rawItems = Array.isArray(response.data) ? response.data : [];
        setCategoryTabs(prev => prev.map(tab =>
          tab.id === tabId ? {
            ...tab,
            items: rawItems.map((item: any) => ({
              item_name: item.item_name || "",
              unit_short: standardizeUnit(item.unit_short || ""),
              day_req_qty: String(item.day_req_qty || "0"),
              received_qty: "",
              selected: false,
            })),
            isLoadingItems: false,
          } : tab
        ));
      }
    } catch (error) {
      setCategoryTabs(prev => prev.map(tab => tab.id === tabId ? { ...tab, items: [], isLoadingItems: false } : tab));
    }
  };

  useEffect(() => {
    if (!purchaseReqDate || !purchaseType) return;
    categoryTabs.forEach(tab => {
      if (tab.items.length === 0 && !tab.isLoadingItems) {
        fetchItemsForTab(tab.id, tab.cat_name);
      }
    });
  }, [purchaseReqDate, purchaseType]);

  useEffect(() => {
    if (!purchaseReqDate || !purchaseType) return;
    const lastTab = categoryTabs[categoryTabs.length - 1];
    if (lastTab && lastTab.items.length === 0 && !lastTab.isLoadingItems) {
      fetchItemsForTab(lastTab.id, lastTab.cat_name);
    }
  }, [categoryTabs.length]);

  const updateTabSupplier = (tabId: string, value: string) => {
    const tab = categoryTabs.find(t => t.id === tabId);
    const sup = tab?.supplierOptions.find(s => s.sup_name === value);
    setCategoryTabs(prev => prev.map(t => t.id === tabId ? { ...t, supplierName: value, supplierCode: sup?.sup_code || "" } : t));
  };

  const updateTabItemQty = (tabId: string, index: number, value: string) => {
    setCategoryTabs(prev => prev.map(tab =>
      tab.id === tabId ? { ...tab, items: tab.items.map((item, i) => i === index ? { ...item, received_qty: value } : item) } : tab
    ));
  };

  const toggleItemSelection = (tabId: string, index: number) => {
    setCategoryTabs(prev => prev.map(tab =>
      tab.id === tabId ? { ...tab, items: tab.items.map((item, i) => i === index ? { ...item, selected: !item.selected } : item) } : tab
    ));
  };

  const toggleAllItemsInTab = (tabId: string) => {
    setCategoryTabs(prev => prev.map(tab => {
      if (tab.id !== tabId) return tab;
      const allSelected = tab.items.every(item => item.selected);
      return { ...tab, items: tab.items.map(item => ({ ...item, selected: !allSelected })) };
    }));
  };

  const removeTabItem = (tabId: string, index: number) => {
    setCategoryTabs(prev => prev.map(tab => {
      if (tab.id !== tabId || tab.items.length <= 1) return tab;
      return { ...tab, items: tab.items.filter((_, i) => i !== index) };
    }));
  };

  const removeCategoryTab = (tabId: string) => {
    setCategoryTabs(prev => {
      const updated = prev.filter(t => t.id !== tabId);
      if (activeTabId === tabId && updated.length > 0) setActiveTabId(updated[updated.length - 1].id);
      return updated;
    });
  };

  const selectedItems = useMemo(() => {
    const result: { tab: CategoryTab; item: ItemRow }[] = [];
    categoryTabs.forEach(tab => {
      tab.items.forEach(item => {
        if (item.selected) result.push({ tab, item });
      });
    });
    return result;
  }, [categoryTabs]);

  const resetForm = () => {
    setPurchaseReqDate(undefined);
    setPurchaseType("");
    setCategoryTabs([]);
    setActiveTabId("");
  };

  const handleSubmit = async () => {
    if (!purchaseReqDate) { toast({ title: "Validation Error", description: "Please select a Purchase Request Date", variant: "destructive" }); return; }
    if (!purchaseType) { toast({ title: "Validation Error", description: "Please select a Purchase Type", variant: "destructive" }); return; }
    if (categoryTabs.length === 0) { toast({ title: "Validation Error", description: "Please add at least one category", variant: "destructive" }); return; }

    // Only save selected items that have received_qty
    const itemsToSave = selectedItems.filter(({ item }) => item.received_qty && parseFloat(item.received_qty) > 0);
    if (itemsToSave.length === 0) { toast({ title: "Validation Error", description: "Please select items and fill in received quantity", variant: "destructive" }); return; }

    setIsSubmitting(true);
    const createdBy = user?.user_name || "system";
    const formattedReceiptDate = format(receiptDate, "yyyy-MM-dd");
    const formattedPurchaseReqDate = format(purchaseReqDate, "yyyy-MM-dd");

    try {
      const results = await Promise.allSettled(
        itemsToSave.map(({ tab, item }) =>
          materialReceiptApi.create({
            mat_rec_date: formattedReceiptDate,
            day_req_date: formattedPurchaseReqDate,
            sup_name: tab.supplierName,
            cat_name: tab.cat_name,
            item_name: item.item_name,
            unit_short: item.unit_short,
            mat_rec_qty: item.received_qty,
            created_by: createdBy,
          })
        )
      );

      const duplicates: string[] = [];
      let successCount = 0;
      let otherErrors: string[] = [];

      results.forEach((result, idx) => {
        if (result.status === "fulfilled") {
          const res = result.value;
          if (res.status === "error") {
            const itemName = itemsToSave[idx].item.item_name;
            if (res.message?.toLowerCase().includes("already exists")) duplicates.push(itemName);
            else otherErrors.push(`${itemName}: ${res.message}`);
          } else successCount++;
        } else otherErrors.push(itemsToSave[idx].item.item_name);
      });

      if (successCount > 0) toast({ title: "Success", description: `${successCount} material receipt(s) saved successfully` });
      if (duplicates.length > 0) toast({ title: "Duplicate Entries", description: `Already exists: ${duplicates.join(", ")}`, variant: "destructive" });
      if (otherErrors.length > 0) toast({ title: "Some Items Failed", description: otherErrors.join("; "), variant: "destructive" });

      if (successCount > 0 && duplicates.length === 0 && otherErrors.length === 0) {
        formInteracted.current = false;
        setDialogOpen(false);
        resetForm();
        fetchRecords();
      }
    } catch (error) {
      toast({ title: "Error", description: "Failed to save material receipts", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Material Receipt</h1>
          <p className="text-muted-foreground">Record incoming materials from suppliers</p>
        </div>

        <Dialog open={dialogOpen} onOpenChange={(open) => {
          if (!open && formInteracted.current) {
            setShowCloseWarning(true);
            return;
          }
          if (open) { formInteracted.current = false; resetForm(); }
          setDialogOpen(open);
        }}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="w-4 h-4" />
              New Material Receipt
            </Button>
          </DialogTrigger>
          <DialogContent
            className="sm:max-w-4xl max-h-[90vh] overflow-y-auto"
            onInteractOutside={(e) => e.preventDefault()}
            onEscapeKeyDown={(e) => e.preventDefault()}
          >
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Package className="w-5 h-5 text-primary" />
                New Material Receipt
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-6" onInput={() => { formInteracted.current = true; }} onChange={() => { formInteracted.current = true; }}>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Receipt Date</Label>
                  <Button variant="outline" className="w-full justify-start text-left font-normal cursor-default" disabled>
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {format(receiptDate, "PPP")}
                  </Button>
                </div>
                <div className="space-y-2">
                  <Label>Purchase Request Date</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !purchaseReqDate && "text-muted-foreground")}>
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {purchaseReqDate ? format(purchaseReqDate, "PPP") : "Select date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0 z-[200] bg-popover" align="start">
                      <Calendar mode="single" selected={purchaseReqDate} onSelect={setPurchaseReqDate} initialFocus className="pointer-events-auto" />
                    </PopoverContent>
                  </Popover>
                </div>
                <div className="space-y-2">
                  <Label>Purchase Type</Label>
                  <Select value={purchaseType} onValueChange={setPurchaseType}>
                    <SelectTrigger className="w-full"><SelectValue placeholder="Select type" /></SelectTrigger>
                    <SelectContent className="z-[200] bg-popover">
                      <SelectItem value="Retail">Retail</SelectItem>
                      <SelectItem value="Bulk">Bulk</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex items-end gap-3">
                <div className="space-y-2 flex-1 max-w-sm">
                  <Label>Add Category</Label>
                  <Select value="" onValueChange={addCategoryTab} disabled={isLoadingCategories || availableCategories.length === 0}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder={isLoadingCategories ? "Loading..." : availableCategories.length === 0 ? "All categories added" : "Select category to add"} />
                    </SelectTrigger>
                    <SelectContent className="z-[200] bg-popover">
                      {availableCategories.map((cat) => (
                        <SelectItem key={cat.cat_code} value={cat.cat_name}>{cat.cat_name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {categoryTabs.length > 0 && (
                <Tabs value={activeTabId} onValueChange={setActiveTabId} className="w-full">
                  <TabsList className="w-full justify-start flex-wrap h-auto gap-1 bg-muted/50 p-1">
                    {categoryTabs.map(tab => (
                      <TabsTrigger key={tab.id} value={tab.id} className="relative pr-7 data-[state=active]:bg-background">
                        {tab.cat_name}
                        <button type="button" onClick={(e) => { e.stopPropagation(); removeCategoryTab(tab.id); }} className="absolute right-1.5 top-1/2 -translate-y-1/2 rounded-full p-0.5 hover:bg-destructive/20 text-muted-foreground hover:text-destructive">
                          <X className="h-3 w-3" />
                        </button>
                      </TabsTrigger>
                    ))}
                  </TabsList>

                  {categoryTabs.map(tab => (
                    <TabsContent key={tab.id} value={tab.id} className="space-y-4 mt-4">
                      <div className="space-y-2 max-w-sm">
                        <Label>Supplier Name</Label>
                        {tab.isLoadingSupplier ? (
                          <div className="h-10 px-3 py-2 rounded-md border bg-muted flex items-center"><Loader2 className="h-4 w-4 animate-spin" /></div>
                        ) : tab.supplierError ? (
                          <div className="h-10 px-3 py-2 rounded-md border border-destructive/50 bg-destructive/10 flex items-center"><span className="text-sm text-destructive">{tab.supplierError}</span></div>
                        ) : (
                          <Select value={tab.supplierName} onValueChange={(v) => updateTabSupplier(tab.id, v)}>
                            <SelectTrigger className="w-full"><SelectValue placeholder="Select supplier" /></SelectTrigger>
                            <SelectContent className="z-[200] bg-popover">
                              {tab.supplierOptions.map(sup => (<SelectItem key={sup.sup_code || sup.sup_name} value={sup.sup_name}>{sup.sup_name}</SelectItem>))}
                            </SelectContent>
                          </Select>
                        )}
                      </div>

                      {tab.isLoadingItems && (
                        <div className="text-center py-8"><Loader2 className="h-6 w-6 animate-spin mx-auto" /><p className="text-sm text-muted-foreground mt-2">Loading items...</p></div>
                      )}

                      {!tab.isLoadingItems && tab.items.length > 0 && (
                        <div className="border rounded-lg overflow-hidden">
                          <div className="bg-muted/50 px-4 py-2"><h4 className="text-sm font-medium">Items in {tab.cat_name}</h4></div>
                          <Table>
                            <TableHeader>
                              <TableRow className="bg-muted/30">
                                <TableHead className="w-12">
                                  <Checkbox
                                    checked={tab.items.length > 0 && tab.items.every(item => item.selected)}
                                    onCheckedChange={() => toggleAllItemsInTab(tab.id)}
                                    aria-label="Select all items"
                                  />
                                </TableHead>
                                <TableHead>Item Name</TableHead>
                                <TableHead className="w-32">Unit of Measure</TableHead>
                                <TableHead className="w-36">Allocated Qty</TableHead>
                                <TableHead className="w-40">Received Quantity</TableHead>
                                <TableHead className="w-20">Action</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {tab.items.map((item, index) => (
                                <TableRow key={`${item.item_name}-${index}`} data-state={item.selected ? "selected" : undefined}>
                                  <TableCell>
                                    <Checkbox
                                      checked={item.selected}
                                      onCheckedChange={() => toggleItemSelection(tab.id, index)}
                                      aria-label={`Select ${item.item_name}`}
                                    />
                                  </TableCell>
                                  <TableCell className="font-medium">{toProperCase(item.item_name)}</TableCell>
                                  <TableCell>{toProperCase(item.unit_short)}</TableCell>
                                  <TableCell><span className="font-medium text-primary">{Number(item.day_req_qty).toFixed(2) || "—"}</span></TableCell>
                                  <TableCell>
                                    <Input type="number" min="0" step="0.01" placeholder="Enter qty" value={item.received_qty} onChange={(e) => updateTabItemQty(tab.id, index, e.target.value)} onKeyDown={numericOnly} className="h-9" />
                                  </TableCell>
                                  <TableCell>
                                    <Button type="button" variant="ghost" size="icon" onClick={() => removeTabItem(tab.id, index)} disabled={tab.items.length <= 1} className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10">
                                      <Trash2 className="w-4 h-4" />
                                    </Button>
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>
                      )}

                      {!tab.isLoadingItems && purchaseReqDate && purchaseType && tab.items.length === 0 && (
                        <div className="text-center py-4 text-muted-foreground border rounded-lg">No items found for {tab.cat_name}</div>
                      )}
                    </TabsContent>
                  ))}
                </Tabs>
              )}

              {selectedItems.length > 0 && (
                <div className="flex items-center justify-between pt-4 border-t">
                  <p className="text-sm text-muted-foreground">
                    Selected items: <span className="font-medium text-foreground">{selectedItems.length}</span>
                    {" across "}<span className="font-medium text-foreground">{new Set(selectedItems.map(v => v.tab.cat_name)).size}</span>{" category(ies)"}
                  </p>
                  <Button onClick={handleSubmit} disabled={isSubmitting} className="gap-2">
                    {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                    Save Selected ({selectedItems.filter(({ item }) => item.received_qty && parseFloat(item.received_qty) > 0).length} items)
                  </Button>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>

        <AlertDialog open={showCloseWarning} onOpenChange={setShowCloseWarning}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Discard changes?</AlertDialogTitle>
              <AlertDialogDescription>You have unsaved changes. Are you sure you want to close?</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={() => { formInteracted.current = false; setDialogOpen(false); resetForm(); setShowCloseWarning(false); }}>
                Discard
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>

      {/* Records Table */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <CardTitle className="text-lg">Receipt Records</CardTitle>
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search records..."
                value={recordSearch}
                onChange={(e) => setRecordSearch(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoadingRecords ? (
            <div className="flex justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          ) : filteredRecords.length === 0 ? (
            <p className="text-center py-12 text-muted-foreground">No records found</p>
          ) : (
            <div className="overflow-x-auto border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>#</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Supplier</TableHead>
                    <TableHead>Item Name</TableHead>
                    <TableHead>Unit</TableHead>
                    <TableHead className="text-right">Received Qty</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredRecords.map((rec, idx) => (
                    <TableRow key={idx}>
                      <TableCell>{idx + 1}</TableCell>
                      <TableCell>{formatDateForTable(rec.mat_rec_date)}</TableCell>
                      <TableCell>{toProperCase(rec.cat_name)}</TableCell>
                      <TableCell>{toProperCase(rec.sup_name)}</TableCell>
                      <TableCell>{toProperCase(rec.item_name)}</TableCell>
                      <TableCell>{rec.unit_short}</TableCell>
                      <TableCell className="text-right font-medium">
                        {Number(rec.mat_rec_qty).toFixed(2)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default MaterialReceiptPage;
