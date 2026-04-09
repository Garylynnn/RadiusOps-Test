import React from "react";
import { LayoutDashboard, Server, ShieldCheck, ShieldAlert, History, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";

interface LayoutProps {
  children: React.ReactNode;
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export default function Layout({ children, activeTab, setActiveTab }: LayoutProps) {
  const menuItems = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { id: "hosts", label: "Host Provisioning", icon: Server },
    { id: "certificates", label: "Certificates", icon: ShieldCheck },
    { id: "revocation", label: "Revocation", icon: ShieldAlert },
    { id: "audit", label: "Audit Logs", icon: History },
  ];

  return (
    <div className="flex h-screen bg-[#F5F5F4] text-[#141414] font-sans">
      {/* Sidebar */}
      <aside className="w-64 border-r border-[#141414]/10 bg-white flex flex-col">
        <div className="p-6">
          <div className="flex items-center gap-2 mb-8">
            <div className="w-8 h-8 bg-[#141414] rounded flex items-center justify-center">
              <ShieldCheck className="text-white w-5 h-5" />
            </div>
            <h1 className="font-bold text-xl tracking-tight">RadiusOps</h1>
          </div>
          
          <nav className="space-y-1">
            {menuItems.map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                  activeTab === item.id
                    ? "bg-[#141414] text-white"
                    : "text-[#141414]/60 hover:bg-[#141414]/5 hover:text-[#141414]"
                )}
              >
                <item.icon className="w-4 h-4" />
                {item.label}
              </button>
            ))}
          </nav>
        </div>

        <div className="mt-auto p-6 space-y-4">
          <Separator className="bg-[#141414]/10" />
          <div className="flex items-center gap-3 px-3">
            <div className="w-8 h-8 rounded-full bg-[#141414]/10 flex items-center justify-center text-xs font-bold">
              GL
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">garylinu@gmail.com</p>
              <p className="text-xs text-[#141414]/40 truncate">IT Operator</p>
            </div>
          </div>
          <Button variant="ghost" className="w-full justify-start gap-3 text-[#141414]/60 hover:text-destructive">
            <LogOut className="w-4 h-4" />
            Logout
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="h-16 border-bottom border-[#141414]/10 bg-white flex items-center justify-between px-8">
          <h2 className="font-semibold text-lg capitalize">{activeTab.replace("-", " ")}</h2>
          <div className="flex items-center gap-4">
            <div className="text-xs font-mono text-[#141414]/40 bg-[#141414]/5 px-2 py-1 rounded">
              System Status: <span className="text-green-600 font-bold">ONLINE</span>
            </div>
          </div>
        </header>
        
        <ScrollArea className="flex-1 p-8">
          <div className="max-w-6xl mx-auto">
            {children}
          </div>
        </ScrollArea>
      </main>
    </div>
  );
}

