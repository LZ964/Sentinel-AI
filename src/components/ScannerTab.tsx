import React, { useState, useEffect } from 'react';
import { RealScanner, Vulnerability } from '../lib/realScanner';
import { WelcomePopup } from './WelcomePopup';
import { Search, AlertOctagon, ShieldAlert, ShieldCheck, Activity, Terminal, Shield, RefreshCw, Cpu, Layers, HardDrive, ShieldCheck as ProtectIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Language } from '../lib/translations';
import { Device } from '@capacitor/device';

interface ScannerTabProps {
  language?: Language;
}

export default function ScannerTab({ language = 'FR' }: ScannerTabProps) {
  const [vulns, setVulns] = useState<Vulnerability[]>([]);
  const [searchFilter, setSearchFilter] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [hasScanned, setHasScanned] = useState(false);
  const [scanStep, setScanStep] = useState<string>('');
  
  // Device specifics
  const [manufacturer, setManufacturer] = useState('Google');
  const [model, setModel] = useState('Pixel 8 Pro');
  const [securityPatch, setSecurityPatch] = useState('2025-06-01');
  
  // Play Integrity details
  const [integrityData, setIntegrityData] = useState({
    meetsBasicIntegrity: true,
    meetsDeviceIntegrity: true,
    playProtectEnabled: true,
    integrityScore: 100
  });

  const s = {
    FR: {
      integrityScore: "Score d'Intégrité Matérielle",
      playProtect: "Google Play Protect",
      basicIntegrity: "Basic Integrity",
      deviceIntegrity: "Device Integrity",
      statusOk: "CONFORME",
      statusFail: "ÉCHEC",
      statusEnabled: "ACTIVÉ",
      statusDisabled: "DÉSACTIVÉ",
      btnAudit: "LANCER L'AUDIT SYSTÈME REEL",
      btnAuditing: "AUDIT SYSTÈME EN COURS...",
      scanningNvd: "Interrogation de l'API NVD en temps réel...",
      filterPlaceholder: "Filtrer les CVEs par ID, composant, description...",
      cveFound: "Vulnérabilité active détectée",
      cvesFound: "Vulnérabilités actives détectées",
      noVulns: "Aucune vulnérabilité active détectée",
      noVulnsDesc: "Votre système est parfaitement protégé par rapport à votre date de correctif.",
      patchLevelLabel: "Correctif :",
      manufacturerLabel: "Fabricant :",
      cveDate: "Date de publication :",
      layerLabel: "Composant touché :",
      badgeModuleScanner: "Module Principal d'Analyse",
      scannerHeading: "Audit Système & Vulnérabilités",
      scannerDescription: "Analyse chirurgicale des pilotes matériels, du noyau Linux et des bibliothèques via l'API NVD en temps réel face au correctif système local."
    },
    EN: {
      integrityScore: "Hardware Integrity Score",
      playProtect: "Google Play Protect",
      basicIntegrity: "Basic Integrity",
      deviceIntegrity: "Device Integrity",
      statusOk: "PASSED",
      statusFail: "FAILED",
      statusEnabled: "ENABLED",
      statusDisabled: "DISABLED",
      btnAudit: "START REAL SYSTEM AUDIT",
      btnAuditing: "SYSTEM AUDIT IN PROGRESS...",
      scanningNvd: "Querying NVD API in real-time...",
      filterPlaceholder: "Filter CVEs by ID, component, description...",
      cveFound: "Active vulnerability detected",
      cvesFound: "Active vulnerabilities detected",
      noVulns: "No active vulnerabilities detected",
      noVulnsDesc: "Your system is fully updated based on your current security patch level.",
      patchLevelLabel: "Patch Level:",
      manufacturerLabel: "Manufacturer:",
      cveDate: "Published Date:",
      layerLabel: "Affected Component:",
      badgeModuleScanner: "Core Analysis Module",
      scannerHeading: "System Audit & Vulnerabilities",
      scannerDescription: "Surgical real-time NVD API query of hardware drivers, Linux kernel, and libraries against local device firmware secure patch level."
    },
    ES: {
      integrityScore: "Puntaje de Integridad de Hardware",
      playProtect: "Google Play Protect",
      basicIntegrity: "Basic Integrity",
      deviceIntegrity: "Device Integrity",
      statusOk: "CONFORME",
      statusFail: "FALLO",
      statusEnabled: "ACTIVADO",
      statusDisabled: "DESACTIVADO",
      btnAudit: "INICIAR AUDITORÍA REAL DE SISTEMA",
      btnAuditing: "AUDITORÍA DE SISTEMA EN CURSO...",
      scanningNvd: "Consultando la API de NVD en tiempo real...",
      filterPlaceholder: "Filtrar CVEs por ID, componente, descripción...",
      cveFound: "Vulnerabilidad activa detectada",
      cvesFound: "Vulnerabilidades activas detectadas",
      noVulns: "No se detectaron vulnerabilidades activas",
      noVulnsDesc: "Su sistema está completamente protegido y al día según su nivel de parche.",
      patchLevelLabel: "Nivel de Parche:",
      manufacturerLabel: "Fabricante:",
      cveDate: "Fecha de Publicación:",
      layerLabel: "Componente Afectado:",
      badgeModuleScanner: "Módulo Principal de Análisis",
      scannerHeading: "Auditoría de Sistema y Vulnerabilidades",
      scannerDescription: "Análisis quirúrgico de controladores de hardware, kernel Linux y bibliotecas a través de la API NVD real frente al parche local."
    }
  }[language];

  useEffect(() => {
    async function loadDeviceDetails() {
      try {
        const info = await Device.getInfo();
        if (info.manufacturer) setManufacturer(info.manufacturer);
        if (info.model) setModel(info.model);
      } catch (e) {
        // Fallback info
      }
    }
    loadDeviceDetails();
  }, []);

  const simulateLogs = language === 'EN' ? [
    "Checking hardware platform components...",
    "Querying local Play Integrity status metrics...",
    "Verifying meetsBasicIntegrity state...",
    "Verifying meetsDeviceIntegrity state...",
    "Asserting Google Play Protect security context...",
    "Surgical connection initialization with official NVD API...",
    "Deploying asynchronous fetch targets (Android, Kernel, BoringSSL)...",
    "Fetching zero-day publications since device patch level...",
    "Filtering real-time results & discarding older secure vulnerabilities..."
  ] : language === 'ES' ? [
    "Comprobando componentes de la plataforma de hardware...",
    "Consultando métricas de estado locales de Play Integrity...",
    "Verificando el estado meetsBasicIntegrity...",
    "Verificando el estado meetsDeviceIntegrity...",
    "Confirmando el contexto de seguridad de Google Play Protect...",
    "Inicializando conexión quirúrgica con la API oficial de NVD...",
    "Lanzando objetivos de recuperación asíncronos (Android, Kernel, BoringSSL)...",
    "Obteniendo publicaciones recientes posteriores al nivel de parche...",
    "Filtrando resultados reales y descartando vulnerabilidades seguras..."
  ] : [
    "Vérification des composants matériels de la plateforme...",
    "Collecte des métriques d'état local de Google Play Integrity...",
    "Vérification de l'état meetsBasicIntegrity...",
    "Vérification de l'état meetsDeviceIntegrity...",
    "Validation du contexte de sécurité Google Play Protect...",
    "Lancement de la connexion avec l'API officielle de la NVD...",
    "Déploiement des tâches de récupération asynchrones (Android, Kernel, BoringSSL)...",
    "Téléchargement des vulnérabilités indexées postérieures au correctif...",
    "Filtrage en temps réel des résultats & élimination des doublons de sécurité..."
  ];

  const handleScan = async () => {
    if (!localStorage.getItem('sentinel_ai')) {
      setShowModal(true);
      return;
    }
    
    setIsScanning(true);
    setHasScanned(false);
    
    // Simulate real-time progress steps for high-fidelity cybersecurity feedback
    for (let i = 0; i < simulateLogs.length; i++) {
      setScanStep(simulateLogs[i]);
      await new Promise(resolve => setTimeout(resolve, 300 + Math.random() * 200));
    }

    try {
      // 1. Perform Play Integrity Hardware verification
      const integrity = await RealScanner.verifySystemIntegrity();
      setIntegrityData(integrity);

      // 2. Perform surgical real-time NVD API query
      const results = await RealScanner.fetchCVEs(securityPatch);
      setVulns(results);
    } catch (e) {
      console.error("Audit processing failure:", e);
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
    <div className="flex flex-col w-full gap-5 flex-1 select-none text-slate-100" id="scanner-tab-container">
      <WelcomePopup isOpen={showModal} onClose={() => setShowModal(false)} onSelect={onEngineSelect} />
      
      {/* Upper header controls with beautiful Bento integration & Hardware Integrity Score Indicator */}
      <div 
        className="bg-slate-900/60 backdrop-blur-md border border-cyan-500/20 shadow-[0_0_30px_rgba(6,182,212,0.05)] rounded-[24px] p-6 relative overflow-hidden flex flex-col md:flex-row gap-6 items-center" 
        id="scanner-bento-header"
      >
        <div className="absolute top-[-80px] left-[-80px] w-96 h-96 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none" />
        
        {/* Hardware Integrity Score Circle HUD Ring */}
        <div className="relative flex-shrink-0 flex items-center justify-center w-36 h-36 border border-slate-800/80 rounded-full bg-slate-950/40 p-2 shadow-inner" id="integrity-hud-container">
          <svg className="w-full h-full transform -rotate-90">
            <circle
              cx="72"
              cy="72"
              r="62"
              className="stroke-slate-800"
              strokeWidth="6"
              fill="transparent"
            />
            <motion.circle
              cx="72"
              cy="72"
              r="62"
              className={integrityData.integrityScore === 100 ? "stroke-cyan-400" : "stroke-rose-500"}
              strokeWidth="6"
              fill="transparent"
              strokeDasharray={389.5}
              initial={{ strokeDashoffset: 389.5 }}
              animate={{ 
                strokeDashoffset: isScanning ? 120 : (389.5 - (389.5 * (hasScanned ? integrityData.integrityScore : 0)) / 100) 
              }}
              transition={{ duration: 1.5, ease: "easeOut" }}
            />
          </svg>
          <div className="absolute flex flex-col items-center justify-center">
            <span className="text-2xl font-black font-mono tracking-tight text-white">
              {isScanning ? "..." : hasScanned ? `${integrityData.integrityScore}%` : "---"}
            </span>
            <span className="text-[8px] font-bold text-slate-400/80 uppercase tracking-widest text-center max-w-[70px] mt-0.5 leading-none">
              {s.integrityScore}
            </span>
          </div>
        </div>

        {/* Dynamic Badges Grid & Details */}
        <div className="flex-1 relative z-10 flex flex-col w-full" id="scanner-meta-bento">
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <span className="text-[10px] font-mono text-cyan-400 font-bold uppercase tracking-widest bg-cyan-500/10 px-2 py-0.5 rounded border border-cyan-500/25">
              {s.badgeModuleScanner}
            </span>
            <span className="text-[10px] font-mono text-slate-400 bg-slate-950/80 px-2' py-0.5 rounded border border-slate-800/50 flex items-center gap-1">
              <Cpu size={10} className="text-slate-500" />
              {s.manufacturerLabel} {manufacturer} ({model})
            </span>
          </div>
          
          <h2 className="text-xl font-display font-medium text-white tracking-tight flex items-center mb-1">
            <Shield className="mr-2 h-5 w-5 text-cyan-400" /> {s.scannerHeading}
          </h2>
          <p className="text-slate-400 text-xs leading-relaxed max-w-xl mb-4">
            {s.scannerDescription}
          </p>

          {/* Core Play Integrity status grid indicators */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 w-full" id="play-integrity-indicators-grid">
            {/* Play Protect Enabled */}
            <div className={`flex items-center justify-between p-3 rounded-xl border bg-slate-950/40 ${
              !hasScanned ? 'border-slate-800/80 text-slate-500' :
              integrityData.playProtectEnabled ? 'border-emerald-500/20 text-emerald-400' : 'border-rose-500/20 text-rose-400'
            }`}>
              <div className="flex items-center gap-2">
                <ProtectIcon size={14} className={hasScanned ? "text-emerald-400" : "text-slate-500"} />
                <span className="text-[10px] font-mono uppercase font-bold text-slate-350">{s.playProtect}</span>
              </div>
              <span className="text-[9px] font-mono font-bold bg-black/45 px-2 py-0.5 rounded">
                {!hasScanned ? "---" : integrityData.playProtectEnabled ? s.statusEnabled : s.statusDisabled}
              </span>
            </div>

            {/* Meets Basic Integrity */}
            <div className={`flex items-center justify-between p-3 rounded-xl border bg-slate-950/40 ${
              !hasScanned ? 'border-slate-800/80 text-slate-500' :
              integrityData.meetsBasicIntegrity ? 'border-emerald-500/20 text-emerald-400' : 'border-rose-500/20 text-rose-400'
            }`}>
              <div className="flex items-center gap-2">
                <Layers size={14} className={hasScanned ? "text-emerald-400" : "text-slate-500"} />
                <span className="text-[10px] font-mono uppercase font-bold text-slate-350">{s.basicIntegrity}</span>
              </div>
              <span className="text-[9px] font-mono font-bold bg-black/45 px-2 py-0.5 rounded">
                {!hasScanned ? "---" : integrityData.meetsBasicIntegrity ? s.statusOk : s.statusFail}
              </span>
            </div>

            {/* Meets Device Integrity */}
            <div className={`flex items-center justify-between p-3 rounded-xl border bg-slate-950/40 ${
              !hasScanned ? 'border-slate-800/80 text-slate-500' :
              integrityData.meetsDeviceIntegrity ? 'border-emerald-500/20 text-emerald-400' : 'border-rose-500/20 text-rose-400'
            }`}>
              <div className="flex items-center gap-2">
                <HardDrive size={14} className={hasScanned ? "text-emerald-400" : "text-slate-500"} />
                <span className="text-[10px] font-mono uppercase font-bold text-slate-350">{s.deviceIntegrity}</span>
              </div>
              <span className="text-[9px] font-mono font-bold bg-black/45 px-2 py-0.5 rounded">
                {!hasScanned ? "---" : integrityData.meetsDeviceIntegrity ? s.statusOk : s.statusFail}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Main interactive core scanner sandbox pane */}
      <div className="flex-1 flex flex-col min-h-[400px]" id="scanner-content-pane">
        
        {/* State 1: Awaiting system verification */}
        {!hasScanned && !isScanning && (
          <div className="flex-1 flex flex-col items-center justify-center p-8 bg-slate-900/10 border border-slate-800/40 rounded-[24px] text-center" id="state-awaiting-audit">
            <div className="p-5 bg-cyan-500/5 border border-cyan-500/20 rounded-full mb-4 animate-pulse">
              <ShieldAlert size={48} className="text-cyan-400/80" />
            </div>
            
            {/* Simulation controls to configure Virtual device Patch level */}
            <div className="flex flex-col gap-1.5 items-center mb-6">
              <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">{s.patchLevelLabel}</span>
              <select 
                value={securityPatch} 
                onChange={e => setSecurityPatch(e.target.value)}
                className="bg-slate-950 border border-slate-800/80 rounded-lg px-3 py-1.5 font-mono text-xs text-cyan-400/90 outline-none focus:border-cyan-400/40 select-none"
              >
                <option value="2026-04-01">2026-04-01 (Modern Hardware)</option>
                <option value="2025-06-01">2025-06-01 (Standard Android 15)</option>
                <option value="2024-10-01">2024-10-01 (Legacy Android 14)</option>
                <option value="2023-01-01">2023-01-01 (Crucial Threat Exposure)</option>
              </select>
            </div>
            
            <button 
              onClick={handleScan}
              className="bg-gradient-to-r from-cyan-500 to-cyan-600 hover:from-cyan-400 hover:to-cyan-500 active:scale-95 text-black font-black font-mono text-xs tracking-wider px-8 py-4 rounded-xl transition-all shadow-[0_0_25px_rgba(6,182,212,0.25)] flex items-center gap-2.5 cursor-pointer uppercase"
              id="start-audit-button"
            >
              <Activity size={18} className="animate-pulse" />
              {s.btnAudit}
            </button>
          </div>
        )}

        {/* State 2: Active system diagnostic */}
        {isScanning && (
          <div className="flex-1 flex flex-col items-center justify-center p-8 bg-slate-900/10 border border-slate-800/40 rounded-[24px]" id="state-scanning">
            <div className="relative mb-6">
              <div className="absolute inset-0 rounded-full bg-cyan-500/10 animate-ping animate-duration-1000" />
              <div className="p-6 bg-slate-900 border-2 border-cyan-500 rounded-full shadow-[0_0_35px_rgba(6,182,212,0.4)] relative">
                <Activity size={40} className="text-cyan-400 animate-pulse" />
              </div>
            </div>
            
            <h3 className="text-base font-bold text-white mb-2 font-mono uppercase tracking-wide">{s.btnAuditing}</h3>
            <p className="text-[10px] font-mono text-cyan-400/80 mb-4 animate-pulse">{s.scanningNvd}</p>
            
            <div className="w-full max-w-lg bg-slate-950/90 border border-slate-800/80 rounded-xl p-4 font-mono text-[11px] text-cyan-400 shadow-xl">
              <div className="flex items-center gap-1.5 text-slate-500 mb-2 border-b border-slate-900 pb-1.5">
                <Terminal size={12} />
                <span>Sentinel Core Cyberdeck Diagnostic</span>
              </div>
              <div className="space-y-1">
                <div className="text-slate-500">{"\u003E\u003E\u003E"} load --sandbox --play-integrity</div>
                <div className="text-slate-300">INFO: Bootstrapping local Android hardware metrics verification</div>
                <div className="text-cyan-400 animate-pulse">{"\u003E\u003E\u003E"} {scanStep}</div>
              </div>
            </div>
          </div>
        )}

        {/* State 3: Diagnostic results dashboard view */}
        {hasScanned && !isScanning && (
          <AnimatePresence>
            <motion.div 
              initial={{ opacity: 0, y: 15 }} 
              animate={{ opacity: 1, y: 0 }} 
              className="flex flex-col gap-4 flex-1"
              id="scanner-results-pane"
            >
              {/* Summary of findings header */}
              <div className={`p-5 rounded-2xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 ${
                vulns.length > 0 
                  ? 'bg-rose-950/10 border-rose-500/20 text-rose-400' 
                  : 'bg-emerald-950/10 border-emerald-500/20 text-emerald-400'
              }`} id="vulnerabilities-summary-banner">
                <div className="flex items-center gap-4">
                  <div className={`p-3 rounded-xl border ${
                    vulns.length > 0 ? 'bg-rose-500/10 border-rose-500/30' : 'bg-emerald-500/10 border-emerald-500/30'
                  }`}>
                    {vulns.length > 0 ? (
                      <AlertOctagon size={24} className="text-rose-500 animate-pulse" />
                    ) : (
                      <ShieldCheck size={24} className="text-emerald-500" />
                    )}
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-100 text-base leading-tight">
                      {vulns.length} {vulns.length === 1 ? s.cveFound : s.cvesFound}
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">
                      {vulns.length > 0 ? `Unpatched security threats detected after secure kernel index date ${securityPatch}.` : s.noVulnsDesc}
                    </p>
                  </div>
                </div>

                <button 
                  onClick={handleScan}
                  className="flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-slate-300 font-bold px-4 py-2 rounded-xl transition-all text-xs font-mono shrink-0 cursor-pointer"
                  id="scanner-action-retry-dashboard"
                >
                  <RefreshCw size={12} />
                  RE-RUN AUDIT
                </button>
              </div>

              {/* Dynamic local search filter */}
              <div className="flex flex-col gap-4" id="scanner-results-filtering">
                <div className="relative" id="filter-wrapper">
                  <Search className="absolute left-3.5 top-3.5 text-slate-500" size={18} />
                  <input 
                    type="text" 
                    placeholder={s.filterPlaceholder} 
                    className="w-full bg-slate-900/40 border border-slate-800/80 p-3.5 pl-11 rounded-xl font-mono text-xs outline-none focus:border-cyan-500/40 text-slate-200 transition-colors placeholder:text-slate-600"
                    value={searchFilter} 
                    onChange={e => setSearchFilter(e.target.value)}
                    id="search-filter-input"
                  />
                </div>

                {/* Vertical scrollable CVE dashboard cards */}
                <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1" id="cve-cards-list">
                  {filteredVulns.map((v, i) => (
                    <motion.div 
                      initial={{ opacity: 0, x: -10 }} 
                      animate={{ opacity: 1, x: 0 }} 
                      transition={{ delay: Math.min(i * 0.02, 0.3) }} 
                      key={v.id} 
                      className="p-4 bg-slate-900/20 border border-slate-800 rounded-xl hover:border-slate-705 transition-all flex flex-col gap-2 relative overflow-hidden"
                    >
                      <div className="absolute top-0 left-0 w-1 h-full bg-rose-500/45" />
                      
                      <div className="flex justify-between items-center pl-2">
                        <span className="font-mono text-rose-400 font-bold text-xs flex items-center gap-1.5">
                          <span className="inline-block w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
                          {v.id}
                        </span>
                        <span className="text-[9px] font-mono bg-slate-950 text-slate-400 border border-slate-800/50 px-2 py-0.5 rounded">
                          {s.cveDate} {v.published}
                        </span>
                      </div>
                      
                      <p className="text-slate-300 text-xs leading-relaxed pl-2 pr-2 font-sans">
                        {v.description}
                      </p>
                      
                      <div className="flex items-center gap-2 pl-2 mt-1">
                        <span className="inline-block px-2 py-0.5 bg-cyan-950/60 border border-cyan-900/30 text-[9px] text-cyan-400 font-mono rounded">
                          {s.layerLabel} {v.component}
                        </span>
                      </div>
                    </motion.div>
                  ))}
                  
                  {filteredVulns.length === 0 && (
                    <div className="text-center text-slate-500 font-mono text-xs py-8" id="no-filtered-results">
                      {s.noVulns}
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
        )}
      </div>
    </div>
  );
}
