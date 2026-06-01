export class AiEngine {
  static async analyzeNetworkThreat(domain: string, protocol: string): Promise<string> {
    const engine = localStorage.getItem('sentinel_ai_engine') || 'fallback';

    if (engine === 'expert' && 'ai' in window) {
      const windowAi = (window as any).ai;
      let session;
      
      try {
        if (windowAi.languageModel) {
          session = await windowAi.languageModel.create();
        } else if (windowAi.assistant) {
          session = await windowAi.assistant.create();
        }
      } catch (e) {
        console.warn("AI prompt API failed to create session", e);
      }

      if (session) {
        try {
          const prompt = `Le pare-feu a bloqué le domaine ${domain} via ${protocol}. Explique brièvement le risque lié à ce domaine de télémétrie.`;
          const result = await session.prompt(prompt);
          // Destroy session to prevent memory leak
          if (session.destroy) {
            session.destroy();
          }
          return result;
        } catch (e) {
          console.warn("AI prompt API session failed to answer", e);
        }
      }
    }

    // Fallback dictionary
    return this.fallbackAnalysis(domain);
  }

  private static fallbackAnalysis(domain: string): string {
    const lower = domain.toLowerCase();
    if (lower.includes('adserver') || lower.includes('ads')) {
      return `Serveur publicitaire bloqué. Risque de suivi comportemental via ${domain}.`;
    }
    if (lower.includes('telemetry') || lower.includes('tracker')) {
      return `Pistage comportemental bloqué. Extraction de données télémétriques vers ${domain}.`;
    }
    if (lower.includes('malware') || lower.includes('bad')) {
      return `Communication malveillante bloquée. Tentative de connexion vers le domaine suspect ${domain}.`;
    }
    return `Domaine ${domain} intercepté préventivement par le Filtre de Bloom local.`;
  }
}
