import { useState } from "react";
import { Shield, ShieldAlert, Terminal, Globe, Lock, Activity } from "lucide-react";
import ScannerTab from "./components/ScannerTab";
import AntiMalwareTab from "./components/AntiMalwareTab";
import FirewallTab from "./components/FirewallTab";
import ProxyTab from "./components/ProxyTab";
import AdbTab from "./components/AdbTab";

type TabId = "scanner" | "antimalware" | "firewall" | "proxy" | "adb";

export default function App() {
  const [activeTab, setActiveTab] = useState<TabId>("scanner");

  const tabs = [
    {
      id: "scanner" as TabId,
      label: "Audit IA",
      icon: ShieldAlert,
      color: "text-rose-400 hover:text-rose-300",
      activeColor: "bg-rose-500/10 text-rose-400 border-rose-500/30",
    },
    {
      id: "antimalware" as TabId,
      label: "Antivirus",
      icon: Shield,
      color: "text-emerald-400 hover:text-emerald-300",
      activeColor: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30",
    },
    {
      id: "firewall" as TabId,
      label: "Firewall",
      icon: Lock,
      color: "text-blue-400 hover:text-blue-300",
      activeColor: "bg-blue-500/10 text-blue-400 border-blue-500/30",
    },
    {
      id: "proxy" as TabId,
      label: "VPN & Tor",
      icon: Globe,
      color: "text-cyan-400 hover:text-cyan-300",
      activeColor: "bg-cyan-500/10 text-cyan-400 border-cyan-500/30",
    },
    {
      id: "adb" as TabId,
      label: "Logs ADB",
      icon: Terminal,
      color: "text-amber-400 hover:text-amber-300",
      activeColor: "bg-amber-500/10 text-amber-400 border-amber-500/30",
    },
  ];

  return (
    <div className="flex flex-col min-h-screen bg-slate-950 text-slate-100 font-sans">
      {/* Top Header Section */}
      <header className="sticky top-0 z-50 border-b border-slate-800 bg-slate-950/80 backdrop-blur-md px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 rounded-lg bg-cyan-500/15 border border-cyan-500/30">
            <Activity className="h-5 w-5 text-cyan-400 animate-pulse" />
          </div>
          <div>
            <h1 className="text-base font-bold tracking-tight text-white uppercase">
              Sentinel Security AI
            </h1>
            <p className="text-[10px] font-mono text-cyan-400/80 uppercase tracking-widest font-semibold flex items-center gap-1">
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-cyan-400 animate-ping"></span>
              Cœurs Natifs Actifs
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 bg-slate-900 border border-slate-800 rounded-full px-2.5 py-1">
          <span className="h-2 w-2 rounded-full bg-emerald-500"></span>
          <span className="text-[10px] font-mono font-medium text-slate-300 uppercase">
            SÉCURISÉ
          </span>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 overflow-y-auto pb-24 md:pb-6">
        <div className="max-w-4xl mx-auto px-4 py-4">
          {activeTab === "scanner" && <ScannerTab />}
          {activeTab === "antimalware" && <AntiMalwareTab />}
          {activeTab === "firewall" && <FirewallTab />}
          {activeTab === "proxy" && <ProxyTab />}
          {activeTab === "adb" && <AdbTab />}
        </div>
      </main>

      {/* Bottom Navigation (Optimised for Mobile & Touch Targets) */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-slate-800 bg-slate-950/90 backdrop-blur-lg pb-safe">
        <div className="max-w-4xl mx-auto px-3 py-2">
          <div className="grid grid-cols-5 gap-1">
            {tabs.map((tab) => {
              const TabIcon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex flex-col items-center justify-center py-2 rounded-xl border transition-all duration-300 active:scale-95 ${
                    isActive
                      ? `${tab.activeColor} border`
                      : "border-transparent text-slate-400 hover:text-slate-200"
                  }`}
                  style={{ minHeight: "48px" }}
                >
                  <TabIcon className={`h-5 w-5 mb-1 ${isActive ? "" : tab.color}`} />
                  <span className="text-[10px] font-medium tracking-tight truncate w-full text-center px-1">
                    {tab.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </nav>
    </div>
  );
}
