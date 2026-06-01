import { useState } from "react";
import { Shield, ShieldAlert, Terminal, Lock, Activity, Globe } from "lucide-react";
import { translations, Language } from "./lib/translations";
import ScannerTab from "./components/ScannerTab";
import BehaviorGuardTab from "./components/BehaviorGuardTab";
import FirewallTab from "./components/FirewallTab";
import AdbTab from "./components/AdbTab";
import ProxyTab from "./components/ProxyTab";
import { PrismLogo } from "./components/PrismLogo";

type TabId = "scanner" | "behaviorguard" | "firewall" | "proxy" | "adb";

export default function App() {
  const [activeTab, setActiveTab] = useState<TabId>("scanner");
  const [language, setLanguage] = useState<Language>(
    (localStorage.getItem("sentinel_language") as Language) || "FR"
  );
  const [isLangMenuOpen, setIsLangMenuOpen] = useState(false);

  const t = translations[language];

  const tabs = [
    {
      id: "scanner" as TabId,
      label: t.tabScanner,
      icon: ShieldAlert,
      color: "text-rose-400 hover:text-rose-300",
      activeColor: "bg-rose-500/10 text-rose-400 border-rose-500/30",
    },
    {
      id: "behaviorguard" as TabId,
      label: t.tabBehaviorGuard,
      icon: Shield,
      color: "text-emerald-400 hover:text-emerald-300",
      activeColor: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30",
    },
    {
      id: "firewall" as TabId,
      label: t.tabFirewall,
      icon: Lock,
      color: "text-blue-400 hover:text-blue-300",
      activeColor: "bg-blue-500/10 text-blue-400 border-blue-500/30",
    },
    {
      id: "proxy" as TabId,
      label: t.tabProxy,
      icon: Globe,
      color: "text-purple-400 hover:text-purple-300",
      activeColor: "bg-purple-500/10 text-purple-400 border-purple-500/30",
    },
    {
      id: "adb" as TabId,
      label: t.tabAdb,
      icon: Terminal,
      color: "text-amber-400 hover:text-amber-300",
      activeColor: "bg-amber-500/10 text-amber-400 border-amber-500/30",
    },
  ];

  return (
    <div className="flex flex-col min-h-screen bg-slate-950 text-slate-100 font-sans">
      {/* Top Header Section */}
      <header className="sticky top-0 z-50 border-b border-slate-800 bg-slate-950/80 backdrop-blur-md px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 shadow-[0_0_15px_rgba(16,185,129,0.2)] flex items-center justify-center">
            <PrismLogo className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-base font-bold tracking-tight text-white uppercase bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
              {t.appTitle}
            </h1>
            <p className="text-[10px] font-mono text-emerald-400/80 uppercase tracking-widest font-semibold flex items-center gap-1">
              <span className="inline-block h-1.5 w-1.5 rounded-full shadow-[0_0_8px_rgba(16,185,129,0.8)] bg-emerald-400 animate-pulse"></span>
              {t.subTitle}
            </p>
          </div>
        </div>

        {/* Improved Dropdown Language Selector Header Widget */}
        <div className="relative">
          <button
            onClick={() => setIsLangMenuOpen(!isLangMenuOpen)}
            className="flex items-center gap-1.5 bg-slate-900 border border-slate-800 rounded-full px-3 py-1.5 hover:border-emerald-500/40 hover:bg-slate-850 transition-all font-mono text-[10px] uppercase font-bold text-slate-300 cursor-pointer active:scale-95"
            aria-haspopup="listbox"
            aria-expanded={isLangMenuOpen}
            id="language-switcher-btn"
          >
            <span className="h-2 w-2 rounded-full bg-emerald-500"></span>
            <span className="mr-0.5">
              {language === "FR" ? "🇫🇷 FR" : language === "EN" ? "🇺🇸 EN" : "🇪🇸 ES"}
            </span>
            <span className="text-[8px] text-slate-500">▼</span>
          </button>

          {isLangMenuOpen && (
            <>
              <div 
                className="fixed inset-0 z-40" 
                onClick={() => setIsLangMenuOpen(false)}
                id="language-switcher-backdrop"
              />
              <div 
                className="absolute right-0 mt-2 w-32 rounded-xl bg-slate-900 border border-slate-800/80 p-1.5 shadow-xl shadow-black/90 z-50 flex flex-col gap-0.5"
                id="language-switcher-dropdown"
              >
                <button
                  onClick={() => {
                    const next = "FR";
                    setLanguage(next);
                    localStorage.setItem("sentinel_language", next);
                    setIsLangMenuOpen(false);
                  }}
                  className={`flex items-center gap-2 w-full text-left px-2.5 py-1.5 rounded-lg text-[11px] font-mono font-medium transition-all hover:bg-slate-800 cursor-pointer ${
                    language === "FR" ? "text-emerald-400 bg-emerald-500/5 font-bold" : "text-slate-300"
                  }`}
                  id="lang-option-fr"
                >
                  <span className="text-[13px] select-none">🇫🇷</span> FR
                </button>
                <button
                  onClick={() => {
                    const next = "EN";
                    setLanguage(next);
                    localStorage.setItem("sentinel_language", next);
                    setIsLangMenuOpen(false);
                  }}
                  className={`flex items-center gap-2 w-full text-left px-2.5 py-1.5 rounded-lg text-[11px] font-mono font-medium transition-all hover:bg-slate-800 cursor-pointer ${
                    language === "EN" ? "text-emerald-400 bg-emerald-500/5 font-bold" : "text-slate-300"
                  }`}
                  id="lang-option-en"
                >
                  <span className="text-[13px] select-none">🇺🇸</span> EN
                </button>
                <button
                  onClick={() => {
                    const next = "ES";
                    setLanguage(next);
                    localStorage.setItem("sentinel_language", next);
                    setIsLangMenuOpen(false);
                  }}
                  className={`flex items-center gap-2 w-full text-left px-2.5 py-1.5 rounded-lg text-[11px] font-mono font-medium transition-all hover:bg-slate-800 cursor-pointer ${
                    language === "ES" ? "text-emerald-400 bg-emerald-500/5 font-bold" : "text-slate-300"
                  }`}
                  id="lang-option-es"
                >
                  <span className="text-[13px] select-none">🇪🇸</span> ES
                </button>
              </div>
            </>
          )}
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 overflow-y-auto pb-24 md:pb-6">
        <div className="max-w-4xl mx-auto px-4 py-4">
          {activeTab === "scanner" && <ScannerTab />}
          {activeTab === "behaviorguard" && <BehaviorGuardTab />}
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
