package com.prismguard.core

import com.getcapacitor.BridgeActivity
import android.os.Bundle

class MainActivity : BridgeActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        registerPlugin(BehaviorGuardPlugin::class.java)
        registerPlugin(SentinelFirewallPlugin::class.java)
        registerPlugin(SentinelIntegrityPlugin::class.java)
        registerPlugin(SentinelTunnelPlugin::class.java)
        super.onCreate(savedInstanceState)
    }
}
