import React from "react";
import { LayoutDashboard, Server, ShieldCheck, ShieldAlert, History, Settings, LogOut, Menu, Sparkles, Send, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { askAssistant } from "@/src/services/gemini";

interface LayoutProps {
  children: React.ReactNode;
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export default function Layout({ children, activeTab, setActiveTab }: LayoutProps) {
  const [isAssistantOpen, setIsAssistantOpen] = React.useState(false);
  const [query, setQuery] = React.useState("");
  const [messages, setMessages] = React.useState<{ role: "user" | "ai"; text: string }[]>([]);
  const [isTyping, setIsTyping] = React.useState(false);

  const handleSend = async () => {
    if (!query.trim()) return;
    const userMsg = query;
    setQuery("");
    setMessages(prev => [...prev, { role: "user", text: userMsg }]);
    setIsTyping(true);
    
    const response = await askAssistant(userMsg, `User is currently on the ${activeTab} tab.`);
    setMessages(prev => [...prev, { role: "ai", text: response }]);
    setIsTyping(false);
  };

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

      {/* AI Assistant Floating Panel */}
      <div className="fixed bottom-8 right-8 z-50 flex flex-col items-end gap-4">
        {isAssistantOpen && (
          <div className="w-80 h-[450px] bg-white border border-[#141414]/10 rounded-xl shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-bottom-4 duration-300">
            <div className="p-4 bg-[#141414] text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4" />
                <span className="text-sm font-bold">RadiusOps AI</span>
              </div>
              <Button variant="ghost" size="icon" className="h-6 w-6 text-white/60 hover:text-white" onClick={() => setIsAssistantOpen(false)}>
                <X className="w-4 h-4" />
              </Button>
            </div>
            
            <ScrollArea className="flex-1 p-4">
              <div className="space-y-4">
                {messages.length === 0 && (
                  <div className="text-center py-8 space-y-2">
                    <Sparkles className="w-8 h-8 mx-auto text-[#141414]/10" />
                    <p className="text-xs text-[#141414]/40">How can I help you with your IT operations today?</p>
                  </div>
                )}
                {messages.map((msg, i) => (
                  <div key={i} className={cn("flex flex-col", msg.role === "user" ? "items-end" : "items-start")}>
                    <div className={cn(
                      "max-w-[85%] px-3 py-2 rounded-lg text-sm",
                      msg.role === "user" ? "bg-[#141414] text-white" : "bg-[#141414]/5 text-[#141414]"
                    )}>
                      {msg.text}
                    </div>
                  </div>
                ))}
                {isTyping && (
                  <div className="flex items-start">
                    <div className="bg-[#141414]/5 text-[#141414] px-3 py-2 rounded-lg text-sm animate-pulse">
                      Typing...
                    </div>
                  </div>
                )}
              </div>
            </ScrollArea>

            <div className="p-4 border-t border-[#141414]/10 flex gap-2">
              <Input 
                placeholder="Ask anything..." 
                className="h-9 text-sm border-[#141414]/10 focus-visible:ring-[#141414]" 
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSend()}
              />
              <Button size="icon" className="h-9 w-9 bg-[#141414] text-white shrink-0" onClick={handleSend}>
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}
        
        <Button 
          onClick={() => setIsAssistantOpen(!isAssistantOpen)}
          className={cn(
            "w-14 h-14 rounded-full shadow-xl flex items-center justify-center transition-all duration-300",
            isAssistantOpen ? "bg-white text-[#141414] rotate-90" : "bg-[#141414] text-white"
          )}
        >
          {isAssistantOpen ? <X className="w-6 h-6" /> : <Sparkles className="w-6 h-6" />}
        </Button>
      </div>
    </div>
  );
}

