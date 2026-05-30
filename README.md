# 🛡️ Sentinel Core - Advanced Security (Production)

**Sentinel Core** is a robust web and hybrid cybersecurity application that interacts directly with your device's hardware. With its latest architecture, it embeds an **100% Local (Zero-Cloud)** Artificial Intelligence, eliminating remote server dependencies. It leverages "Real Hardware Monitoring" to collect security logs and performs all evaluations directly on-device.

---

## ✨ Primary Features

The application is modularized, featuring a responsive design tailored for mobile screens:

### 🔍 1. System Audit & Vulnerability Scanner (`ScannerTab`)
*   **Zero-Cloud & Sandbox Architecture:** Operates completely autonomously with no backend requirement.
*   **Native & Local AI:** Utilizes modern browsers' and flagship devices' **`window.ai` API (CoreAI / Gemini Nano)**. A fallback mechanism downloads a local LLM module directly into the Webview/RAM if the native API is unavailable.
*   **Real Hardware Scanner:** A diagnostic engine extracting precise data regarding network connectivity, battery status (`@capacitor/device`), hardware capacities (`hardwareConcurrency`), Webview isolation (TLS) and tracking vulnerabilities (e.g., GPU fingerprinting). Boasts ultra-fast asynchronous execution with zero simulated delays.
*   **Detailed Terminal Log (Debug Mode):** Displays completely unfiltered audit returns via an integrated security terminal, providing raw JSON outputs to ensure complete transparency of queries and inferences.

### 🧱 2. Local Firewall & Behavioral AI (`FirewallTab`)
*   **VpnService Firewall:** Complete control over local network traffic without exposing data externally.
*   **Anti-Bypass (Killswitch) Security:** Network rules are enforced end-to-end ("Fail-Closed") via the native bridge. Traffic cannot bypass the firewall even during malfunctions, preventing data leaks.
*   **Real Native Integration:** Interacts directly with the Android system API via `window.AndroidBridge` (`setAppStatus`, `enableFirewall`, `requestInstalledApps`, `onInstalledAppsList`, `onNetworkLogIntercepted`), replacing previous simulated environments.
*   **AI-Driven Guidance:** Analyzing actual installed apps, the firewall automatically advises (block/allow) based on real network traffic metrics reported by the OS.
*   **Semantic Log Analysis:** The AI engine parses incoming/outgoing requests and outputs clear, structured "Recommendation" tickets.
*   **Advanced Monitoring:** The interface reflects genuine connection states of open sockets and dynamic app traffic.

### 🦠 3. Anti-Malware & Threat Tracker (`AntiMalwareTab`)
*   **Active Supervision:** Detects anomalies, rootkits, and privilege escalations.
*   **Live Activity Journal:** A syntax-highlighted terminal display of real-time system actions.
*   **Disinfection Module:** Allows quarantining and deletion of compromised elements.

### 🌐 4. Secure Routing & Proxy (`ProxyTab`)
*   **Connection Profiles:** Seamlessly switches between traffic security modes (Standard, Mullvad VPN, Tor Onion Routing).
*   **Mullvad Integration:** Directly establishes Wireguard tunnels verified via Mullvad's official API.
*   **Default Direct & Anti-Bypass:** Strict "Direct" connection acts as the baseline. Tor or VPN connections activate only via explicit manual requests. The app delivers strict errors rather than simulated results when secure requests fail.
*   **IP Masking:** Features a cryptographic status dashboard and non-intrusive active network routing management.

### 💻 5. Advanced ADB Tools (`AdbTab`)
*   **Expert Console:** An interface for deep device interactions (via USB or WiFi connections), specifically analyzing Android Debug Bridge anomalies.

---

## ⚙️ Architecture & Native Integration (CI/CD)

To ensure peak security and integrity, **Sentinel Core** employs a "Clean Build" pipeline utilizing GitHub Actions for compiling native cryptographic libraries (`libwg-go.so` for WireGuard/Mullvad and `libtor.so` for Tor routing).

Instead of downloading these libraries dynamically at runtime (which is vulnerable to Man-in-the-Middle attacks and restricted by modern Android security policies), the Continuous Integration / Continuous Deployment (CI/CD) system is configured to:
1. Fetch secure binaries from trusted sources.
2. Rigorously verify the SHA-256 signatures of these binaries.
3. Inject them directly into the Android package's `jniLibs/arm64-v8a` directory before APK assembly.

This ensures all library updates happen transparently, securely, and without requiring code-side logic changes for the next version deployment.

---

## 🛠️ Technical Stack

*   **Intelligence:** Production use of `window.ai` (CoreAI/Gemini Nano local) with `@huggingface/transformers` as a fallback.
*   **Hardware Bridge:** CapacitorJS (`@capacitor/device`, `@capacitor/network`, `@capacitor/app`).
*   **Core Framework:** [React](https://react.dev/) 18 (TypeScript) with Vite, functioning as a **Single-Page Application (Client-Side)**.
*   **Styling:** [Tailwind CSS](https://tailwindcss.com/) with a Responsive, Mobile-First approach.
*   **Animations:** [Framer Motion](https://motion.dev/)
*   **Graphics:** [Recharts](https://recharts.org/) for bandwidth visualization.

---

## 🚀 Installation & Development

Ensure `Node.js` is installed on your environment.

1. **Clone the repository:**
   ```bash
   git clone <your-github-url>
   cd sentinel-core
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Start the application:**
   ```bash
   npm run dev
   ```

4. **Compile for production:**
   ```bash
   npm run build
   ```

---

## 📄 License & Copyright

This project is licensed under the MIT License.
Copyright (c) 2026 carlgodrolt. See the [LICENSE](LICENSE) file for details.


