import React, { useState, useEffect } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2, UserPlus, Loader2, Shield, User as UserIcon } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

export default function UserManagement() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newUser, setNewUser] = useState({
    username: "",
    password: "",
    role: "IT"
  });

  const fetchUsers = async () => {
    try {
      const res = await fetch("/api/users");
      const data = await res.json();
      if (Array.isArray(data)) {
        setUsers(data);
      }
    } catch (err) {
      toast.error("Failed to fetch users");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleCreateUser = async () => {
    if (!newUser.username || !newUser.password) {
      toast.error("Please fill in all fields");
      return;
    }

    try {
      const res = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newUser)
      });
      if (res.ok) {
        toast.success("User created successfully");
        setIsDialogOpen(false);
        setNewUser({ username: "", password: "", role: "IT" });
        fetchUsers();
      } else {
        const data = await res.json();
        toast.error(data.error || "Failed to create user");
      }
    } catch (err) {
      toast.error("An error occurred");
    }
  };

  const handleDeleteUser = async (username: string) => {
    try {
      const res = await fetch(`/api/users/${username}`, { method: "DELETE" });
      if (res.ok) {
        toast.success("User deleted successfully");
        fetchUsers();
      } else {
        const data = await res.json();
        toast.error(data.error || "Failed to delete user");
      }
    } catch (err) {
      toast.error("An error occurred");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-[#141414]/60 uppercase tracking-wider flex items-center gap-2">
          <Shield className="w-4 h-4" />
          Access Control & User Management
        </h3>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger render={<Button className="bg-[#141414] text-white hover:bg-[#141414]/90 gap-2" />}>
            <UserPlus className="w-4 h-4" />
            Create New User
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Create New User</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="username">Username</Label>
                <Input 
                  id="username" 
                  placeholder="e.g. jsmith" 
                  value={newUser.username}
                  onChange={(e) => setNewUser({ ...newUser, username: e.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="password">Initial Password</Label>
                <Input 
                  id="password" 
                  type="password"
                  placeholder="••••••••" 
                  value={newUser.password}
                  onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="role">Role</Label>
                <Select 
                  value={newUser.role}
                  onValueChange={(v) => setNewUser({ ...newUser, role: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="IT">IT User (Enrollment Only)</SelectItem>
                    <SelectItem value="Admin">Admin (Full Access + Approval)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
              <Button onClick={handleCreateUser} className="bg-[#141414] text-white">Create User</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="border border-[#141414]/10 rounded-lg bg-white overflow-hidden">
        <Table>
          <TableHeader className="bg-[#141414]/5">
            <TableRow>
              <TableHead className="font-serif italic text-[11px] uppercase tracking-wider">Username</TableHead>
              <TableHead className="font-serif italic text-[11px] uppercase tracking-wider">Role</TableHead>
              <TableHead className="font-serif italic text-[11px] uppercase tracking-wider">Created At</TableHead>
              <TableHead className="text-right font-serif italic text-[11px] uppercase tracking-wider">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={4} className="h-24 text-center">
                  <Loader2 className="w-6 h-6 animate-spin mx-auto text-[#141414]/40" />
                </TableCell>
              </TableRow>
            ) : users.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="h-24 text-center text-[#141414]/40">
                  No users found.
                </TableCell>
              </TableRow>
            ) : (
              users.map((user) => (
                <TableRow key={user.username} className="hover:bg-[#141414]/5 transition-colors">
                  <TableCell className="font-medium flex items-center gap-2">
                    <UserIcon className="w-4 h-4 text-[#141414]/40" />
                    {user.username}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={user.role === "Admin" ? "bg-purple-100 text-purple-800 border-purple-200" : "bg-blue-100 text-blue-800 border-blue-200"}>
                      {user.role}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-xs text-[#141414]/60">
                    {format(new Date(user.createdAt), "yyyy-MM-dd HH:mm")}
                  </TableCell>
                  <TableCell className="text-right">
                    {user.username !== "admin" && (
                      <Button 
                        size="icon" 
                        variant="ghost" 
                        className="h-8 w-8 text-destructive hover:text-destructive"
                        onClick={() => handleDeleteUser(user.username)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
