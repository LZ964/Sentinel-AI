/**
 * Pont de communication (Bridge) entre l'application React et le code natif Kotlin (Android).
 * Ce fichier remplace les données simulées ("mock") par de véritables appels système.
 */

// Mocking Capacitor plugin for web
export interface AntiMalwareScannerPlugin {
  startNativeScan(): Promise<void>;
  addListener(eventName: 'onNativeLog', listenerFunc: (info: { message: string }) => void): any;
  addListener(eventName: 'onNativeScanComplete', listenerFunc: (info: { score: number, details: string }) => void): any;
  addListener(eventName: 'onNativeError', listenerFunc: (info: { error: string }) => void): any;
}

const AntiMalwareScanner: AntiMalwareScannerPlugin = {
  startNativeScan: async () => {},
  addListener: () => {},
} as any;

class SentinelNativeBridge {
  private isNativeEnvironment(): boolean {
    // For legacy compat, we check for Capacitor as well.
    return (typeof window !== 'undefined' && !!window.AndroidBridge) || !!(window as any).Capacitor?.isNativePlatform();
  }

  /**
   * Modifie le statut du pare-feu pour une application via le VpnService Kotlin
   */
  public setFirewallAppStatus(packageName: string, status: 'allowed' | 'blocked'): void {
    if (typeof window !== 'undefined' && window.AndroidBridge && window.AndroidBridge.setAppStatus) {
      window.AndroidBridge.setAppStatus(packageName, status);
    } else {
      console.warn(`[Bridge] Production: La modification des règles du pare-feu nécessite l'API native.`);
    }
  }

  public enableFirewall(enabled: boolean): void {
    if (typeof window !== 'undefined' && window.AndroidBridge && window.AndroidBridge.enableFirewall) {
      window.AndroidBridge.enableFirewall(enabled);
    } else {
      console.warn(`[Bridge] Production: La fonctionnalité Pare-feu nécessite l'API VpnService native. Impossible de l'activer.`);
    }
  }

  public requestActiveConnections(): void {
    if (typeof window !== 'undefined' && window.AndroidBridge && window.AndroidBridge.requestActiveConnections) {
      window.AndroidBridge.requestActiveConnections();
    } else {
      console.warn(`[Bridge] Production: La récupération des connexions nécessite l'API native.`);
    }
  }

  public requestInstalledApps(): void {
    if (typeof window !== 'undefined' && window.AndroidBridge && window.AndroidBridge.requestInstalledApps) {
      window.AndroidBridge.requestInstalledApps();
    } else {
      console.warn(`[Bridge] Production: La liste des applications nécessite l'API PackageManager native.`);
    }
  }

  /**
   * Lance un véritable scan antiviral via l'OS Android
   */
  public async startMalwareScan(
    onLog: (msg: string) => void,
    onComplete: (score: number, details: string) => void,
    onError: (err: string) => void
  ) {
    if (!this.isNativeEnvironment()) {
      console.warn("[Bridge] Environnement natif non détecté. Assurez-vous de lancer l'APK compilé.");
      onError("Environnement natif Android non détecté.");
      return;
    }

    try {
        await AntiMalwareScanner.addListener('onNativeLog', (info) => onLog(info.message));
        await AntiMalwareScanner.addListener('onNativeScanComplete', (info) => onComplete(info.score, info.details));
        await AntiMalwareScanner.addListener('onNativeError', (info) => onError(info.error));
        await AntiMalwareScanner.startNativeScan();
    } catch(e: any) {
        // Fallback to legacy window.AndroidBridge if the plugin is not properly registered
        if (typeof window !== 'undefined' && window.AndroidBridge && window.AndroidBridge.startNativeScan) {
           window.onNativeLog = onLog;
           window.onNativeScanComplete = onComplete;
           window.onNativeError = onError;
           window.AndroidBridge.startNativeScan();
        } else {
           onError("Erreur d'initialisation du scanner natif: " + e.message);
        }
    }
  }

  /**
   * Lance la procédure de désinstallation native d'un malware
   */
  public disinfectDevice(packageName: string): void {
    if (typeof window !== 'undefined' && window.AndroidBridge && window.AndroidBridge.disinfectDevice) {
      window.AndroidBridge.disinfectDevice(packageName);
    } else {
      console.error(`[Bridge] Production: La désinstallation nécessite des privilèges root ou l'API DeviceAdministrator native.`);
    }
  }
}

export const NativeBridge = new SentinelNativeBridge();
