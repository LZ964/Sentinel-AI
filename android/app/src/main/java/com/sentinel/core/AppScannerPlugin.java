package com.sentinel.core;

import android.content.pm.ApplicationInfo;
import android.content.pm.PackageInfo;
import android.content.pm.PackageManager;
import com.getcapacitor.JSArray;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

import java.util.List;

@CapacitorPlugin(name = "AppScanner")
public class AppScannerPlugin extends Plugin {

    @PluginMethod
    public void getDeviceSecurityInfo(PluginCall call) {
        JSObject ret = new JSObject();
        ret.put("securityPatch", android.os.Build.VERSION.SECURITY_PATCH);
        ret.put("sdkInt", android.os.Build.VERSION.SDK_INT);
        ret.put("release", android.os.Build.VERSION.RELEASE);
        call.resolve(ret);
    }

    @PluginMethod
    public void getInstalledApps(PluginCall call) {
        try {
            PackageManager pm = getContext().getPackageManager();
            List<PackageInfo> packages = pm.getInstalledPackages(PackageManager.GET_PERMISSIONS);
            
            JSArray appsArray = new JSArray();
            
            for (PackageInfo packageInfo : packages) {
                // Ignore system apps if needed, but let's send them all or filter
                if ((packageInfo.applicationInfo.flags & ApplicationInfo.FLAG_SYSTEM) == 0) {
                    JSObject appObj = new JSObject();
                    appObj.put("packageName", packageInfo.packageName);
                    appObj.put("appName", packageInfo.applicationInfo.loadLabel(pm).toString());
                    
                    JSArray permissionsArray = new JSArray();
                    if (packageInfo.requestedPermissions != null) {
                        for (String perm : packageInfo.requestedPermissions) {
                            permissionsArray.put(perm);
                        }
                    }
                    appObj.put("permissions", permissionsArray);
                    appsArray.put(appObj);
                }
            }
            
            JSObject ret = new JSObject();
            ret.put("apps", appsArray);
            call.resolve(ret);
            
        } catch (Exception e) {
            call.reject("Failed to retrieve installed apps", e);
        }
    }
}
