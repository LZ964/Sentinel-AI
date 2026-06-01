import React, { useState, useEffect } from 'react';
import { registerPlugin, Capacitor } from '@capacitor/core';
import { Shield, ShieldAlert, Activity, Terminal, Power, Search, AlertOctagon, BrainCircuit, Globe, Play, Square, Settings, Database, Server, Filter, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { AiEngine } from '../lib/AiEngine';

const SentinelFirewall = registerPlugin<any>('SentinelFirewall');

type SubTab = 'dashboard' | 'rules' | 'logs';

interface NetworkLog {
  id: string;
  action: string;
  protocol: string;
  ip: string;
  domain: string;
  timestamp: number;
}

export default function FirewallTab() {
  const [activeTab, setActiveTab] = useState<SubTab>('logs');
  const [fwEnabled, setFwEnabled] = useState(false);
  const [networkLogs, setNetworkLogs] = useState<NetworkLog[]>([]);
  const [aiRecommendation, setAiRecommendation] = useState<string | null>(null);
  const [isAiLoading, setIsAiLoading] = useState(false);

  // Web Preview Mock Data Generator
  useEffect(() => {
    if (Capacitor.isNativePlatform()) return;
    
    // In web preview, generate some mock logs if firewall is "enabled"
    let interval: any;
    if (fwEnabled) {
      interval = setInterval(() => {
        const isBlock = Math.random() > 0.8;
        const log = {
          id: Math.random().toString(36).substring(7),
          action: isBlock ? 'BLOCK' : 'ALLOW',
          protocol: Math.random() > 0.5 ? 'TCP' : 'UDP',
          ip: `192.168.1.${Math.floor(Math.random() * 255)}`,
          domain: isBlock ? 'tracker.bad-domain.com' : 'api.exemple.fr',
          timestamp: Date.now()
        };
        
        setNetworkLogs(prev => [log, ...prev].slice(0, 100));
        
        if (isBlock) {
          setIsAiLoading(true);
          setTimeout(() => {
            setAiRecommendation(`Ce domaine est connu pour la collecte massive de métadonnées. L'accès a été bloqué par le filtre.`);
            setIsAiLoading(false);
          }, 1000);
        }
      }, 5000);
    }
    
    return () => clearInterval(interval);
  }, [fwEnabled]);

  useEffect(() => {
    let listener: any;
    
    const setupListener = async () => {
      if (!Capacitor.isNativePlatform()) return; // Don't try to add listener on Web
      
      // Listen to native plugin events
      listener = await SentinelFirewall.addListener('onNetworkLog', async (data: any) => {
        setNetworkLogs(prev => [{ ...data, id: Math.random().toString(36).substring(7) }, ...prev].slice(0, 100));
        
        if (data.action === 'BLOCK') {
          setIsAiLoading(true);
          try {
            const recommendation = await AiEngine.analyzeNetworkThreat(data.domain, data.protocol);
            setAiRecommendation(recommendation);
          } catch (e) {
            console.error('AI Error:', e);
          } finally {
            setIsAiLoading(false);
          }
        }
      });
    };
    
    setupListener();
    
    return () => {
      if (listener) listener.remove();
    };
  }, []);

  const toggleFirewall = async () => {
    try {
      const newState = !fwEnabled;
      if (Capacitor.isNativePlatform()) {
        const res = await SentinelFirewall.enableFirewall({ enabled: newState });
        setFwEnabled(res.status);
      } else {
        // Fallback for web preview
        setFwEnabled(newState);
      }
    } catch (e) {
      console.error("Firewall toggle failed:", e);
      setFwEnabled(!fwEnabled);
    }
  };

  return (
    <div className="flex flex-col w-full gap-5 flex-1 select-none text-slate-100 h-full max-h-[85vh]">
      
      {/* Firewall Master Control Header */}
      <div className="bg-slate-900/60 backdrop-blur-md border border-slate-800 rounded-[24px] p-6 relative overflow-hidden flex flex-col md:flex-row justify-between items-center gap-6">
        <div className="flex items-center gap-5">
          <div className={`p-4 rounded-full border ${fwEnabled ? 'bg-cyan-500/10 border-cyan-500/30' : 'bg-slate-800/50 border-slate-700'}`}>
            <Shield className={fwEnabled ? 'text-cyan-400' : 'text-slate-500'} size={32} />
          </div>
          <div>
            <h2 className="text-xl font-display font-medium text-white tracking-tight flex items-center mb-1">
              Prism Guard VpnService Engine
            </h2>
            <p className="text-slate-400 text-xs">
              Moteur de bouclage local (Loopback) avec Filtre de Bloom (0 Mo).
            </p>
          </div>
        </div>

        <button 
          onClick={toggleFirewall}
          className={`flex items-center gap-2.5 px-8 py-3.5 rounded-xl font-mono text-xs font-bold tracking-wider transition-all border ${
            fwEnabled 
              ? 'bg-rose-500/10 text-rose-400 border-rose-500/30 hover:bg-rose-500/20' 
              : 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30 hover:bg-cyan-500/20'
          }`}
        >
          <Power size={16} className={fwEnabled ? 'animate-pulse' : ''} />
          {fwEnabled ? "DÉSACTIVER LE PARE-FEU" : "ACTIVER LE PARE-FEU"}
        </button>
      </div>

      {/* Sub-Tab Navigation */}
      <div className="flex items-center gap-2 bg-slate-900/50 p-1.5 rounded-xl border border-slate-800 w-fit">
        <button 
          onClick={() => setActiveTab('dashboard')}
          className={`px-4 py-2 rounded-lg font-mono text-xs font-bold transition-all ${
            activeTab === 'dashboard' ? 'bg-slate-800 text-cyan-400' : 'text-slate-500 hover:text-slate-300'
          }`}
        >
          DASHBOARD
        </button>
        <button 
          onClick={() => setActiveTab('rules')}
          className={`px-4 py-2 rounded-lg font-mono text-xs font-bold transition-all ${
            activeTab === 'rules' ? 'bg-slate-800 text-cyan-400' : 'text-slate-500 hover:text-slate-300'
          }`}
        >
          RULES & APPS
        </button>
        <button 
          onClick={() => setActiveTab('logs')}
          className={`px-4 py-2 rounded-lg font-mono text-xs font-bold transition-all ${
            activeTab === 'logs' ? 'bg-slate-800 text-cyan-400' : 'text-slate-500 hover:text-slate-300'
          }`}
        >
          <span className="flex items-center gap-2">
            <Terminal size={12} />
            LOG SUPERVISION
          </span>
        </button>
      </div>

      {/* Tab Contents */}
      <div className="flex-1 bg-slate-900/40 border border-slate-800/60 rounded-2xl p-4 overflow-hidden flex flex-col">
        {activeTab === 'dashboard' && (
          <div className="flex-1 flex items-center justify-center text-slate-500 font-mono text-xs">
            Module de statistiques globales en développement...
          </div>
        )}

        {activeTab === 'rules' && (
          <div className="flex-1 flex items-center justify-center text-slate-500 font-mono text-xs">
            Gestionnaire de règles applicatives en développement...
          </div>
        )}

        {activeTab === 'logs' && (
          <div className="flex-1 flex flex-col gap-4 overflow-hidden h-full">
            <h3 className="text-sm font-bold font-mono text-cyan-400 uppercase tracking-widest flex items-center gap-2">
              <Activity size={16} /> NETWORK LOGS & AI RECOMMENDATIONS
            </h3>
            
            <div className="flex flex-col lg:flex-row gap-4 h-full overflow-hidden">
              {/* Terminal Logs (Left) */}
              <div className="flex-1 bg-slate-950 border border-slate-800 rounded-xl flex flex-col overflow-hidden relative">
                <div className="bg-slate-900 border-b border-slate-800 p-2.5 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="flex gap-1.5">
                      <div className="w-2.5 h-2.5 rounded-full bg-rose-500/50"></div>
                      <div className="w-2.5 h-2.5 rounded-full bg-amber-500/50"></div>
                      <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/50"></div>
                    </div>
                    <span className="text-[10px] font-mono text-slate-500 ml-2">VpnService Interceptor (TUN)</span>
                  </div>
                  <Filter size={14} className="text-slate-500" />
                </div>
                
                <div className="flex-1 p-3 overflow-y-auto font-mono text-[11px] leading-relaxed space-y-1">
                  {!fwEnabled && networkLogs.length === 0 && (
                    <div className="text-slate-600 text-center mt-10">
                      En attente de l'activation du pare-feu...
                    </div>
                  )}
                  {networkLogs.map((log) => (
                    <div key={log.id} className="flex flex-wrap md:flex-nowrap gap-3 hover:bg-slate-900 py-0.5 px-1 rounded group">
                      <span className="text-slate-600 shrink-0">
                        [{new Date(log.timestamp).toLocaleTimeString()}]
                      </span>
                      <span className={`shrink-0 text-[10px] px-1.5 py-0.5 rounded ${log.action === 'BLOCK' ? 'bg-rose-500/20 text-rose-400' : 'bg-emerald-500/10 text-emerald-500'}`}>
                        {log.action}
                      </span>
                      <span className={`shrink-0 ${log.protocol === 'TCP' ? 'text-amber-400' : 'text-purple-400'}`}>
                        {log.protocol}
                      </span>
                      <span className="text-cyan-400/70 shrink-0 w-24 truncate" title={log.ip}>
                        {log.ip}
                      </span>
                      <span className="text-slate-300 truncate font-semibold">
                        {log.domain}
                      </span>
                    </div>
                  ))}
                  {fwEnabled && networkLogs.length === 0 && (
                    <div className="flex items-center gap-2 text-emerald-400/80">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                      Écoute des paquets IPv4 sur 10.0.0.2...
                    </div>
                  )}
                </div>
              </div>

              {/* AI Recommendations Panel (Right) */}
              <div className="w-full lg:w-80 bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col gap-4">
                <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
                  <BrainCircuit className="text-purple-400" size={18} />
                  <h4 className="text-xs font-mono font-bold text-slate-200">ANALYSE IA EN TEMPS RÉEL</h4>
                  {isAiLoading && <Loader2 className="animate-spin text-purple-400 ml-auto" size={14} />}
                </div>
                
                <div className="flex-1 overflow-y-auto space-y-3">
                  {aiRecommendation ? (
                    <div className="p-3 bg-purple-500/10 border border-purple-500/20 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <AlertOctagon size={14} className="text-rose-400" />
                        <span className="text-[10px] font-mono text-purple-400 font-bold">ALERTE IA LOCAL</span>
                      </div>
                      <p className="text-[11px] text-slate-300 leading-relaxed font-sans">
                        {aiRecommendation}
                      </p>
                    </div>
                  ) : (
                    <div className="p-3 bg-slate-800/40 border border-slate-700/50 rounded-lg text-center text-slate-500 text-xs py-10">
                      <BrainCircuit size={24} className="mx-auto mb-3 opacity-20" />
                      En attente de blocage réseau...
                    </div>
                  )}
                  
                  <div className="p-3 bg-emerald-500/5 border border-emerald-500/10 rounded-lg">
                    <div className="flex items-center gap-2 mb-1">
                      <Shield size={14} className="text-emerald-500" />
                      <span className="text-[10px] font-mono text-emerald-500 font-bold">FILTRE DE BLOOM</span>
                    </div>
                    <p className="text-[11px] text-slate-400 leading-relaxed font-sans">
                      Base de données chargée en RAM. Traitement ultra-rapide des flux.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
