import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  ShieldAlert,
  Info,
  Play,
  CheckCircle2,
  AlertTriangle,
  ShieldX,
  Zap,
  BrainCircuit,
  Blocks,
  Cpu,
  ChevronDown,
  Activity,
  Terminal,
  FileCheck
} from "lucide-react";

import { ScanStatus, LogEntry, VulnerabilityResult, ScanMode } from "../types";

import { LocalAIService } from "../lib/localAi";

const Device = {
  getInfo: async () => ({ model: navigator.userAgent.substring(0, 30) + "...", osVersion: "Inconnu", platform: "web", manufacturer: "Web Browser", webViewVersion: "NA" }),
  getBatteryInfo: async () => ({ batteryLevel: 1, isCharging: true }),
  getLanguageCode: async () => 'en'
};

const Network = {
  getStatus: async () => ({ connected: navigator.onLine })
};

export default function ScannerTab() {
  const [status, setStatus] = useState<ScanStatus>("idle");
  const [scanMode, setScanMode] = useState<ScanMode>("full");
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [results, setResults] = useState<VulnerabilityResult[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const [activeTab, setActiveTab] = useState<"overview" | "results" | "logs">("overview");
  const terminalContainerRef = useRef<HTMLDivElement>(null);
  const [autoScroll, setAutoScroll] = useState(true);

  const startScan = async (mode: ScanMode) => {
    setStatus("scanning");
    setScanMode(mode);
    setLogs([]);
    setResults([]);
    setActiveTab("logs");

    try {
      const networkStatus = await Network.getStatus();
      if (!networkStatus.connected) {
         setLogs([
            { id: Date.now(), time: new Date().toLocaleTimeString(), message: "ERREUR FATALE: L'appareil est HORS LIGNE.", type: "error" },
            { id: Date.now() + 1, time: new Date().toLocaleTimeString(), message: "Vous devez obligatoirement être en ligne pour télécharger les dernières vulnérabilités réelles de production.", type: "error" }
         ]);
         window.alert("Erreur : Vous devez être en ligne pour continuer.");
         setStatus("completed");
         return;
      }

      if (mode === "apps") {
        setLogs((prev) => [
          ...prev,
          {
            id: Date.now(),
            time: new Date().toLocaleTimeString(),
            message: "Initialisation du diagnostic d'applications...",
            type: "info",
          },
        ]);

        const handleAiProgress = (msg: any) => {
          if (typeof msg === 'object' && msg.type === 'progress') {
            setLogs((prev) => {
              const id = 'progress_' + msg.file;
              const existingIndex = prev.findIndex(l => l.id === id);
              
              // Define animation frame based on progress
              const spinner = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'][Math.floor(msg.progress) % 10];
              
              const text = msg.status === 'downloading'
                ? `Téléchargement ${msg.file} ${spinner} ${Math.round(msg.progress)}%`
                : `Chargement en mémoire [${msg.file}] ${spinner} ${Math.round(msg.progress)}%`;

              if (existingIndex >= 0) {
                const newLogs = [...prev];
                
                // If it's effectively finished, freeze the text without spinner
                if (msg.progress >= 100) {
                    newLogs[existingIndex] = { ...newLogs[existingIndex], message: msg.status === 'downloading' ? `Téléchargement ${msg.file} ✔️ 100%` : `Chargement en mémoire [${msg.file}] ✔️ 100%` };
                } else {
                    newLogs[existingIndex] = { ...newLogs[existingIndex], message: text };
                }
                return newLogs;
              } else {
                return [...prev, { id, time: new Date().toLocaleTimeString(), message: text, type: "info" }];
              }
            });
          } else {
            setLogs((prev) => [
              ...prev,
              {
                id: Date.now() + Math.random(),
                time: new Date().toLocaleTimeString(),
                message: msg as string,
                type: "info",
              },
            ]);
          }
        };

        // 1. Initialisation de l'IA Locale
        await LocalAIService.initialize(handleAiProgress);

        const { AppScanner } = await import("../lib/appScanner");
        let appsList: any[] = [];

        try {
          setLogs((prev) => [
            ...prev,
            {
              id: Date.now(),
              time: new Date().toLocaleTimeString(),
              message: "Interrogation de l'API native PackageManager...",
              type: "action",
            },
          ]);
          const result = await AppScanner.getInstalledApps();
          appsList = result.apps || [];
          setLogs((prev) => [
            ...prev,
            {
              id: Date.now(),
              time: new Date().toLocaleTimeString(),
              message: `${appsList.length} applications détectées par le plugin natif.`,
              type: "success",
            },
          ]);
        } catch (e) {
          setLogs((prev) => [
            ...prev,
            {
              id: Date.now(),
              time: new Date().toLocaleTimeString(),
              message: `Plugin natif inatteignable (exécution web). Le scan d'applications nécessite l'application native.`,
              type: "warning",
            },
          ]);
          appsList = [];
        }

        if (appsList.length === 0) {
          setLogs((prev) => [
            ...prev,
            {
              id: Date.now(),
              time: new Date().toLocaleTimeString(),
              message: "Analyse annulée: aucune application trouvée.",
              type: "warning",
            },
          ]);
          setStatus("completed");
          setActiveTab("results");
          return;
        }

        const appResults = await LocalAIService.analyzeApps(
          appsList,
          (msg, type) => {
            setLogs((prev) => [
              ...prev,
              {
                id: Date.now() + Math.random(),
                time: new Date().toLocaleTimeString(),
                message: msg,
                type: (type as any) || "info",
              },
            ]);
          },
        );

        setTimeout(() => {
          setResults(
            appResults.map((r) => ({
              cveId:
                "APP-RISK-" +
                Math.random().toString(36).substr(2, 5).toUpperCase(),
              title: "Application Suspecte: " + r.appName,
              severity:
                r.riskLevel === "Élevé"
                  ? "CRITICAL"
                  : r.riskLevel === "Modéré"
                    ? "HIGH"
                    : "MODERATE",
              impact: `Paquet: ${r.packageName}`,
              description: r.reason,
              concept: r.userFriendlyWarning,
              updateStatus: r.canAutomate
                ? `Action Dispo: ${r.automationAction}`
                : "Désinstallation Manuelle",
              mitigation:
                "Ouvrir les paramètres Android pour désinstaller ou révoquer les droits.",
            })),
          );
          setStatus("completed");
          setActiveTab("results");
        }, 500);
        return;
      }

      // 1. Gather Real Device Information
      setLogs((prev) => [
        ...prev,
        {
          id: Date.now(),
          time: new Date().toLocaleTimeString(),
          message: "Initialisation du diagnostic matériel...",
          type: "info",
        },
      ]);

      let info: any = {};
      let fullDeviceInfo: any = {};
      try {
        info = await Device.getInfo();
        fullDeviceInfo.info = info;
        try {
          fullDeviceInfo.battery = await Device.getBatteryInfo();
        } catch (e) {}
        try {
          fullDeviceInfo.language = await Device.getLanguageCode();
        } catch (e) {}

        setLogs((prev) => [
          ...prev,
          {
            id: Date.now() + 1,
            time: new Date().toLocaleTimeString(),
            message: `Modele: ${info.model || "Inconnu"} (OS: ${info.osVersion || "Inconnu"}) - Plateforme: ${info.platform}`,
            type: "success",
          },
        ]);
        setLogs((prev) => [
          ...prev,
          {
            id: Date.now() + 10,
            time: new Date().toLocaleTimeString(),
            message: `Fabricant: ${info.manufacturer || "Inconnu"} | WebView: ${info.webViewVersion || "NA"}`,
            type: "info",
          },
        ]);
        if (fullDeviceInfo.battery) {
          setLogs((prev) => [
            ...prev,
            {
              id: Date.now() + 11,
              time: new Date().toLocaleTimeString(),
              message: `Batterie: ${Math.round((fullDeviceInfo.battery.batteryLevel || 0) * 100)}% | En charge: ${fullDeviceInfo.battery.isCharging}`,
              type: "info",
            },
          ]);
        }
      } catch (err) {
        setLogs((prev) => [
          ...prev,
          {
            id: Date.now() + 1,
            time: new Date().toLocaleTimeString(),
            message: `Information matériel indisponible (exécution web/simulateur)`,
            type: "warning",
          },
        ]);
        info = {
          model: navigator.userAgent.substring(0, 30) + "...",
          osVersion: "Inconnu",
          platform: "web",
        };
        fullDeviceInfo.info = info;
      }

      const handleAiProgress = (msg: any) => {
        if (typeof msg === 'object' && msg.type === 'progress') {
          setLogs((prev) => {
            const id = 'progress_' + msg.file;
            const existingIndex = prev.findIndex(l => l.id === id);
            
            const spinner = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'][Math.floor(msg.progress) % 10];
            
            const text = msg.status === 'downloading'
              ? `Téléchargement ${msg.file} ${spinner} ${Math.round(msg.progress)}%`
              : `Chargement en mémoire [${msg.file}] ${spinner} ${Math.round(msg.progress)}%`;

            if (existingIndex >= 0) {
              const newLogs = [...prev];
              if (msg.progress >= 100) {
                  newLogs[existingIndex] = { ...newLogs[existingIndex], message: msg.status === 'downloading' ? `Téléchargement ${msg.file} ✔️ 100%` : `Chargement en mémoire [${msg.file}] ✔️ 100%` };
              } else {
                  newLogs[existingIndex] = { ...newLogs[existingIndex], message: text };
              }
              return newLogs;
            } else {
              return [...prev, { id, time: new Date().toLocaleTimeString(), message: text, type: "info" }];
            }
          });
        } else {
          setLogs((prev) => [
            ...prev,
            {
              id: Date.now() + Math.random(),
              time: new Date().toLocaleTimeString(),
              message: msg as string,
              type: "info",
            },
          ]);
        }
      };

      // 2. Initialisation de l'IA Locale
      await LocalAIService.initialize(handleAiProgress);

      const { AppScanner } = await import("../lib/appScanner");
      let fullAppsList: any[] = [];
      try {
        const appScanResult = await AppScanner.getInstalledApps();
        fullAppsList = appScanResult.apps || [];
      } catch (e) {
        // Ignorer l'erreur si exécuté sur le web sans bridge natif
      }

      let logCounter = 0;
      const data = await LocalAIService.generateReport(
        info,
        fullAppsList,
        mode,
        (msg, type) => {
          logCounter++;
          setLogs((prev) => [
            ...prev,
            {
               id: Date.now() + "-" + logCounter,
               time: new Date().toLocaleTimeString(),
               message: msg,
               type: (type as any) || "info",
            },
          ]);
        }
      );

      if (!data || !data.logs || !Array.isArray(data.logs)) {
        throw new Error("Format de réponse invalide reçu du moteur IA local.");
      }

      if (data.logs && data.logs.length > 0) {
        setLogs(prev => [
          ...prev,
          ...data.logs.map((log: any, index: number) => ({
            id: Date.now() + index * 10,
            time: new Date().toLocaleTimeString(),
            message: log.message,
            type: log.type || "info",
          }))
        ]);
      }

      let finalResults = data.results || [];
      
      setResults(finalResults);
      setStatus("completed");
      setActiveTab("results");
    } catch (error: any) {
      setLogs((prev) => [
        ...prev,
        {
          id: Date.now(),
          time: new Date().toLocaleTimeString(),
          message: `ECHEC AUDIT: ${error.message}`,
          type: "error",
        },
      ]);
      setStatus("completed");
    }
  };

  const handleScroll = () => {
    if (terminalContainerRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = terminalContainerRef.current;
      const isAtBottom = scrollHeight - scrollTop - clientHeight < 10;
      setAutoScroll(isAtBottom);
    }
  };

  useEffect(() => {
    if (autoScroll && terminalContainerRef.current) {
      terminalContainerRef.current.scrollTop = terminalContainerRef.current.scrollHeight;
    }
  }, [logs, autoScroll]);

  const getSeverityColor = (severity: string) => {
    switch (severity?.toUpperCase()) {
      case "CRITICAL":
        return "bg-[#F87171]/10 text-[#F87171] border-[#F87171]/30";
      case "HIGH":
        return "bg-[#FBBF24]/10 text-[#FBBF24] border-[#FBBF24]/30";
      case "MODERATE":
        return "bg-yellow-500/10 text-yellow-400 border-yellow-500/30";
      default:
        return "bg-blue-500/10 text-blue-400 border-blue-500/30";
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity?.toUpperCase()) {
      case "CRITICAL":
        return <ShieldX className="w-5 h-5 text-[#F87171]" />;
      case "HIGH":
        return <AlertTriangle className="w-5 h-5 text-[#FBBF24]" />;
      case "MODERATE":
        return <Info className="w-5 h-5 text-yellow-500" />;
      default:
        return <CheckCircle2 className="w-5 h-5 text-blue-400" />;
    }
  };

  return (
    <div className="flex flex-col w-full h-full gap-4 flex-1 min-h-[500px]">
      {/* Header Bento Card */}
      <div className="bg-slate-900/40 backdrop-blur-md border border-cyan-500/20 shadow-[0_0_30px_rgba(6,182,212,0.05)] rounded-[20px] p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shrink-0 relative overflow-hidden">
        <div className="absolute top-[-50px] right-[-50px] w-64 h-64 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none" />
        <div className="flex-1 relative z-10 flex flex-col sm:flex-row justify-between sm:items-center gap-4 w-full">
          <div>
            <h2 className="text-xl font-display font-bold text-white tracking-tight">
              Audit de Sécurité Système
            </h2>
            <p className="text-slate-400 text-sm mt-1">
              Vérification de l'intégrité (Noyau, Vulnérabilités, Secure Boot).
            </p>
          </div>
          
          <div className="flex flex-wrap sm:flex-nowrap items-center gap-2 w-full sm:w-auto shrink-0 justify-start sm:justify-end">
            <button
              onClick={() => startScan("apps")}
              disabled={status === "scanning"}
              className="flex items-center justify-center gap-2 bg-[#F87171]/10 hover:bg-[#F87171]/20 text-[#F87171] border border-[#F87171]/30 font-bold px-3 py-2 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed text-[11px] uppercase tracking-wider shrink-0"
            >
              <BrainCircuit className="w-3.5 h-3.5" />
              <span>Scan Apps</span>
            </button>
            <button
              onClick={() => startScan("full")}
              disabled={status === "scanning"}
              className="flex items-center justify-center gap-2 bg-cyan-500 hover:bg-cyan-400 text-black border border-cyan-400 font-bold px-4 py-2 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_15px_rgba(6,182,212,0.3)] text-[11px] uppercase tracking-wider shrink-0"
            >
              {status === "scanning" && scanMode === "full" ? (
                <div className="w-3.5 h-3.5 border-2 border-black/30 border-t-black rounded-full animate-spin" />
              ) : (
                <Play className="w-3.5 h-3.5 fill-black" />
              )}
              <span>
                {status === "scanning" && scanMode === "full"
                  ? "En cours..."
                  : "Audit Complet"}
              </span>
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
          <Activity className="w-4 h-4" /> Vue d'ensemble
        </button>
        <button
          onClick={() => setActiveTab("results")}
          className={`pb-3 text-sm font-bold transition-colors whitespace-nowrap border-b-2 flex items-center gap-2 ${activeTab === "results" ? "border-cyan-400 text-cyan-400" : "border-transparent text-slate-500 hover:text-slate-300"}`}
        >
          <FileCheck className="w-4 h-4" /> Résultats d'Audit
          {results.length > 0 && <span className="ml-1 text-[10px] bg-rose-500 text-white px-1.5 py-0.5 rounded-full leading-none">{results.length}</span>}
        </button>
        <button
          onClick={() => setActiveTab("logs")}
          className={`pb-3 text-sm font-bold transition-colors whitespace-nowrap border-b-2 flex items-center gap-2 ${activeTab === "logs" ? "border-cyan-400 text-cyan-400" : "border-transparent text-slate-500 hover:text-slate-300"}`}
        >
          <Terminal className="w-4 h-4" /> Terminal d'Audit
        </button>
      </div>

      {/* Tab Content Areas */}
      <div className="flex-1 flex flex-col pb-6">
        {activeTab === "overview" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 auto-rows-max min-h-[600px]">
            {/* Firmware Limitation Notice */}
            <div className="bg-blue-500/5 border border-blue-500/20 rounded-[20px] p-5 flex items-start gap-4 h-full">
              <Info className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
              <div>
                <h3 className="font-bold text-blue-400 text-sm mb-1 uppercase tracking-wider">
                  Limites de vérification du firmware
                </h3>
                <p className="text-xs text-[#E2E8F0] leading-relaxed">
                  Android et ChromeOS sont construits comme des coffres-forts
                  isolés. Pour vérifier la clé de sécurité matérielle de votre
                  Chromebook, l'application a besoin de l'aide de notre extension
                  Chrome, c'est la seule méthode sécurisée autorisée par Google.
                </p>
              </div>
            </div>

            {/* Scan Types Explanation */}
            <div className="bg-slate-900/40 border border-white/5 rounded-[20px] p-5 flex flex-col justify-center gap-4 h-full">
              <div className="flex items-start gap-3">
                <Play className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-cyan-400 text-xs uppercase tracking-wider mb-1">
                    Audit Complet
                  </h4>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    Analyse approfondie de tous les paquets installés, modules du
                    noyau, anomalies d'autorisations et traque des menaces
                    complexes.
                  </p>
                </div>
              </div>
            </div>

            {/* Methodology & Architecture Explanation Card */}
            <div className="bg-slate-900/40 backdrop-blur-md border border-cyan-500/20 rounded-[20px] p-6 md:col-span-2 shadow-[0_0_30px_rgba(6,182,212,0.02)] relative overflow-hidden">
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[300px] bg-cyan-500/5 blur-[100px] rounded-full pointer-events-none" />
              <div className="flex items-center gap-3 mb-6 border-b border-white/10 pb-4 relative z-10">
                <div className="bg-cyan-500/10 p-2.5 rounded-xl border border-cyan-500/30 shadow-[0_0_15px_rgba(6,182,212,0.15)]">
                  <BrainCircuit className="w-5 h-5 text-cyan-400" />
                </div>
                <div>
                  <h3 className="font-bold text-white text-lg tracking-tight">
                    Ce que l'application fait vraiment
                  </h3>
                  <p className="text-xs text-cyan-400/60 font-mono mt-0.5 uppercase tracking-widest">
                    En Toute Transparence : Nos Limites Techniques
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative z-10">
                <div className="space-y-3 relative">
                  <div className="absolute top-0 left-[-16px] w-[2px] h-full bg-gradient-to-b from-cyan-500/30 to-transparent hidden md:block" />
                  <div className="flex items-center gap-2">
                    <Blocks className="w-4 h-4 text-cyan-400" />
                    <h4 className="font-bold text-white text-[12px] uppercase">
                      1. Limites d'Android
                    </h4>
                  </div>
                  <p className="text-[11.5px] leading-relaxed text-slate-400">
                    Android est construit comme un immense bâtiment où chaque
                    application a son propre coffre-fort. Une véritable application de
                    sécurité ne peut <strong className="text-white">jamais</strong>{" "}
                    fouiller dans les autres coffres-forts. Sinon, ce serait elle le
                    virus. Nous travaillons en analysant uniquement ce qui tourne
                    autour (comportement, réseau).
                  </p>
                </div>

                <div className="space-y-3 relative">
                  <div className="absolute top-0 left-[-16px] w-[2px] h-full bg-gradient-to-b from-[#2D3139] to-transparent hidden md:block" />
                  <div className="flex items-center gap-2">
                    <Cpu className="w-4 h-4 text-[#FBBF24]" />
                    <h4 className="font-bold text-white text-[12px] uppercase">
                      2. Pourquoi l'extension Chrome ?
                    </h4>
                  </div>
                  <p className="text-[11.5px] leading-relaxed text-[#94A3B8]">
                    Android et ChromeOS sont construits comme des coffres isolés. Pour
                    vérifier la clé secrète de votre Chromebook, l'application a
                    besoin de l'aide de notre{" "}
                    <span className="font-bold">extension Chrome compagnon</span>.
                    C'est la seule méthode sécurisée autorisée par Google pour
                    interroger la puce ("Titan C").
                  </p>
                </div>

                <div className="space-y-3 relative">
                  <div className="absolute top-0 left-[-16px] w-[2px] h-full bg-gradient-to-b from-[#2D3139] to-transparent hidden md:block" />
                  <div className="flex items-center gap-2">
                    <ShieldAlert className="w-4 h-4 text-[#F87171]" />
                    <h4 className="font-bold text-white text-[12px] uppercase">
                      3. Le mythe du 100% sûr
                    </h4>
                  </div>
                  <p className="text-[11.5px] leading-relaxed text-[#94A3B8]">
                    L'application compare l'état de votre système avec notre base de
                    vulnérabilités publique. Est-ce fiable à 100% ?{" "}
                    <strong className="text-[#F87171]">Non.</strong> Aucun système ne
                    l'est. Un téléphone déjà infecté par une faille ultra-sophistiquée
                    (Zero-Day) pourrait mentir à notre scanner et prétendre que tout
                    va bien.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "results" && (
          <div
            className={`bg-gradient-to-br from-slate-900/60 to-black backdrop-blur-md border rounded-[20px] p-5 flex flex-col flex-1 transition-all duration-1000 ${
              status === "completed" && results.length > 0
                ? "border-rose-500/30 shadow-[0_0_40px_rgba(244,63,94,0.1)]"
                : "border-cyan-500/20 shadow-[0_0_30px_rgba(6,182,212,0.02)]"
            }`}
          >
            <div className="flex items-center justify-between mb-4 border-b border-cyan-500/20 pb-4 shrink-0">
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-rose-400" />
                <h3 className="text-sm font-bold text-white">
                  Rapport de Vulnérabilité
                </h3>
              </div>
              {status === "completed" && (
                <span className="text-[10px] bg-cyan-500/10 text-cyan-400 px-2 py-0.5 rounded uppercase font-bold border border-cyan-500/20">
                  {results.length} alertes
                </span>
              )}
            </div>

            {/* Légende des niveaux de gravité */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-4 px-1 shrink-0">
              <div className="bg-[#F87171]/5 border border-[#F87171]/20 p-2.5 rounded-lg flex flex-col justify-start">
                <div className="flex items-center gap-1.5 mb-1.5">
                  <ShieldX className="w-3 h-3 text-[#F87171] shrink-0" />
                  <span className="text-[#F87171] text-[9.5px] font-bold tracking-wider uppercase">Critique</span>
                </div>
                <p className="text-[9px] text-[#F87171]/80 leading-snug">Action immédiate. Faille de contournement direct.</p>
              </div>
              <div className="bg-[#FBBF24]/5 border border-[#FBBF24]/20 p-2.5 rounded-lg flex flex-col justify-start">
                <div className="flex items-center gap-1.5 mb-1.5">
                  <AlertTriangle className="w-3 h-3 text-[#FBBF24] shrink-0" />
                  <span className="text-[#FBBF24] text-[9.5px] font-bold tracking-wider uppercase">Élevé</span>
                </div>
                <p className="text-[9px] text-[#FBBF24]/80 leading-snug">Mise à jour requise. Compromission importante.</p>
              </div>
              <div className="bg-yellow-500/5 border border-yellow-500/20 p-2.5 rounded-lg flex flex-col justify-start">
                <div className="flex items-center gap-1.5 mb-1.5">
                  <Info className="w-3 h-3 text-yellow-500 shrink-0" />
                  <span className="text-yellow-500 text-[9.5px] font-bold tracking-wider uppercase">Modéré</span>
                </div>
                <p className="text-[9px] text-yellow-500/80 leading-snug">Défaut mineur ou risque d'exposition locale.</p>
              </div>
              <div className="bg-blue-500/5 border border-blue-500/20 p-2.5 rounded-lg flex flex-col justify-start">
                <div className="flex items-center gap-1.5 mb-1.5">
                  <CheckCircle2 className="w-3 h-3 text-blue-400 shrink-0" />
                  <span className="text-blue-400 text-[9.5px] font-bold tracking-wider uppercase">Faible</span>
                </div>
                <p className="text-[9px] text-blue-400/80 leading-snug">Bonne pratique manquante, très faible risque.</p>
              </div>
            </div>

            {status === "idle" || status === "scanning" ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center opacity-50 min-h-0">
                <ShieldAlert className="w-12 h-12 text-slate-700 mb-3" />
                <p className="text-sm font-bold text-slate-500 uppercase tracking-widest">
                  En attente des résultats
                </p>
                {status === "scanning" && <p className="text-xs text-slate-500 mt-2">L'audit est en cours, consultez le terminal pour le suivi.</p>}
              </div>
            ) : (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col space-y-3 -mx-2 px-2 pb-2">
                {results.map((res) => (
                  <div key={res.cveId} className="bg-[#0B0F19] border border-white/10 hover:border-cyan-500/30 rounded-xl overflow-hidden transition-all cursor-pointer shadow-[0_4px_20px_rgba(0,0,0,0.5)] group relative" onClick={() => setExpandedId(expandedId === res.cveId ? null : res.cveId)}>
                    <div className="absolute top-0 left-0 w-1 h-full" style={{ backgroundColor: res.severity === "CRITICAL" ? "#F87171" : res.severity === "HIGH" ? "#FBBF24" : res.severity === "MODERATE" ? "#EAB308" : "#3B82F6" }}></div>
                    <div className="p-4 pl-5">
                      <div className="flex gap-3 relative">
                        <div className="shrink-0 mt-0.5">{getSeverityIcon(res.severity)}</div>
                        <div className="flex-1 min-w-0 pr-6">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-1.5">
                            <h4 className="font-bold text-white text-sm tracking-tight leading-snug pr-2">{res.title}</h4>
                            <span className={`text-[10px] px-2 py-0.5 rounded border font-bold tracking-widest uppercase shrink-0 self-start sm:self-auto ${getSeverityColor(res.severity)}`}>{res.severity}</span>
                          </div>
                          <div className="flex flex-wrap items-center gap-2 mb-2">
                            <span className="text-cyan-400 bg-cyan-950/50 font-mono text-[10px] font-bold px-1.5 py-0.5 rounded-md border border-cyan-500/20">{res.cveId}</span>
                            <span className="text-[#94A3B8] text-xs font-medium">{res.impact}</span>
                          </div>
                          {!expandedId || expandedId !== res.cveId ? (
                            <>
                              <p className="text-[#94A3B8] text-xs leading-relaxed line-clamp-2 md:line-clamp-1 mb-2">
                                {res.description}
                              </p>
                              <div className="mt-2 inline-flex items-center gap-1.5 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 px-3 py-1.5 rounded border border-cyan-500/30 transition-all font-bold uppercase text-[10px] tracking-wider relative overflow-hidden">
                                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-cyan-400/10 to-transparent -translate-x-full animate-[shimmer_2s_infinite]" />
                                <Info className="w-3.5 h-3.5" /> Cliquez ici pour lire la recommandation IA
                              </div>
                            </>
                          ) : null}
                        </div>
                        <div className="absolute top-1/2 -mt-2.5 right-0 text-slate-500 group-hover:text-cyan-400 transition-colors">
                          <motion.div animate={{ rotate: expandedId === res.cveId ? 180 : 0 }}><ChevronDown className="w-5 h-5" /></motion.div>
                        </div>
                      </div>
                    </div>
                    <AnimatePresence>
                      {expandedId === res.cveId && (
                        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="border-t border-[#2D3139]/50 bg-black/40">
                          <div className="p-4 pl-5 space-y-4 text-xs">
                            <p className="text-[#E2E8F0] leading-relaxed mb-4">{res.description}</p>
                            <div className="grid grid-cols-1 gap-3">
                              <div className="bg-[#16181D] p-4 rounded-xl border border-[#2D3139] shadow-inner">
                                <div className="grid md:grid-cols-2 gap-4">
                                  <div>
                                    <h5 className="font-bold text-[#A5B4FC] flex items-center gap-1.5 uppercase tracking-wider text-[10px] mb-2">
                                      <Info className="w-3.5 h-3.5" /> Statut Technique
                                    </h5>
                                    <p className="text-[#94A3B8] leading-relaxed text-sm">{res.concept}</p>
                                  </div>
                                  <div>
                                    <h5 className="font-bold text-[#FBBF24] flex items-center gap-1.5 uppercase tracking-wider text-[10px] mb-2">
                                      <Zap className="w-3.5 h-3.5" /> Correctif Requis
                                    </h5>
                                    <p className="text-[#FBBF24]/90 font-mono text-sm leading-relaxed bg-[#FBBF24]/5 p-2 rounded-lg border border-[#FBBF24]/10 inline-block">{res.updateStatus}</p>
                                  </div>
                                </div>
                              </div>
                              <div className="bg-[#022c22]/40 p-5 rounded-xl border-2 border-[#4ADE80]/40 shadow-[0_0_15px_rgba(74,222,128,0.05)] mt-1">
                                <h5 className="font-bold text-[#4ADE80] flex items-center gap-2 uppercase tracking-widest text-[12px] mb-3">
                                  <CheckCircle2 className="w-5 h-5" /> Recommandation Vulgarisée de l'IA
                                </h5>
                                <p className="text-[#4ADE80] font-medium leading-relaxed text-sm md:text-base">{res.mitigation}</p>
                                <div className="mt-4 pt-3 border-t border-[#4ADE80]/20 flex items-center gap-2 text-xs text-[#4ADE80]/60 uppercase tracking-widest font-bold">
                                  <BrainCircuit className="w-3.5 h-3.5" /> Explication simplifiée pour débutant
                                </div>
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                ))}
              </motion.div>
            )}
          </div>
        )}

        {activeTab === "logs" && (
          <div className="bg-slate-900/40 backdrop-blur-md border border-cyan-500/20 rounded-[20px] overflow-hidden flex flex-col shadow-[0_0_30px_rgba(6,182,212,0.02)]">
            <div className="p-3 border-b border-cyan-500/20 flex items-center justify-between gap-3 bg-black/40 shrink-0">
               <div className="flex items-center gap-3">
                  <Terminal className="w-5 h-5 text-cyan-400" />
                  <span className="text-xs font-mono font-bold text-white uppercase tracking-widest">
                     Terminal d'Audit
                  </span>
               </div>
              <div className="flex items-center gap-2">
                 {status === "scanning" && (
                   <span className="flex items-center gap-1.5 shrink-0">
                     <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse"></span>
                     <span className="text-[10px] text-cyan-400 font-mono">SCAN...</span>
                   </span>
                 )}
              </div>
            </div>
            <div onScroll={handleScroll} ref={terminalContainerRef} className="flex flex-col bg-black/60 p-4 font-mono text-[11px] md:text-xs gap-1.5 shadow-inner relative border border-white/5">
              {logs.length === 0 && status === "idle" && (
                <div className="text-[#94A3B8] absolute inset-0 flex items-center justify-center opacity-50 uppercase tracking-widest text-[10px]">
                  &gt; /run/audit_daemon.sock{" "}
                  <span className="animate-pulse ml-0.5">_</span>
                </div>
              )}
              <AnimatePresence>
                {logs.map((log) => (
                  <motion.div
                    initial={{ opacity: 0, x: -5 }}
                    animate={{ opacity: 1, x: 0 }}
                    key={log.id}
                    className={`flex items-start gap-3 leading-relaxed ${log.type === "raw" ? "flex-col sm:flex-row" : ""}`}
                  >
                    {log.type !== "raw" && (
                      <span className="text-slate-600 shrink-0">[{log.time}]</span>
                    )}
                    <span
                      className={`break-words ${log.type === "raw" ? "w-full" : "flex-1"}
                      ${log.type === "error" ? "text-rose-400 font-bold" : ""}
                      ${log.type === "success" ? "text-emerald-400 font-bold" : ""}
                      ${log.type === "warning" ? "text-[#FBBF24]" : ""}
                      ${log.type === "info" ? "text-blue-300" : ""}
                      ${log.type === "raw" ? "text-fuchsia-300 font-mono text-[10px] whitespace-pre-wrap mt-0.5 opacity-90 border-l-2 px-3 py-1.5 border-fuchsia-500/50 bg-fuchsia-900/10 rounded-r shadow-inner w-full block" : ""}
                      ${log.type === "action" ? "text-cyan-400 font-semibold" : ""}
                    `}
                    >
                      {log.type === "raw" ? log.message : log.message}
                    </span>
                  </motion.div>
                ))}
              </AnimatePresence>
              {logs.length > 0 && status === "scanning" && (
                <div className="flex items-center gap-2 text-cyan-400 mt-2 font-bold mb-2">
                  <Terminal className="w-3.5 h-3.5 animate-pulse" />
                  <span className="animate-pulse">Analyse en cours</span>
                  <span className="flex items-center space-x-1">
                    <span className="animate-bounce delay-75">.</span>
                    <span className="animate-bounce delay-150">.</span>
                    <span className="animate-bounce delay-300">.</span>
                  </span>
                </div>
              )}
              {logs.length > 0 && status !== "scanning" && (
                <div className="text-slate-500 mt-1">
                  <span className="animate-pulse">_</span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
