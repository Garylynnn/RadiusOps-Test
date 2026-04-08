/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import Layout from "./components/Layout";
import Dashboard from "./components/Dashboard";
import HostManagement from "./components/HostManagement";
import CertificateManagement from "./components/CertificateManagement";
import AuditLogs from "./components/AuditLogs";
import { Toaster } from "@/components/ui/sonner";

export default function App() {
  const [activeTab, setActiveTab] = useState("dashboard");

  const renderContent = () => {
    switch (activeTab) {
      case "dashboard":
        return <Dashboard />;
      case "hosts":
        return <HostManagement />;
      case "certificates":
        return <CertificateManagement />;
      case "audit":
        return <AuditLogs />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <>
      <Layout activeTab={activeTab} setActiveTab={setActiveTab}>
        {renderContent()}
      </Layout>
      <Toaster position="top-right" />
    </>
  );
}

import { ShieldCheck } from "lucide-react";

