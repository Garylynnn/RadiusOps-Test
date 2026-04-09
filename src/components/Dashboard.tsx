import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Server, ShieldCheck, AlertTriangle, Activity } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export default function Dashboard({ user }: { user: any }) {
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    pending: 0,
    revoked: 0
  });
  const [loading, setLoading] = useState(true);

  const isAdmin = user?.role === "Admin";

  const fetchStats = async () => {
    try {
      const res = await fetch("/api/hosts");
      const data = await res.json();
      if (Array.isArray(data)) {
        setStats({
          total: data.length,
          active: data.filter((h: any) => h.status === "Provisioned").length,
          pending: data.filter((h: any) => h.status === "Draft" || h.status === "Approved").length,
          revoked: data.filter((h: any) => h.status === "Revoked").length
        });
      }
    } catch (err) {
      console.error("Failed to fetch stats");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const chartData = [
    { name: "Active", value: stats.active },
    { name: "Pending", value: stats.pending },
    { name: "Revoked", value: stats.revoked },
  ];

  const COLORS = ["#141414", "#404040", "#737373"];

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-medium text-[#141414]/60 uppercase tracking-wider">System Overview</h2>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Enrolled" value={stats.total} icon={Server} trend="Total hosts in system" />
        <StatCard title="Active Certificates" value={stats.active} icon={ShieldCheck} trend="Provisioned and valid" />
        <StatCard title="Pending Approval" value={stats.pending} icon={Activity} trend="Requires attention" />
        <StatCard title="Revoked Hosts" value={stats.revoked} icon={AlertTriangle} trend="Invalidated access" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Device Distribution */}
        <Card className="lg:col-span-3 border-[#141414]/10 shadow-none">
          <CardHeader>
            <CardTitle className="text-sm font-medium font-serif italic">Certificate Status Distribution</CardTitle>
          </CardHeader>
          <CardContent className="h-[300px] flex flex-col items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={80}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex gap-8 mt-4">
              {chartData.map((entry, index) => (
                <div key={entry.name} className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index] }} />
                  <span className="text-xs text-[#141414]/60 font-medium uppercase tracking-tight">{entry.name}: {entry.value}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function StatCard({ title, value, icon: Icon, trend }: any) {
  return (
    <Card className="border-[#141414]/10 shadow-none">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-xs font-medium text-[#141414]/60 uppercase tracking-wider">{title}</CardTitle>
        <Icon className="h-4 w-4 text-[#141414]/40" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold font-mono">{value}</div>
        <p className="text-[10px] text-[#141414]/40 mt-1 font-medium">{trend}</p>
      </CardContent>
    </Card>
  );
}
