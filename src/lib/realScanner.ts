import { Device } from '@capacitor/device';
import { Network } from '@capacitor/network';
import { App } from '@capacitor/app';
import { Capacitor } from '@capacitor/core';
import { UpstreamVulnerability } from '../types';

export class RealScanner {
  static cachedDatabase: UpstreamVulnerability[] = [];

  static async delay(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
  
  static async fetchWithRetry(url: string, retries = 3, backoff = 2000): Promise<any> {
    for (let i = 0; i < retries; i++) {
       try {
           const resp = await fetch(url);
           if (resp.ok) {
               return await resp.json();
           }
           if (resp.status === 403 || resp.status === 429) {
               console.warn(`Rate limit NVD, retry ${i+1}/${retries}...`);
               await this.delay(backoff * (i + 1));
           } else {
               throw new Error(`Erreur HTTP ${resp.status}`);
           }
       } catch (error) {
           if (i === retries - 1) throw error;
           await this.delay(backoff);
       }
    }
    throw new Error("Impossible de récupérer les données (Rate Limit NVD ou erreur réseau atteints).");
  }

  static async syncCveDatabase() {
    const status = await Network.getStatus();
    if (!status.connected) {
       throw new Error("L'appareil doit être en ligne pour télécharger les vulnérabilités de production.");
    }
    
    const info = await Device.getInfo();
    if (info.operatingSystem !== 'android') {
        throw new Error("L'appareil n'est pas sous Android.");
    }
    if (!info.osVersion) {
        throw new Error("Version de l'OS introuvable.");
    }
       
    // Analyse dynamique et précise de la version OS (supporte 13, 8.1, etc.)
    const getOsVersion = (v: string) => {
        const m = v.match(/^(\d+(?:\.\d+)?)/); 
        if (!m) return "1.0"; // Fallback par défaut
        const parsed = m[1];
        return parsed.includes('.') ? parsed : `${parsed}.0`;
    };
    
    const osVer = getOsVersion(info.osVersion);
    const androidCpe = `cpe:2.3:o:google:android:${osVer}:*:*:*:*:*:*:*`;
       
    const deviceStr = (((info as any).hardware || "") + " " + (info.model || "") + " " + (info.manufacturer || "")).toLowerCase();

    let nvdVulns: UpstreamVulnerability[] = [];
    
    // Utilisation de virtualMatchString pour autoriser la correspondance partielle sur le NVD
    const url = `https://services.nvd.nist.gov/rest/json/cves/2.0?virtualMatchString=${androidCpe}`;
    
    const nvdData = await this.fetchWithRetry(url);
    const vulnerabilities = nvdData.vulnerabilities || [];
    
    nvdVulns = vulnerabilities.reduce((acc: UpstreamVulnerability[], item: any) => {
        const cve = item.cve;
        if (!cve.published) return acc; 
        
        const descObj = cve.descriptions?.find((d:any) => d.lang === "en") || cve.descriptions?.[0];
        const description = descObj ? descObj.value : "Aucune description disponible.";
        
        const metrics = cve.metrics?.cvssMetricV40?.[0] || cve.metrics?.cvssMetricV31?.[0] || cve.metrics?.cvssMetricV30?.[0];
        const cvssScore = metrics?.cvssData?.baseScore || 0;
        const baseSeverity = metrics?.cvssData?.baseSeverity || "MEDIUM";
        
        acc.push({
            cve_id: cve.id,
            layer: "NATIVE_LIBRARY",
            component_name: "Android System / OS",
            severity: baseSeverity.toUpperCase() as "LOW" | "MEDIUM" | "HIGH" | "CRITICAL",
            description: `[CVSS: ${cvssScore}] ` + description.substring(0, 250) + (description.length > 250 ? "..." : ""),
            upstream_status: "Active",
            affected_hardware: deviceStr, 
            patched_in_date: cve.published.split('T')[0]
        });
        return acc;
    }, []);
       
    this.cachedDatabase = nvdVulns;
  }

  static async gatherData(onLog: (msg: string, type?: string) => void) {
    const findings: any = {};
    const formatInfo = (obj: any): string => {
       try {
          return JSON.stringify(obj, null, 2).replace(/["{},\[\]]/g, '').replace(/^\s*[\r\n]/gm, '').trim();
       } catch (e) {
          return String(obj);
       }
    };
  
    onLog("=== DÉBUT DIAGNOSTIC RÉEL ===");

    onLog("> ncp-network-status", "action");
    const network = await Network.getStatus();
    findings.network = network;

    onLog("> sys-device-info", "action");
    const info = await Device.getInfo();
    findings.device = info;

    onLog("> sys-battery-info", "action");
    const battery = await Device.getBatteryInfo();
    findings.battery = battery;

    if (Capacitor.isNativePlatform()) {
      try {
        onLog("> get-app-metadata", "action");
        const appInfo = await App.getInfo();
        findings.appInfo = appInfo;
      } catch (e) {
        onLog("Échec app info: " + (e as Error).message, "error");
      }
    }

    let securityPatch = ""; 
    if (Capacitor.isNativePlatform()) {
       try {
         const { AppScanner } = await import("./appScanner");
         const secInfo = await AppScanner.getDeviceSecurityInfo();
         if (secInfo && secInfo.securityPatch) {
            securityPatch = secInfo.securityPatch;
         }
       } catch(e) {
           onLog(`Impossible de lire la date du patch via AppScanner: ${String(e)}`, "error");
       }
    }
    
    if (securityPatch) {
        onLog(`Patch détecté : ${securityPatch}`);
    } else {
        onLog(`ATTENTION : Impossible de détecter le niveau de patch de sécurité.`, "error");
    }
    findings.securityPatch = securityPatch;

    onLog("Vérification dynamique des CVEs (Synchronisation NVD)...");
    
    try {
        await this.syncCveDatabase(); 
    } catch (e) {
        onLog(`[!] ERREUR API : ${(e as Error).message}`, "error");
        onLog("L'audit utilise les données en cache (si existantes).", "error");
    }

    let matchedCves: (UpstreamVulnerability & { is_mitigated?: boolean })[] = [];
    let activeVulnerabilitiesCount = 0;
    
    for (const cve of this.cachedDatabase) {
       let isMitigated = false;
       if (securityPatch) {
           const patchDate = new Date(securityPatch).getTime();
           const cveDate = new Date(cve.patched_in_date).getTime();
           
           if (!isNaN(patchDate) && !isNaN(cveDate) && cveDate <= patchDate) {
               isMitigated = true; 
           }
       }
       
       matchedCves.push({ ...cve, is_mitigated: isMitigated });
       if (!isMitigated) activeVulnerabilitiesCount++;
    }
    
    if (activeVulnerabilitiesCount === 0) {
      onLog(`[+] Votre appareil semble à jour. Les vulnérabilités connues sont couvertes par votre patch de sécurité.`);
    } else {
      onLog(`[!] Attention: ${activeVulnerabilitiesCount} vulnérabilité(s) potentiellement actives trouvées.`);
    }

    findings.systemCVEs = matchedCves;
    
    onLog("> analyze-security-context", "action");
    findings.securityContext = {
      isSecureContext: window.isSecureContext,
      cookiesEnabled: navigator.cookieEnabled
    };

    onLog("=== FIN DU RAPPATRIEMENT DE DONNÉES ===");

    return findings;
  }
}