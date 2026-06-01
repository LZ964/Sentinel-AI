package com.prismguard.core

import android.app.NotificationChannel
import android.app.NotificationManager
import android.content.Context
import android.content.pm.PackageManager
import android.os.Build
import android.util.Log
import androidx.core.app.NotificationCompat
import com.getcapacitor.JSObject
import com.getcapacitor.JSArray

object BehaviorGuardEngine {
    private const val TAG = "BehaviorGuardEngine"
    private const val NOTIFICATION_CHANNEL_ID = "prismguard_alerts"

    fun analyzeApp(context: Context, packageName: String): JSObject {
        val pm = context.packageManager
        val result = JSObject()
        try {
            val packageInfo = pm.getPackageInfo(packageName, PackageManager.GET_PERMISSIONS)
            val permissions = packageInfo.requestedPermissions ?: emptyArray()
            val appName = packageInfo.applicationInfo?.loadLabel(pm)?.toString() ?: packageName
            
            result.put("packageName", packageName)
            result.put("appName", appName)
            
            val permsArray = JSArray()
            var smsOrContacts = false
            for (p in permissions) {
                permsArray.put(p)
                val pl = p.lowercase()
                if (pl.contains("sms") || pl.contains("contacts")) {
                    smsOrContacts = true
                }
            }
            result.put("permissions", permsArray)
            result.put("domains", JSArray())

            // Simulated AI/Heuristic behavioral risk calculation
            var score = "Faible"
            if (permissions.size > 5) score = "Moyen"
            if (smsOrContacts && !appName.lowercase().contains("message")) {
                score = "Critique"
            }

            result.put("score", score)
            result.put("explanation", "L'application a demandé \${permissions.size} permissions. Score de risque calculé: \$score.")

            if (score == "Critique") {
                sendHighPriorityNotification(context, appName)
            }

        } catch (e: Exception) {
            Log.e(TAG, "Error analyzing app: \$packageName", e)
        }
        return result
    }

    private fun sendHighPriorityNotification(context: Context, appName: String) {
        val notificationManager = context.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
        
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channel = NotificationChannel(
                NOTIFICATION_CHANNEL_ID,
                "Alerte Prism Guard",
                NotificationManager.IMPORTANCE_HIGH
            )
            notificationManager.createNotificationChannel(channel)
        }

        // We use android.R.drawable.ic_dialog_alert as placeholder
        val notification = NotificationCompat.Builder(context, NOTIFICATION_CHANNEL_ID)
            .setSmallIcon(android.R.drawable.ic_dialog_alert)
            .setContentTitle("Prism Guard: Alerte Critique")
            .setContentText("Activité suspecte détectée dans \$appName")
            .setPriority(NotificationCompat.PRIORITY_HIGH)
            .setAutoCancel(true)
            .build()

        notificationManager.notify(packageName.hashCode(), notification)
    }
}
