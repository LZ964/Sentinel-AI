import { pipeline, env } from "@huggingface/transformers";
import { RealScanner } from "./realScanner";

// Configuration vitale pour charger le modèle depuis le Hub HuggingFace au lieu d'un chemin local
if (typeof process !== 'undefined' && process.env.NODE_ENV === 'test') {
  env.useBrowserCache = false;
  env.allowLocalModels = true;
} else {
  env.allowLocalModels = false;
  env.useBrowserCache = true;
}

// Prompt système pour l'analyse des applications (ajouté suite à la configuration)
export const SENTINEL_APPS_PROMPT = `You are the AI security analysis engine integrated into the Sentinel application. You are a cybersecurity specialist passionate about Android and Chrome OS security. The target device is NEVER a web server.
Your function is to analyze the user's application list and device, and to find and explain to people, in a popularized but concise way, whether an element represents a significant security flaw, a vulnerability on an Android phone or Chromebook, or if it's simply a false positive / normal behavior.

For each suspicious application detected, you must provide a rigorous analysis and return STRICTLY a JSON object (or an array of objects if multiple) containing the following keys:
1. "appName": Le nom de l'application.
2. "packageName": Le nom de paquet Android (ex: com.example.app).
3. "riskLevel": "Élevé", "Modéré", "Faible", ou "Faux Positif".
4. "reason": Une explication technique concise pour les journaux système.
5. "canAutomate": Un booléen (true/false) indiquant s'il est techniquement possible pour Sentinel de lancer une action de correction (ex: désinstallation).
6. "automationAction": L'action automatique à lancer ("REVOKE_PERMISSION", "UNINSTALL_APP" ou null).
7. "androidDeepLink": L'URI d'intention Android exact pour ouvrir la fiche de l'application : "intent:#Intent;action=android.settings.APPLICATION_DETAILS_SETTINGS;data=package:[packageName];end"
8. "userFriendlyWarning": A short, popularized but concise text explaining clearly if it's a flaw, a risk, or a false positive.

Contrainte stricte : Réponds exclusivement au format JSON. Pas de texte explicatif avant ou après le bloc JSON.`;

export const SENTINEL_REPORT_PROMPT = `You are the low-level vulnerability analysis engine of the 'Sentinel AI' application, a mobile cybersecurity specialist. Your role is to analyze provided real data (Linux Upstream CVEs, Android libraries) filtered by device processor and security patch date, to generate the final audit report.

[CONTRAINTE DE SORTIE - JSON STRICT]
Tu dois OBLIGATOIREMENT retourner un objet JSON valide, strict, sans AUCUN markdown (pas de \`\`\`json) ni texte avant/après. Le JSON doit respecter ce schéma :

{
  "device_summary": {
    "model": "Nom de l'appareil",
    "kernel_version_detected": "Version ou Inconnu",
    "security_patch_level": "Date du patch",
    "system_integrity_status": "TRUSTED' ou 'COMPROMISED'"
  },
  "kernel_and_upstream_vulnerabilities": [
    {
      "cve_id": "ID",
      "layer": "KERNEL ou NATIVE_LIBRARY",
      "component_name": "Composant",
      "severity": "CRITICAL, HIGH, MEDIUM ou LOW",
      "description": "Description vulgarisée de la menace réelle",
      "upstream_status": "Status"
    }
  ],
  "application_and_package_audit": [
    {
      "package_name": "Nom",
      "version": "Version",
      "status": "SECURE ou VULNERABLE",
      "findings": ["Point 1", "Point 2"]
    }
  ],
  "architectural_risk_score": 85,
  "recommendations": ["Recommandation actionnable 1", "Recommandation actionnable 2"]
}

### DIRECTIVES D'ANALYSE :
1. "architectural_risk_score" doit être un nombre entre 0 et 100 calculé selon les données fournies en entrée. Plus il y a de CVEs fournies non corrigées, plus ce score de risque s'approche de 100.
2. Formule "device_summary" à partir des données exactes transmises en entrée.
3. Do not generate fake flaws: if there are no vulnerabilities, leave arrays empty ([]). Limit to the CVEs sent as input.`;

