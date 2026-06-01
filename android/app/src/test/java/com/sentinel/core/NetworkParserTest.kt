package com.sentinel.core

import org.junit.Assert.assertEquals
import org.junit.Assert.assertNull
import org.junit.Test
import org.mockito.Mockito
import java.lang.reflect.Method

class NetworkParserTest {

    /**
     * Utilisation formelle de la Reflection pour tester une méthode privée isolée
     * au sein d'une instance "Mockée" afin de ne pas déclencher le Thread UI Android.
     */
    private fun invokeExtractSni(buffer: ByteArray, offset: Int, limit: Int): String? {
        // Mock avec appels directs (survit à la restriction "Stub!" de JUnit / Android)
        val serviceMock = Mockito.mock(LocalVpnService::class.java, Mockito.CALLS_REAL_METHODS)
        
        val method: Method = LocalVpnService::class.java.getDeclaredMethod(
            "extractSni",
            ByteArray::class.java,
            Int::class.javaPrimitiveType,
            Int::class.javaPrimitiveType
        )
        method.isAccessible = true
        
        return method.invoke(serviceMock, buffer, offset, limit) as String?
    }

    @Test
    fun testExtractSni_ValidTlsClientHello() {
        // Simulation d'une capture (TLS Client Hello) comportant le SNI "example.com"
        val packet = byteArrayOf(
            0x16, 0x03, 0x01, 0x00, 0x2f, 0x01, 0x00, 0x00,
            0x2b, 0x03, 0x03, 0x00, 0x00, 0x00, 0x00, 0x00, 
            0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 
            0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 
            0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 
            0x00, 0x00, 0x00, 0x00, 0x02, 0x13, 0x01, 0x01, 
            0x00, 0x00, 0x16, 0x00, 0x00, 0x00, 0x0e, 0x00, 
            0x0c, 0x00, 0x00, 0x0b, 
            // SNI Content: "example.com" (11 octets)
            'e'.code.toByte(), 'x'.code.toByte(), 'a'.code.toByte(), 'm'.code.toByte(),
            'p'.code.toByte(), 'l'.code.toByte(), 'e'.code.toByte(), '.'.code.toByte(),
            'c'.code.toByte(), 'o'.code.toByte(), 'm'.code.toByte()
        )

        val sni = invokeExtractSni(packet, 0, packet.size)
        assertEquals("L'extracteur binaire doit trouver 'example.com'.", "example.com", sni)
    }

    @Test
    fun testExtractSni_MalformedGarbagePacket() {
        // Test sur un paquet contenant des données aléatoires/bruitées
        val garbagePacket = byteArrayOf(0x00, 0x11, 0x22, 0x33, 0x44, 0x55)
        val sniGarbage = invokeExtractSni(garbagePacket, 0, garbagePacket.size)
        
        assertNull("Le parser ne doit pas crash mais retourner null pour les paquets indéchiffrables.", sniGarbage)
    }

    @Test
    fun testExtractSni_TruncatedPacket() {
        // Test sur un début de paquet TLS Client Hello coupé avant l'extension SNI
        val truncatedPacket = byteArrayOf(0x16, 0x03, 0x01, 0x00, 0x2f, 0x01)
        val sniTruncated = invokeExtractSni(truncatedPacket, 0, truncatedPacket.size)
        
        assertNull("Le parser doit intercepter la troncature (Array Out Of Bounds) et retourner null en interne.", sniTruncated)
    }
}
