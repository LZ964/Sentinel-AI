package com.sentinel.core;

import android.app.Activity;
import android.content.Intent;
import android.net.VpnService;
import androidx.activity.result.ActivityResult;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.ActivityCallback;
import com.getcapacitor.annotation.CapacitorPlugin;

@CapacitorPlugin(name = "NetworkProxy")
public class NetworkProxyPlugin extends Plugin {

    @PluginMethod
    public void connect(PluginCall call) {
        String mode = call.getString("mode", "standard");
        
        Intent vpnIntent = VpnService.prepare(getContext());
        if (vpnIntent != null) {
            // Need to ask the user for permission
            startActivityForResult(call, vpnIntent, "vpnResult");
            return;
        }

        startVpn(mode, call);
    }

    @ActivityCallback
    private void vpnResult(PluginCall call, ActivityResult result) {
        if (result.getResultCode() == Activity.RESULT_OK) {
            String mode = call.getString("mode", "standard");
            startVpn(mode, call);
        } else {
            call.reject("VPN permission denied by user.");
        }
    }

    private void startVpn(String mode, PluginCall call) {
        Intent intent = new Intent(getContext(), SentinelVpnService.class);
        intent.setAction("com.sentinel.core.CONNECT_" + mode.toUpperCase());
        
        getContext().startService(intent);
        
        JSObject ret = new JSObject();
        ret.put("status", "connected");
        ret.put("mode", mode);
        call.resolve(ret);
    }
    
    @PluginMethod
    public void disconnect(PluginCall call) {
        Intent intent = new Intent(getContext(), SentinelVpnService.class);
        getContext().stopService(intent);
        
        JSObject ret = new JSObject();
        ret.put("status", "disconnected");
        call.resolve(ret);
    }
}
