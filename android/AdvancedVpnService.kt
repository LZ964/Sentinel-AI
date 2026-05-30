package com.security.audit

import android.content.Context
import android.net.VpnService
import android.os.ParcelFileDescriptor
import android.util.Log
import android.content.Intent

class AdvancedVpnService : VpnService() {

    private var vpnInterface: ParcelFileDescriptor? = null

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        Log.i("VPN", "Démarrage du Pare-Feu Local (VpnService)...")
        setupLocalFirewall()
        return START_STICKY
    }

    private fun setupLocalFirewall() {
        val prefs = getSharedPreferences("FirewallPrefs", android.content.Context.MODE_PRIVATE)
        val blockedApps = prefs.getStringSet("blocked_apps", setOf()) ?: setOf()
        
        val builder = Builder()
        builder.setSession("PareFeu_Local")
               .addAddress("10.0.0.2", 24)
        
        // Pare-feu transparent : 
        // L'application tourne localement via cette interface virtuelle.
        // On n'ajoute pas addRoute("0.0.0.0", 0) sans relais pour ne pas 
        // couper internet au téléphone.
        
        var hasBlockedApp = false
        for (pkg in blockedApps) {
            try {
                // Route only the blocked apps into our VPN (black hole)
                builder.addAllowedApplication(pkg)
                hasBlockedApp = true
                Log.d("VPN", "Application bloquée (routée via VPN): $pkg")
            } catch (e: Exception) {
                Log.e("VPN", "Erreur blockage app: $pkg", e)
            }
        }
        
        // If there are no blocked apps, we still need to establish the VPN
        // to keep the service running, but we don't route anything
        try {
            vpnInterface?.close() // close previous if any
            vpnInterface = builder.establish()
            Log.i("VPN", "Interface Pare-Feu établie avec succès. Bloque ${blockedApps.size} applications.")
        } catch (e: Exception) {
            Log.e("VPN", "Erreur lors de l'établissement du VPN : ", e)
        }
    }

    override fun onDestroy() {
        super.onDestroy()
        try {
            vpnInterface?.close()
        } catch (e: Exception) {
            Log.e("VPN", "Erreur à la fermeture", e)
        }
        vpnInterface = null
        Log.i("VPN", "VpnService arrêté.")
    }
}
