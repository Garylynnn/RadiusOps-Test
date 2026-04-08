import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Server, ShieldCheck, AlertTriangle, Activity } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

const data = [
  { name: "Mon", enrollments: 4 },
  { name: "Tue", enrollments: 7 },
  { name: "Wed", enrollments: 5 },
  { name: "Thu", enrollments: 12 },
  { name: "Fri", enrollments: 8 },
  { name: "Sat", enrollments: 2 },
  { name: "Sun", enrollments: 1 },
];

const deviceData = [
  { name: "Laptop", value: 45 },
  { name: "Desktop", value: 25 },
  { name: "Server", value: 30 },
];

const COLORS = ["#141414", "#404040", "#737373"];

export default function Dashboard() {
  return (
    <div className="space-y-8">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Enrolled" value="124" icon={Server} trend="+12% from last month" />
        <StatCard title="Active Certificates" value="118" icon={ShieldCheck} trend="95.2% health" />
        <StatCard title="Pending Approval" value="6" icon={Activity} trend="Requires attention" />
        <StatCard title="Revoked Hosts" value="12" icon={AlertTriangle} trend="3 this week" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Enrollment Trend */}
        <Card className="lg:col-span-2 border-[#141414]/10 shadow-none">
          <CardHeader>
            <CardTitle className="text-sm font-medium font-serif italic">Enrollment Trends</CardTitle>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#141414/10" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "#141414/40" }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "#141414/40" }} />
                <Tooltip 
                  cursor={{ fill: "#141414/5" }}
                  contentStyle={{ borderRadius: "8px", border: "1px solid rgba(20,20,20,0.1)", boxShadow: "none" }}
                />
                <Bar dataKey="enrollments" fill="#141414" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Device Distribution */}
        <Card className="border-[#141414]/10 shadow-none">
          <CardHeader>
            <CardTitle className="text-sm font-medium font-serif italic">Device Distribution</CardTitle>
          </CardHeader>
          <CardContent className="h-[300px] flex flex-col items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={deviceData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {deviceData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex gap-4 mt-4">
              {deviceData.map((entry, index) => (
                <div key={entry.name} className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index] }} />
                  <span className="text-xs text-[#141414]/60">{entry.name}</span>
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
