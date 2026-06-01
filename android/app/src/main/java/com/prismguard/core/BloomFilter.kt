package com.prismguard.core

import java.nio.charset.StandardCharsets
import java.security.MessageDigest
import java.util.BitSet
import kotlin.math.abs

class BloomFilter(private val size: Int, private val numHashes: Int) {
    private val bitSet = BitSet(size)
    private val digest = MessageDigest.getInstance("SHA-256")

    fun add(element: String) {
        val hashes = getHashes(element)
        for (hash in hashes) {
            bitSet.set(abs(hash % size))
        }
    }

    fun contains(element: String): Boolean {
        val hashes = getHashes(element)
        for (hash in hashes) {
            if (!bitSet.get(abs(hash % size))) {
                return false
            }
        }
        return true
    }

    private fun getHashes(element: String): IntArray {
        val bytes = element.toByteArray(StandardCharsets.UTF_8)
        val hashBytes = digest.digest(bytes)
        val result = IntArray(numHashes)
        var offset = 0
        for (i in 0 until numHashes) {
            if (offset + 4 > hashBytes.size) {
                 // re-hash if we run out of bytes
                 digest.update(hashBytes)
                 val newHashBytes = digest.digest()
                 System.arraycopy(newHashBytes, 0, hashBytes, 0, newHashBytes.size)
                 offset = 0
            }
            var h = 0
            h = h or (hashBytes[offset].toInt() and 0xFF shl 24)
            h = h or (hashBytes[offset + 1].toInt() and 0xFF shl 16)
            h = h or (hashBytes[offset + 2].toInt() and 0xFF shl 8)
            h = h or (hashBytes[offset + 3].toInt() and 0xFF)
            result[i] = h
            offset += 4
        }
        return result
    }
}
