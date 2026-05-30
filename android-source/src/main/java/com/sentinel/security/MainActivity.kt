package com.sentinel.security

import android.content.Intent
import android.net.VpnService
import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.ui.Modifier
import com.sentinel.security.firewall.SentinelVpnService

class MainActivity : ComponentActivity() {
    
    companion object {
        const val VPN_REQUEST_CODE = 0x0F
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        
        // Démarrage de l'interface principale (Jetpack Compose)
        // Note: L'architecture UI complète est simulée dans le prototype Web (React)
        setContent {
            MaterialTheme {
                Surface(
                    modifier = Modifier.fillMaxSize(),
                    color = MaterialTheme.colorScheme.background
                ) {
                    Text(text = "Sentinel Security - Core Loaded")
                }
            }
        }
    }

    /**
     * Demande les permissions au système Android pour établir le VPN local (Pare-Feu)
     */
    fun startFirewall() {
        val intent = VpnService.prepare(this)
        if (intent != null) {
            startActivityForResult(intent, VPN_REQUEST_CODE)
        } else {
            onActivityResult(VPN_REQUEST_CODE, RESULT_OK, null)
        }
    }

    override fun onActivityResult(requestCode: Int, resultCode: Int, data: Intent?) {
        super.onActivityResult(requestCode, resultCode, data)
        if (requestCode == VPN_REQUEST_CODE && resultCode == RESULT_OK) {
            val vpnIntent = Intent(this, SentinelVpnService::class.java)
            startService(vpnIntent)
        }
    }
}
