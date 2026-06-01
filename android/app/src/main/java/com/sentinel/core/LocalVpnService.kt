package com.sentinel.core

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.content.Intent
import android.net.VpnService
import android.os.Build
import android.os.ParcelFileDescriptor
import android.util.Log
import java.io.BufferedReader
import java.io.FileInputStream
import java.io.InputStreamReader
import java.net.HttpURLConnection
import java.net.URL
import java.nio.ByteBuffer
import java.util.concurrent.atomic.AtomicBoolean

class LocalVpnService : VpnService(), Runnable {
    private var mInterface: ParcelFileDescriptor? = null
    private var mThread: Thread? = null
    private val isRunning = AtomicBoolean(false)
    private val bloomFilter = BloomFilter(100000, 3)

    init {
        syncThreatList()
    }

    private fun syncThreatList() {
        Thread {
            try {
                Log.i(TAG, "Syncing threat list...")
                val url = URL("https://raw.githubusercontent.com/StevenBlack/hosts/master/hosts")
                val connection = url.openConnection() as HttpURLConnection
                connection.requestMethod = "GET"
                
                if (connection.responseCode == HttpURLConnection.HTTP_OK) {
                    val reader = BufferedReader(InputStreamReader(connection.inputStream))
                    var line: String?
                    while (reader.readLine().also { line = it } != null) {
                        val currentLine = line?.trim() ?: continue
                        if (currentLine.startsWith("#") || currentLine.isEmpty()) continue
                        
                        if (currentLine.startsWith("0.0.0.0")) {
                            val parts = currentLine.split("\\s+".toRegex())
                            if (parts.size >= 2) {
                                val domain = parts[1]
                                if (domain != "0.0.0.0") {
                                    bloomFilter.add(domain)
                                }
                            }
                        }
                    }
                    reader.close()
                    Log.i(TAG, "Threat list synced successfully.")
                } else {
                    Log.e(TAG, "Failed to sync threat list: HTTP ${connection.responseCode}")
                }
            } catch (e: Exception) {
                Log.e(TAG, "Exception syncing threat list", e)
            }
        }.start()
    }

    companion object {
        const val ACTION_CONNECT = "com.sentinel.core.START_VPN"
        const val ACTION_DISCONNECT = "com.sentinel.core.STOP_VPN"
        private const val TAG = "LocalVpnService"
        private const val NOTIFICATION_CHANNEL_ID = "Sentinel_Channel"
        
        var logListener: ((String, String, String, String) -> Unit)? = null
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        if (intent != null && ACTION_DISCONNECT == intent.action) {
            disconnect()
            stopForeground(true)
            return START_NOT_STICKY
        } else {
            val notification = createNotification()
            startForeground(1, notification)
            connect()
            return START_STICKY
        }
    }

    private fun createNotification(): Notification {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channel = NotificationChannel(
                NOTIFICATION_CHANNEL_ID,
                "Sentinel Firewall",
                NotificationManager.IMPORTANCE_LOW
            )
            val manager = getSystemService(NotificationManager::class.java)
            manager?.createNotificationChannel(channel)
        }

