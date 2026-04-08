import React, { useState, useEffect } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Loader2, History, Sparkles } from "lucide-react";
import { format } from "date-fns";
import { summarizeLogs } from "@/src/services/gemini";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function AuditLogs() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState<string | null>(null);
  const [isSummarizing, setIsSummarizing] = useState(false);

  const handleSummarize = async () => {
    if (logs.length === 0) return;
    setIsSummarizing(true);
    const text = await summarizeLogs(logs);
    setSummary(text);
    setIsSummarizing(false);
  };

  const fetchLogs = async () => {
    try {
      const res = await fetch("/api/logs");
      const data = await res.json();
      setLogs(data.sort((a: any, b: any) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()));
    } catch (err) {
      console.error("Failed to fetch logs", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
    const interval = setInterval(fetchLogs, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-[#141414]/60 uppercase tracking-wider flex items-center gap-2">
          <History className="w-4 h-4" />
          System Audit Trail
        </h3>
        <Button 
          variant="outline" 
          size="sm" 
          className="h-8 text-[10px] gap-2 uppercase font-bold border-[#141414]/10"
          onClick={handleSummarize}
          disabled={isSummarizing || logs.length === 0}
        >
          {isSummarizing ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
          AI Summary
        </Button>
      </div>

      {summary && (
        <Card className="border-[#141414]/10 bg-[#141414]/5 shadow-none">
          <CardContent className="p-4 flex gap-3">
            <Sparkles className="w-5 h-5 text-[#141414]/40 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="text-xs font-bold uppercase tracking-wider text-[#141414]/60">AI Insight</p>
              <p className="text-sm leading-relaxed">{summary}</p>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="border border-[#141414]/10 rounded-lg bg-white overflow-hidden">
        <Table>
          <TableHeader className="bg-[#141414]/5">
            <TableRow>
              <TableHead className="font-serif italic text-[11px] uppercase tracking-wider">Timestamp</TableHead>
              <TableHead className="font-serif italic text-[11px] uppercase tracking-wider">User</TableHead>
              <TableHead className="font-serif italic text-[11px] uppercase tracking-wider">Host</TableHead>
              <TableHead className="font-serif italic text-[11px] uppercase tracking-wider">Action</TableHead>
              <TableHead className="font-serif italic text-[11px] uppercase tracking-wider">IP Address</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center">
                  <Loader2 className="w-6 h-6 animate-spin mx-auto text-[#141414]/40" />
                </TableCell>
              </TableRow>
            ) : logs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center text-[#141414]/40">
                  No logs recorded yet.
                </TableCell>
              </TableRow>
            ) : (
              logs.map((log) => (
                <TableRow key={log.id} className="hover:bg-[#141414]/5 transition-colors">
                  <TableCell className="font-mono text-[10px] text-[#141414]/60">
                    {format(new Date(log.timestamp), "yyyy-MM-dd HH:mm:ss")}
                  </TableCell>
                  <TableCell className="text-sm font-medium">{log.user}</TableCell>
                  <TableCell className="text-sm">{log.hostname}</TableCell>
                  <TableCell>
                    <ActionBadge action={log.action} />
                  </TableCell>
                  <TableCell className="font-mono text-[10px] text-[#141414]/40">
                    {log.ip}
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

function ActionBadge({ action }: { action: string }) {
  const styles: any = {
    Created: "bg-blue-50 text-blue-700 border-blue-100",
    Approved: "bg-purple-50 text-purple-700 border-purple-100",
    Provisioned: "bg-green-50 text-green-700 border-green-100",
    Revoked: "bg-red-50 text-red-700 border-red-100",
    Downloaded: "bg-orange-50 text-orange-700 border-orange-100",
  };

  return (
    <Badge variant="outline" className={`${styles[action] || ""} font-medium text-[10px] uppercase tracking-tight shadow-none`}>
      {action}
    </Badge>
  );
}
