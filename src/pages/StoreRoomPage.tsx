import React, { useState, useEffect, useCallback } from "react";
import { Plus, RefreshCw, Pencil, Trash2, Warehouse } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { getApiErrorMessage } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
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
import { Skeleton } from "@/components/ui/skeleton";

const API_BASE = "https://ngrchatbot.whindia.in/fpda";

interface StoreItem {
  id: number;
  store_items: string;
  total_items: number;
  created_by: string;
}

interface NewRow {
  store_items: string;
  total_items: string;
}

const StoreRoomPage: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [data, setData] = useState<StoreItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [addOpen, setAddOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [selectedItem, setSelectedItem] = useState<StoreItem | null>(null);
  const [editName, setEditName] = useState("");
  const [editCount, setEditCount] = useState("");
  const [newRows, setNewRows] = useState<NewRow[]>([{ store_items: "", total_items: "" }]);
  const [formDirty, setFormDirty] = useState(false);
  const [confirmCloseOpen, setConfirmCloseOpen] = useState(false);
  const [pendingCloseTarget, setPendingCloseTarget] = useState<"add" | "edit" | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/get_store/`);
      const json = await res.json();
      setData(Array.isArray(json?.data) ? json.data : Array.isArray(json) ? json : []);
    } catch (err) {
      toast({ title: "Error", description: getApiErrorMessage(err), variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // Unsaved changes guard
  const tryClose = (target: "add" | "edit") => {
    if (formDirty) {
      setPendingCloseTarget(target);
      setConfirmCloseOpen(true);
    } else {
      if (target === "add") setAddOpen(false);
      else setEditOpen(false);
    }
  };

  const confirmClose = () => {
    if (pendingCloseTarget === "add") setAddOpen(false);
    else setEditOpen(false);
    setFormDirty(false);
    setConfirmCloseOpen(false);
    setPendingCloseTarget(null);
  };

  // Add
  const openAdd = () => {
    setNewRows([{ store_items: "", total_items: "" }]);
    setFormDirty(false);
    setAddOpen(true);
  };

  const updateNewRow = (idx: number, field: keyof NewRow, value: string) => {
    setNewRows(prev => prev.map((r, i) => i === idx ? { ...r, [field]: value } : r));
    setFormDirty(true);
  };

  const addRow = () => {
    setNewRows(prev => [...prev, { store_items: "", total_items: "" }]);
    setFormDirty(true);
  };

  const removeNewRow = (idx: number) => {
    if (newRows.length <= 1) return;
    setNewRows(prev => prev.filter((_, i) => i !== idx));
    setFormDirty(true);
  };

  const handleSaveNew = async () => {
    const valid = newRows.every(r => r.store_items.trim() && r.total_items.trim());
    if (!valid) {
      toast({ title: "Validation Error", description: "All rows must have Item Name and Count.", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      for (const row of newRows) {
        const fd = new FormData();
        fd.append("store_items", row.store_items.trim());
        fd.append("total_items", row.total_items.trim());
        fd.append("created_by", user?.user_name || "");
        const res = await fetch(`${API_BASE}/create_store/`, { method: "POST", body: fd });
        if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
      }
      toast({ title: "Success", description: "Store items created successfully." });
      setAddOpen(false);
      setFormDirty(false);
      fetchData();
    } catch (err) {
      toast({ title: "Error", description: getApiErrorMessage(err), variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  // Edit
  const openEdit = (item: StoreItem) => {
    setSelectedItem(item);
    setEditName(item.store_items);
    setEditCount(String(item.total_items));
    setFormDirty(false);
    setEditOpen(true);
  };

  const handleUpdate = async () => {
    if (!editName.trim() || !editCount.trim()) {
      toast({ title: "Validation Error", description: "Item Name and Count are required.", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      const fd = new FormData();
      fd.append("id", String(selectedItem!.id));
      fd.append("store_items", editName.trim());
      fd.append("total_items", editCount.trim());
      const res = await fetch(`${API_BASE}/update_store/`, { method: "POST", body: fd });
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
      toast({ title: "Success", description: "Store item updated successfully." });
      setEditOpen(false);
      setFormDirty(false);
      fetchData();
    } catch (err) {
      toast({ title: "Error", description: getApiErrorMessage(err), variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  // Delete
  const openDelete = (item: StoreItem) => {
    setSelectedItem(item);
    setDeleteOpen(true);
  };

  const handleDelete = async () => {
    setSaving(true);
    try {
      const fd = new FormData();
      fd.append("id", String(selectedItem!.id));
      const res = await fetch(`${API_BASE}/delete_store/`, { method: "POST", body: fd });
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
      toast({ title: "Success", description: "Store item deleted successfully." });
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
            <Warehouse className="w-5 h-5 text-primary" />
            Store Room
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
            <p className="text-center text-muted-foreground py-8">No store room items found.</p>
          ) : (
            <div className="overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>S.No</TableHead>
                    <TableHead>Item Name</TableHead>
                    <TableHead>Count</TableHead>
                    <TableHead>Created By</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.map((item, idx) => (
                    <TableRow key={item.id}>
                      <TableCell>{idx + 1}</TableCell>
                      <TableCell>{item.store_items}</TableCell>
                      <TableCell>{item.total_items}</TableCell>
                      <TableCell>{item.created_by}</TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="icon" onClick={() => openEdit(item)}>
                          <Pencil className="w-4 h-4" />
                        </Button>
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
      <Dialog open={addOpen} onOpenChange={() => tryClose("add")}>
        <DialogContent
          className="max-w-lg max-h-[80vh] overflow-y-auto"
          onPointerDownOutside={(e) => e.preventDefault()}
          onEscapeKeyDown={(e) => e.preventDefault()}
        >
          <DialogHeader>
            <DialogTitle>Add Store Room Items</DialogTitle>
            <DialogDescription>Add one or more items to the store room.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {newRows.map((row, idx) => (
              <div key={idx} className="flex gap-2 items-end">
                <div className="flex-1 space-y-1">
                  <Label>Item Name</Label>
                  <Input value={row.store_items} onChange={(e) => updateNewRow(idx, "store_items", e.target.value)} placeholder="Enter item name" />
                </div>
                <div className="w-28 space-y-1">
                  <Label>Count</Label>
                  <Input type="number" value={row.total_items} onChange={(e) => updateNewRow(idx, "total_items", e.target.value)} placeholder="Qty" />
                </div>
                {newRows.length > 1 && (
                  <Button variant="ghost" size="icon" onClick={() => removeNewRow(idx)} className="text-destructive">
                    <Trash2 className="w-4 h-4" />
                  </Button>
                )}
              </div>
            ))}
            <Button variant="outline" size="sm" onClick={addRow}>
              <Plus className="w-4 h-4 mr-1" /> Add Row
            </Button>
          </div>
          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => tryClose("add")}>Cancel</Button>
            <Button onClick={handleSaveNew} disabled={saving}>{saving ? "Saving..." : "Save"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={editOpen} onOpenChange={() => tryClose("edit")}>
        <DialogContent
          onPointerDownOutside={(e) => e.preventDefault()}
          onEscapeKeyDown={(e) => e.preventDefault()}
        >
          <DialogHeader>
            <DialogTitle>Edit Store Room Item</DialogTitle>
            <DialogDescription>Update the item details below.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1">
              <Label>Item Name</Label>
              <Input value={editName} onChange={(e) => { setEditName(e.target.value); setFormDirty(true); }} />
            </div>
            <div className="space-y-1">
              <Label>Count</Label>
              <Input type="number" value={editCount} onChange={(e) => { setEditCount(e.target.value); setFormDirty(true); }} />
            </div>
          </div>
          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => tryClose("edit")}>Cancel</Button>
            <Button onClick={handleUpdate} disabled={saving}>{saving ? "Saving..." : "Update"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirm */}
      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Store Item</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{selectedItem?.store_items}"? This action cannot be undone.
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
            <AlertDialogCancel onClick={() => { setConfirmCloseOpen(false); setPendingCloseTarget(null); }}>
              No, keep editing
            </AlertDialogCancel>
            <AlertDialogAction onClick={confirmClose}>Yes, close</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default StoreRoomPage;
