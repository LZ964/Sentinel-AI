import { useState, useEffect } from "react";
import { Shield, Activity, ShieldCheck, ShieldAlert, Cpu, Loader2, RefreshCw } from "lucide-react";
import { registerPlugin, Capacitor } from "@capacitor/core";
import { AiEngine } from "../lib/AiEngine";

const BehaviorGuard = registerPlugin<any>("BehaviorGuard");

interface AppInfo {
  packageName: string;
  appName: string;
}

interface AppAnalysis {
  packageName: string;
  appName: string;
  permissions: string[];
  domains: string[];
  score?: string;
  explanation?: string;
}

export default function BehaviorGuardTab() {
  const [apps, setApps] = useState<AppInfo[]>([]);
  const [selectedApp, setSelectedApp] = useState<AppAnalysis | null>(null);
  const [analysisResult, setAnalysisResult] = useState<{ score: string; explanation: string } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isScanning, setIsScanning] = useState(false);

  useEffect(() => {
    loadApps();
  }, []);

  const loadApps = async () => {
    setIsLoading(true);
    try {
      if (Capacitor.isNativePlatform()) {
        const res = await BehaviorGuard.getThirdPartyApps();
        setApps(res.apps || []);
      } else {
        // Mock data for Web Preview
        setTimeout(() => {
          setApps([
            { appName: 'Fake WhatsApp', packageName: 'com.fake.whatsapp' },
            { appName: 'Malicious Flashlight', packageName: 'com.evil.flashlight' },
            { appName: 'Safe Note', packageName: 'com.safe.notepad' }
          ]);
          setIsLoading(false);
        }, 800);
        return;
      }
    } catch (e) {
      console.error("Failed to load apps:", e);
    } finally {
      setIsLoading(false);
    }
  };

  const scanApp = async (app: AppInfo) => {
    setIsScanning(true);
    setAnalysisResult(null);
    setSelectedApp(null);
    try {
      let res: any;
      if (Capacitor.isNativePlatform()) {
        res = await BehaviorGuard.scanAppBehavior({ packageName: app.packageName });
      } else {
        // Mock result for web
        await new Promise(r => setTimeout(r, 1500));
        res = {
          packageName: app.packageName,
          appName: app.appName,
          permissions: app.packageName.includes('evil') 
            ? ['android.permission.INTERNET', 'android.permission.READ_SMS', 'android.permission.READ_CONTACTS', 'android.permission.CAMERA']
            : ['android.permission.INTERNET'],
          domains: [],
          score: app.packageName.includes('evil') ? "Critique" : "Faible",
          explanation: `Simulated result for Web Preview: App behaves normally.`
        };
      }
      
      setSelectedApp(res);
      
      let finalScore = res.score;
      let finalExplanation = res.explanation;
      
      const aiResult = await AiEngine.analyzeAppBehavior(res.appName, res.permissions, res.domains || []);
      
      setAnalysisResult({
          score: aiResult.score !== "Faible" ? aiResult.score : finalScore,
          explanation: aiResult.explanation
      });
      
    } catch (e) {
      console.error("Analysis failed:", e);
    } finally {
      setIsScanning(false);
    }
  };

  const getScoreColor = (score: string) => {
    if (score === "Critique") return "text-rose-400 bg-rose-500/10 border-rose-500/30";
    if (score === "Moyen") return "text-amber-400 bg-amber-500/10 border-amber-500/30";
    return "text-emerald-400 bg-emerald-500/10 border-emerald-500/30";
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="bg-slate-900/60 backdrop-blur-md border border-slate-800 rounded-[24px] p-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-5 isolate">
          <Shield className="w-48 h-48" />
        </div>
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                <Activity className="w-6 h-6 text-emerald-400" />
              </div>
              <h2 className="text-xl font-bold tracking-tight text-white uppercase">
                Prism Guard: Behavior Guard
              </h2>
            </div>
            <p className="text-slate-400 text-sm leading-relaxed max-w-2xl font-medium mt-3">
              Analyse proactive du comportement applicatif via IA locale et filtrage de réputation haute performance.
            </p>
          </div>
          
          <button
            onClick={loadApps}
            disabled={isLoading}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 rounded-lg text-sm font-bold uppercase tracking-widest transition-all disabled:opacity-50"
          >
            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
            Actualiser
          </button>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-slate-900/40 border border-slate-800 rounded-[20px] p-4 flex flex-col max-h-[500px]">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
            <Cpu className="w-4 h-4 text-emerald-400" />
            Applications Tierces ({apps.length})
          </h3>
          <div className="flex-1 overflow-y-auto pr-2 space-y-2 custom-scrollbar">
            {isLoading ? (
              <div className="text-center py-8 text-slate-500 text-sm">Chargement des applications...</div>
            ) : apps.length === 0 ? (
              <div className="text-center py-8 text-slate-500 text-sm">Aucune application tierce trouvée.</div>
            ) : (
              apps.map((app) => (
                <button
                  key={app.packageName}
                  onClick={() => scanApp(app)}
                  disabled={isScanning}
                  className="w-full flex items-center justify-between p-3 rounded-xl bg-black/40 border border-white/5 hover:bg-emerald-500/10 hover:border-emerald-500/30 transition-all text-left"
                >
                  <div className="truncate pr-4">
                    <p className="text-sm font-medium text-slate-200 truncate">{app.appName}</p>
                    <p className="text-[10px] text-slate-500 font-mono truncate">{app.packageName}</p>
                  </div>
                  <ShieldCheck className="w-5 h-5 text-slate-600 shrink-0" />
                </button>
              ))
            )}
          </div>
        </div>

        <div className="bg-slate-900/40 border border-slate-800 rounded-[20px] p-4 flex flex-col min-h-[300px]">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-emerald-400" />
            Rapport d'Analyse
          </h3>
          
          {isScanning ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center opacity-50">
              <Activity className="w-12 h-12 text-emerald-400 mb-3 animate-spin" />
              <p className="text-sm font-bold text-emerald-400 uppercase tracking-widest animate-pulse">
                Extraction des signatures et analyse IA...
              </p>
            </div>
          ) : analysisResult && selectedApp ? (
            <div className="flex flex-col gap-4">
              <div className="bg-black/40 border border-white/5 p-4 rounded-xl">
                <p className="text-xs text-slate-500 font-mono mb-1">Cible</p>
                <p className="font-medium text-white">{selectedApp.appName}</p>
              </div>

              <div className={`p-4 rounded-xl border ${getScoreColor(analysisResult.score)} flex items-center gap-4`}>
                <div className="flex-1">
                  <p className="text-xs font-mono mb-1 opacity-80 uppercase">Score de Risque IA</p>
                  <p className="text-xl font-bold">{analysisResult.score}</p>
                </div>
                <ShieldAlert className="w-8 h-8 opacity-80" />
              </div>

              <div className="bg-black/40 border border-white/5 p-4 rounded-xl">
                <p className="text-xs text-slate-500 font-mono mb-2">Synthèse Comportementale Dual-Engine</p>
                <p className="text-sm text-slate-300 leading-relaxed font-medium">
                  {analysisResult.explanation}
                </p>
              </div>

              {selectedApp.permissions.length > 0 && (
                <div className="bg-black/40 border border-white/5 p-4 rounded-xl">
                  <p className="text-xs text-slate-500 font-mono mb-2">Vecteurs d'Attaque (Permissions Brutes)</p>
                  <div className="flex flex-wrap gap-1">
                    {selectedApp.permissions.slice(0, 5).map((p, i) => (
                      <span key={i} className="text-[9px] px-1.5 py-0.5 bg-slate-800 text-slate-400 rounded font-mono truncate max-w-[150px]">
                        {p.split('.').pop()}
                      </span>
                    ))}
                    {selectedApp.permissions.length > 5 && (
                      <span className="text-[9px] px-1.5 py-0.5 bg-slate-800 text-slate-400 rounded font-mono">
                        +{selectedApp.permissions.length - 5}
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center opacity-50">
              <Shield className="w-12 h-12 text-slate-700 mb-3" />
              <p className="text-sm font-bold text-slate-500 uppercase tracking-widest">
                Aucune cible sélectionnée
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
