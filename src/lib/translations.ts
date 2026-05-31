export type Language = 'FR' | 'EN' | 'ES';

export interface TranslationSchema {
  // Navigation / App Chrome
  appTitle: string;
  subTitle: string;
  secureStatus: string;
  tabScanner: string;
  tabAntivirus: string;
  tabFirewall: string;
  tabProxy: string;
  tabAdb: string;

  // Scanner Tab translations
  scannerHeading: string;
  scannerSubheading: string;
  scannerTitle: string;
  scannerDescription: string;
  btnStartAudit: string;
  btnRelaunch: string;
  btnReauditer: string;
  badgeModuleScanner: string;
  noAuditHeading: string;
  noAuditDescription: string;
  scanningText: string;
  scanningNvd: string;
  terminalHeader: string;
  terminalSub: string;
  vulnsDetectedSingular: string;
  vulnsDetectedPlural: string;
  vulnsDetectedDesc: string;
  healthyHeading: string;
  healthyDescription: string;
  searchPlaceholder: string;
  layerTitle: string;
  noResults: string;

  // Welcome Popup translations
  popupTitle: string;
  popupDescription: string;
  optExpertTitle: string;
  optExpertDesc: string;
  optFallbackTitle: string;
  optFallbackDesc: string;
}

export const translations: Record<Language, TranslationSchema> = {
  FR: {
    appTitle: "Sentinel Security AI",
    subTitle: "Cœurs Natifs Actifs",
    secureStatus: "SÉCURISÉ",
    tabScanner: "Audit IA",
    tabAntivirus: "Antivirus",
    tabFirewall: "Firewall",
    tabProxy: "VPN & Tor",
    tabAdb: "Logs ADB",

    scannerHeading: "Audit Système & Vulnérabilités",
    scannerSubheading: "Analyse du noyau, des pilotes et des bibliothèques natives.",
    scannerTitle: "Audit de Sécurité Systémique",
    scannerDescription: "Interrogez directement les vulnérabilités CVE de la banque officielle du National Vulnerability Database (NVD) face au correctif de votre noyau.",
    btnStartAudit: "LANCER L'AUDIT SYSTÈME RÉEL",
    btnRelaunch: "[RELANCER]",
    btnReauditer: "Relancer l'Audit",
    badgeModuleScanner: "Module Principal d'Analyse",
    noAuditHeading: "Aucun audit n'a été effectué",
    noAuditDescription: "Pour récupérer, analyser et croiser les menaces 0-day de votre système face aux publications de l'API NVD, démarrez l'audit système hors ligne.",
    scanningText: "AUDIT SYSTÈME EN COURS...",
    scanningNvd: "Analyse en cours...",
    terminalHeader: "Sentinel Core Diagnostic Terminal",
    terminalSub: "INFO: Bootstrapping diagnostic sandbox",
    vulnsDetectedSingular: "Vulnérabilité Réelle Détectée",
    vulnsDetectedPlural: "Vulnérabilités Réelles Détectées",
    vulnsDetectedDesc: "Ces failles de sécurité majeures n'ont pas encore été colmatées par votre microcode ni par votre niveau de correctif actuel.",
    healthyHeading: "Votre micro-noyau est parfaitement sain",
    healthyDescription: "Aucune faille Android NVD publiée après votre correctif n'affecte vos primitives système.",
    searchPlaceholder: "Filtrer les failles par ID, description ou composant (ex: Hardware, Linux, Qualcomm...)",
    layerTitle: "Couche",
    noResults: "Aucune vulnérabilité ne correspond à vos critères de filtrage.",

    popupTitle: "Configuration de l'Analyse IA",
    popupDescription: "Sentinel Security AI opère 100% hors ligne pour garantir une confidentialité absolue (aucune télémétrie externe). Veuillez configurer votre moteur de détection local avant le scan.",
    optExpertTitle: "Expert Model (Recommandé)",
    optExpertDesc: "Télécharge un LLM local puissant pour l'analyse heuristique avancée des logs et la détection des failles complexes liées à l'architecture matérielle.",
    optFallbackTitle: "Fallback Model",
    optFallbackDesc: "Analyse basique (règles légères type Nano). Analyse superficielle mais aucun téléchargement requis.",
  },
  EN: {
    appTitle: "Sentinel Security AI",
    subTitle: "Active Native Cores",
    secureStatus: "SECURE",
    tabScanner: "AI Audit",
    tabAntivirus: "Antivirus",
    tabFirewall: "Firewall",
    tabProxy: "VPN & Tor",
    tabAdb: "ADB Logs",

    scannerHeading: "System Audit & Vulnerabilities",
    scannerSubheading: "In-depth analysis of kernel, hardware drivers, and native libraries.",
    scannerTitle: "Systemic Security Audit",
    scannerDescription: "Query real-time CVE vulnerabilities from the official National Vulnerability Database (NVD) against your kernel patch level.",
    btnStartAudit: "START REAL SYSTEM AUDIT",
    btnRelaunch: "[RE-RUN]",
    btnReauditer: "Re-run Audit",
    badgeModuleScanner: "Core Analysis Module",
    noAuditHeading: "No audit has been performed yet",
    noAuditDescription: "To fetch, analyze, and cross-reference 0-day threats with NVD API releases on your device, start the offline system audit.",
    scanningText: "SYSTEM AUDIT IN PROGRESS...",
    scanningNvd: "Analyzing...",
    terminalHeader: "Sentinel Core Diagnostic Terminal",
    terminalSub: "INFO: Bootstrapping diagnostic sandbox",
    vulnsDetectedSingular: "Real Vulnerability Detected",
    vulnsDetectedPlural: "Real Vulnerabilities Detected",
    vulnsDetectedDesc: "These major security flaws have not yet been patched by your microcode or current security patch date.",
    healthyHeading: "Your micro-kernel is perfectly healthy",
    healthyDescription: "No Android NVD vulnerability published after your patch level affects your system primitives.",
    searchPlaceholder: "Filter vulnerabilities by ID, description, or component (e.g., Hardware, Linux, Qualcomm...)",
    layerTitle: "Layer",
    noResults: "No vulnerabilities match your filter criteria.",

    popupTitle: "AI Analysis Configuration",
    popupDescription: "Sentinel Security AI runs 100% offline to guarantee absolute privacy (no external telemetry). Please configure your local engine before scanning.",
    optExpertTitle: "Expert Model (Recommended)",
    optExpertDesc: "Deploys a powerful local LLM for advanced heuristic log analysis and hardware vulnerability cross-referencing.",
    optFallbackTitle: "Fallback Model",
    optFallbackDesc: "Basic security analysis (lightweight Nano-like rules). Superficial heuristics but requires zero downloading.",
  },
  ES: {
    appTitle: "Sentinel Security AI",
    subTitle: "Núcleos Nativos Activos",
    secureStatus: "SEGURO",
    tabScanner: "Auditoría IA",
    tabAntivirus: "Antivirus",
    tabFirewall: "Firewall",
    tabProxy: "VPN y Tor",
    tabAdb: "Registros ADB",

    scannerHeading: "Auditoría de Sistema y Vulnerabilidades",
    scannerSubheading: "Análisis en profundidad del kernel, controladores de hardware y librerías nativas.",
    scannerTitle: "Auditoría de Seguridad Sistémica",
    scannerDescription: "Consulte vulnerabilidades CVE reales de la base de datos oficial del National Vulnerability Database (NVD) contra el nivel de parche de su kernel.",
    btnStartAudit: "INICIAR AUDITORÍA REAL DE SISTEMA",
    btnRelaunch: "[REINICIAR]",
    btnReauditer: "Reiniciar Auditoría",
    badgeModuleScanner: "Módulo Principal de Análisis",
    noAuditHeading: "No se ha realizado ninguna auditoría",
    noAuditDescription: "Para recuperar, analizar y correlacionar amenazas 0-day de su sistema según las publicaciones de la API NVD, inicie la auditoría sin conexión.",
    scanningText: "AUDITORÍA DE SISTEMA EN CURSO...",
    scanningNvd: "Analizando...",
    terminalHeader: "Sentinel Core Diagnostic Terminal",
    terminalSub: "INFO: Bootstrapping diagnostic sandbox",
    vulnsDetectedSingular: "Vulnerabilidad Real Detectada",
    vulnsDetectedPlural: "Vulnerabilidades Reales Detectadas",
    vulnsDetectedDesc: "Estas fallas críticas de seguridad aún no han sido corregidas por su microcódigo o nivel actual de parche.",
    healthyHeading: "Su micro-kernel está perfectamente seguro",
    healthyDescription: "Ninguna vulnerabilidad Android NVD publicada después de su parche afecta las primitivas de su sistema.",
    searchPlaceholder: "Filtrar fallas por ID, descripción o componente (ej: Hardware, Linux, Qualcomm...)",
    layerTitle: "Capa",
    noResults: "Ninguna vulnerabilidad coincide con sus criterios de búsqueda.",

    popupTitle: "Configuración de Análisis de IA",
    popupDescription: "Sentinel Security AI opera 100% fuera de línea para garantizar privacidad absoluta (sin telemetría externa). Inicie su motor local antes de escanear.",
    optExpertTitle: "Módulo Experto (Recomendado)",
    optExpertDesc: "Usa un LLM local avanzado para el análisis heurístico de registros y correspondencia de vulnerabilidades a nivel de hardware.",
    optFallbackTitle: "Módulo de Emergencia",
    optFallbackDesc: "Análisis básico (reglas ligeras tipo Nano). Revisión superficial pero libre de descargas de datos secundarias.",
  }
};
