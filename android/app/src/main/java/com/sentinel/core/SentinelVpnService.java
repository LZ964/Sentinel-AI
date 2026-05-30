package com.sentinel.core;

import android.content.Intent;
import android.net.VpnService;
import android.os.ParcelFileDescriptor;
import android.util.Log;

public class SentinelVpnService extends VpnService {

    private static final String TAG = "SentinelVpnService";
    private Thread mThread;
    private ParcelFileDescriptor mInterface;
    
    private TorProxyManager torProxyManager;
    private MullvadWireGuardManager wireGuardManager;
    private String currentMode = "standard";

    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        if (intent != null && intent.getAction() != null) {
            String action = intent.getAction();
            if (action.equals("com.sentinel.core.CONNECT_TOR")) {
                currentMode = "tor";
            } else if (action.equals("com.sentinel.core.CONNECT_MULLVAD")) {
                currentMode = "mullvad";
            } else {
                currentMode = "standard";
            }
        }
        
        Log.i(TAG, "Starting VpnService in mode: " + currentMode);
        torProxyManager = new TorProxyManager(this);
        wireGuardManager = new MullvadWireGuardManager();
        
        mThread = new Thread(new Runnable() {
            @Override
            public void run() {
                try {
                    Builder builder = new Builder();
                    builder.setSession("Sentinel Firewall");
                    builder.addAddress("10.0.0.2", 24);
                    // Add routes depending on what needs to be intercepted
                    // builder.addRoute("0.0.0.0", 0); 
                    
                    if (currentMode.equals("mullvad")) {
                        builder.addDnsServer("1.1.1.1");
                    }
                    
                    mInterface = builder.establish();
                    Log.i(TAG, "VPN Interface established");
                    
                    if (currentMode.equals("tor")) {
                        torProxyManager.startTorDaemon();
                        Log.i(TAG, "Routing VPN traffic to Tor SOCKS5 (9050) via tun2socks configuration.");
                    } else if (currentMode.equals("mullvad")) {
                        wireGuardManager.connectToMullvad(mInterface.getFd(), "premium_account_id");
                    }
                    
                    // Simple infinite loop to keep the process alive
                    // In a real implementation, we would read/write packets from mInterface.getFileDescriptor()
                    while (!Thread.currentThread().isInterrupted()) {
                        Thread.sleep(1000);
                    }
                } catch (Exception e) {
                    Log.e(TAG, "Error in VPN Service", e);
                } finally {
                    try {
                        if (currentMode.equals("tor")) torProxyManager.stopTorDaemon();
                        if (currentMode.equals("mullvad")) wireGuardManager.disconnect();
                        
                        if (mInterface != null) {
                            mInterface.close();
                            mInterface = null;
                        }
                    } catch (Exception e) {
                        // ignore
                    }
                }
            }
        }, "SentinelVpnThread");
        
        mThread.start();
        return START_STICKY;
    }

    @Override
    public void onDestroy() {
        if (mThread != null) {
            mThread.interrupt();
        }
        if (torProxyManager != null) torProxyManager.stopTorDaemon();
        if (wireGuardManager != null) wireGuardManager.disconnect();
        super.onDestroy();
    }
}
