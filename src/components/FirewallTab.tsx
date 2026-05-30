import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Settings2,
  Power,
  Network,
  Search,
  AlertCircle,
  ShieldAlert,
  Activity,
  Terminal,
  Shield,
  ShieldOff,
  Check,
  X,
  Eye,
  BrainCircuit,
  AppWindow,
  LayoutGrid,
} from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface NetworkLog {
  id: string;
  time: string;
  app: string;
  pkg: string;
  ip: string;
  port: number;
  status: "allowed" | "blocked";
  isAiAnalyzed?: boolean;
  aiRecommendation?: {
    suspiciousBehavior?: string;
    decision?: string;
    uiType?: string;
    technicalReason?: string;
    userFriendlyMessage?: string;
    androidIntentAction?: string;
  };
}

export default function FirewallTab() {
  const [enabled, setEnabled] = useState(false);
  const [aiAutoConfig, setAiAutoConfig] = useState(true);
  const [aiLogAnalysis, setAiLogAnalysis] = useState(true);
  const [allowLocalNetwork, setAllowLocalNetwork] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<"overview" | "apps" | "logs">("overview");
  const [appFilter, setAppFilter] = useState<"all" | "user" | "system">("all");

  const [trafficData, setTrafficData] = useState<
    { time: string; chrome: number; system: number; facebook: number }[]
  >([]);
  const [activeConnections, setActiveConnections] = useState<
    {
      id: string;
      app: string;
      protocol: string;
      remoteIp: string;
      port: number;
      status: string;
    }[]
  >([]);
  const [apps, setApps] = useState<any[]>([]);

  const [logs, setLogs] = useState<NetworkLog[]>([]);
  const terminalContainerRef = useRef<HTMLDivElement>(null);
  const [autoScroll, setAutoScroll] = useState(true);

  const handleScroll = () => {
    if (terminalContainerRef.current) {
      const { scrollTop, scrollHeight, clientHeight } =
        terminalContainerRef.current;
      const isScrolledToBottom =
        Math.abs(scrollHeight - clientHeight - scrollTop) < 50;
      setAutoScroll(isScrolledToBottom);
    }
  };

  useEffect(() => {
    // 1. Fetch apps on mount or when returning
    import("../native/AndroidBridge").then(({ NativeBridge }) => {
      NativeBridge.requestInstalledApps();
      NativeBridge.requestActiveConnections();
    });

    window.onInstalledAppsList = (appsJson: string) => {
      try {
        const parsed = JSON.parse(appsJson);
        if (Array.isArray(parsed)) {
          setApps(parsed);
        }
      } catch (e) {
        console.error("Failed to parse apps list", e);
      }
    };

    window.onActiveConnectionsUpdate = (json: string) => {
      try {
        setActiveConnections(JSON.parse(json));
      } catch (e) { }
    };
    
    window.onTrafficStatsUpdate = (json: string) => {
      try {
        setTrafficData(JSON.parse(json));
      } catch (e) { }
    };

    // 2. Listen to real network traffic from Android VpnService
    window.onNetworkLogIntercepted = (logJson: string) => {
      if (!enabled) return;

      try {
        const parsedLog: NetworkLog = JSON.parse(logJson);
        const { app, pkg, ip, port, status } = parsedLog;

        let counter = Date.now() + Math.random();
        const newLog: NetworkLog = {
          ...parsedLog,
          id: `log_${counter}`,
          time: new Date().toLocaleTimeString("fr-FR", {
            hour12: false,
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
          }),
        };

        setLogs((prev) => [...prev.slice(-49), newLog]);

        const isSuspicious = aiLogAnalysis && status === "blocked"; // Relying on actual firewall blocks or AI heuristic flags from native?
        // Or if the UI needs to do the analysis for EVERY log if aiLogAnalysis is on:
        if (aiLogAnalysis) {
          import("../lib/localAi").then(({ LocalAIService }) => {
            LocalAIService.evaluateNetworkRequest(
              {
                appName: app,
                packageName: pkg,
                ip: ip,
                port: port,
                reputation: "Unknown",
                allowLocalNetwork: allowLocalNetwork,
              },
              aiAutoConfig ? "auto" : "manual",
              () => {},
            ).then((aiInterpretation) => {
              if (aiInterpretation) {
                setLogs((prevLogs) =>
                  prevLogs.map((l) =>
                    l.id === newLog.id
                      ? {
                          ...l,
                          aiRecommendation: {
                            decision: aiInterpretation.decision,
                            uiType: aiInterpretation.uiType,
                            technicalReason: aiInterpretation.technicalReason,
                            userFriendlyMessage:
                              aiInterpretation.userFriendlyMessage,
                            androidIntentAction:
                              aiInterpretation.androidIntentAction,
                          },
                        }
                      : l,
                  ),
                );
              }
            });
          });
        }
      } catch (e) {
        console.error("Failed to parse network log", e);
      }
    };

    return () => {
      window.onInstalledAppsList = undefined;
      window.onNetworkLogIntercepted = undefined;
      window.onActiveConnectionsUpdate = undefined;
      window.onTrafficStatsUpdate = undefined;
    };
  }, [enabled, aiAutoConfig, aiLogAnalysis, allowLocalNetwork]);

  useEffect(() => {
    // Verify the Android Bridge connection exists and is loaded properly before allowing execution of firewall tasks. This is not a simulation anymore
    import("../native/AndroidBridge").then(({ NativeBridge }) => {
       NativeBridge.enableFirewall(enabled);
    });
  }, [enabled]);

  useEffect(() => {
    if (autoScroll && terminalContainerRef.current) {
      terminalContainerRef.current.scrollTop =
        terminalContainerRef.current.scrollHeight;
    }
  }, [logs, autoScroll]);

  const toggleAppStatus = (id: string) => {
    setApps(
      apps.map((app) => {
        if (app.id === id) {
          const nextStatus = app.status === "allowed" ? "blocked" : "allowed";
          if (window.AndroidBridge?.setAppStatus)
            window.AndroidBridge.setAppStatus(app.package, nextStatus);
          return {
            ...app,
            status: nextStatus,
            reason: nextStatus === "blocked" ? "Manually Blocked" : "",
          };
        }
        return app;
      }),
    );
  };

  const blockSimilarRequests = (pkg: string) => {
    setApps(
      apps.map((app) => {
        if (app.package === pkg && app.status !== "blocked") {
          if (window.AndroidBridge?.setAppStatus)
            window.AndroidBridge.setAppStatus(pkg, "blocked");
          return { ...app, status: "blocked", reason: "Blocked via Logs" };
        }
        return app;
      }),
    );
  };

  const allowSimilarRequests = (pkg: string) => {
    setApps(
      apps.map((app) => {
        if (app.package === pkg && app.status !== "allowed") {
          if (window.AndroidBridge?.setAppStatus)
            window.AndroidBridge.setAppStatus(pkg, "allowed");
          return { ...app, status: "allowed", reason: "" };
        }
        return app;
      }),
    );
  };

  const ignoreRecommendation = (logId: string) => {
    setLogs(
      logs.map((log) =>
        log.id === logId ? { ...log, aiRecommendation: undefined } : log,
      ),
    );
  };

  const filteredApps = apps.filter((app) => {
    const matchesSearch =
      app.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.package.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = appFilter === "all" || app.type === appFilter;
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="flex flex-col w-full h-full gap-4 flex-1 min-h-[700px]">
      {/* Configuration Header */}
      <div className="bg-slate-900/40 backdrop-blur-md border border-cyan-500/20 shadow-[0_0_30px_rgba(6,182,212,0.05)] rounded-[20px] p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shrink-0 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 w-full flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-display font-bold text-white tracking-tight">
              Local Firewall
            </h2>
            <p className="text-slate-400 text-sm mt-1">
              Manage and secure your device's network connections.
            </p>
            <div className="mt-2 bg-blue-500/10 border border-blue-500/20 p-2 rounded-lg inline-block w-full max-w-2xl">
              <p className="text-[10.5px] leading-relaxed text-blue-300">
                <span className="font-bold">How it works?</span> This firewall interfaces via the Android VpnService API to analyze traffic locally. None of your data is sent externally.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div
              onClick={() => setEnabled(!enabled)}
              className={`p-2.5 rounded-xl transition-colors cursor-pointer ${enabled ? "bg-cyan-500/20 text-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.3)] hover:bg-cyan-500/30" : "bg-black/40 text-slate-500 border border-white/5 hover:bg-white/10"}`}
            >
              <Power className="w-5 h-5" />
            </div>
            <div onClick={() => setEnabled(!enabled)} className="cursor-pointer group">
              <h3 className="font-bold text-sm text-white group-hover:text-cyan-400 transition-colors">
                Firewall Status
              </h3>
              <p className={`text-xs font-mono mt-0.5 ${enabled ? "text-cyan-400 animate-pulse" : "text-slate-500"}`}>
                {enabled ? "ACTIF" : "DÉSACTIVÉ"}
              </p>
            </div>
            <button
              onClick={() => setEnabled(!enabled)}
              className={`ml-2 relative inline-flex h-6 w-11 items-center rounded-full transition-colors shrink-0 ${enabled ? "bg-cyan-400 shadow-[0_0_10px_rgba(6,182,212,0.5)]" : "bg-white/10"}`}
            >
              <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${enabled ? "translate-x-6" : "translate-x-1"}`} />
            </button>
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex border-b border-cyan-500/20 px-2 space-x-6 overflow-x-auto scrollbar-hide py-1 shrink-0">
        <button
          onClick={() => setActiveTab("overview")}
          className={`pb-3 text-sm font-bold transition-colors whitespace-nowrap border-b-2 flex items-center gap-2 ${activeTab === "overview" ? "border-cyan-400 text-cyan-400" : "border-transparent text-slate-500 hover:text-slate-300"}`}
        >
          <Activity className="w-4 h-4" /> Dashboard
        </button>
        <button
          onClick={() => setActiveTab("apps")}
          className={`pb-3 text-sm font-bold transition-colors whitespace-nowrap border-b-2 flex items-center gap-2 ${activeTab === "apps" ? "border-cyan-400 text-cyan-400" : "border-transparent text-slate-500 hover:text-slate-300"}`}
        >
          <AppWindow className="w-4 h-4" /> Rules & Applications
        </button>
        <button
          onClick={() => setActiveTab("logs")}
          className={`pb-3 text-sm font-bold transition-colors whitespace-nowrap border-b-2 flex items-center gap-2 ${activeTab === "logs" ? "border-cyan-400 text-cyan-400" : "border-transparent text-slate-500 hover:text-slate-300"}`}
        >
          <Terminal className="w-4 h-4" /> Log Supervision
        </button>
      </div>

      {/* Tab Content Areas */}
      <div className="flex-1 flex flex-col pb-6">
        {activeTab === "overview" && (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 auto-rows-max">
            {/* Rules Engine & Config */}
            <div className="bg-slate-900/40 backdrop-blur-md border border-cyan-500/20 shadow-[0_0_30px_rgba(6,182,212,0.02)] rounded-[20px] p-5 lg:col-span-2 flex flex-col min-h-[400px]">
              <h3 className="font-bold flex items-center gap-2 text-white mb-6 bg-black/40 p-3 rounded-xl border border-white/5">
                <Settings2 className="w-5 h-5 text-cyan-400" />
                <div>
                  <span className="block text-sm">Automatic Control (AI)</span>
                  <span className="text-[10px] text-cyan-500/50 uppercase font-mono">Network Policy</span>
                </div>
              </h3>
              <div className="space-y-4 flex-1">
                <label className={`flex items-start gap-4 cursor-pointer p-4 rounded-xl transition-colors ${aiAutoConfig ? "bg-cyan-500/10 border-cyan-500/30" : "bg-white/5 border-transparent"} border`}>
                  <input type="checkbox" className="mt-1 accent-cyan-400 w-4 h-4 cursor-pointer shrink-0" checked={aiAutoConfig} onChange={() => setAiAutoConfig(!aiAutoConfig)} />
                  <div>
                    <p className="text-sm font-bold text-white mb-1 flex items-center gap-2">
                      AI Piloting {aiAutoConfig && <span className="text-[9px] bg-cyan-500/20 text-cyan-400 px-1.5 py-0.5 rounded uppercase font-bold animate-pulse">Recommended</span>}
                    </p>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      The AI makes autonomous decisions to block threats.
                    </p>
                  </div>
                </label>
                <label className={`flex items-start gap-4 cursor-pointer p-4 rounded-xl transition-colors ${allowLocalNetwork ? "bg-emerald-500/10 border-emerald-500/30" : "bg-white/5 border-transparent"} border`}>
                  <input type="checkbox" className="mt-1 accent-emerald-400 w-4 h-4 cursor-pointer shrink-0" checked={allowLocalNetwork} onChange={() => setAllowLocalNetwork(!allowLocalNetwork)} />
                  <div>
                    <p className="text-sm font-bold text-white mb-1 flex items-center gap-2">Allow Local Network</p>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      Allows LAN communication (Chromecast, printers).
                    </p>
                  </div>
                </label>
                {!aiAutoConfig && (
                  <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="bg-rose-500/10 border border-rose-500/30 p-4 rounded-xl flex items-start gap-3">
                    <AlertCircle className="w-4 h-4 text-rose-400 mt-0.5 shrink-0" />
                    <p className="text-[11px] text-rose-200 leading-relaxed font-mono">
                      <span className="font-bold text-rose-400 uppercase tracking-widest block mb-1">Manual Override</span>
                      All applications without a rule will be allowed.
                    </p>
                  </motion.div>
                )}
              </div>
            </div>

            {/* AI Log Config */}
            <div className="bg-gradient-to-br from-slate-900/60 to-black backdrop-blur-md border border-cyan-500/20 shadow-[0_0_30px_rgba(6,182,212,0.02)] rounded-[20px] p-5 lg:col-span-2 relative overflow-hidden flex flex-col min-h-[400px]">
              <div className="absolute right-[-40px] top-[-40px] w-32 h-32 bg-cyan-500/10 rounded-full blur-3xl" />
              <h3 className="font-bold flex items-center gap-2 text-white mb-6 bg-black/40 p-3 rounded-xl border border-white/5 relative z-10">
                <Network className="w-5 h-5 text-cyan-400" />
                <div>
                  <span className="block text-sm">Behavioral Analysis</span>
                  <span className="text-[10px] text-cyan-500/50 uppercase font-mono">Log Inspection</span>
                </div>
              </h3>
              <div className="flex-1 space-y-5 relative z-10">
                <div className="flex items-start justify-between bg-black/40 p-4 rounded-xl border border-white/5">
                  <div className="space-y-1">
                    <p className="text-sm font-bold text-white">Real-time flow analysis</p>
                    <p className="text-xs text-slate-400 pr-4 leading-relaxed">
                      The AI generates recommendations on blocked requests.
                    </p>
                  </div>
                  <button onClick={() => setAiLogAnalysis(!aiLogAnalysis)} className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors shrink-0 mt-1 ${aiLogAnalysis ? "bg-cyan-400 shadow-[0_0_10px_rgba(6,182,212,0.5)]" : "bg-white/10"}`}>
                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${aiLogAnalysis ? "translate-x-6" : "translate-x-1"}`} />
                  </button>
                </div>
                {aiLogAnalysis ? (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} layout className="bg-cyan-500/10 p-4 rounded-xl border border-cyan-500/30 flex items-start gap-3">
                    <Activity className="w-4 h-4 text-cyan-400 mt-0.5 shrink-0" />
                    <p className="text-xs text-cyan-50 leading-relaxed font-mono">
                      <span className="font-bold text-cyan-400 animate-pulse">ACTIVE SUPERVISION</span>
                    </p>
                  </motion.div>
                ) : (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} layout className="bg-slate-800 p-4 rounded-xl border border-white/5 flex items-start gap-3">
                    <Eye className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
                    <p className="text-xs text-slate-300 leading-relaxed font-mono">Disabled.</p>
                  </motion.div>
                )}
              </div>
            </div>

            {/* Traffic Visualization */}
            <div className="bg-transparent overflow-hidden flex flex-col lg:flex-row h-auto min-h-[500px] lg:col-span-4 mt-2 mb-4 rounded-[20px]">
              <div className="flex-[3] border border-cyan-500/20 bg-slate-900/40 backdrop-blur-md rounded-[20px] lg:rounded-r-none lg:border-r-0 p-5 flex flex-col relative z-10">
                <div className="flex items-center gap-2 mb-6">
                  <Activity className="w-5 h-5 text-cyan-400" />
                  <div>
                    <h3 className="font-bold text-sm text-white">Bandwidth</h3>
                    <p className="text-[10px] uppercase font-mono text-cyan-500/50 mt-0.5">KB/s per application</p>
                  </div>
                </div>
                <div className="flex-1 min-h-[200px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={trafficData} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                      <XAxis dataKey="time" stroke="#475569" fontSize={10} tickLine={false} axisLine={false} />
                      <YAxis stroke="#475569" fontSize={10} tickLine={false} axisLine={false} />
                      <Tooltip contentStyle={{ backgroundColor: "rgba(0,0,0,0.8)", borderColor: "rgba(6,182,212,0.2)", borderRadius: "12px", fontSize: "12px", backdropFilter: "blur(8px)" }} itemStyle={{ color: "#E2E8F0" }} />
                      <Line type="monotone" dataKey="chrome" stroke="#22d3ee" strokeWidth={2} dot={false} name="Google Chrome" />
                      <Line type="monotone" dataKey="facebook" stroke="#ec4899" strokeWidth={2} dot={false} name="Facebook" />
                      <Line type="monotone" dataKey="system" stroke="#f43f5e" strokeWidth={2} dot={false} name="System" />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
              <div className="flex-[2] border border-cyan-500/20 lg:border-l lg:rounded-l-none bg-slate-950/80 p-5 flex flex-col rounded-[20px] mt-4 lg:mt-0 relative z-10">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="font-bold text-sm text-white">Active Connections</h3>
                    <p className="text-[10px] uppercase font-mono text-cyan-500/50 mt-0.5">Active sockets</p>
                  </div>
                  <span className="text-[10px] bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 px-2 py-0.5 rounded font-mono font-bold animate-pulse">
                    {activeConnections.length} ACTIVES
                  </span>
                </div>
                <div className="flex flex-col space-y-2 pr-2">
                  {activeConnections.length === 0 ? (
                    <div className="text-slate-500 font-mono text-xs p-4 text-center">No socket detected</div>
                  ) : (
                    activeConnections.map((conn) => (
                      <div key={conn.id} className="bg-black/60 border border-white/5 p-3 rounded-xl flex items-start flex-col gap-1.5 text-xs hover:border-cyan-500/20 transition-colors">
                        <div className="flex justify-between w-full items-center">
                          <p className="font-bold text-white leading-tight">{conn.app}</p>
                          <div>
                            {conn.status === "ESTABLISHED" && <span className="text-cyan-400 font-mono font-bold text-[9px] bg-cyan-500/10 border border-cyan-500/20 px-1.5 py-0.5 rounded">ESTABLISHED</span>}
                            {conn.status === "BLOCKED" && <span className="text-rose-400 font-mono font-bold text-[9px] bg-rose-500/10 border border-rose-500/20 px-1.5 py-0.5 rounded">BLOCKED</span>}
                            {conn.status === "LISTEN" && <span className="text-purple-400 font-mono font-bold text-[9px] bg-purple-500/10 border border-purple-500/20 px-1.5 py-0.5 rounded">LISTENING</span>}
                          </div>
                        </div>
                        <p className="text-slate-500 font-mono text-[10px] bg-black/40 w-full p-1.5 rounded">{conn.protocol} &rarr; {conn.remoteIp}:{conn.port}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "apps" && (
          <div className="bg-slate-900/40 backdrop-blur-md border border-cyan-500/20 shadow-[0_0_30px_rgba(6,182,212,0.02)] rounded-[20px] overflow-hidden flex flex-col">
            <div className="p-4 border-b border-cyan-500/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-black/40 shrink-0">
              <div>
                <h3 className="font-bold text-base text-white">Rule Management</h3>
                <p className="text-xs text-slate-400 mt-1 max-w-sm">Complete list of applications. Explicitly block or allow their network access.</p>
              </div>
              <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
                <div className="flex bg-black/50 p-1 rounded-lg border border-white/10 w-full sm:w-auto">
                   <button onClick={() => setAppFilter("all")} className={`px-4 py-1.5 text-xs font-bold rounded-md transition-colors ${appFilter === "all" ? "bg-cyan-500/20 text-cyan-400" : "text-slate-400 hover:text-white"}`}>All</button>
                   <button onClick={() => setAppFilter("user")} className={`px-4 py-1.5 text-xs font-bold rounded-md transition-colors ${appFilter === "user" ? "bg-cyan-500/20 text-cyan-400" : "text-slate-400 hover:text-white"}`}>Installed</button>
                   <button onClick={() => setAppFilter("system")} className={`px-4 py-1.5 text-xs font-bold rounded-md transition-colors ${appFilter === "system" ? "bg-cyan-500/20 text-cyan-400" : "text-slate-400 hover:text-white"}`}>System</button>
                </div>
                <div className="relative w-full sm:w-64">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-cyan-500/50" />
                  <input value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} type="text" placeholder="Search..." className="w-full bg-black/40 border border-white/10 rounded-lg pl-9 pr-4 py-2 text-sm text-white focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-500/50 font-mono transition-colors" />
                </div>
              </div>
            </div>
            
            <div className="flex flex-col p-4 bg-black/20">
               <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                  {filteredApps.length === 0 && (
                     <div className="col-span-full py-10 flex text-center flex-col items-center justify-center text-slate-500 italic">
                        <LayoutGrid className="w-10 h-10 mb-3 opacity-20" />
                        No applications match your criteria.
                     </div>
                  )}
                  {filteredApps.map((app) => (
                    <div key={app.id} className={`p-4 border rounded-xl flex flex-col justify-between transition-colors gap-4 h-full ${app.status === "blocked" ? "bg-rose-950/20 border-rose-500/20" : "bg-black/40 border-white/5 hover:bg-white/5 hover:border-cyan-500/30"}`}>
                      <div className={`flex items-start gap-4 ${app.status === "blocked" ? "opacity-75" : ""}`}>
                        <div className={`w-12 h-12 shrink-0 bg-black/30 border border-white/5 rounded-xl flex items-center justify-center text-sm font-bold ${app.status === "blocked" ? "text-rose-400" : "text-cyan-400"}`}>
                          {app.initials}
                        </div>
                        <div className="overflow-hidden">
                          <p className="text-sm font-bold text-white flex items-center gap-2 truncate">
                            <span className="truncate">{app.name}</span>
                          </p>
                          <p className={`text-[11px] font-mono mt-1 pr-2 truncate ${app.status === "blocked" ? "text-rose-400/80" : "text-slate-400"}`}>
                            {app.package}
                          </p>
                          <div className="flex gap-2 mt-2">
                            {app.type === "system" && <span className="text-[9px] bg-slate-800 text-slate-400 border border-slate-700 px-1.5 py-0.5 rounded font-mono uppercase">System</span>}
                            {app.reason && app.reason.includes("IA") && <span className="text-[9px] bg-purple-500/20 text-purple-300 border border-purple-500/30 px-1.5 py-0.5 rounded font-mono uppercase">Managed by AI</span>}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between w-full mt-auto pt-4 border-t border-white/5">
                        {app.status === "blocked" && app.reason ? (
                          <span className="text-[10px] px-2 py-1 bg-rose-500/10 text-rose-400 rounded-lg border border-rose-500/20 flex items-center gap-1.5 font-bold uppercase tracking-wider truncate max-w-[140px]">
                            <ShieldAlert className="w-3.5 h-3.5 shrink-0" /> <span className="truncate">{app.reason}</span>
                          </span>
                        ) : <div />}
                        <button onClick={() => toggleAppStatus(app.id)} className={`text-xs px-4 py-2 border rounded-lg font-bold transition-colors ml-auto shrink-0 ${app.status === "blocked" ? "bg-transparent hover:bg-rose-500/20 text-rose-400 border-rose-500/20" : "bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 border-cyan-500/20"}`}>
                          {app.status === "blocked" ? "Allow" : "Block"}
                        </button>
                      </div>
                    </div>
                  ))}
               </div>
            </div>
          </div>
        )}

        {activeTab === "logs" && (
          <div className="bg-slate-900/40 backdrop-blur-md border border-cyan-500/20 rounded-[20px] overflow-hidden flex flex-col shadow-[0_0_30px_rgba(6,182,212,0.02)]">
            <div className="p-3 border-b border-cyan-500/20 flex items-center gap-3 bg-black/40 shrink-0">
              <Terminal className="w-5 h-5 text-cyan-400" />
              <span className="text-xs font-mono font-bold text-white uppercase tracking-widest">Network Logs & AI Recommendations</span>
              {logs.length > 0 && enabled && (
                <span className="ml-auto flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse"></span>
                  <span className="text-[10px] text-cyan-400 font-mono">LIVE</span>
                </span>
              )}
            </div>
            <div onScroll={handleScroll} ref={terminalContainerRef} className="flex flex-col p-4 font-mono text-[11px] leading-relaxed bg-black/60 scrollbar-hide">
              {!enabled ? (
                <div className="flex items-center justify-center h-full text-slate-600 font-bold uppercase tracking-widest">Firewall disabled.</div>
              ) : logs.length === 0 ? (
                <div className="flex items-center justify-center h-full text-slate-600 font-bold uppercase tracking-widest">Waiting for network connections <span className="animate-pulse ml-0.5">_</span></div>
              ) : (
                <div className="space-y-4">
                  {logs.map((log) => (
                    <div key={log.id} className="flex flex-col gap-2">
                       <div className={`flex flex-col md:flex-row md:items-center gap-2 md:gap-4 flex-1 p-3 rounded-lg transition-colors ${log.status === "blocked" ? "bg-rose-950/40 text-rose-300 border border-rose-500/10" : "bg-white/5 border border-white/5 text-slate-400"}`}>
                        <span className="opacity-50 shrink-0">[{log.time}]</span>
                        <span className={`px-2 py-0.5 rounded font-bold shrink-0 flex items-center gap-1.5 text-xs ${log.status === "blocked" ? "bg-rose-500/20 text-rose-400" : "bg-cyan-500/10 text-cyan-400"}`}>
                          {log.status === "blocked" ? <ShieldOff className="w-3.5 h-3.5" /> : <Shield className="w-3.5 h-3.5" />}
                          {log.status === "blocked" ? "BLOQUÉ" : "AUTORISÉ"}
                        </span>
                        <span className="font-bold text-white shrink-0 text-xs">{log.app}</span>
                        <span className="text-cyan-200/70 shrink-0">&rarr; {log.ip}:{log.port}</span>
                      </div>
                      <AnimatePresence>
                        {log.aiRecommendation && (
                          <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, height: 0 }} className="bg-gradient-to-r from-purple-900/40 to-black border border-purple-500/40 rounded-xl p-5 ml-6 relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-4 opacity-10 blur-xl pointer-events-none"><BrainCircuit className="w-32 h-32 text-purple-400" /></div>
                            <div className="flex items-start gap-4 relative z-10">
                              <div className="bg-purple-500/20 p-2 rounded-lg border border-purple-500/30 shrink-0 mt-1"><AlertCircle className="w-5 h-5 text-purple-300" /></div>
                              <div className="flex-1">
                                <h4 className="text-sm font-bold text-white font-sans flex flex-col md:flex-row md:items-center gap-2">
                                  <span>AI Security Alert</span>
                                  {log.aiRecommendation.uiType === "BACKGROUND_POPUP" && <span className="inline-block bg-purple-500/20 text-purple-300 text-[10px] px-2 py-0.5 rounded uppercase tracking-wider w-max">Active Overlay</span>}
                                  {log.aiRecommendation.uiType === "SYSTEM_NOTIFICATION" && <span className="inline-block bg-blue-500/20 text-blue-300 text-[10px] px-2 py-0.5 rounded uppercase tracking-wider w-max">Notification Emitted</span>}
                                </h4>
                                <p className="text-sm text-purple-200/90 mt-2 mb-3 font-sans leading-relaxed">{log.aiRecommendation.userFriendlyMessage || log.aiRecommendation.suspiciousBehavior}</p>
                                {log.aiRecommendation.technicalReason && (
                                  <p className="text-[11px] text-purple-400 font-mono mb-4 bg-purple-950/50 p-3 rounded-lg border border-purple-500/20">[Diagnostic] {log.aiRecommendation.technicalReason}<br/><span className="opacity-50 inline-block mt-1">Status: {log.aiRecommendation.decision} | Dispatch: {log.aiRecommendation.androidIntentAction}</span></p>
                                )}
                                <div className="flex flex-wrap items-center gap-3 mt-2">
                                  <button onClick={() => blockSimilarRequests(log.pkg)} className="px-5 py-2 bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/30 rounded-lg text-sm font-bold font-sans transition-colors cursor-pointer relative z-20">Block traffic</button>
                                  <button onClick={() => allowSimilarRequests(log.pkg)} className="px-5 py-2 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 rounded-lg text-sm font-bold font-sans transition-colors cursor-pointer relative z-20">Allow</button>
                                  <button onClick={() => ignoreRecommendation(log.id)} className="px-5 py-2 bg-white/5 hover:bg-white/10 text-slate-300 rounded-lg text-sm font-bold font-sans transition-colors cursor-pointer relative z-20">Ignore alert</button>
                                </div>
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  ))}
                  {logs.length > 0 && enabled && <div className="text-slate-500 mt-2 pl-2"><span className="animate-pulse">_</span></div>}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
