package com.security.audit

import android.content.Context
import android.content.Intent
import android.net.Uri
import java.io.File

/**
 * GUIDE D'AUDIT DE SÉCURITÉ (Checklist de Production) :
 * 
 * 1. PRÉVENTION DES INJECTIONS DE COMMANDES (ADB/SHELL) :
 *    - Ne jamais concaténer directement des chaînes de caractères (ex: package name non validé) dans les commandes shell.
 *    - Toujours valider le format du package name (ex: via une regex `^[a-zA-Z0-9_.]+$`) avant de l'inclure dans
 *      `adb shell pm uninstall`. 
 * 
 * 2. STOCKAGE SÉCURISÉ DES SECRETS :
 *    - Les identifiants sensibles (ex: compte VPN Mullvad, jetons d'API Cloud, clés privées) ne doivent jamais être 
 *      stockés en clair.
 *    - Utiliser `EncryptedSharedPreferences` d'AndroidX Security pour chiffrer les données au repos sur le disque.
 * 
 * 3. VALIDATION DES CHEMINS DE FICHIERS (PATH TRAVERSAL) :
 *    - Lors de la suppression de fichiers malveillants, s'assurer que le chemin résolu (canonical path) appartient bien 
 *      au répertoire attendu (ex: Downloads) pour éviter le Path Traversal (`../../`).
 * 
 * 4. MOINDRE PRIVILÈGE & CONSENTEMENT UTILISATEUR :
 *    - Ne demander que les permissions strictement nécessaires (ex: QUERY_ALL_PACKAGES).
 *    - Les actions destructrices (désinstallation) doivent toujours passer par les APIs système (Intent) 
 *      pour garantir le consentement explicite de l'utilisateur, sauf dans un environnement géré (MDM/ADB) 
 *      où l'administrateur a déjà consenti.
 */
class DisinfectionManager(private val context: Context) {

    // Action 1 : Suppression de Fichiers (Fichiers utilisateur)
    fun deleteMaliciousFile(filePath: String): Boolean {
        return try {
            val file = File(filePath)
            // Prévention Path Traversal simplifiée pour l'audit de sécurité
            val canonicalPath = file.canonicalPath
            val isSafePath = canonicalPath.startsWith("/storage/emulated/0/")
            
            if (isSafePath && file.exists() && file.isFile) {
                file.delete()
            } else {
                false
            }
        } catch (e: Exception) {
            false
        }
    }

    // Action 2 : Désinstallation d'Applications (Mode Standard)
    fun uninstallMalwareApp(packageName: String) {
        try {
            val intent = Intent(Intent.ACTION_DELETE).apply {
                data = Uri.parse("package:$packageName")
                flags = Intent.FLAG_ACTIVITY_NEW_TASK
            }
            context.startActivity(intent)
        } catch (e: Exception) {
            e.printStackTrace()
        }
    }

    // Action 3 : Désinfection Radicale (Mode Avancé via ADB)
    // Retourne les commandes à exécuter par le pont ADB ou les exécute si connecté localement
    fun generateAdbRemediationCommands(packageName: String): List<String> {
        // Validation stricte du package pour éviter l'injection de commandes (Audit Point #1)
        val packageRegex = Regex("^[a-zA-Z0-9_.]+$")
        require(packageRegex.matches(packageName)) { "Format de package invalide." }

        return listOf(
            "adb shell am force-stop $packageName",
            "adb shell pm disable-user $packageName",
            "adb shell pm uninstall $packageName"
        )
    }
}
