package com.security.audit

import android.content.Context
import android.util.Log
import com.google.android.play.core.integrity.IntegrityManagerFactory
import com.google.android.play.core.integrity.IntegrityTokenRequest
import com.google.android.play.core.integrity.model.IntegrityErrorCode

class SystemIntegrity(private val context: Context) {

    fun checkPlayIntegrity(nonce: String, onResult: (Boolean, String) -> Unit) {
        // Create an instance of a manager.
        val integrityManager = IntegrityManagerFactory.create(context)

        // Request the integrity token by providing a nonce.
        val integrityTokenResponse = integrityManager.requestIntegrityToken(
            IntegrityTokenRequest.builder()
                .setNonce(nonce)
                .build()
        )

        integrityTokenResponse.addOnSuccessListener { response ->
            val integrityToken = response.token()
            // In a real application, you send this token to your backend server.
            // The backend communicates with Google servers to decrypt and verify the token.
            // It parses MEETS_STRONG_INTEGRITY
            Log.d("SystemIntegrity", "Integrity Token obtained successfully.")
            onResult(true, "Token generated. Must verify MEETS_STRONG_INTEGRITY on secure backend.")
        }

        integrityTokenResponse.addOnFailureListener { exception ->
            Log.e("SystemIntegrity", "Error obtaining Integrity Token", exception)
            onResult(false, "Failed to obtain token: \${exception.message}")
        }
    }
}
