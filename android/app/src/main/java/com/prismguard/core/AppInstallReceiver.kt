package com.prismguard.core

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import com.prismguard.core.BehaviorGuardEngine

class AppInstallReceiver : BroadcastReceiver() {
    override fun onReceive(context: Context, intent: Intent) {
        val action = intent.action
        if (action == Intent.ACTION_PACKAGE_ADDED || action == Intent.ACTION_PACKAGE_REPLACED) {
            val packageName = intent.data?.schemeSpecificPart ?: return
            
            // Invoke the engine in background
            BehaviorGuardEngine.analyzeApp(context, packageName)
        }
    }
}
