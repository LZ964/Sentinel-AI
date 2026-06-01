package com.sentinel.core

import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Test

class BloomFilterTest {

    @Test
    fun testBloomFilterAccuracy() {
        // Initialisation d'un Bloom Filter isolé pour le test
        val bloomFilter = BloomFilter(1000, 3)

        // Simulation de l'ajout de domaines provenant de the Threat List
        bloomFilter.add("telemetry.adserver.cn")
        bloomFilter.add("malware.bad-domain.xyz")

        // Vérification des inclusions
        assertTrue("Le filtre doit détecter le domaine malveillant ajouté.", bloomFilter.contains("telemetry.adserver.cn"))
        assertTrue("Le filtre doit détecter le second domaine malveillant.", bloomFilter.contains("malware.bad-domain.xyz"))

        // Probabilités extrêmement faibles de faux positifs avec de tels paramètres
        assertFalse("Le filtre ne doit pas bloquer un domaine inoffensif non ajouté.", bloomFilter.contains("google.com"))
        assertFalse("Le filtre ne doit pas bloquer localhost.", bloomFilter.contains("localhost"))
    }
}
