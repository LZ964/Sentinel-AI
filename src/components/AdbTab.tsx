import React, { useEffect, useState, useRef } from "react";

export default function AdbTab() {
  const [logs, setLogs] = useState<string[]>([]);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const logEvents = [
      "daemon not running; starting now at tcp:5037",
      "daemon started successfully",
      "connected to device offline-first-mode",
      "logcat -v threadtime -b system",
      "ActivityManager: Start proc com.sentinel.security for activity",
      "SecurityService: Verifying kernel integrity...",
      "Selinux: permissive mode denied.",
    ];
    let step = 0;
    const interval = setInterval(() => {
      if (step < logEvents.length) {
        setLogs(prev => [...prev, logEvents[step]]);
        step++;
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
      }
    }, 1200);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="h-full w-full bg-black text-green-500 font-mono p-4 overflow-y-auto">
      <div className="mb-4 text-slate-400 border-b border-slate-800 pb-2 text-xs">
        GNU/Linux Terminal - Sentinel ADB Bridge
      </div>
      
      {logs.map((log, idx) => (
        <div key={idx} className="mb-1 text-sm break-all">
          <span className="text-green-300 font-bold mr-2">user@sentinel:~$</span>
          {log}
        </div>
      ))}
      
      <div className="mt-1 flex items-center text-sm">
        <span className="text-green-300 font-bold mr-2">user@sentinel:~$</span>
        <span className="w-2 h-4 bg-green-500 animate-pulse"></span>
      </div>
      <div ref={bottomRef} />
    </div>
  );
};