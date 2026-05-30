package com.sentinel.core;

import android.util.Log;

public class MullvadWireGuardManager {
    private static final String TAG = "MullvadWireGuardManager";

    // JNI interfaces for libwg-go integration
    // public native int wgTurnOn(String ifName, int tunFd, String settings);
    // public native void wgTurnOff(int handle);

    public void connectToMullvad(int tunFd, String mullvadAccountId) {
        Log.i(TAG, "Connecting to Mullvad using WireGuard backend...");
        Log.i(TAG, "Account ID: " + mullvadAccountId);
        
        Log.i(TAG, "Configuring libwg-go tunnel with FileDescriptor: " + tunFd);
        // wgTurnOn("wg0", tunFd, "private_key=...;public_key=...;endpoint=...");
        Log.i(TAG, "WireGuard Tunnel generation mocked for Preview. Must link libwg-go.so on final build.");
    }

    public void disconnect() {
        Log.i(TAG, "Disconnecting from Mullvad WireGuard...");
        // wgTurnOff(handle);
    }
}
