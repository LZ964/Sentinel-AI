export interface UpstreamVulnerability {
  cve_id: string;
  layer: "KERNEL" | "NATIVE_LIBRARY" | "SYSTEM_SCRIPT";
  component_name: string;
  severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  description: string;
  upstream_status: string;
  affected_hardware?: string;
  patched_in_date: string; // Format YYYY-MM-DD pour la soustraction logique
}

export interface VulnerabilityResult {
  cveId: string;
  severity: "CRITICAL" | "HIGH" | "MODERATE" | "LOW" | "INFO"; // Added INFO
  title: string;
  impact: string;
  description: string;
  concept: string;
  mitigation: string;
  updateStatus: string;
}

export type ScanStatus = "idle" | "scanning" | "completed";
export type ScanMode = "full" | "fast" | "apps";

export interface LogEntry {
  id: number;
  time: string;
  message: string;
  type: "info" | "warning" | "error" | "success" | "raw" | "action";
}

export interface NetworkTraffic {
  time: string;
  chrome: number;
  system: number;
  facebook: number;
}

export interface ActiveConnection {
  id: string;
  app: string;
  protocol: string;
  remoteIp: string;
  port: number;
  status: "ESTABLISHED" | "BLOCKED" | "LISTEN";
}

declare global {
  interface Window {
    AndroidBridge?: {
      startNativeScan?: () => void;
      setAppStatus?: (pkg: string, status: string) => void;
      enableFirewall?: (enabled: boolean) => void;
      requestInstalledApps?: () => void;
      requestActiveConnections?: () => void;
      disinfectDevice?: (packageName: string) => void;
      analyzeAdbLogs?: (text: string, id: string) => void;
    };
    onNativeLog?: (msg: string) => void;
    onNativeScanComplete?: (score: number, details: string) => void;
    onNativeError?: (err: string) => void;
    onLocalAIAnalysisComplete?: (id: string, result: string) => void;
    onNetworkLogIntercepted?: (logJson: string) => void;
    onInstalledAppsList?: (appsJson: string) => void;
    onActiveConnectionsUpdate?: (connsJson: string) => void;
    onTrafficStatsUpdate?: (statsJson: string) => void;
    onAdbAnomaliesUpdate?: (json: string) => void;
    ai?: any;
  }
}