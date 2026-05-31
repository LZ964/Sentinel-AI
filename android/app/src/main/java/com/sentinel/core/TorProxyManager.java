package com.sentinel.core;

import android.content.Context;
import android.util.Log;
import java.io.File;
import java.io.FileOutputStream;

public class TorProxyManager {
    private static final String TAG = "TorProxyManager";
    private Context context;
    private Process torProcess;

    public TorProxyManager(Context context) {
        this.context = context;
    }

    public void startTorDaemon() {
        Log.i(TAG, "Starting Tor Daemon...");
        try {
            File torDir = context.getDir("tor", Context.MODE_PRIVATE);
            File torrcFile = new File(torDir, "torrc");
            if (!torrcFile.exists()) {
                FileOutputStream fos = new FileOutputStream(torrcFile);
                fos.write("SocksPort 9050\nLog notice stdout".getBytes());
                fos.close();
            }
            
            // Note: libtor.so must be packaged in jniLibs
            String torExecutable = context.getApplicationInfo().nativeLibraryDir + "/libtor.so";
            File torBinary = new File(torExecutable);
            
            if (torBinary.exists()) {
                ProcessBuilder pb = new ProcessBuilder(torExecutable, "-f", torrcFile.getAbsolutePath());
                pb.directory(torDir);
                torProcess = pb.start();
                Log.i(TAG, "Tor Daemon Process Started successfully.");
            } else {
                Log.e(TAG, "libtor.so not found in nativeLibraryDir. Expected for AI Studio preview. Must inject during final build.");
                throw new RuntimeException("libtor.so non trouvé. Le build final (CI/CD) doit inclure Tor en tant que JNI (jniLibs).");
            }
        } catch (Exception e) {
            Log.e(TAG, "Failed to start Tor Daemon", e);
            throw new RuntimeException(e.getMessage());
        }
    }

    public void stopTorDaemon() {
        if (torProcess != null) {
            torProcess.destroy();
            torProcess = null;
            Log.i(TAG, "Tor Daemon stopped.");
        }
    }
}
