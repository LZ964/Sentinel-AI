# 🛡️ Sentinel Core - Sécurité Avancée (Production)

**Sentinel Core** est une véritable application web et hybride de cybersécurité exploitant directement le matériel de votre appareil. Suite à la nouvelle architecture, elle embarque une intelligence artificielle **100% Locale (zéro-cloud)**, ne dépendant plus d'aucun serveur distant. Elle collecte vos logs de sécurité matériel ("Real Hardware Monitoring") et effectue ses évaluations sur l'appareil.

---

## ✨ Fonctionnalités Principales

L'application est divisée en plusieurs modules spécialisés, offrant un design responsif s'adaptant parfaitement aux écrans de mobiles :

### 🔍 1. Audit Système & Scanner de Vulnérabilités (`ScannerTab`)
*   **Architecture Zéro-Cloud & Sandbox:** Plus aucun backend n'est requis. Fonctionnement 100% autonome.
*   **Intelligence Artificielle Native & Locale:** Utilisation de **l'API `window.ai` (CoreAI / Gemini Nano)** des navigateurs modernes et flagships (Pixel 8a+). S'il n'est pas détecté, un algorithme de fallback télécharge un module LLM local directement dans la Webview/RAM.
*   **Vraie évaluation du matériel (Real Hardware Scanner):** Moteur de diagnostic qui extrait la vraie condition de la connectivité réseau, l'état de la batterie (`@capacitor/device`), les capacités hardware (`hardwareConcurrency`), l'isolation Webview (TLS) et les vulnérabilités de traçage (ex: GPU fingerprinting). Exécution asynchrone ultra-rapide (aucune simulation de délai).
*   **Journal Terminal Détaillé (Mode Debug) :** Tous les retours de l'audit sont affichés sans aucun filtre via un terminal de sécurité intégré, y compris les sorties JSON `raw` complètes pour garantir la transparence des requêtes et inférences.

### 🧱 2. Pare-feu Local & IA Comportementale (`FirewallTab`)
*   **Pare-feu via VpnService :** Contrôle du trafic réseau local complet, sans envoyer les données à l'extérieur.
*   **Sécurité Anti-Bypass (Killswitch) :** Une fois des règles réseau établies via le pont natif, elles sont appliquées de bout en bout ("Fail-Closed") et ne peuvent être contournées, garantissant qu'aucune connexion ne fuite en cas de dysfonctionnement.
*   **Production et Intégration Native Réelle :** Fin des simulations et des mocks. Le module s'interface en direct avec l'API système Android via `window.AndroidBridge` (`setAppStatus`, `enableFirewall`, `requestInstalledApps`, `onInstalledAppsList`, `onNetworkLogIntercepted`).
*   **Pilotage par l'IA :** Le pare-feu analyse les véritables applications installées et prend des décisions autonomes (bloquer/autoriser) basées sur le trafic réseau réel remonté par l'OS.
*   **Analyse Sémantique des Logs :** L'IA scrute les requêtes entrantes/sortantes et génère des fiches de "Recommandations" claires structurées.
*   **Monitoring Avancé :** L'interface affiche le vrai état des connexions socket ouvertes et le trafic applicatif (dynamique).

### 🦠 3. Anti-Malware & Traque de Menaces (`AntiMalwareTab`)
*   **Supervision Active :** Détection d'anomalies, de rootkits et d'élévations de privilèges.
*   **Journal (Activité) en Direct :** Affichage terminal colorisé des actions système.
*   **Module de Désinfection :** Mise en quarantaine et suppression des éléments compromis.

### 🌐 4. Routage Sécurisé & Proxy (`ProxyTab`)
*   **Profils de Connexion :** Bascule entre différents modes de sécurisation du trafic (Standard, VPN Mullvad, Trafic Oignon via Tor).
*   **Intégration Réelle de Mullvad :** Activation directe du tunnel Wireguard via une validation par l'API officielle de Mullvad. 
*   **Direct par Défaut & Anti-Bypass :** La connexion directe ("Direct") est la configuration stricte par défaut. Toute connexion Tor ou VPN ne peut s'activer que par requête manuelle. Si aucune requête sécurisée n'est valide ou disponible, l'application ne simulera pas les résultats et retournera des erreurs strictes.
*   **Masquage d'IP :** Interface de suivi du statut cryptographique et gestion de la route réseau active informelle et sans alertes invasives.

### 💻 5. Outils Avancés ADB (`AdbTab`)
*   **Console pour Experts :** Interface permettant d'interagir profondément avec l'appareil (connexion USB ou WiFi).

---

## ⚙️ Architecture & Intégration Native (CI/CD)

Afin de garantir une sécurité et une intégrité maximales, **Sentinel Core** utilise une approche de compilation propre ("Clean Build") via GitHub Actions pour l'intégration de ses bibliothèques cryptographiques natives (`libwg-go.so` pour WireGuard / Mullvad, et `libtor.so` pour le routage Oignon). 

Plutôt que de télécharger des bibliothèques dynamiquement au moment de l'exécution (une pratique vulnérable aux attaques de type *Man-in-the-Middle* et bloquée par les politiques de sécurité Android modernes), le système d'intégration continue (CI/CD) est responsable de :
1. Télécharger les binaires sécurisés depuis des sources de confiance.
2. Vérifier scrupuleusement les signatures SHA-256 de ces binaires.
3. Les injecter directement dans le dossier `jniLibs/arm64-v8a` du paquet Android avant l'assemblage de l'APK.

Cette approche garantit qu'il n'y a pas besoin de mettre à jour manuellement ou produire une nouvelle application côté code pour intégrer les dernières versions des librairies, tout se fait de manière transparente, hermétique et sécurisée lors du déploiement continu.

---

## 🛠️ Stack Technique

*   **Intelligence Artificielle:** Utilisation en production de `window.ai` (CoreAI/Gemini Nano local) et `@huggingface/transformers` en fallback.
*   **Pont Matériel:** CapacitorJS (`@capacitor/device`, `@capacitor/network`, `@capacitor/app`).
*   **Framework Core:** [React](https://react.dev/) 18 (TypeScript) via Vite, architecture **Single-Page Application (Client-Side)**.
*   **Styling:** [Tailwind CSS](https://tailwindcss.com/) optimisé pour le First-Mobile design (Responsive).
*   **Animations:** [Framer Motion](https://motion.dev/)
*   **Graphiques:** [Recharts](https://recharts.org/) pour la visualisation de la bande passante

---

## 🚀 Installation & Développement

Assurez-vous d'avoir `Node.js` d'installé sur votre machine.

1. **Cloner le projet :**
   ```bash
   git clone <votre-url-github>
   cd sentinel-core
   ```

2. **Installer les dépendances :**
   ```bash
   npm install
   ```

3. **Lancer l'Application :**
   ```bash
   npm run dev
   ```

4. **Compiler pour la production :**
   ```bash
   npm run build
   ```

---

## 📄 Licence et Copyright

Ce projet est sous licence MIT.
Copyright (c) 2026 carlgodrolt. Voir le fichier [LICENSE](LICENSE) pour plus de détails.