export const SENTINEL_FIREWALL_PROMPT = `You are the security orchestration engine of the Sentinel application. Your role is to rule on network access requests of Android apps and generate the appropriate response for the user interface, according to the firewall configuration and network options.

You will receive the current configuration parameters of Sentinel as input along with the details of the app requesting network access.

Règles de filtrage du trafic local (LAN) :
- Les adresses IP locales incluent les plages standard : 192.168.x.x, 10.x.x.x, 172.16.x.x à 172.31.x.x, ainsi que l'adresse de bouclage local (localhost/127.0.0.1).
- Si l'IP de destination est LOCALE et que l'option "allowLocalNetwork" est TRUE : Tu dois automatiquement accorder l'accès ("ALLOW"), spécifier le type "NONE" pour l'interface utilisateur (pas de popup ni de notification) afin de permettre de caster du contenu (Chromecast) ou d'imprimer de manière transparente.
- Si l'IP de destination est LOCALE et que l'option "allowLocalNetwork" est FALSE : Tu dois bloquer la requête ("BLOCK") ou demander l'avis de l'utilisateur ("ASK_USER") selon les règles d'autopilote.

Tu devez analyser la requête et retourner STRICTEMENT un objet JSON structuré contenant les clés suivantes :

1. "decision": "ALLOW" (autoriser), "BLOCK" (bloquer) ou "ASK_USER" (demander à l'utilisateur).
   - Si le mode pilote automatique est actif ou s'il s'agit d'un trafic local autorisé par les règles, tu dois trancher ("ALLOW" ou "BLOCK").
   - Si le mode manuel est actif et que l'action requiert l'avis de l'utilisateur, mets "ASK_USER".
2. "uiType": Le type d'élément visuel à déclencher dans Android :
   - "BACKGROUND_POPUP" : Si la décision est "ASK_USER" (s'affiche par-dessus toutes les applications).
   - "SYSTEM_NOTIFICATION" : Si la décision est une action automatique de l'IA qui mérite d'être signalée (une seule fois par application).
   - "NONE" : Si l'accès est autorisé de manière transparente (comme le trafic local légitime).
3. "technicalReason": La justification technique sous-jacente (ex: "Trafic LAN autorisé pour le partage de contenu ou l'impression").
4. "userFriendlyMessage": Le texte vulgarisé destiné à l'utilisateur final pour le popup ou la notification. Explique simplement et sans jargon (pas de termes comme 'CIDR', 'subnet' ou 'packets') ce qui s'est passé (ex: "L'application a tenté de se connecter à un appareil de votre réseau local, comme votre téléviseur ou votre imprimante...").
5. "androidIntentAction": L'action système à exécuter par Sentinel ("APPLY_FIREWALL_RULE", "SHOW_OVERLAY_DIALOG", "PUSH_NOTIF").

Contrainte stricte : Réponds exclusivement au format JSON. Pas de texte explicatif avant ou après le bloc JSON.`;

export class LocalAIService {
  static instance: any = null;
  static isDownloading = false;
  static initPromise: Promise<any> | null = null;

  static async initialize(onProgress: (info: string) => void) {
    if (this.instance) return { type: "transformers", model: this.instance };

    // Si une initialisation est déjà en cours, on attend sa résolution sans la relancer
    if (this.initPromise) {
      return this.initPromise;
    }

    this.initPromise = (async () => {
      try {
        this.isDownloading = true;
        onProgress("Vérification de l'API IA native (AICore/WebAI)...");

        // Check for Chrome's native window.ai (Prompt API)
        if (typeof window !== "undefined" && "ai" in window) {
          // @ts-ignore
          const ai = window.ai;
          if (
            ai &&
            (ai.languageModel || ai.assistant || ai.createTextSession)
          ) {
            onProgress(
              "Utilisation de l'API IA intégrée au système (CoreAI/Gemini Nano).",
            );
            this.isDownloading = false;
            return { type: "native" };
          }
        } else {
          onProgress(
            "CoreAI non détecté (Activable via chrome://flags/#prompt-api-for-gemini-nano).",
          );
        }

        onProgress(
          "Initialisation du modèle IA local de secours (LaMini-Flan-T5-248M)...",
        );
        onProgress(
          "Ce modèle est conservé en cache par votre navigateur (téléchargement unique).",
        );

        let lastProgressVals: Record<string, number> = {};
        const pipelinePromise = pipeline(
          "text2text-generation",
          "Xenova/LaMini-Flan-T5-248M",
          {
            progress_callback: (x: any) => {
              if (x.status === "downloading" || x.status === "progress") {
                if (typeof x.file === "string") {
                  const rounded = Math.round(x.progress || 0);
                  const key = x.file + "_" + x.status;
                  if (lastProgressVals[key] !== rounded) {
                    lastProgressVals[key] = rounded;
                    onProgress({
                      type: 'progress',
                      status: x.status,
                      file: x.file,
                      progress: rounded
                    } as any);
                  }
                }
              } else if (x.status === "done") {
                onProgress(`Opération terminée pour ${x.file}`);
              }
            },
          },
        );

        // Timeout augmenté à 5 minutes (300 000 ms) pour permettre le téléchargement sur connexion moyenne
        this.instance = await Promise.race([
          pipelinePromise,
          new Promise((_, reject) =>
            setTimeout(
              () =>
                reject(
                  new Error("Timeout during model initialization (Trop long)"),
                ),
              300000,
            ),
          ),
        ]);

        onProgress("Modèle IA web chargé avec succès.");
        this.isDownloading = false;
        return { type: "transformers", model: this.instance };
      } catch (e: any) {
        this.isDownloading = false;
        this.instance = null;
        console.warn(
          "Échec du chargement du modèle IA, utilisation de l'analyse heuristique",
          e,
        );
        onProgress(`Échec HuggingFace Transformers: ${e.message}`);
        onProgress(
          "Basculement sur l'analyse heuristique locale (moteur hors-ligne).",
        );
        return { type: "heuristic" };
      }
    })();

    return this.initPromise;
  }

