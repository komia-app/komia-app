import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { base44 } from "@/api/base44Client";
import { toast } from "@/components/ui/use-toast";

export default function EditProfileDialog({ user, open, onClose, onSaved }) {
  const [homeCity, setHomeCity] = useState("");
  const [cuisines, setCuisines] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setHomeCity(user?.home_city || "");
    setCuisines((user?.favorite_cuisines || []).join(", "));
  }, [user, open]);

  const submit = async () => {
    setSaving(true);
    try {
      await base44.auth.updateMe({
        home_city: homeCity,
        favorite_cuisines: cuisines.split(",").map((c) => c.trim()).filter(Boolean),
      });
      toast({ title: "Profile updated" });
      onSaved?.();
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit profile</DialogTitle>
        </DialogHeader>
        <div className="space-y-3 py-2">
          <div className="space-y-1.5">
            <Label>Name</Label>
            <Input value={user?.full_name || ""} disabled />
          </div>
          <div className="space-y-1.5">
            <Label>Username</Label>
            <Input value={user?.email ? "@" + user.email.split("@")[0] : ""} disabled />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="city">Home city</Label>
            <Input id="city" value={homeCity} onChange={(e) => setHomeCity(e.target.value)} placeholder="e.g. Bogotá" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="cuisines">Favorite cuisines</Label>
            <Input id="cuisines" value={cuisines} onChange={(e) => setCuisines(e.target.value)} placeholder="Italian, Japanese, ..." />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={submit} disabled={saving}>{saving ? "Saving..." : "Save"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}