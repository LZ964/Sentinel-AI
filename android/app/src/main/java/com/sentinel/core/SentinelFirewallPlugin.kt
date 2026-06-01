package com.sentinel.core

import android.app.Activity
import android.content.Intent
import android.net.VpnService
import com.getcapacitor.JSObject
import com.getcapacitor.Plugin
import com.getcapacitor.PluginCall
import com.getcapacitor.PluginMethod
import com.getcapacitor.annotation.CapacitorPlugin
import com.getcapacitor.annotation.ActivityCallback

@CapacitorPlugin(name = "SentinelFirewall")
class SentinelFirewallPlugin : Plugin() {

    override fun load() {
        super.load()
        LocalVpnService.logListener = { action, protocol, ip, domain ->
            val data = JSObject()
            data.put("action", action)
            data.put("protocol", protocol)
            data.put("ip", ip)
            data.put("domain", domain)
            data.put("timestamp", System.currentTimeMillis())
            notifyListeners("onNetworkLog", data)
        }
    }

    @PluginMethod
    fun enableFirewall(call: PluginCall) {
        val enabled = call.getBoolean("enabled", false)
        if (enabled == true) {
            val intent = VpnService.prepare(context)
            if (intent != null) {
                // VPN requires user permission prompt
                startActivityForResult(call, intent, "vpnPrepareResult")
            } else {
                // Permission already granted
                startVpnService()
                val ret = JSObject()
                ret.put("status", true)
                call.resolve(ret)
            }
        } else {
            stopVpnService()
            val ret = JSObject()
            ret.put("status", false)
            call.resolve(ret)
        }
    }

    @ActivityCallback
    fun vpnPrepareResult(call: PluginCall?, result: androidx.activity.result.ActivityResult) {
        if (result.resultCode == Activity.RESULT_OK) {
            startVpnService()
            val ret = JSObject()
            ret.put("status", true)
            call?.resolve(ret)
        } else {
            val ret = JSObject()
            ret.put("status", false)
            ret.put("error", "User denied VPN permission")
            call?.resolve(ret)
        }
    }

    private fun startVpnService() {
        val intent = Intent(context, LocalVpnService::class.java)
        intent.action = LocalVpnService.ACTION_CONNECT
        context.startService(intent)
    }

    private fun stopVpnService() {
        val intent = Intent(context, LocalVpnService::class.java)
        intent.action = LocalVpnService.ACTION_DISCONNECT
        context.startService(intent)
    }
}
