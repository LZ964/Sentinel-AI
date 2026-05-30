package com.sentinel.security.firewall

/**
 * Moteur de décision IA (Simulation) pour évaluer et restreindre le trafic.
 * Uniquement dédié aux applications pour lesquelles l'intention n'est pas évidente.
 */
object DecisionEngine {
    
    // Critères stricts : Les applications système ne doivent pas avoir accès au réseau 
    // sauf si elles font partie d'une liste blanche stricte vérifiée.
    private val systemTrafficWhitelist = setOf(
        "com.android.vending",
        "com.google.android.gms",
        "com.android.updater",
        "com.android.providers.downloads"
    )

    /**
     * Analyse si une application système représente une fuite de données potentielle
     * et doit être bloquée par défaut par le pare-feu.
     */
    fun shouldBlockSystemApp(packageName: String): Boolean {
        // Validation stricte: Si le package n'est pas dans la liste blanche de 
        // composants absolument nécessaires pour le système réseau, il est bloqué.
        // Exemple: com.android.calculator2 demande l'accès internet => Rejeté.
        return !systemTrafficWhitelist.contains(packageName)
    }

    /**
     * Applique une politique d'isolation (Zéro-Confiance).
     */
    fun getIsolationPolicyDescription(): String {
        return "Routage Zero-Trust : Seules les API de synchronisation essentielles sont autorisées. " +
               "Toute application système secondaire (Claviers, Calculatrices, APN) est coupée du réseau."
    }
}
