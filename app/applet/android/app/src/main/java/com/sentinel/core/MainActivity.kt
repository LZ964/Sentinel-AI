package com.sentinel.core

import android.os.Bundle
import com.getcapacitor.BridgeActivity

class MainActivity : BridgeActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        registerPlugin(AntiMalwareScannerPlugin::class.java)
        registerPlugin(AppScannerPlugin::class.java)
        registerPlugin(NetworkProxyPlugin::class.java)
        
        // Nouveaux plugins Sentinel AI V2
        registerPlugin(SentinelIntegrityPlugin::class.java)
        registerPlugin(SentinelFirewallPlugin::class.java)
        registerPlugin(SentinelTunnelPlugin::class.java)
        
        super.onCreate(savedInstanceState)
    }
}
