import React, { useState, useEffect } from "react";
import { Plus, Loader2, Search } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { materialReceiptApi } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toProperCase, formatDateForTable } from "@/lib/utils";

interface MatRecRecord {
  mat_rec_date: string;
  cat_name: string;
  sup_name: string;
  item_name: string;
  unit_short: string;
  mat_rec_qty: number | string;
}

const MaterialReceiptPage: React.FC = () => {
  const { toast } = useToast();
  const navigate = useNavigate();

  const [records, setRecords] = useState<MatRecRecord[]>([]);
  const [isLoadingRecords, setIsLoadingRecords] = useState(true);
  const [recordSearch, setRecordSearch] = useState("");

  // Fetch records on mount
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

  useEffect(() => {
    fetchRecords();
  }, []);

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

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Material Receipt</h1>
          <p className="text-muted-foreground">Record incoming materials from suppliers</p>
        </div>
        <Button onClick={() => navigate("/dashboard/material-receipt/new")} className="gap-2">
          <Plus className="w-4 h-4" />
          New Material Receipt
        </Button>
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
