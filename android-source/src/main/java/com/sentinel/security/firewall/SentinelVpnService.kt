package com.sentinel.security.firewall

import android.content.Intent
import android.net.VpnService
import android.os.ParcelFileDescriptor
import android.util.Log

/**
 * Service Pare-Feu local ne nécessitant pas les droits root.
 * Intercepte le trafic via une interface TUN virtuelle (Android VpnService API).
 */
class SentinelVpnService : VpnService() {
    
    private var vpnInterface: ParcelFileDescriptor? = null
    private val TAG = "SentinelFirewall"

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        Log.i(TAG, "Démarrage du Pare-feu Sentinel...")
        setupVpnInterface()
        return START_STICKY
    }

    private fun setupVpnInterface() {
        if (vpnInterface != null) return

        try {
            val builder = Builder()
                .setSession("Sentinel Firewall")
                .addAddress("10.0.0.2", 24)
                .addDnsServer("1.1.1.1") // Proxy DNS via Cloudflare/Mullvad
                .addRoute("0.0.0.0", 0)  // Route l'ensemble du trafic IPv4 vers le TUN

            // Simulation d'utilisation du moteur IA pour appliquer des règles
            // Si une app système ne doit pas avoir accès, on la gère ici (pseudocode)
            // val packages = packageManager.getInstalledPackages(0)
            // for (pkg in packages) {
            //      if (DecisionEngine.shouldBlockSystemApp(pkg.packageName)) {
            //          builder.addDisallowedApplication(pkg.packageName)
            //      }
            // }

            // Établissement de l'interface
            vpnInterface = builder.establish()
            
            // Note pour WireGuard/Tor:
            // Le descripteur vpnInterface?.fileDescriptor serait passé aux bibliothèques 
            // Tor Onion Proxy Library ou WireGuard tunnel backend.
            
        } catch (e: Exception) {
            Log.e(TAG, "Erreur lors de l'établissement du pare-feu", e)
        }
    }

    override fun onDestroy() {
        Log.i(TAG, "Arrêt du pare-feu...")
        try {
            vpnInterface?.close()
            vpnInterface = null
        } catch (e: Exception) {
            Log.e(TAG, "Erreur fermeture FileDescriptor", e)
        }
        super.onDestroy()
    }
}
