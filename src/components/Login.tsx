import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { ShieldCheck, Lock, User, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface LoginProps {
  onLogin: () => void;
}

export default function Login({ onLogin }: LoginProps) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) {
      toast.error("Please enter both username and password");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      if (res.ok) {
        toast.success("Login successful");
        onLogin();
      } else {
        const data = await res.json();
        toast.error(data.error || "Authentication failed");
      }
    } catch (err) {
      toast.error("An error occurred during login");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F5F5F4] flex items-center justify-center p-4 font-sans">
      <Card className="w-full max-w-md border-[#141414]/10 shadow-xl bg-white">
        <CardHeader className="space-y-1 text-center pb-8">
          <div className="flex justify-center mb-4">
            <div className="w-12 h-12 bg-[#141414] rounded-xl flex items-center justify-center shadow-lg">
              <ShieldCheck className="text-white w-7 h-7" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold tracking-tight">RadiusOps Manager</CardTitle>
          <CardDescription className="text-[#141414]/60">
            System Authentication (PAM)
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">System Username</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#141414]/40" />
                <Input
                  id="username"
                  placeholder="e.g. root or admin"
                  className="pl-10 border-[#141414]/10 focus-visible:ring-[#141414]"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  autoComplete="username"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#141414]/40" />
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  className="pl-10 border-[#141414]/10 focus-visible:ring-[#141414]"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                />
              </div>
            </div>
          </CardContent>
          <CardFooter className="pt-4">
            <Button 
              type="submit" 
              className="w-full bg-[#141414] text-white hover:bg-[#141414]/90 h-11 text-base font-bold"
              disabled={loading}
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Authenticate"}
            </Button>
          </CardFooter>
        </form>
        <div className="px-8 pb-8 text-center">
          <p className="text-[10px] text-[#141414]/40 uppercase tracking-widest font-medium">
            Secure Infrastructure Access Control
          </p>
        </div>
      </Card>
    </div>
  );
}
