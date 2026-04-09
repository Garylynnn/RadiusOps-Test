import React, { useState, useEffect } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, ShieldAlert, Search, ShieldCheck, AlertTriangle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export default function RevocationManagement({ user }: { user: any }) {
  const [hosts, setHosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [revokingId, setRevokingId] = useState<string | null>(null);

  const isAdmin = user?.role === "Admin";

  if (!isAdmin) {
    return (
      <div className="h-64 flex flex-col items-center justify-center text-[#141414]/40 space-y-2">
        <ShieldAlert className="w-12 h-12" />
        <p className="text-sm font-medium">Access Denied: Admin privileges required for CRL management.</p>
      </div>
    );
  }

  const fetchHosts = async () => {
    try {
      const res = await fetch("/api/hosts");
      const data = await res.json();
      if (Array.isArray(data)) {
        // Only show hosts that can be revoked (Provisioned) or are already Revoked
        const revocableHosts = data.filter((h: any) => h.status === "Provisioned" || h.status === "Revoked");
        setHosts(revocableHosts);
      }
    } catch (err) {
      toast.error("Failed to fetch hosts for revocation");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHosts();
    const interval = setInterval(fetchHosts, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleRevoke = async (id: string) => {
    try {
      const res = await fetch(`/api/hosts/${id}/revoke`, { method: "POST" });
      if (res.ok) {
        toast.success("Host certificate revoked successfully");
        setRevokingId(null);
        fetchHosts();
      }
    } catch (err) {
      toast.error("Failed to revoke host");
    }
  };

  const filteredHosts = hosts.filter(host => 
    host.hostname.toLowerCase().includes(searchQuery.toLowerCase()) ||
    host.owner.toLowerCase().includes(searchQuery.toLowerCase()) ||
    host.fqdn.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="relative w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#141414]/40" />
          <Input 
            placeholder="Search hosts to revoke..." 
            className="pl-10 border-[#141414]/10 focus-visible:ring-[#141414]" 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2 text-xs text-red-600/60 font-medium">
          <ShieldAlert className="w-4 h-4" />
          <span>CRL (Certificate Revocation List) Management</span>
        </div>
      </div>

      <div className="bg-red-50 border border-red-100 rounded-lg p-4 flex items-start gap-3">
        <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5" />
        <div>
          <h4 className="text-sm font-bold text-red-900">Security Warning</h4>
          <p className="text-xs text-red-700 leading-relaxed">
            Revoking a host will immediately invalidate its certificate. This action is permanent and will block the device from accessing the Radius network.
          </p>
        </div>
      </div>

      <div className="border border-[#141414]/10 rounded-lg bg-white overflow-hidden">
        <Table>
          <TableHeader className="bg-[#141414]/5">
            <TableRow>
              <TableHead className="w-[250px] font-serif italic text-[11px] uppercase tracking-wider">Hostname / FQDN</TableHead>
              <TableHead className="font-serif italic text-[11px] uppercase tracking-wider">Owner</TableHead>
              <TableHead className="font-serif italic text-[11px] uppercase tracking-wider">Status</TableHead>
              <TableHead className="font-serif italic text-[11px] uppercase tracking-wider">Cert Serial</TableHead>
              <TableHead className="text-right font-serif italic text-[11px] uppercase tracking-wider">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center">
                  <Loader2 className="w-6 h-6 animate-spin mx-auto text-[#141414]/40" />
                </TableCell>
              </TableRow>
            ) : filteredHosts.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center text-[#141414]/40">
                  {searchQuery ? "No matching hosts found." : "No active hosts available for revocation."}
                </TableCell>
              </TableRow>
            ) : (
              filteredHosts.map((host) => (
                <TableRow key={host.id} className="hover:bg-[#141414]/5 transition-colors">
                  <TableCell>
                    <div className="font-medium">{host.hostname}</div>
                    <div className="text-[10px] text-[#141414]/40 font-mono">{host.fqdn}</div>
                  </TableCell>
                  <TableCell className="text-sm">{host.owner}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className={cn(
                      "font-medium text-[10px] uppercase tracking-tight shadow-none border",
                      host.status === "Provisioned" ? "bg-green-100 text-green-800 border-green-200" : "bg-red-100 text-red-800 border-red-200"
                    )}>
                      {host.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-mono text-[10px] text-[#141414]/60">
                    {host.certSerial}
                  </TableCell>
                  <TableCell className="text-right">
                    {host.status === "Provisioned" ? (
                      <Dialog>
                        <DialogTrigger render={
                          <Button 
                            size="sm" 
                            variant="destructive" 
                            className="h-8 gap-2 text-[10px] uppercase font-bold"
                          />
                        }>
                          <ShieldAlert className="w-3 h-3" />
                          Revoke
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Confirm Revocation</DialogTitle>
                            <DialogDescription>
                              Are you sure you want to revoke the certificate for <strong>{host.hostname}</strong>? 
                              This will immediately disconnect the device from the network.
                            </DialogDescription>
                          </DialogHeader>
                          <DialogFooter>
                            <Button variant="outline">Cancel</Button>
                            <Button variant="destructive" onClick={() => handleRevoke(host.id)}>Confirm Revocation</Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
                    ) : (
                      <div className="flex items-center justify-end gap-2 text-red-600 text-[10px] font-bold uppercase">
                        <ShieldCheck className="w-3 h-3" />
                        Revoked
                      </div>
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