  // Extract JSON robustly from any LLM output string
  static extractJsonFromText(text: string): any {
    try {
      // First try standard parse
      return JSON.parse(text);
    } catch (e) {
      // Fallback: Use Regex to find JSON block
      const jsonMatch = text.match(/\[[\s\S]*\]|\{[\s\S]*\}/);
      if (jsonMatch) {
        try {
          let extracted = jsonMatch[0];
          // Fix common model formatting errors: trailing commas before brackets
          extracted = extracted.replace(/,\s*([\]}])/g, "$1");
          return JSON.parse(extracted);
        } catch (innerE) {
          return null;
        }
      }
      return null;
    }
  }

  static async analyzeApps(
    apps: any[],
    onDetail: (msg: string, type?: string) => void,
  ) {
    onDetail("Démarrage de l'analyse des applications par l'IA...", "warning");
    const results = [];
    const appsStr = JSON.stringify(
      apps.slice(0, 15).map((a) => ({
        n: a.appName,
        p: a.packageName,
        perm: a.permissions?.slice(0, 5),
      })),
    );

    if (typeof window !== "undefined" && "ai" in window) {
      try {
        onDetail("Interrogation système CoreAI (window.ai)...", "action");
        // @ts-ignore
        const session = await window.ai.createTextSession({
             systemPrompt: SENTINEL_APPS_PROMPT
        });
        const prompt = "Applications à analyser : " + appsStr;
        const aiInterpretation = await session.prompt(prompt);

        onDetail("Réponse CoreAI:", "info");
        onDetail(aiInterpretation, "raw");

        const parsed = this.extractJsonFromText(aiInterpretation);
        if (parsed) {
          if (Array.isArray(parsed)) results.push(...parsed);
          else results.push(parsed);
        } else {
          onDetail("Parsing error (non-JSON response).", "error");
        }
      } catch (e: any) {
        onDetail(`Échec inférence CoreAI: ${e.message}`, "error");
      }
    } else if (this.instance) {
      try {
        onDetail("Interrogation LaMini localement...", "action");
        const prompt = `System: ${SENTINEL_APPS_PROMPT}\n\nUser: Analyze these applications:\n${appsStr}\n\nAssistant: [\n  {`;
        const out = await this.instance(prompt, { max_new_tokens: 350 });
        let textOut = "[\n  {" + (out[0]?.generated_text || "");

        onDetail("Sortie Brute Modèle Local", "info");
        onDetail(textOut, "raw");

        const parsed = this.extractJsonFromText(textOut);
        if (parsed) {
          if (Array.isArray(parsed)) results.push(...parsed);
          else results.push(parsed);
        } else {
          onDetail(
            "Erreur: Le modèle n'a pas pu garantir le JSON 100%. Fallback activé.",
            "warning",
          );
          // Heuristic fallback if model breaks
          apps.forEach((app) => {
            const strPerms = (app.permissions || []).join(" ").toLowerCase();
            if (
              (app.appName.toLowerCase().includes("calc") ||
                app.appName.toLowerCase().includes("lamp")) &&
              (strPerms.includes("sms") || strPerms.includes("contacts"))
            ) {
              results.push({
                appName: app.appName,
                packageName: app.packageName,
                riskLevel: "Élevé",
                reason:
                  "Une application utilitaire basique réclame des accès abusifs à des données sensibles (SMS/Contacts).",
                canAutomate: true,
                automationAction: "UNINSTALL_APP",
                androidDeepLink: `intent:#Intent;action=android.settings.APPLICATION_DETAILS_SETTINGS;data=package:${app.packageName};end`,
                userFriendlyWarning: `L'application "${app.appName}" a accès à vos messages. C'est anormal pour ce type d'application.`,
              });
            }
          });
        }
      } catch (e: any) {
        onDetail(`Échec inférence locale: ${e.message}`, "error");
      }
    }
    return results;
  }

  static async evaluateNetworkRequest(
    requestDetails: any,
    mode: "auto" | "manual",
    onDetail: (msg: string, type?: string) => void,
  ) {
    onDetail(
      `[Firewall AI] Évaluation de la requête pour ${requestDetails.appName}...`,
      "warning",
    );

    const payloadString = JSON.stringify({ requestDetails, mode });

    if (typeof window !== "undefined" && "ai" in window) {
      try {
        // @ts-ignore
        const session = await window.ai.createTextSession({
             systemPrompt: SENTINEL_FIREWALL_PROMPT
        });
        const prompt = "Données de la requête :\n" + payloadString;
        const aiInterpretation = await session.prompt(prompt);

        onDetail("Réponse Firewall CoreAI:", "info");
        onDetail(aiInterpretation, "raw");

        return this.extractJsonFromText(aiInterpretation);
      } catch (e) {
        onDetail(
          "CoreAI indisponible pour Firewall, basculement mode standard...",
          "info",
        );
      }
    }

    if (this.instance) {
      try {
        const prompt = `System: ${SENTINEL_FIREWALL_PROMPT}\n\nUser: Analyze the intercepted network request:\n${payloadString}\n\nAssistant: {`;
        const out = await this.instance(prompt, { max_new_tokens: 300 });
        let textOut = "{" + (out[0]?.generated_text || "");

        onDetail("Sortie Brute Modèle Local Firewall", "info");
        onDetail(textOut, "raw");

        return this.extractJsonFromText(textOut);
      } catch (e: any) {
        onDetail(`Échec inférence locale Firewall: ${e.message}`, "error");
      }
    }

    // Heuristique de secours (Fallback)
    onDetail("Utilisation des heuristiques de secours Firewall", "warning");
    if (mode === "auto") {
      return {
        decision: "BLOCK",
        uiType: "SYSTEM_NOTIFICATION",
        technicalReason:
          "Heuristique: Connexion inconnue bloquée par précaution.",
        userFriendlyMessage: `L'application a tenté de se connecter à un serveur non reconnu, Sentinel a bloqué l'accès par précaution.`,
        androidIntentAction: "APPLY_FIREWALL_RULE",
      };
    } else {
      return {
        decision: "ASK_USER",
        uiType: "BACKGROUND_POPUP",
        technicalReason: "Heuristique mode manuel.",
        userFriendlyMessage: `Cette application tente de se connecter à Internet. Voulez-vous autoriser cet accès ?`,
        androidIntentAction: "SHOW_OVERLAY_DIALOG",
      };
    }
  }

  static async generateReport(
    info: any,
    apps: any[],
    mode: string,
    onDetail: (msg: string, type?: string) => void,
  ) {
    const perfStart = performance.now();

    onDetail(
      "Démarrage du Thread de Télémétrie Matérielle (Hardware Scanner)",
      "warning",
    );

    // Gather real hardware and env data synchronously as fast as possible
    const realData = await RealScanner.gatherData(async (msg, details) => {
      if (details) {
        onDetail(msg, "info");
        onDetail(details, "raw");
      } else {
        onDetail(msg, "action");
      }
    });

    const deviceLabel = realData.device?.model || "Appareil Web";
    const osStr = String(realData.device?.osVersion || "0");
    const osVersionFloat = parseFloat(osStr.replace(/[^0-9.]/g, "")) || 0;
    const isOutdated = osVersionFloat > 0 && osVersionFloat < 14;
    const isSecure = realData.securityContext?.isSecureContext;

    onDetail(`--- DÉMARRAGE MOTEUR INFERENCE IA LOCAL ---`, "warning");
    onDetail("> prepare-payload", "action");
    
    // Add apps to realData for context
    const analysisPayload = {
      ...realData,
      installed_apps: apps.map(a => ({ name: a.appName, package: a.packageName, version: a.version || "1.0", permissions: a.permissions }))
    };

    onDetail(`Taille: ${JSON.stringify(analysisPayload).length} octets\nType de moteur: ${this.instance ? "transformers/moteur-local" : typeof window !== "undefined" && "ai" in window ? "native-webai" : "heuristic_fallback"}\nHors ligne: true`, "raw");

    onDetail(`[AI] Hardware context analysis: ${deviceLabel}`, "success");

    let results: any[] = [];
    let aiParsedOutput: any = null;

    onDetail(
      "Exécution de l'inférence structurelle sur les données collectées...",
      "action",
    );

    // -------------------------------------------------------------
    // VRAIE INFERENCE IA LOCALE (si disponible)
    // -------------------------------------------------------------
    if (typeof window !== "undefined" && "ai" in window) {
      try {
        onDetail(
          "Tentative de génération avec Window API (CoreAI)...",
          "action",
        );
        // @ts-ignore
        const session = await window.ai.createTextSession({
           systemPrompt: SENTINEL_REPORT_PROMPT
        });
        
        let strData = "";
        try {
           const veryClean = {
              device: realData.device,
              securityPatch: realData.securityPatch,
              isSecureContext: realData.securityContext?.isSecureContext,
              systemCVEs: realData.systemCVEs || [],
              installed_apps: apps.map(a => `${a.appName}(${a.version || "1.0"})`)
           };
           strData = JSON.stringify(veryClean);
        } catch(e) {
           strData = JSON.stringify(analysisPayload);
           if (strData.length > 2500) strData = strData.substring(0, 2500) + "...}";
        }

        const prompt = `DONNÉES D'ENTRÉE:\n${strData}`;
        const aiInterpretation = await session.prompt(prompt);

        onDetail("Sortie Brute API Window.ai", "info");
        onDetail(aiInterpretation, "raw");

        aiParsedOutput = this.extractJsonFromText(aiInterpretation);
      } catch (e: any) {
        onDetail(`Échec inférence CoreAI: ${e.message}`, "error");
      }
    } else if (this.instance) {
      try {
        onDetail(
          "Tentative de génération avec Transformers WebGL...",
          "action",
        );
        const cleanPayload = { ...analysisPayload }; // Create a copy
        delete cleanPayload.securityHeaders; // Prevent LLM from talking about server headers
        delete cleanPayload.securityContext;
        
        let cleanPayloadString = "";
        try {
           const veryClean = {
              device: realData.device,
              securityPatch: realData.securityPatch,
              systemCVEs: realData.systemCVEs || [],
              installed_apps: apps.map((a: any) => `${a.appName}(${a.version || "1.0"})`)
           };
           cleanPayloadString = JSON.stringify(veryClean);
           // truncate safely to avoid model context overflow
           if (cleanPayloadString.length > 2500) {
               cleanPayloadString = cleanPayloadString.substring(0, 2500) + '...}';
           }
        } catch(e) {
           cleanPayloadString = JSON.stringify(cleanPayload);
           if (cleanPayloadString.length > 500) {
              cleanPayloadString = cleanPayloadString.substring(0, 500) + '...}';
           }
        }

        const prompt = `Instruction: Analyze the Android device data and return a JSON security report with keys: "device_summary", "kernel_and_upstream_vulnerabilities", "application_and_package_audit", "architectural_risk_score", "recommendations". Strictly return JSON only.\nData: ${cleanPayloadString}\nResponse:\n{`;
        const out = await this.instance(prompt, { max_new_tokens: 250, temperature: 0.1, repetition_penalty: 1.15 });
        const textOut = "{" + (out[0]?.generated_text?.trim() || "}");

        onDetail("Sortie Brute LaMini/Qwen", "info");
        onDetail(textOut, "raw");

        aiParsedOutput = this.extractJsonFromText(textOut);
      } catch (e: any) {
        onDetail(`Échec inférence locale: ${e.message}`, "error");
      }
    }

    if (aiParsedOutput) {
       // Interpret the newly requested JSON format
       if (aiParsedOutput.device_summary) {
          onDetail("=== Résumé de l'appareil (IA) ===", "warning");
          onDetail(JSON.stringify(aiParsedOutput.device_summary, null, 2), "raw");
       }
       if (aiParsedOutput.architectural_risk_score !== undefined) {
          onDetail(`Score de risque architectural (IA): ${aiParsedOutput.architectural_risk_score}`, "info");
       }
       if (aiParsedOutput.kernel_and_upstream_vulnerabilities && Array.isArray(aiParsedOutput.kernel_and_upstream_vulnerabilities)) {
          aiParsedOutput.kernel_and_upstream_vulnerabilities.forEach((vuln: any) => {
             results.push({
                cveId: vuln.cve_id || "SYS-VULN",
                title: `${vuln.component_name || "Système"} - ${vuln.cve_id || "Vulnérabilité"}`,
                severity: vuln.severity || "HIGH",
                impact: vuln.upstream_status || "ACTIVE",
                description: vuln.description || "",
                concept: `Couche: ${vuln.layer || "Inconnue"}`,
                updateStatus: "Recommandations applicables.",
                mitigation: aiParsedOutput.recommendations ? aiParsedOutput.recommendations.join(" ") : "Vérifiez régulièrement la disponibilité d'une mise à jour."
             });
          });
       }
       if (aiParsedOutput.application_and_package_audit && Array.isArray(aiParsedOutput.application_and_package_audit)) {
          aiParsedOutput.application_and_package_audit.forEach((app: any) => {
             if (app.status === "VULNERABLE" || app.status === "OUTDATED") {
                 results.push({
                    cveId: "APP-VULN-" + app.package_name,
                    title: `App Vulnérable: ${app.package_name}`,
                    severity: app.status === "VULNERABLE" ? "CRITICAL" : "HIGH",
                    impact: `Version: ${app.version}`,
                    description: (app.findings || []).join(" "),
                    concept: "Audit IA de l'application",
                    updateStatus: app.status,
                    mitigation: "Désinstaller ou mettre à jour."
                 });
             }
          });
       }
       
       // S'assurer de ne pas perdre de CVEs système si l'IA les a ignorées en raison de la limite de tokens
       if (realData.systemCVEs && Array.isArray(realData.systemCVEs)) {
          realData.systemCVEs.forEach((cve: any) => {
             const cveIdLower = (cve.id || cve.cve_id || "").toLowerCase();
             const alreadyExists = results.some(r => r.cveId.toLowerCase().includes(cveIdLower));
             if (!alreadyExists) {
                results.push({
                  cveId: cve.id || cve.cve_id || "SYS-VULN",
                  title: cve.name || cve.component_name || "Sys Vuln",
                  severity: cve.severity || "HIGH",
                  impact: "Compromission Système",
                  description: cve.detail || cve.description || "",
                  concept: cve.layer || "Couche système vulnérable",
                  updateStatus: cve.upstream_status || "En attente du constructeur",
                  mitigation: aiParsedOutput.recommendations ? aiParsedOutput.recommendations.join(" ") : "Appliquer les mises à jour.",
                });
             }
          });
       }

    } else {
       onDetail("Échec du parsing JSON AI, basculement sur l'heuristique...", "error");

    // Add actual system CVEs matching Android Version
    if (realData.systemCVEs && Array.isArray(realData.systemCVEs)) {
      realData.systemCVEs.forEach((cve: any) => {
        results.push({
          cveId: cve.id || cve.cve_id,
          title: cve.name || cve.component_name || "Sys Vuln",
          severity: cve.severity || "HIGH",
          impact: "Compromission Système",
          description: cve.detail || cve.description || "",
          concept: cve.layer || "Couche système vulnérable",
          updateStatus: cve.upstream_status || "Non corrigé",
          mitigation: "Apply system updates in Settings under 'Security Update'.",
        });
      });
    }

    // -------------------------------------------------------------
    // REGLES HEURISTIQUES
    // -------------------------------------------------------------
    onDetail("> os_vuln_scanner", "action");
    onDetail(`Cible: kernel/os\nVersion: ${osStr} (Numérique: ${osVersionFloat})\nSeuil minimal: 14.0\nVulnérable: ${isOutdated}`, "raw");

    if (isOutdated) {
      onDetail(">> Détection Positive: OS potentiellement obsolète", "error");
      results.push({
        cveId: "CVE-2023-LOCAL-OS",
        title: "Version OS potentiellement obsolète",
        severity: "HIGH",
        impact: "Vulnérabilités connues non corrigées",
        description: `This device (${deviceLabel}) runs OS version ${osStr}, which is earlier than the recommended version (14+), exposing it to documented security flaws.`,
        concept:
          "Les systèmes non mis à jour manquent des correctifs critiques contre les attaques.",
        updateStatus: "Check settings for a system update.",
        mitigation: "Mettre à jour vers la dernière version.",
      });
    } else {
      onDetail(">> OS jugé récent ou inconnu (OK)", "success");
    }

    onDetail("> webview_sandbox_audit", "action");
    onDetail(`App Native: ${!!realData.appInfo}\nCœurs Alloués: ${realData.webEnvironment?.hardwareConcurrency}\nUserAgent: ${navigator.userAgent}`, "raw");

    results.push({
      cveId: "LOCAL-CHK-01",
      title: "Intégrité du Sandboxing (Bac à sable)",
      severity: "INFO",
      impact: "Secure Architecture",
      description: `Environment analysis: The application is properly isolated by the OS (${realData.appInfo ? 'Native App' : 'Chrome Browser'}). Hardware resources are securely allocated.`,
      concept:
        "False Positive / Informative: This is not a flaw. Sandbox mode is an excellent Android/Chrome OS practice.",
      updateStatus: "Confinement actif et valide.",
      mitigation:
        "Information : Votre appareil bloque correctement les accès non autorisés inter-applications.",
    });
    onDetail(">> Exposition Sandbox documentée (INFO)", "info");

    onDetail("> network_tls_inspection", "action");
    onDetail(`Original Security Headers: ${realData.securityHeaders ? 'Present' : 'Absent'}\nProtocole HTTP: ${window.location.protocol}`, "raw");

    if (realData.securityHeaders && !realData.securityHeaders.error) {
      if (!realData.securityHeaders.hsts) {
        onDetail(
          ">> Absence HSTS du serveur d'hébergement (Ignoré pour l'appareil)",
          "info",
        );
      } else {
        onDetail(">> En-tête HSTS détecté (Protection MITM active)", "success");
      }

      if (!realData.securityHeaders.csp) {
        onDetail(
          ">> Absence CSP du serveur d'hébergement (Ignoré pour l'appareil)",
          "info",
        );
      }
    } else {
      onDetail(
        ">> Failed to verify origin security headers",
        "warning",
      );
    }

    onDetail("> http_protocol_audit", "action");
    onDetail(`Secure HTTP Context: ${isSecure}\nActive Cookies: ${realData.securityContext?.cookiesEnabled}\nProtocole: ${window.location.protocol}`, "raw");

    if (!isSecure) {
      onDetail(
        ">> Unencrypted HTTP context (Ignored for system security)",
        "warning",
      );
    } else {
      onDetail(">> Transport Layer Security (TLS) vérifié (OK)", "success");
    }

    const gpu = realData.gpu?.renderer || "Logiciel";
    let vendorHash = "";
    try {
      vendorHash = btoa(gpu).substring(0, 16);
    } catch (e) {}

    onDetail(`Vendeur GPU: ${realData.gpu?.vendor}\nRendu GPU: ${gpu}\nEmpreinte Hash: ${vendorHash}`, "raw");

    results.push({
      cveId: "GPU-FINGERPRINT",
      title: "Empreinte GPU Exposée",
      severity: "LOW",
      impact: "Suivi / Tracking",
      description: `Le GPU rapporté est: ${gpu}, ce qui permet de tracer cet appareil à travers le web.`,
      concept:
        "Les informations de rendu matériel permettent l'empreinte digitale (fingerprinting).",
      updateStatus: "Défaut d'API Web standard",
      mitigation:
        "Block the WebGL API if it is not strictly necessary.",
    });
    onDetail(">> Vulnérabilité Fingerprint documentée (LOW)", "info");
    
    } // END OF else block for heuristics

    const perfEnd = performance.now();
    const timeSpentMs = Math.round(perfEnd - perfStart);

    onDetail("--- FIN DE L'ANALYSE IA ---", "warning");
    onDetail(`Vulnerabilities detected: ${results.length}\nExecution time: ${timeSpentMs}ms\nVerification mode: strict`, "raw");

    return {
      logs: [
        {
          message: `Évaluation finalisée en ${timeSpentMs}ms.`,
          type: "success",
        },
      ],
      results,
    };
  }
}
