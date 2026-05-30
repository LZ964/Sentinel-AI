package com.sentinel.core;

import android.os.Bundle;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(AntiMalwareScannerPlugin.class);
        registerPlugin(AppScannerPlugin.class);
        registerPlugin(NetworkProxyPlugin.class);
        super.onCreate(savedInstanceState);
    }
}
