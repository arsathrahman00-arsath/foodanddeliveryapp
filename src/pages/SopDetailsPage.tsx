import React, { useState, useEffect, useCallback } from "react";
import { Plus, RefreshCw, Trash2, FileText, ExternalLink } from "lucide-react";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { getApiErrorMessage } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDateForTable } from "@/lib/utils";

const API_BASE = "https://ngrchatbot.whindia.in/fpda";

interface SopItem {
  id: number;
  sop_date: string;
  sop_title: string;
  sop_upload: string;
  created_by: string;
}

const ACCEPTED_TYPES = ".doc,.docx,.xls,.xlsx,.png,.pdf,.jpg,.jpeg";

const SopDetailsPage: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [data, setData] = useState<SopItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [addOpen, setAddOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [selectedItem, setSelectedItem] = useState<SopItem | null>(null);

  // Form state
  const [sopDate, setSopDate] = useState<Date | undefined>(undefined);
  const [sopTitle, setSopTitle] = useState("");
  const [sopFile, setSopFile] = useState<File | null>(null);
  const [formDirty, setFormDirty] = useState(false);
  const [confirmCloseOpen, setConfirmCloseOpen] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/get_sop/`);
      const json = await res.json();
      setData(Array.isArray(json?.data) ? json.data : Array.isArray(json) ? json : []);
    } catch (err) {
      toast({ title: "Error", description: getApiErrorMessage(err), variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const tryClose = () => {
    if (formDirty) {
      setConfirmCloseOpen(true);
    } else {
      setAddOpen(false);
    }
  };

  const confirmClose = () => {
    setAddOpen(false);
    setFormDirty(false);
    setConfirmCloseOpen(false);
  };

  const openAdd = () => {
    setSopDate(undefined);
    setSopTitle("");
    setSopFile(null);
    setFormDirty(false);
    setAddOpen(true);
  };

  const handleSaveNew = async () => {
    if (!sopDate || !sopTitle.trim() || !sopFile) {
      toast({ title: "Validation Error", description: "Date, Title, and File are required.", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      const fd = new FormData();
      fd.append("sop_date", format(sopDate, "yyyy-MM-dd"));
      fd.append("sop_title", sopTitle.trim());
      fd.append("sop_upload", sopFile);
      fd.append("created_by", user?.user_name || "");
      const res = await fetch(`${API_BASE}/create_sop/`, { method: "POST", body: fd });
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
      toast({ title: "Success", description: "SOP created successfully." });
      setAddOpen(false);
      setFormDirty(false);
      fetchData();
    } catch (err) {
      toast({ title: "Error", description: getApiErrorMessage(err), variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const openDelete = (item: SopItem) => {
    setSelectedItem(item);
    setDeleteOpen(true);
  };

  const handleDelete = async () => {
    setSaving(true);
    try {
      const fd = new FormData();
      fd.append("id", String(selectedItem!.id));
      const res = await fetch(`${API_BASE}/delete_sop/`, { method: "POST", body: fd });
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
      toast({ title: "Success", description: "SOP deleted successfully." });
      setDeleteOpen(false);
      fetchData();
    } catch (err) {
      toast({ title: "Error", description: getApiErrorMessage(err), variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-primary" />
            SOP Details
          </CardTitle>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={fetchData} disabled={loading}>
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            </Button>
            <Button size="sm" onClick={openAdd}>
              <Plus className="w-4 h-4 mr-1" /> Add New
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-2">{[1,2,3].map(i => <Skeleton key={i} className="h-10 w-full" />)}</div>
          ) : data.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">No SOP records found.</p>
          ) : (
            <div className="overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>S.No</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Title</TableHead>
                    <TableHead>Document</TableHead>
                    <TableHead>Created By</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.map((item, idx) => (
                    <TableRow key={item.id}>
                      <TableCell>{idx + 1}</TableCell>
                      <TableCell>{formatDateForTable(item.sop_date)}</TableCell>
                      <TableCell>{item.sop_title}</TableCell>
                      <TableCell>
                        {item.sop_upload ? (
                          <a href={item.sop_upload} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-primary hover:underline text-sm">
                            <ExternalLink className="w-3.5 h-3.5" /> View
                          </a>
                        ) : "-"}
                      </TableCell>
                      <TableCell>{item.created_by}</TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="icon" onClick={() => openDelete(item)}>
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Dialog */}
      <Dialog open={addOpen} onOpenChange={() => tryClose()}>
        <DialogContent
          className="max-w-lg"
          onPointerDownOutside={(e) => e.preventDefault()}
          onEscapeKeyDown={(e) => e.preventDefault()}
        >
          <DialogHeader>
            <DialogTitle>Add SOP</DialogTitle>
            <DialogDescription>Fill in the SOP details below.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1">
              <Label>Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !sopDate && "text-muted-foreground")}>
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {sopDate ? format(sopDate, "PPP") : "Pick a date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar mode="single" selected={sopDate} onSelect={(d) => { setSopDate(d); setFormDirty(true); }} className="p-3 pointer-events-auto" />
                </PopoverContent>
              </Popover>
            </div>
            <div className="space-y-1">
              <Label>SOP Title</Label>
              <Input value={sopTitle} onChange={(e) => { setSopTitle(e.target.value); setFormDirty(true); }} placeholder="Enter SOP title" />
            </div>
            <div className="space-y-1">
              <Label>Upload Document</Label>
              <Input
                type="file"
                accept={ACCEPTED_TYPES}
                onChange={(e) => { setSopFile(e.target.files?.[0] || null); setFormDirty(true); }}
              />
              <p className="text-xs text-muted-foreground">Accepted: DOC, XLS, PNG, PDF, JPG</p>
            </div>
          </div>
          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={tryClose}>Cancel</Button>
            <Button onClick={handleSaveNew} disabled={saving}>{saving ? "Saving..." : "Save"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirm */}
      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete SOP</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{selectedItem?.sop_title}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={saving} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {saving ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Unsaved changes confirm */}
      <AlertDialog open={confirmCloseOpen} onOpenChange={setConfirmCloseOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Unsaved Changes</AlertDialogTitle>
            <AlertDialogDescription>
              You have unsaved changes. Are you sure you want to close this page?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setConfirmCloseOpen(false)}>No, keep editing</AlertDialogCancel>
            <AlertDialogAction onClick={confirmClose}>Yes, close</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default SopDetailsPage;
