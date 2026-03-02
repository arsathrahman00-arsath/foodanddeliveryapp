import React, { useState } from "react";
import { format } from "date-fns";
import { CalendarIcon, Edit, FileText, Loader2, Save, Search } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { cn, numericOnly } from "@/lib/utils";
import { recipeCostApi, getApiErrorMessage } from "@/lib/api";
import { generateRecipeCostPdf } from "@/lib/generateRecipeCostPdf";
import { handlePdfResult } from "@/lib/handlePdfResult";

interface CostRow {
  day_rcp_date: string;
  recipe_type: string;
  recipe_code: number | string;
  cat_name: string;
  cat_code?: number | string;
  item_name: string;
  item_code: number | string;
  unit_short: string;
  req_qty: number;
  item_rate: number;
  total_rate: number;
}

const RecipeCostByDate: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();

  const [selectedDate, setSelectedDate] = useState<Date | undefined>();
  const [rows, setRows] = useState<CostRow[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isPdfLoading, setIsPdfLoading] = useState(false);

  const fetchByDate = async (date: Date) => {
    setIsLoading(true);
    setIsEditing(false);
    try {
      const formatted = format(date, "yyyy-MM-dd");
      const response = await recipeCostApi.getByDate({ day_rcp_date: formatted });
      if (response.status === "success" && Array.isArray(response.data)) {
        setRows(
          response.data.map((r: any) => ({
            ...r,
            req_qty: Number(r.req_qty) || 0,
            item_rate: Number(r.item_rate) || 0,
            total_rate: Number(r.total_rate) || 0,
          }))
        );
      } else {
        setRows([]);
      }
    } catch (error) {
      console.error("Failed to fetch recipe cost by date:", error);
      toast({ title: "Error", description: getApiErrorMessage(error), variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDateSelect = (date: Date | undefined) => {
    setSelectedDate(date);
    if (date) fetchByDate(date);
  };

  const updateRow = (index: number, field: "req_qty" | "item_rate", value: string) => {
    setRows((prev) =>
      prev.map((row, i) => {
        if (i !== index) return row;
        const updated = { ...row, [field]: Number(value) || 0 };
        updated.total_rate = updated.req_qty * updated.item_rate;
        return updated;
      })
    );
  };

  const handleSaveAll = async () => {
    if (!selectedDate || rows.length === 0) return;
    setIsSaving(true);
    try {
      const formattedDate = format(selectedDate, "yyyy-MM-dd");
      for (const row of rows) {
        await recipeCostApi.update({
          day_rcp_date: formattedDate,
          recipe_type: row.recipe_type,
          recipe_code: String(row.recipe_code),
          cat_name: row.cat_name || "",
          cat_code: String(row.cat_code || ""),
          item_name: row.item_name,
          item_code: String(row.item_code),
          unit_short: row.unit_short,
          req_qty: String(row.req_qty),
          item_rate: String(row.item_rate),
          total_rate: String(row.total_rate.toFixed(2)),
          created_by: user?.user_name || "",
        });
      }
      toast({ title: "Success", description: "Recipe costs updated successfully" });
      setIsEditing(false);
    } catch (error) {
      console.error("Failed to update recipe costs:", error);
      toast({ title: "Error", description: getApiErrorMessage(error), variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  const handleGetPdf = async () => {
    if (!selectedDate || rows.length === 0) return;
    setIsPdfLoading(true);
    try {
      const result = await generateRecipeCostPdf(rows, format(selectedDate, "yyyy-MM-dd"));
      handlePdfResult(result);
    } catch (error) {
      console.error("PDF generation failed:", error);
      toast({ title: "Error", description: "Failed to generate PDF", variant: "destructive" });
    } finally {
      setIsPdfLoading(false);
    }
  };

  const grandTotal = rows.reduce((sum, r) => sum + r.total_rate, 0);

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg">Recipe Cost by Date</CardTitle>
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 mt-2">
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-full sm:w-56 justify-start text-left font-normal",
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
                onSelect={handleDateSelect}
                initialFocus
                className={cn("p-3 pointer-events-auto")}
              />
            </PopoverContent>
          </Popover>

          <div className="flex gap-2">
            {rows.length > 0 && !isEditing && (
              <Button variant="outline" size="sm" className="gap-2" onClick={() => setIsEditing(true)}>
                <Edit className="w-4 h-4" />
                Edit
              </Button>
            )}
            {isEditing && (
              <Button size="sm" className="gap-2" onClick={handleSaveAll} disabled={isSaving}>
                {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                Save All
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              className="gap-2"
              onClick={handleGetPdf}
              disabled={rows.length === 0 || isPdfLoading}
            >
              {isPdfLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileText className="w-4 h-4" />}
              Get PDF
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        ) : rows.length === 0 ? (
          <p className="text-center py-8 text-muted-foreground">
            {selectedDate ? "No records found for this date" : "Select a date to view recipe costs"}
          </p>
        ) : (
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
                {rows.map((row, index) => (
                  <TableRow key={index}>
                    <TableCell>{index + 1}</TableCell>
                    <TableCell>{row.cat_name}</TableCell>
                    <TableCell>{row.item_name}</TableCell>
                    <TableCell>{row.unit_short}</TableCell>
                    <TableCell className="text-right">
                      {isEditing ? (
                        <Input
                          type="number"
                          value={row.req_qty || ""}
                          onChange={(e) => updateRow(index, "req_qty", e.target.value)}
                          onKeyDown={numericOnly}
                          className="w-20 text-right ml-auto"
                          min="0"
                        />
                      ) : (
                        Number(row.req_qty).toFixed(2)
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      {isEditing ? (
                        <Input
                          type="number"
                          value={row.item_rate || ""}
                          onChange={(e) => updateRow(index, "item_rate", e.target.value)}
                          onKeyDown={numericOnly}
                          className="w-24 text-right ml-auto"
                          min="0"
                          step="0.01"
                        />
                      ) : (
                        `₹${Number(row.item_rate).toFixed(2)}`
                      )}
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      ₹{row.total_rate.toFixed(2)}
                    </TableCell>
                  </TableRow>
                ))}
                <TableRow className="bg-muted/50 font-bold">
                  <TableCell colSpan={6} className="text-right">Grand Total</TableCell>
                  <TableCell className="text-right">₹{grandTotal.toFixed(2)}</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default RecipeCostByDate;
