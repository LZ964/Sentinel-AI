package com.prismguard.core

import android.content.pm.PackageInfo
import android.content.pm.PackageManager
import com.getcapacitor.JSArray
import com.getcapacitor.JSObject
import com.getcapacitor.Plugin
import com.getcapacitor.PluginCall
import com.getcapacitor.PluginMethod
import com.getcapacitor.annotation.CapacitorPlugin

@CapacitorPlugin(name = "BehaviorGuard")
class BehaviorGuardPlugin : Plugin() {

    @PluginMethod
    fun scanAppBehavior(call: PluginCall) {
        val packageName = call.getString("packageName")
        if (packageName == null) {
            call.reject("Package name is required")
            return
        }

        try {
            val result = BehaviorGuardEngine.analyzeApp(context, packageName)
            call.resolve(result)
        } catch (e: Exception) {
            call.reject("Error scanning app", e)
        }
    }

    @PluginMethod
    fun getThirdPartyApps(call: PluginCall) {
        try {
            val pm = context.packageManager
            val packages = pm.getInstalledApplications(PackageManager.GET_META_DATA)
            val appsArray = JSArray()
            for (app in packages) {
                if ((app.flags and android.content.pm.ApplicationInfo.FLAG_SYSTEM) == 0) {
                    val appObj = JSObject()
                    appObj.put("packageName", app.packageName)
                    appObj.put("appName", app.loadLabel(pm).toString())
                    appsArray.put(appObj)
                }
            }
            val res = JSObject()
            res.put("apps", appsArray)
            call.resolve(res)
        } catch (e: Exception) {
            call.reject("Error getting apps", e)
        }
    }
}
