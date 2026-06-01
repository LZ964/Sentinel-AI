/**
 * Pont de communication (Bridge) entre l'application React et le code natif Kotlin (Android).
 * Ce fichier remplace les données simulées ("mock") par de véritables appels système.
 */


class SentinelNativeBridge {
  private isNativeEnvironment(): boolean {
    // For legacy compat, we check for Capacitor as well.
    return (typeof window !== 'undefined' && !!window.AndroidBridge) || !!(window as any).Capacitor?.isNativePlatform();
  }

  /**
   * Modifies the firewall status for an application via the Kotlin VpnService
   */
  public setFirewallAppStatus(packageName: string, status: 'allowed' | 'blocked'): void {
    if (typeof window !== 'undefined' && window.AndroidBridge && window.AndroidBridge.setAppStatus) {
      window.AndroidBridge.setAppStatus(packageName, status);
    } else {
      console.warn(`[Bridge] Production: Modifying firewall rules requires the native API.`);
    }
  }

  public enableFirewall(enabled: boolean): void {
    if (typeof window !== 'undefined' && window.AndroidBridge && window.AndroidBridge.enableFirewall) {
      window.AndroidBridge.enableFirewall(enabled);
    } else {
      console.warn(`[Bridge] Production: The Firewall functionality requires the native VpnService API. Unable to activate it.`);
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
