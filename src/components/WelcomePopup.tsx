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
              className="p-4 border border-rose-900/50 bg-slate-950 rounded-lg cursor-pointer hover:border-rose-500 transition-colors group"
              id="welcome-popup-opt-expert"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center">
                  <Database className="text-rose-500 mr-2" size={20} />
                  <h3 className="text-rose-400 font-bold">{t.optExpertTitle}</h3>
                </div>
                <span className="text-red-500 font-black text-lg bg-red-500/10 px-2 py-1 rounded">
                  2.0 GB
                </span>
              </div>
              <p className="text-xs text-slate-400">
                {t.optExpertDesc}
              </p>
            </div>

            <div 
              onClick={() => onSelect('fallback')}
              className="p-4 border border-slate-700 bg-slate-950 rounded-lg cursor-pointer hover:border-cyan-500 transition-colors"
              id="welcome-popup-opt-fallback"
            >
              <div className="flex items-center mb-2">
                <Cpu className="text-cyan-400 mr-2" size={20} />
                <h3 className="text-cyan-100 font-bold">{t.optFallbackTitle}</h3>
              </div>
              <p className="text-xs text-slate-400">
                {t.optFallbackDesc}
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
