/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import Layout from "./components/Layout";
import Dashboard from "./components/Dashboard";
import HostManagement from "./components/HostManagement";
import CertificateManagement from "./components/CertificateManagement";
import RevocationManagement from "./components/RevocationManagement";
import AuditLogs from "./components/AuditLogs";
import UserManagement from "./components/UserManagement";
import Login from "./components/Login";
import { Toaster } from "@/components/ui/sonner";
import { Loader2 } from "lucide-react";

export default function App() {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await fetch("/api/me");
        if (res.ok) {
          const data = await res.json();
          setUser(data);
        } else {
          setUser(null);
        }
      } catch (err) {
        setUser(null);
      } finally {
        setLoading(false);
      }
    };
    checkAuth();
  }, []);

  if (loading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-[#F5F5F4]">
        <Loader2 className="w-8 h-8 animate-spin text-[#141414]/40" />
      </div>
    );
  }

  if (!user) {
    return (
      <>
        <Login onLogin={() => window.location.reload()} />
        <Toaster position="top-right" />
      </>
    );
  }

  const renderContent = () => {
    switch (activeTab) {
      case "dashboard":
        return <Dashboard user={user} />;
      case "hosts":
        return <HostManagement user={user} />;
      case "certificates":
        return <CertificateManagement user={user} />;
      case "revocation":
        return <RevocationManagement user={user} />;
      case "users":
        return <UserManagement />;
      case "audit":
        return <AuditLogs user={user} />;
      default:
        return <Dashboard user={user} />;
    }
  };

  return (
    <>
      <Layout activeTab={activeTab} setActiveTab={setActiveTab} user={user} onLogout={() => setUser(null)}>
        {renderContent()}
      </Layout>
      <Toaster position="top-right" />
    </>
  );
}

import { ShieldCheck } from "lucide-react";

