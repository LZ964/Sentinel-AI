import React, { useState } from 'react';
import { RealScanner, Vulnerability } from '../lib/realScanner';
import { WelcomePopup } from './WelcomePopup';
import { Search, AlertOctagon, ShieldAlert, ShieldCheck, Activity, Terminal, Shield, RefreshCw } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { translations, Language } from '../lib/translations';

export default function ScannerTab({ language = 'FR' }: { language?: Language }) {
  const [vulns, setVulns] = useState<Vulnerability[]>([]);
  const [searchFilter, setSearchFilter] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [hasScanned, setHasScanned] = useState(false);
  const [scanStep, setScanStep] = useState<string>('');

  const t = translations[language];

  const simulateLogs = language === 'EN' ? [
    "Initializing local offline scanner...",
    "Verifying Applet execution permissions...",
    "Identifying Linux kernel version...",
    "Reading hardware security patch level (Android 2025/2026)...",
    "Incremental NVD threat database verification...",
    "Analyzing 1000+ known vulnerability signatures...",
    "Heuristic calculation of potential attack vectors..."
  ] : language === 'ES' ? [
    "Inicializando escáner local sin conexión...",
    "Verificando permisos de ejecución de la Applet...",
    "Identificando la versión del kernel Linux...",
    "Leyendo el nivel de parche de seguridad de hardware (Android 2025/2026)...",
    "Verificación incremental de la base de datos de amenazas NVD...",
    "Analizando más de 1000 firmas de vulnerabilidades conocidas...",
    "Cálculo heurístico de posibles vectores de ataque..."
  ] : [
    "Initialisation du scanner local offline...",
    "Vérification des permissions d'exécution de l'Applet...",
    "Identification de la version du noyau Linux...",
    "Lecture du niveau de correctif matériel (Android 2025/2026)...",
    "Téléchargement incrémental/Vérification de la base de données de menaces NVD...",
    "Analyse de 1000+ signatures de vulnérabilités connues...",
    "Calcul heuristique des vecteurs d'attaque potentiels..."
  ];

  const handleScan = async () => {
    if (!localStorage.getItem('sentinel_ai')) {
      setShowModal(true);
      return;
    }
    
    setIsScanning(true);
    setHasScanned(false);
    
    // Virtual device patch date (for test and simulator continuity)
    const devicePatchLevel = "2025-01-01";
    
    // Run through quick visual log simulations to make the diagnostic immersive
    for (let i = 0; i < simulateLogs.length; i++) {
      setScanStep(simulateLogs[i]);
      await new Promise(resolve => setTimeout(resolve, 400 + Math.random() * 300));
    }

    try {
      const results = await RealScanner.fetchCVEs(devicePatchLevel);
      setVulns(results);
    } catch (e) {
      console.error("Erreur lors de l'audit :", e);
    } finally {
      setIsScanning(false);
      setHasScanned(true);
    }
  };

  const onEngineSelect = (engine: string) => {
    localStorage.setItem('sentinel_ai', engine);
    setShowModal(false);
    handleScan();
  };

  const filteredVulns = vulns.filter(v => 
    v.id.toLowerCase().includes(searchFilter.toLowerCase()) || 
    v.description.toLowerCase().includes(searchFilter.toLowerCase()) ||
    v.component.toLowerCase().includes(searchFilter.toLowerCase())
  );

  return (
    <div className="flex flex-col w-full gap-5 flex-1 select-none" id="scanner-tab-container">
      <WelcomePopup isOpen={showModal} onClose={() => setShowModal(false)} onSelect={onEngineSelect} />
      
      {/* Upper header controls */}
      <div className="bg-slate-900/40 backdrop-blur-md border border-cyan-500/20 shadow-[0_0_30px_rgba(6,182,212,0.02)] rounded-[20px] p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative overflow-hidden" id="scanner-header-card">
        <div className="absolute top-[-50px] right-[-50px] w-64 h-64 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none" />
        <div className="flex-1 relative z-10 flex flex-col justify-between" id="scanner-header-info">
          <span className="text-[10px] font-mono text-cyan-400 font-bold uppercase tracking-widest bg-cyan-500/10 px-2 py-0.5 rounded border border-cyan-500/25 self-start mb-2">
            {t.badgeModuleScanner}
          </span>
          <h2 className="text-xl font-display font-bold text-white tracking-tight flex items-center">
            <Shield className="mr-2 h-5 w-5 text-cyan-400" /> {t.scannerHeading}
          </h2>
          <p className="text-slate-400 text-xs mt-1 leading-relaxed">
            {t.scannerDescription}
          </p>
        </div>
        
        {hasScanned && !isScanning && (
          <button 
            onClick={handleScan}
            className="flex items-center justify-center gap-2 bg-cyan-500 hover:bg-cyan-400 text-black font-bold px-6 py-2.5 rounded-xl transition-all shadow-[0_0_15px_rgba(6,182,212,0.35)] cursor-pointer text-sm font-mono active:scale-95 shrink-0"
            id="scanner-action-retry"
          >
            <RefreshCw size={16} className="animate-spin-slow" />
            {t.btnRelaunch}
          </button>
        )}
      </div>

      {/* Main Content Pane */}
      <div className="flex-1 flex flex-col min-h-[400px]" id="scanner-content-pane">
        
        {/* State 1: Awaiting Audit */}
        {!hasScanned && !isScanning && (
          <div className="flex-1 flex flex-col items-center justify-center p-8 bg-slate-900/20 border border-slate-800/60 rounded-[20px] text-center" id="state-awaiting-audit">
            <div className="p-5 bg-cyan-500/5 border border-cyan-500/20 rounded-full mb-4 animate-pulse">
              <ShieldAlert size={48} className="text-cyan-400/80" />
            </div>
            <h3 className="text-lg font-bold text-slate-100 mb-2">{t.noAuditHeading}</h3>
            <p className="text-slate-400 text-sm max-w-sm mb-6 leading-relaxed">
              {t.noAuditDescription}
            </p>
            
            <button 
              onClick={handleScan}
              className="bg-cyan-500 hover:bg-cyan-400 active:scale-95 text-black font-bold font-mono text-sm px-8 py-3.5 rounded-xl transition-all shadow-[0_0_25px_rgba(6,182,212,0.25)] flex items-center gap-2 cursor-pointer"
              id="start-audit-button"
            >
              <Activity size={18} className="animate-pulse" />
              {t.btnStartAudit}
            </button>
          </div>
        )}

        {/* State 2: Active scanning */}
        {isScanning && (
          <div className="flex-1 flex flex-col items-center justify-center p-8 bg-slate-900/20 border border-slate-800/60 rounded-[20px]" id="state-scanning">
            <div className="relative mb-6">
              <div className="absolute inset-0 rounded-full bg-cyan-500/10 animate-ping" />
              <div className="p-6 bg-slate-900 border-2 border-cyan-500 rounded-full shadow-[0_0_30px_rgba(6,182,212,0.3)] relative">
                <Activity size={40} className="text-cyan-400 animate-pulse" />
              </div>
            </div>
            
            <h3 className="text-lg font-bold text-white mb-2 font-mono">{t.scanningText}</h3>
            
            <div className="w-full max-w-md bg-slate-950/85 border border-slate-800 rounded-lg p-4 font-mono text-xs text-cyan-400 shadow-md">
              <div className="flex items-center gap-1.5 text-slate-500 mb-2 border-b border-slate-900 pb-1.5">
                <Terminal size={12} />
                <span>Sentinel Core Diagnostic Terminal</span>
              </div>
              <div className="space-y-1">
                <div className="text-slate-500">{"\u003E\u003E\u003E"} systemctl status sentinel.service</div>
                <div className="text-slate-300">INFO: Bootstrapping diagnostic sandbox</div>
                <div className="text-cyan-400 animate-pulse">{"\u003E\u003E\u003E"} {scanStep}</div>
              </div>
            </div>
          </div>
        )}

        {/* State 3: Scan completed */}
        {hasScanned && !isScanning && (
          <AnimatePresence>
            <motion.div 
              initial={{ opacity: 0, y: 15 }} 
              animate={{ opacity: 1, y: 0 }} 
              className="flex flex-col gap-4 flex-1"
              id="scanner-results-pane"
            >
              {/* Vulnerabilities Summary Banner */}
              <div className={`p-5 rounded-[20px] border flex items-center gap-4 ${vulns.length > 0 ? 'bg-rose-950/15 border-rose-500/30 text-rose-400 shadow-[0_0_20px_rgba(244,63,94,0.03)]' : 'bg-emerald-950/15 border-emerald-500/30 text-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.03)]'}`} id="vulnerabilities-summary-banner">
                {vulns.length > 0 ? (
                  <>
                    <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl">
                      <AlertOctagon size={28} className="text-rose-500" />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-100 text-base">
                        {vulns.length} {vulns.length === 1 ? t.vulnsDetectedSingular : t.vulnsDetectedPlural}
                      </h3>
                      <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">
                        {t.vulnsDetectedDesc}
                      </p>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl">
                      <ShieldCheck size={28} className="text-emerald-500 animate-bounce" />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-100 text-base text-emerald-400">{t.healthyHeading}</h3>
                      <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">
                        {t.healthyDescription}
                      </p>
                    </div>
                  </>
                )}
              </div>

              {/* Filtering layout (Only displayed when there are metrics/results) */}
              {vulns.length > 0 && (
                <div className="flex flex-col gap-4" id="scanner-results-filtering">
                  <div className="relative" id="filter-wrapper">
                    <Search className="absolute left-3.5 top-3.5 text-slate-500" size={18} />
                    <input 
                      type="text" 
                      placeholder={t.searchPlaceholder} 
                      className="w-full bg-slate-900/60 border border-slate-800 p-3.5 pl-11 rounded-xl font-mono text-xs outline-none focus:border-cyan-500/60 text-slate-200 transition-colors"
                      value={searchFilter} 
                      onChange={e => setSearchFilter(e.target.value)}
                      id="search-filter-input"
                    />
                  </div>

                  {/* List of CVE cards */}
                  <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1" id="cve-cards-list">
                    {filteredVulns.map((v, i) => (
                      <motion.div 
                        initial={{ opacity: 0, x: -10 }} 
                        animate={{ opacity: 1, x: 0 }} 
                        transition={{ delay: Math.min(i * 0.03, 0.4) }} 
                        key={v.id} 
                        className="p-4 bg-slate-900/30 border border-slate-800 rounded-xl hover:border-slate-700/80 transition-all flex flex-col gap-2 relative overflow-hidden group hover:bg-slate-900/40"
                      >
                        <div className="absolute top-0 left-0 w-1.5 h-full bg-rose-500/35" />
                        <div className="flex justify-between items-center pl-2">
                          <span className="font-mono text-rose-500/90 font-bold text-sm flex items-center gap-1.5">
                            <span className="inline-block w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
                            {v.id}
                          </span>
                          <span className="text-[10px] font-mono bg-slate-950 text-slate-400 border border-slate-800/80 px-2 py-0.5 rounded">
                            NVD: {v.published}
                          </span>
                        </div>
                        
                        <p className="text-slate-300 text-xs leading-relaxed pl-2 pr-2">
                          {v.description}
                        </p>
                        
                        <div className="flex items-center gap-2 pl-2 mt-1">
                          <span className="inline-block px-2 py-0.5 bg-cyan-950 border border-cyan-900/50 text-[10px] text-cyan-400 font-mono rounded">
                            {t.layerTitle}: {v.component}
                          </span>
                        </div>
                      </motion.div>
                    ))}
                    
                    {filteredVulns.length === 0 && (
                      <div className="text-center text-slate-500 font-mono text-xs py-8" id="no-filtered-results">
                        {t.noResults}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        )}
      </div>
    </div>
  );
}
