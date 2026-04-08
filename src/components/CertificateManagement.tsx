import React, { useState, useEffect } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Download, ShieldCheck, Search, Calendar, Key } from "lucide-react";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { format } from "date-fns";

export default function CertificateManagement() {
  const [certs, setCerts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  const fetchCerts = async () => {
    try {
      const res = await fetch("/api/hosts");
      const data = await res.json();
      // Filter only provisioned hosts which have certificates
      const provisionedCerts = data.filter((h: any) => h.status === "Provisioned" || h.status === "Revoked");
      setCerts(provisionedCerts);
    } catch (err) {
      toast.error("Failed to fetch certificates");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCerts();
    const interval = setInterval(fetchCerts, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleDownload = async (hostname: string) => {
    try {
      const res = await fetch("/api/download-token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ hostname })
      });
      const { token } = await res.json();
      window.open(`/api/download/${token}`, "_blank");
      toast.success(`Certificate for ${hostname} download started`);
    } catch (err) {
      toast.error("Failed to generate download token");
    }
  };

  const filteredCerts = certs.filter(cert => 
    cert.hostname.toLowerCase().includes(searchQuery.toLowerCase()) ||
    cert.certSerial?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    cert.owner.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="relative w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#141414]/40" />
          <Input 
            placeholder="Search certificates..." 
            className="pl-10 border-[#141414]/10 focus-visible:ring-[#141414]" 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2 text-xs text-[#141414]/40">
          <ShieldCheck className="w-4 h-4" />
          <span>Active PKI Hierarchy: <strong>RadiusOps Root CA</strong></span>
        </div>
      </div>

      <div className="border border-[#141414]/10 rounded-lg bg-white overflow-hidden">
        <Table>
          <TableHeader className="bg-[#141414]/5">
            <TableRow>
              <TableHead className="w-[250px] font-serif italic text-[11px] uppercase tracking-wider">Common Name (CN)</TableHead>
              <TableHead className="font-serif italic text-[11px] uppercase tracking-wider">Serial Number</TableHead>
              <TableHead className="font-serif italic text-[11px] uppercase tracking-wider">Status</TableHead>
              <TableHead className="font-serif italic text-[11px] uppercase tracking-wider">Issued To</TableHead>
              <TableHead className="font-serif italic text-[11px] uppercase tracking-wider">Expiry</TableHead>
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
            ) : filteredCerts.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center text-[#141414]/40">
                  {searchQuery ? "No matching certificates found." : "No certificates issued yet."}
                </TableCell>
              </TableRow>
            ) : (
              filteredCerts.map((cert) => (
                <TableRow key={cert.id} className="hover:bg-[#141414]/5 transition-colors">
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Key className="w-3 h-3 text-[#141414]/40" />
                      <span className="font-medium">{cert.fqdn}</span>
                    </div>
                  </TableCell>
                  <TableCell className="font-mono text-[10px] text-[#141414]/60">
                    {cert.certSerial}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={cn(
                      "font-medium text-[10px] uppercase tracking-tight shadow-none border",
                      cert.status === "Provisioned" ? "bg-green-100 text-green-800 border-green-200" : "bg-red-100 text-red-800 border-red-200"
                    )}>
                      {cert.status === "Provisioned" ? "Active" : "Revoked"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm">{cert.owner}</TableCell>
                  <TableCell className="text-[10px] text-[#141414]/60 flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {format(new Date(new Date().setFullYear(new Date().getFullYear() + 1)), "yyyy-MM-dd")}
                  </TableCell>
                  <TableCell className="text-right">
                    {cert.status === "Provisioned" && (
                      <Button 
                        size="sm" 
                        variant="ghost" 
                        className="h-8 gap-2 text-[10px] uppercase font-bold"
                        onClick={() => handleDownload(cert.hostname)}
                      >
                        <Download className="w-3 h-3" />
                        Download
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

import { cn } from "@/lib/utils";
