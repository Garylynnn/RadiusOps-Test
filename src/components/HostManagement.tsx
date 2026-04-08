import React, { useState, useEffect } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Download, ShieldAlert, CheckCircle2, Loader2, Search, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { suggestHostname } from "@/src/services/gemini";

export default function HostManagement() {
  const [hosts, setHosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSuggesting, setIsSuggesting] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [newHost, setNewHost] = useState({
    hostname: "",
    owner: "",
    device_type: "Laptop"
  });

  const handleSuggest = async () => {
    if (!newHost.owner) {
      toast.error("Please enter an owner name first");
      return;
    }
    setIsSuggesting(true);
    const names = await suggestHostname(newHost.owner, newHost.device_type);
    setSuggestions(names);
    setIsSuggesting(false);
  };

  const fetchHosts = async () => {
    try {
      const res = await fetch("/api/hosts");
      const data = await res.json();
      setHosts(data);
    } catch (err) {
      toast.error("Failed to fetch hosts");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHosts();
    const interval = setInterval(fetchHosts, 5000); // Poll for status updates
    return () => clearInterval(interval);
  }, []);

  const handleCreateHost = async () => {
    if (!newHost.hostname || !newHost.owner) {
      toast.error("Please fill in all fields");
      return;
    }

    try {
      const res = await fetch("/api/hosts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newHost)
      });
      if (res.ok) {
        toast.success("Host request created. Pending approval.");
        setIsDialogOpen(false);
        setNewHost({ hostname: "", owner: "", device_type: "Laptop" });
        fetchHosts();
      }
    } catch (err) {
      toast.error("Failed to create host");
    }
  };

  const handleApprove = async (id: string) => {
    try {
      const res = await fetch(`/api/hosts/${id}/approve`, { method: "POST" });
      if (res.ok) {
        toast.success("Host approved. Provisioning started...");
        fetchHosts();
      }
    } catch (err) {
      toast.error("Failed to approve host");
    }
  };

  const handleRevoke = async (id: string) => {
    try {
      const res = await fetch(`/api/hosts/${id}/revoke`, { method: "POST" });
      if (res.ok) {
        toast.success("Host revoked successfully");
        fetchHosts();
      }
    } catch (err) {
      toast.error("Failed to revoke host");
    }
  };

  const handleDownload = async (hostname: string) => {
    try {
      const res = await fetch("/api/download-token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ hostname })
      });
      const { token } = await res.json();
      window.open(`/api/download/${token}`, "_blank");
      toast.success("Certificate download started");
    } catch (err) {
      toast.error("Failed to generate download token");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="relative w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#141414]/40" />
          <Input placeholder="Search hosts..." className="pl-10 border-[#141414]/10 focus-visible:ring-[#141414]" />
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger render={<Button className="bg-[#141414] text-white hover:bg-[#141414]/90 gap-2" />}>
            <Plus className="w-4 h-4" />
            Enroll New Host
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Enroll New Host</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="hostname">Hostname</Label>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="h-6 text-[10px] gap-1 text-[#141414]/60 hover:text-[#141414]"
                    onClick={handleSuggest}
                    disabled={isSuggesting}
                  >
                    {isSuggesting ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                    AI Suggest
                  </Button>
                </div>
                <Input 
                  id="hostname" 
                  placeholder="e.g. laptop-01" 
                  value={newHost.hostname}
                  onChange={(e) => setNewHost({ ...newHost, hostname: e.target.value })}
                />
                {suggestions.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-1">
                    {suggestions.map((name) => (
                      <button
                        key={name}
                        onClick={() => setNewHost({ ...newHost, hostname: name })}
                        className="text-[10px] bg-[#141414]/5 hover:bg-[#141414]/10 px-2 py-1 rounded border border-[#141414]/10 transition-colors"
                      >
                        {name}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <div className="grid gap-2">
                <Label htmlFor="owner">Owner (Employee Name)</Label>
                <Input 
                  id="owner" 
                  placeholder="e.g. John Doe" 
                  value={newHost.owner}
                  onChange={(e) => setNewHost({ ...newHost, owner: e.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="type">Device Type</Label>
                <Select 
                  value={newHost.device_type}
                  onValueChange={(v) => setNewHost({ ...newHost, device_type: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Laptop">Laptop</SelectItem>
                    <SelectItem value="Desktop">Desktop</SelectItem>
                    <SelectItem value="Server">Server</SelectItem>
                    <SelectItem value="Android">Android</SelectItem>
                    <SelectItem value="iOS">iOS</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
              <Button onClick={handleCreateHost} className="bg-[#141414] text-white">Create Request</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="border border-[#141414]/10 rounded-lg bg-white overflow-hidden">
        <Table>
          <TableHeader className="bg-[#141414]/5">
            <TableRow>
              <TableHead className="w-[200px] font-serif italic text-[11px] uppercase tracking-wider">Hostname / FQDN</TableHead>
              <TableHead className="font-serif italic text-[11px] uppercase tracking-wider">Owner</TableHead>
              <TableHead className="font-serif italic text-[11px] uppercase tracking-wider">Type</TableHead>
              <TableHead className="font-serif italic text-[11px] uppercase tracking-wider">Status</TableHead>
              <TableHead className="font-serif italic text-[11px] uppercase tracking-wider">Cert Serial</TableHead>
              <TableHead className="text-right font-serif italic text-[11px] uppercase tracking-wider">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center">
                  <Loader2 className="w-6 h-6 animate-spin mx-auto text-[#141414]/40" />
                </TableCell>
              </TableRow>
            ) : hosts.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center text-[#141414]/40">
                  No hosts found. Enroll a new host to get started.
                </TableCell>
              </TableRow>
            ) : (
              hosts.map((host) => (
                <TableRow key={host.id} className="hover:bg-[#141414]/5 transition-colors group">
                  <TableCell className="font-medium">
                    <div>{host.hostname}</div>
                    <div className="text-[10px] text-[#141414]/40 font-mono">{host.fqdn}</div>
                  </TableCell>
                  <TableCell className="text-sm">{host.owner}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="font-normal text-[10px] uppercase tracking-tight">
                      {host.device_type}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={host.status} />
                  </TableCell>
                  <TableCell className="font-mono text-[10px] text-[#141414]/60">
                    {host.certSerial || "—"}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      {host.status === "Draft" && (
                        <Button size="sm" variant="outline" className="h-8 text-[10px] uppercase font-bold" onClick={() => handleApprove(host.id)}>
                          Approve
                        </Button>
                      )}
                      {host.status === "Provisioned" && (
                        <>
                          <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => handleDownload(host.hostname)}>
                            <Download className="w-4 h-4" />
                          </Button>
                          <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => handleRevoke(host.id)}>
                            <ShieldAlert className="w-4 h-4" />
                          </Button>
                        </>
                      )}
                    </div>
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

function StatusBadge({ status }: { status: string }) {
  const styles: any = {
    Draft: "bg-yellow-100 text-yellow-800 border-yellow-200",
    Approved: "bg-blue-100 text-blue-800 border-blue-200",
    Provisioned: "bg-green-100 text-green-800 border-green-200",
    Revoked: "bg-red-100 text-red-800 border-red-200",
  };

  return (
    <Badge className={`${styles[status]} font-medium text-[10px] uppercase tracking-tight shadow-none border`}>
      {status === "Provisioned" && <CheckCircle2 className="w-3 h-3 mr-1" />}
      {status}
    </Badge>
  );
}
