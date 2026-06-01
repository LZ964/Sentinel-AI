import React, { useState } from 'react';
import { registerPlugin } from '@capacitor/core';
import { Shield, Network, Terminal, Power, Globe } from 'lucide-react';
import { motion } from 'framer-motion';

const SentinelTunnel = registerPlugin<any>('SentinelTunnel');

type ConnectionState = 'disconnected' | 'connecting' | 'connected' | 'error';
type TunnelType = 'wireguard' | 'tor' | 'none';

interface LogEntry {
  id: string;
  timestamp: number;
  message: string;
}

export default function ProxyTab() {
  const [activeTunnel, setActiveTunnel] = useState<TunnelType>('none');
  const [connectionState, setConnectionState] = useState<ConnectionState>('disconnected');
  const [logs, setLogs] = useState<LogEntry[]>([]);

  const addLog = (message: string) => {
    setLogs(prev => [{ id: Math.random().toString(36).substring(7), timestamp: Date.now(), message }, ...prev].slice(0, 50));
  };

  const toggleTunnel = async (type: TunnelType) => {
    if (activeTunnel === type && connectionState === 'connected') {
      setConnectionState('disconnected');
      setActiveTunnel('none');
      addLog(`Tunnel ${type.toUpperCase()} déconnecté.`);
      await SentinelTunnel.configureTunnel({ type: 'none' });
      return;
    }

    setConnectionState('connecting');
    addLog(`Initialisation du tunnel ${type.toUpperCase()}...`);
    setActiveTunnel(type);

    try {
      const res = await SentinelTunnel.configureTunnel({ type });
      if (res.status === 'connected') {
        setConnectionState('connected');
        addLog(res.message || `Connecté au réseau ${type.toUpperCase()}.`);
      } else {
        setConnectionState('error');
        addLog(`Erreur de connexion : ${res.message}`);
      }
    } catch (e: any) {
      setConnectionState('error');
      addLog(`Échec : ${e.message}`);
    }
  };

  return (
    <div className="flex flex-col w-full gap-5 flex-1 select-none text-slate-100 h-full max-h-[85vh]">
      <div className="bg-slate-900/60 backdrop-blur-md border border-slate-800 rounded-[24px] p-6 relative overflow-hidden flex flex-col md:flex-row justify-between items-center gap-6">
        <div className="flex items-center gap-5">
          <div className="p-4 rounded-full border bg-slate-800/50 border-slate-700">
            <Globe className="text-purple-400" size={32} />
          </div>
          <div>
            <h2 className="text-xl font-display font-medium text-white tracking-tight flex items-center mb-1">
              VPN & Tor Proxy
            </h2>
            <p className="text-slate-400 text-xs">
              Routage sécurisé du trafic validé (WireGuard / Onion Network).
            </p>
          </div>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-5 flex-1 overflow-hidden">
        {/* Connection Cards */}
        <div className="flex-1 flex flex-col gap-5 overflow-y-auto pr-2">
          {/* WireGuard Card */}
          <div className={`border rounded-2xl p-5 transition-all ${
            activeTunnel === 'wireguard' && connectionState === 'connected' 
              ? 'bg-emerald-950/20 border-emerald-500/40' 
              : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
          }`}>
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-slate-950 rounded-xl border border-slate-800">
                  <Shield className={activeTunnel === 'wireguard' && connectionState === 'connected' ? 'text-emerald-400' : 'text-slate-400'} size={24} />
                </div>
                <div>
                  <h3 className="font-bold text-slate-200">MULLVAD SECURE NODE</h3>
                  <p className="text-[10px] font-mono text-slate-500">Protocole: WireGuard (UDP)</p>
                </div>
              </div>
              <button 
                onClick={() => toggleTunnel('wireguard')}
                disabled={activeTunnel === 'tor' && connectionState !== 'disconnected'}
                className={`p-3 rounded-xl transition-all ${
                  activeTunnel === 'wireguard' && connectionState === 'connected'
                    ? 'bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 border border-emerald-500/30'
                    : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                <Power size={20} className={activeTunnel === 'wireguard' && connectionState === 'connecting' ? 'animate-pulse text-amber-400' : ''} />
              </button>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Route le trafic vers l'infrastructure Mullvad via le tunnel crypté WireGuard. Hautes performances et latence minimale.
            </p>
          </div>

          {/* Tor Card */}
          <div className={`border rounded-2xl p-5 transition-all ${
            activeTunnel === 'tor' && connectionState === 'connected' 
              ? 'bg-purple-950/20 border-purple-500/40' 
              : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
          }`}>
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-slate-950 rounded-xl border border-slate-800">
                  <Network className={activeTunnel === 'tor' && connectionState === 'connected' ? 'text-purple-400' : 'text-slate-400'} size={24} />
                </div>
                <div>
                  <h3 className="font-bold text-slate-200">TOR ONION NETWORK</h3>
                  <p className="text-[10px] font-mono text-slate-500">Protocole: Onion Routing (TCP)</p>
                </div>
              </div>
              <button 
                onClick={() => toggleTunnel('tor')}
                disabled={activeTunnel === 'wireguard' && connectionState !== 'disconnected'}
                className={`p-3 rounded-xl transition-all ${
                  activeTunnel === 'tor' && connectionState === 'connected'
                    ? 'bg-purple-500/10 text-purple-400 hover:bg-purple-500/20 border border-purple-500/30'
                    : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                <Power size={20} className={activeTunnel === 'tor' && connectionState === 'connecting' ? 'animate-pulse text-amber-400' : ''} />
              </button>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Anonymise le trafic en le faisant rebondir via le réseau décentralisé Tor. Configuration de sécurité maximale (Guardian Project).
            </p>
          </div>
        </div>

        {/* Terminal Logs */}
        <div className="w-full lg:w-96 bg-slate-950 border border-slate-800 rounded-2xl flex flex-col overflow-hidden shrink-0">
          <div className="bg-slate-900 border-b border-slate-800 p-3 flex items-center gap-2">
            <Terminal size={14} className="text-slate-400" />
            <span className="text-xs font-mono font-bold text-slate-300">TUNNEL DIAGNOSTICS</span>
          </div>
          <div className="flex-1 p-4 overflow-y-auto font-mono text-[11px] leading-relaxed space-y-2">
            {logs.length === 0 && (
              <div className="text-slate-600 text-center mt-10">En attente de connexion...</div>
            )}
            {logs.map((log) => (
              <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} key={log.id} className="flex gap-3">
                <span className="text-slate-600 shrink-0">[{new Date(log.timestamp).toLocaleTimeString()}]</span>
                <span className="text-cyan-400/80">{log.message}</span>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