        val builder = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            Notification.Builder(this, NOTIFICATION_CHANNEL_ID)
        } else {
            @Suppress("DEPRECATION")
            Notification.Builder(this)
        }

        return builder
            .setContentTitle("Pare-feu Sentinel Actif")
            .setContentText("Le trafic réseau est sécurisé localement.")
            .setSmallIcon(android.R.drawable.ic_secure)
            .build()
    }

    override fun onDestroy() {
        disconnect()
        super.onDestroy()
    }

    private fun connect() {
        if (mThread != null) {
            return
        }
        mThread = Thread(this, "LocalVpnThread")
        isRunning.set(true)
        mThread?.start()
    }

    private fun disconnect() {
        isRunning.set(false)
        mThread?.interrupt()
        mThread = null
        try {
            mInterface?.close()
        } catch (e: Exception) {
            Log.e(TAG, "Error closing interface", e)
        }
        mInterface = null
    }

    override fun run() {
        try {
            val builder = Builder()
                .addAddress("10.0.0.2", 24)
                .addRoute("0.0.0.0", 0)
                .setSession("Sentinel Firewall")
                .setBlocking(true)

            mInterface = builder.establish()

            if (mInterface == null) {
                Log.e(TAG, "Failed to establish VPN interface.")
                return
            }

            val inputStream = FileInputStream(mInterface!!.fileDescriptor)
            val packet = ByteBuffer.allocate(32767)

            Log.i(TAG, "VPN VPNService running. Listening for packets...")

            while (isRunning.get()) {
                val length = inputStream.read(packet.array())
                if (length > 0) {
                    packet.limit(length)
                    
                    parsePacket(packet)
                    
                    packet.clear()
                }
                Thread.sleep(1)
            }
        } catch (e: Exception) {
            Log.e(TAG, "Exception in VPN loop", e)
        } finally {
            disconnect()
        }
    }
    
    private fun parsePacket(packet: ByteBuffer) {
        val buffer = packet.array()
        if (buffer.size < 20) return
        
        // IPv4 Header
        val versionAndIHL = buffer[0].toInt() and 0xFF
        val version = versionAndIHL shr 4
        if (version != 4) return // Only IPv4
        
        val ihl = versionAndIHL and 0x0F
        val ipHeaderLength = ihl * 4
        
        val protocol = buffer[9].toInt() and 0xFF
        
        val destIp = "${buffer[16].toInt() and 0xFF}.${buffer[17].toInt() and 0xFF}.${buffer[18].toInt() and 0xFF}.${buffer[19].toInt() and 0xFF}"
        
        if (protocol == 17) { // UDP
            val udpOffset = ipHeaderLength
            if (buffer.size < udpOffset + 8) return
            val destPort = ((buffer[udpOffset + 2].toInt() and 0xFF) shl 8) or (buffer[udpOffset + 3].toInt() and 0xFF)
            
            if (destPort == 53) {
                val domain = extractDnsQuestion(buffer, udpOffset + 8, packet.limit())
                if (domain != null) {
                    handleExtractedDomain("UDP", destIp, domain)
                }
            }
        } else if (protocol == 6) { // TCP
            val tcpOffset = ipHeaderLength
            if (buffer.size < tcpOffset + 20) return
            val destPort = ((buffer[tcpOffset + 2].toInt() and 0xFF) shl 8) or (buffer[tcpOffset + 3].toInt() and 0xFF)
            
            if (destPort == 443) {
                val dataOffset = tcpOffset + (((buffer[tcpOffset + 12].toInt() and 0xFF) shr 4) * 4)
                if (packet.limit() > dataOffset) {
                    val sni = extractSni(buffer, dataOffset, packet.limit())
                    if (sni != null) {
                        handleExtractedDomain("TCP", destIp, sni)
                    }
                }
            }
        }
    }

    private fun handleExtractedDomain(protocol: String, destIp: String, domain: String) {
        if (bloomFilter.contains(domain)) {
            logListener?.invoke("BLOCK", protocol, destIp, domain)
            // Dropped
        } else {
            logListener?.invoke("ALLOW", protocol, destIp, domain)
            // Simulated forwarding
        }
    }
    
    private fun extractDnsQuestion(buffer: ByteArray, payloadOffset: Int, limit: Int): String? {
        // DNS Header is 12 bytes
        var offset = payloadOffset + 12
        if (offset >= limit) return null
        
        val domain = StringBuilder()
        while (offset < limit) {
            val len = buffer[offset].toInt() and 0xFF
            if (len == 0) break
            if ((len and 0xC0) == 0xC0) break // Pointer, ignore for simple parsing
            offset++
            if (offset + len >= limit) return null
            for (i in 0 until len) {
                domain.append(buffer[offset + i].toChar())
            }
            domain.append('.')
            offset += len
        }
        if (domain.isNotEmpty() && domain.last() == '.') {
            domain.deleteCharAt(domain.length - 1)
        }
        return if (domain.isNotEmpty()) domain.toString() else null
    }

    private fun extractSni(buffer: ByteArray, offset: Int, limit: Int): String? {
        try {
            // Check TLS Handshake record (ContentType: 22, ProtocolVersion: 3.x)
            var currentOffset = offset
            if (currentOffset + 5 >= limit) return null
            if (buffer[currentOffset] != 0x16.toByte()) return null // Not a handshake
            
            // Handshake message type: Client Hello (1)
            currentOffset += 5
            if (currentOffset >= limit || buffer[currentOffset] != 0x01.toByte()) return null
            
            // Skip up to session ID
            currentOffset += 38
            if (currentOffset >= limit) return null
            
            val sessionIdLen = buffer[currentOffset].toInt() and 0xFF
            currentOffset += 1 + sessionIdLen
            if (currentOffset + 2 >= limit) return null
            
            val cipherSuitesLen = ((buffer[currentOffset].toInt() and 0xFF) shl 8) or (buffer[currentOffset + 1].toInt() and 0xFF)
            currentOffset += 2 + cipherSuitesLen
            if (currentOffset >= limit) return null
            
            val compressionMethodsLen = buffer[currentOffset].toInt() and 0xFF
            currentOffset += 1 + compressionMethodsLen
            if (currentOffset + 2 >= limit) return null
            
            val extensionsLen = ((buffer[currentOffset].toInt() and 0xFF) shl 8) or (buffer[currentOffset + 1].toInt() and 0xFF)
            currentOffset += 2
            
            val endOffset = Math.min(currentOffset + extensionsLen, limit)
            while (currentOffset + 4 <= endOffset) {
                val extType = ((buffer[currentOffset].toInt() and 0xFF) shl 8) or (buffer[currentOffset + 1].toInt() and 0xFF)
                val extLen = ((buffer[currentOffset + 2].toInt() and 0xFF) shl 8) or (buffer[currentOffset + 3].toInt() and 0xFF)
                currentOffset += 4
                
                if (extType == 0) { // Server Name Indication
                    if (currentOffset + 2 <= endOffset) {
                        val listLen = ((buffer[currentOffset].toInt() and 0xFF) shl 8) or (buffer[currentOffset + 1].toInt() and 0xFF)
                        var listOffset = currentOffset + 2
                        if (listOffset + 3 <= endOffset && buffer[listOffset] == 0x00.toByte()) { // HostName type
                            val nameLen = ((buffer[listOffset + 1].toInt() and 0xFF) shl 8) or (buffer[listOffset + 2].toInt() and 0xFF)
                            listOffset += 3
                            if (listOffset + nameLen <= endOffset) {
                                return String(buffer, listOffset, nameLen)
                            }
                        }
                    }
                }
                currentOffset += extLen
            }
        } catch (e: Exception) {
            // Ignore parse errors on malformed packets
        }
        return null
    }
}
