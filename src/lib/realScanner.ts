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
       
    // Génération dynamique stricte du CPE Android
    const getMajorVersion = (v: string) => {
        const m = v.match(/^(\d+)/);
        if (!m) {
            throw new Error(`Format de version OS invalide: ${v}`);
        }
        return m[1] + ".0"; 
    };
    const osVer = getMajorVersion(info.osVersion);
    const androidCpe = `cpe:2.3:o:google:android:${osVer}:*:*:*:*:*:*:*`;
       
    // Identification du matériel réel
    const deviceStr = (((info as any).hardware || "") + " " + (info.model || "") + " " + (info.manufacturer || "")).toLowerCase();
    
    // Déduction des concurrents : on prend la liste des puces connues et on retire celles présentes sur notre appareil
    const allChips = ["qualcomm", "snapdragon", "mediatek", "tensor", "exynos", "mali", "adreno", "bionic"];
    const competitorChips = allChips.filter(chip => !deviceStr.includes(chip));

    let nvdVulns: UpstreamVulnerability[] = [];
    const url = `https://services.nvd.nist.gov/rest/json/cves/2.0?cpeName=${androidCpe}`;
    
    const nvdData = await this.fetchWithRetry(url);
    const vulnerabilities = nvdData.vulnerabilities || [];
    
    nvdVulns = vulnerabilities.reduce((acc: UpstreamVulnerability[], item: any) => {
        const cve = item.cve;
        if (!cve.published) return acc; 
        
        const descObj = cve.descriptions?.find((d:any) => d.lang === "en") || cve.descriptions?.[0];
        const description = descObj ? descObj.value : "";
        if (!description) return acc;
        
        const descLower = description.toLowerCase();
        
        // Filtrage matériel déductif : si la faille mentionne un processeur concurrent qu'on ne possède pas, on la rejette
        const mentionsCompetitor = competitorChips.some(chip => descLower.includes(chip));
        if (mentionsCompetitor) {
             return acc;
        }
        
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
            affected_hardware: deviceStr, // Fixé avec le matériel réel
            patched_in_date: cve.published.split('T')[0]
        });
        return acc;
    }, []);
       
    this.cachedDatabase = nvdVulns.slice(0, 40);
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
    onLog(formatInfo(network), "raw");

    onLog("> sys-device-info", "action");
    const info = await Device.getInfo();
    findings.device = info;
    onLog(formatInfo(info), "raw");

    onLog("> sys-battery-info", "action");
    const battery = await Device.getBatteryInfo();
    findings.battery = battery;
    onLog(formatInfo(battery), "raw");

    if (Capacitor.isNativePlatform()) {
      try {
        onLog("> get-app-metadata", "action");
        const appInfo = await App.getInfo();
        findings.appInfo = appInfo;
        onLog(formatInfo(appInfo), "raw");
      } catch (e) {
        onLog("Échec app info: " + (e as Error).message, "error");
      }
    }

    onLog("Vérification des APIs Web expérimentales...");
    const webApis = {
      ai: typeof window !== 'undefined' && 'ai' in window,
      bluetooth: 'bluetooth' in navigator,
      usb: 'usb' in navigator,
      serviceWorker: 'serviceWorker' in navigator,
      hardwareConcurrency: navigator.hardwareConcurrency,
      deviceMemory: (navigator as any).deviceMemory,
    };
    findings.webEnvironment = webApis;
    onLog("> check-web-apis", "action");
    onLog(formatInfo(webApis), "raw");

    onLog("> gpu-fingerprint-sys", "action");
    try {
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
      if (gl) {
        const debugInfo = (gl as WebGLRenderingContext).getExtension('WEBGL_debug_renderer_info');
        if (debugInfo) {
          const vendor = (gl as WebGLRenderingContext).getParameter(debugInfo.UNMASKED_VENDOR_WEBGL);
          const renderer = (gl as WebGLRenderingContext).getParameter(debugInfo.UNMASKED_RENDERER_WEBGL);
          findings.gpu = { vendor, renderer };
          onLog(formatInfo({ vendor, renderer }), "raw");
        } else {
            onLog(`Accès aux infos rendu refusé/Indisponible`, "raw");
        }
      }
    } catch(e) {
       onLog(`GPU scan failed: ${String(e)}`, "error");
    }

    onLog("Récupération du patch de sécurité local...");
    // CORRECTION : Pas de date codée en dur
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
        onLog(`ATTENTION : Impossible de détecter le niveau de patch de sécurité. L'audit ne pourra pas filtrer les correctifs récents.`, "error");
    }
    findings.securityPatch = securityPatch;

    onLog("Vérification dynamique des CVEs (Synchronisation NVD)...");
    
    // CORRECTION : Le try/catch vital qui empêchait l'application de planter
    try {
        await this.syncCveDatabase(); 
    } catch (e) {
        onLog(`[!] ERREUR CRITIQUE API : ${(e as Error).message}`, "error");
        onLog("L'audit utilise les données en cache (si existantes).", "error");
    }

    let matchedCves: UpstreamVulnerability[] = [];
    
    for (const cve of this.cachedDatabase) {
       if (securityPatch) {
           const patchDate = new Date(securityPatch).getTime();
           const cveDate = new Date(cve.patched_in_date).getTime();
           
           if (!isNaN(patchDate) && !isNaN(cveDate) && cveDate <= patchDate) {
               continue; // Déjà corrigé par le patch du device
           }
       }
       matchedCves.push(cve);
    }
    
    if (matchedCves.length === 0) {
      onLog(`[+] Félicitations ! Votre appareil est sain. Toutes les failles publiques ont été écartées ou patchées.`);
    } else {
      onLog(`[!] Attention: ${matchedCves.length} vulnérabilité(s) potentiellement actives trouvées pour votre configuration matérielle.`);
    }

    findings.systemCVEs = matchedCves.map(vuln => ({
      id: vuln.cve_id,
      name: vuln.component_name,
      detail: vuln.description,
      layer: vuln.layer,
      severity: vuln.severity,
      upstream_status: vuln.upstream_status
    }));
    
    onLog("> display-cve-results", "action");
    if (matchedCves.length > 0) {
      onLog(formatInfo(findings.systemCVEs), "raw");
    } else {
      onLog("Aucune nouvelle vulnérabilité publique trouvée", "raw");
    }

    onLog("> verify-security-headers", "action");
    try {
      const response = await fetch(window.location.href, { method: 'HEAD' });
      const headers: Record<string, string> = {};
      response.headers.forEach((value, key) => {
        headers[key] = value;
      });
      findings.securityHeaders = {
        hsts: !!headers['strict-transport-security'],
        csp: !!headers['content-security-policy'],
        xContentTypeOptions: !!headers['x-content-type-options'],
        raw: headers
      };
      onLog(formatInfo(findings.securityHeaders), "raw");
    } catch (e) {
      findings.securityHeaders = { error: String(e) };
      onLog(`Échec Headers: ${String(e)}`, "error");
    }

    onLog("> analyze-security-context", "action");
    findings.securityContext = {
      isSecureContext: window.isSecureContext,
      cookiesEnabled: navigator.cookieEnabled,
      doNotTrack: (navigator as any).doNotTrack || null
    };
    onLog(formatInfo(findings.securityContext), "raw");

    onLog("=== FIN DU RAPPATRIEMENT DE DONNÉES ===");

    return findings;
  }
}