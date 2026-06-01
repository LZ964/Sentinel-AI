import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldAlert, Cpu, Database } from 'lucide-react';
import { translations, Language } from '../lib/translations';

interface WelcomePopupProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (engine: 'expert' | 'fallback') => void;
}

export const WelcomePopup: React.FC<any> = ({ isOpen, onClose, onSelect }) => {
  if (!isOpen) return null;

  const currentLang = (localStorage.getItem('sentinel_language') as Language) || 'FR';
  const t = translations[currentLang];

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0B0F19]/90 backdrop-blur-md p-4" id="welcome-popup-overlay">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: -20 }}
          className="bg-slate-900 border border-slate-700 rounded-xl p-6 max-w-lg w-full shadow-2xl shadow-cyan-900/20 relative"
          id="welcome-popup-container"
        >
          <div className="flex items-center mb-4 border-b border-slate-800 pb-3" id="welcome-popup-header">
            <ShieldAlert className="text-cyan-400 mr-3" size={28} id="welcome-popup-icon" />
            <h2 className="text-2xl font-bold text-slate-100" id="welcome-popup-title">
              {t.popupTitle} <span className="sr-only">Local AI Core Setup</span>
            </h2>
          </div>
          
          <p className="text-slate-300 text-sm mb-6" id="welcome-popup-description">
            {t.popupDescription}
          </p>

          <div className="space-y-4" id="welcome-popup-options">
            <div 
              onClick={() => onSelect('expert')}
              className="p-4 border border-cyan-500/30 bg-slate-950 rounded-lg cursor-pointer hover:border-cyan-400 transition-colors group"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center">
                  <ShieldAlert className="text-cyan-400 mr-2" size={20} />
                  <h3 className="text-cyan-400 font-bold">Android AICore (0 MB)</h3>
                </div>
                <span className="text-cyan-400 font-mono text-[10px] bg-cyan-500/10 px-2 py-1 rounded">NATIVE TENSOR</span>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed mb-3">
                Optimal performance using built-in device Gemini Nano model (e.g. Pixel 8+). Zero download required.
              </p>
              <details className="mt-2 text-[11px] font-mono bg-black/40 p-2 rounded border border-white/5" onClick={(e) => e.stopPropagation()}>
                <summary className="cursor-pointer text-cyan-500 hover:text-cyan-400 ml-1">View Activation Instructions</summary>
                <div className="mt-2 pl-3 border-l border-cyan-500/30 text-slate-500 space-y-1">
                  <p>1. Open Chrome and navigate to <span className="text-slate-300">chrome://flags</span></p>
                  <p>2. Enable <span className="text-purple-400">#prompt-api-for-gemini-nano</span></p>
                  <p>3. Set <span className="text-purple-400">#optimization-guide-on-device-model</span> to <span className="text-slate-300">BypassPerfRequirement</span></p>
                  <p>4. Relaunch the browser</p>
                </div>
              </details>
            </div>

            <div 
              onClick={() => onSelect('expert')}
              className="p-4 border border-rose-900/50 bg-slate-950 rounded-lg cursor-pointer hover:border-rose-500 transition-colors group"
              id="welcome-popup-opt-expert"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center">
                  <Database className="text-rose-500 mr-2" size={20} />
                  <h3 className="text-rose-400 font-bold">WebGPU Frontier (800 MB)</h3>
                </div>
                <span className="text-rose-400 font-mono text-[10px] bg-rose-500/10 px-2 py-1 rounded">ADVANCED</span>
              </div>
              <p className="text-xs text-slate-400">
                Llama/Phi advanced model for detailed behavioural analysis. Recommended for powerful devices lacking native AICore.
              </p>
            </div>

            <div 
              onClick={() => onSelect('fallback')}
              className="p-4 border border-slate-700 bg-slate-950 rounded-lg cursor-pointer hover:border-slate-500 transition-colors"
              id="welcome-popup-opt-fallback"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center">
                  <Cpu className="text-slate-400 mr-2" size={20} />
                  <h3 className="text-slate-200 font-bold">Nano SLM Fallback (350 MB)</h3>
                </div>
                <span className="text-slate-400 font-mono text-[10px] bg-slate-800 px-2 py-1 rounded">LEGACY</span>
              </div>
              <p className="text-xs text-slate-400">
                Highly quantized model for older devices. Direct, short recommendations. Better than standard rule-based detection.
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
