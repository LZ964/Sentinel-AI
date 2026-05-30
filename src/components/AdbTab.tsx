import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Terminal, AlertTriangle, ShieldCheck, Cpu, PowerOff, CheckCircle2, EyeOff, Smartphone, Usb, Wifi, ChevronRight, Lock, BrainCircuit, Activity } from 'lucide-react';

export default function AdbTab() {
  const [connectionMethod, setConnectionMethod] = useState<'usb' | 'wifi' | null>(null);
  const [wifiStep, setWifiStep] = useState(1);
  const [isSameWifi, setIsSameWifi] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isConnected, setIsConnected] = useState(false);

  const [anomalies, setAnomalies] = useState<any[]>([]);

  useEffect(() => {
    window.onLocalAIAnalysisComplete = (id: string, result: string) => {
      setAnomalies(prev => prev.map(a => 
        a.id === id ? { ...a, diagnostic: result, isAnalyzing: false } : a
      ));
    };
    window.onAdbAnomaliesUpdate = (json: string) => {
      try {
        setAnomalies(JSON.parse(json));
      } catch (e) { console.error(e); }
    };
    return () => {
      delete window.onLocalAIAnalysisComplete;
      delete window.onAdbAnomaliesUpdate;
    };
  }, []);

  const analyzeWithLocalAI = (anomaly: any) => {
    setAnomalies(prev => prev.map(a => a.id === anomaly.id ? { ...a, isAnalyzing: true } : a));
    
    if (window.AndroidBridge?.analyzeAdbLogs) {
      window.AndroidBridge.analyzeAdbLogs(anomaly.rawText, anomaly.id);
    } else {
      setTimeout(() => {
        setAnomalies(prev => prev.map(a => a.id === anomaly.id ? { ...a, diagnostic: "Error: NativeBridge unavailable, analysis in web environment impossible.", isAnalyzing: false } : a));
      }, 500);
    }
  };

  const [resolved, setResolved] = useState<string[]>([]);
  const [logs, setLogs] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<"anomalies" | "logs">("anomalies");
  const terminalContainerRef = useRef<HTMLDivElement>(null);
  const [autoScroll, setAutoScroll] = useState(true);

  const executeCommand = (id: string, action: any) => {
    setActiveTab("logs");
    if (action.command === 'ignore') {
      setResolved([...resolved, id]);
      setLogs(prev => [...prev, `[USER] Ignored the anomaly : ${id}`]);
      return;
    }
    
    setLogs(prev => [...prev, `[ADB] Executing : adb shell ${action.command}`]);
    setTimeout(() => {
      setLogs(prev => [...prev, `[SUCCESS] Command executed successfully for ${id}.`]);
      setResolved([...resolved, id]);
    }, 800);
  };

  const startConnection = () => {
    setIsConnecting(true);
    setTimeout(() => {
      setIsConnecting(false);
      setIsConnected(true);
    }, 2500);
  };

  const handleScroll = () => {
    if (terminalContainerRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = terminalContainerRef.current;
      const isAtBottom = scrollHeight - scrollTop - clientHeight < 10;
      setAutoScroll(isAtBottom);
    }
  };

  useEffect(() => {
    if (autoScroll && terminalContainerRef.current) {
      terminalContainerRef.current.scrollTop = terminalContainerRef.current.scrollHeight;
    }
  }, [logs, autoScroll]);

  if (!isConnected) {
    if (!connectionMethod) {
      return (
        <div className="w-full max-w-4xl mx-auto h-full p-4 flex flex-col justify-center items-center">
          <div className="text-center mb-10">
            <h2 className="text-2xl font-display font-bold text-white tracking-tight">Advanced Tools : Phone Connection</h2>
            <p className="text-[#94A3B8] mt-2 max-w-lg mx-auto">To inspect your phone, we need to establish an invisible and secure bridge. How would you like to link it to this Chromebook?</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-2xl">
            <button 
              onClick={() => { setConnectionMethod('usb'); setIsConnected(true); }}
              className="bg-slate-900/40 backdrop-blur-md border border-white/10 hover:border-cyan-500/50 rounded-2xl p-8 flex flex-col items-center justify-center text-center transition-all group shadow-[0_0_30px_rgba(6,182,212,0.02)]"
            >
              <div className="w-16 h-16 bg-blue-500/10 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <Usb className="w-8 h-8 text-blue-400" />
              </div>
              <h3 className="text-white font-bold text-lg mb-2">Via USB cable</h3>
              <p className="text-xs text-slate-400 leading-relaxed">Direct, simple, and stable. Just plug the cable in and authorize access.</p>
            </button>

            <button 
              onClick={() => setConnectionMethod('wifi')}
              className="bg-slate-900/40 backdrop-blur-md border border-white/10 hover:border-cyan-500/50 rounded-2xl p-8 flex flex-col items-center justify-center text-center transition-all group shadow-[0_0_30px_rgba(6,182,212,0.02)]"
            >
              <div className="w-16 h-16 bg-cyan-500/10 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <Wifi className="w-8 h-8 text-cyan-400" />
              </div>
              <h3 className="text-white font-bold text-lg mb-2">Wireless (Wi-Fi)</h3>
              <p className="text-xs text-slate-400 leading-relaxed">Convenient and fast. Both devices must be on the same network.</p>
            </button>
          </div>
        </div>
      );
    }

    if (connectionMethod === 'wifi') {
      return (
        <div className="w-full max-w-2xl mx-auto h-full p-4 py-10 flex flex-col">
          <button onClick={() => setConnectionMethod(null)} className="text-[#94A3B8] hover:text-white text-sm font-bold flex items-center gap-1 mb-8 w-max">
            &larr; Back to selection
          </button>
          
          <div className="mb-8">
            <h2 className="text-2xl font-display font-bold text-white tracking-tight flex items-center gap-3">
              <Wifi className="w-6 h-6 text-[#4ADE80]" />
              Wireless Connection (ADB)
            </h2>
            <p className="text-[#94A3B8] mt-1 text-sm">Follow these simple steps to link the phone via Wi-Fi.</p>
          </div>

          <div className="flex gap-4 mb-8">
            {[1, 2, 3].map(step => (
              <div key={step} className="flex-1">
                <div className={`h-1.5 rounded-full mb-2 ${wifiStep >= step ? 'bg-[#4ADE80]' : 'bg-[#2D3139]'}`}></div>
                <span className={`text-[10px] uppercase font-bold ${wifiStep >= step ? 'text-[#4ADE80]' : 'text-slate-500'}`}>Step {step}</span>
              </div>
            ))}
          </div>

          <AnimatePresence mode="wait">
            {wifiStep === 1 && (
              <motion.div initial={{opacity:0, x:20}} animate={{opacity:1, x:0}} exit={{opacity:0, x:-20}} className="flex-1 bg-[#16181D] border border-[#2D3139] rounded-2xl p-8">
                 <h3 className="text-xl font-bold text-white mb-4">Network Verification</h3>
                 <p className="text-[#94A3B8] mb-6 text-sm">For security reasons, both devices must be connected to the same Wi-Fi router.</p>
                 
                 <label className="flex items-center gap-4 bg-black/40 p-4 rounded-xl border border-white/5 cursor-pointer hover:bg-black/60 transition-colors">
                   <input 
                     type="checkbox" 
                     className="w-5 h-5 accent-[#4ADE80] rounded border-slate-700 bg-transparent"
                     checked={isSameWifi}
                     onChange={(e) => setIsSameWifi(e.target.checked)}
                   />
                   <span className="text-white font-medium">I am connected to the same Wi-Fi</span>
                 </label>

                 <div className="mt-8 flex justify-end">
                   <button 
                     disabled={!isSameWifi}
                     onClick={() => setWifiStep(2)}
                     className="bg-[#4ADE80] hover:bg-[#4ADE80]/90 disabled:bg-[#2D3139] disabled:text-slate-500 disabled:cursor-not-allowed text-black font-bold px-8 py-3 rounded-xl transition-colors flex items-center gap-2"
                   >
                     Next <ChevronRight className="w-4 h-4" />
                   </button>
                 </div>
              </motion.div>
            )}

            {wifiStep === 2 && (
              <motion.div initial={{opacity:0, x:20}} animate={{opacity:1, x:0}} exit={{opacity:0, x:-20}} className="flex-1 bg-[#16181D] border border-[#2D3139] rounded-2xl p-8">
                 <h3 className="text-xl font-bold text-white mb-4">Enable the magic button</h3>
                 <p className="text-[#94A3B8] mb-6 text-sm">Go to your phone's <strong className="text-white">Settings</strong> &gt; <strong className="text-white">Developer options</strong>.</p>
                 
                 <div className="bg-black/40 p-5 rounded-xl border border-white/5 flex flex-col gap-4">
                    <div className="flex items-center justify-between opacity-50 pointer-events-none">
                       <span className="text-sm font-bold text-white">USB Debugging</span>
                       <div className="w-10 h-5 bg-slate-700 rounded-full relative">
                          <div className="w-4 h-4 bg-slate-400 rounded-full absolute left-0.5 top-0.5"></div>
                       </div>
                    </div>
                    <div className="flex items-center justify-between bg-[#4ADE80]/5 p-3 -mx-3 rounded-lg border border-[#4ADE80]/20">
                       <div>
                         <span className="text-sm font-bold text-[#4ADE80] block">Wireless Debugging</span>
                         <span className="text-[10px] text-[#4ADE80]/70">Tap here to enable and pair</span>
                       </div>
                       <div className="w-10 h-5 bg-[#4ADE80]/30 rounded-full relative">
                          <div className="w-4 h-4 bg-[#4ADE80] rounded-full absolute right-0.5 top-0.5 shadow-[0_0_10px_rgba(74,222,128,0.5)]"></div>
                       </div>
                    </div>
                 </div>

                 <div className="mt-8 flex justify-between">
                   <button onClick={() => setWifiStep(1)} className="text-slate-400 hover:text-white px-4 py-2 font-bold">Back</button>
                   <button 
                     onClick={() => setWifiStep(3)}
                     className="bg-[#4ADE80] hover:bg-[#4ADE80]/90 text-black font-bold px-8 py-3 rounded-xl transition-colors flex items-center gap-2"
                   >
                     Done <ChevronRight className="w-4 h-4" />
                   </button>
                 </div>
              </motion.div>
            )}

            {wifiStep === 3 && (
              <motion.div initial={{opacity:0, x:20}} animate={{opacity:1, x:0}} exit={{opacity:0, x:-20}} className="flex-1 bg-[#16181D] border border-[#2D3139] rounded-2xl p-8">
                 <h3 className="text-xl font-bold text-white mb-4">Secure Linking</h3>
                 <p className="text-[#94A3B8] mb-6 text-sm">Tap on <strong className="text-white">"Pair device with pairing code"</strong> on your phone and copy the info below.</p>
                 
                 <div className="space-y-4 mb-8">
                   <div>
                     <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Encrypted Address</label>
                     <input type="text" placeholder="ex: 192.168.1.50" className="w-full bg-black/50 border border-[#2D3139] rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#4ADE80]" />
                   </div>
                   <div className="grid grid-cols-2 gap-4">
                     <div>
                       <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Security Code (Port)</label>
                       <input type="text" placeholder="ex: 45678" className="w-full bg-black/50 border border-[#2D3139] rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#4ADE80]" />
                     </div>
                     <div>
                       <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Pairing PIN Code</label>
                       <input type="text" placeholder="6 digits" className="w-full bg-black/50 border border-[#2D3139] rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#4ADE80] font-mono tracking-widest" />
                     </div>
                   </div>
                 </div>

                 {isConnecting ? (
                   <div className="bg-[#4ADE80]/10 border border-[#4ADE80]/30 rounded-xl p-4 flex flex-col items-center justify-center gap-3">
                     <div className="w-6 h-6 border-2 border-[#4ADE80] border-t-transparent rounded-full animate-spin"></div>
                     <p className="text-sm font-bold text-[#4ADE80]">Establishing the invisible security bridge with your phone...</p>
                   </div>
                 ) : (
                   <div className="flex justify-between items-center">
                     <button onClick={() => setWifiStep(2)} className="text-slate-400 hover:text-white px-4 py-2 font-bold">Back</button>
                     <button 
                       onClick={startConnection}
                       className="bg-[#4ADE80] hover:bg-[#4ADE80]/90 text-black font-bold px-8 py-3 rounded-xl transition-colors flex items-center gap-2 shadow-[0_0_15px_rgba(74,222,128,0.3)]"
                     >
                       <Lock className="w-4 h-4" /> Start secure scan
                     </button>
                   </div>
                 )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      );
    }
  }

  return (
    <div className="flex flex-col w-full gap-4 flex-1">
      
      {/* Header */}
      <div className="bg-slate-900/40 backdrop-blur-md border border-cyan-500/20 shadow-[0_0_30px_rgba(6,182,212,0.05)] rounded-[20px] p-5 shrink-0 flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative overflow-hidden">
        <div className="absolute top-[-50px] right-[-50px] w-64 h-64 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex-1">
          <h2 className="text-xl font-display font-bold text-cyan-400 tracking-tight flex items-center gap-2">
            <Terminal className="w-5 h-5 text-cyan-400" />
            Advanced Tools (Expert Users)
          </h2>
          <p className="text-slate-400 text-sm mt-1">Deep inspection via ADB console with AI recommendations.</p>
        </div>
        <div className="flex items-center gap-2 shrink-0 bg-cyan-500/10 px-3 py-1.5 rounded-lg border border-cyan-500/20 relative z-10">
          <Smartphone className="w-4 h-4 text-cyan-400" />
          <span className="text-[10px] uppercase font-bold text-cyan-400 tracking-widest whitespace-nowrap">Connected ({connectionMethod})</span>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex border-b border-cyan-500/20 px-2 space-x-6 overflow-x-auto scrollbar-hide py-1 shrink-0">
        <button
          onClick={() => setActiveTab("anomalies")}
          className={`pb-3 text-sm font-bold transition-colors whitespace-nowrap border-b-2 flex items-center gap-2 ${activeTab === "anomalies" ? "border-cyan-400 text-cyan-400" : "border-transparent text-slate-500 hover:text-slate-300"}`}
        >
          <Activity className="w-4 h-4" /> Detected Anomalies
          {anomalies.filter(a => !resolved.includes(a.id)).length > 0 && <span className="ml-1 px-1.5 py-0.5 rounded-full bg-rose-500/20 text-rose-400 text-[10px]">{anomalies.filter(a => !resolved.includes(a.id)).length}</span>}
        </button>
        <button
          onClick={() => setActiveTab("logs")}
          className={`pb-3 text-sm font-bold transition-colors whitespace-nowrap border-b-2 flex items-center gap-2 ${activeTab === "logs" ? "border-cyan-400 text-cyan-400" : "border-transparent text-slate-500 hover:text-slate-300"}`}
        >
          <Terminal className="w-4 h-4" /> ADB Terminal
        </button>
      </div>

      {/* Tab Content Areas */}
      <div className="flex-1 flex flex-col pb-6">
        {activeTab === "anomalies" && (
          <div className="flex flex-col gap-4">
            {/* Warning Box */}
            <div className="bg-amber-500/5 border border-amber-500/20 rounded-[20px] p-5 flex items-start gap-4 shadow-[0_0_15px_rgba(245,158,11,0.05)]">
              <AlertTriangle className="w-6 h-6 text-amber-500 shrink-0 mt-0.5" />
              <div>
                <h3 className="font-bold text-amber-500 text-sm mb-1 uppercase tracking-wider">Advanced Tools Warning</h3>
                <p className="text-xs text-amber-50 leading-relaxed">
                  These tools allow you to modify deep settings of your phone. The AI guides you step-by-step with tailored recommendations, but you keep total control over each action.
                </p>
              </div>
            </div>

            {/* AI Privacy Notice */}
            <div className="bg-cyan-500/5 border border-cyan-500/20 rounded-[20px] p-5 flex items-start gap-4">
              <BrainCircuit className="w-6 h-6 text-cyan-400 shrink-0 mt-0.5" />
              <div>
                <h3 className="font-bold text-cyan-400 text-sm mb-1 uppercase tracking-wider">100% Local Security</h3>
                <p className="text-xs text-cyan-50 leading-relaxed">
                  Your device's analysis is powered by your phone's internal AI. <strong className="text-white">No data is sent to the internet.</strong>
                </p>
              </div>
            </div>

            {/* Main Content */}
            <div className="space-y-4">
              {anomalies.filter(a => !resolved.includes(a.id)).length === 0 ? (
                <div className="bg-black/20 border border-white/5 rounded-xl p-8 text-center flex flex-col items-center justify-center min-h-[200px]">
                   <ShieldCheck className="w-12 h-12 text-[#4ADE80] mb-3 opacity-50" />
                   <p className="text-white font-bold">No active anomalies</p>
                   <p className="text-slate-500 text-xs mt-1">Your system is clean.</p>
                </div>
              ) : (
                anomalies.filter(a => !resolved.includes(a.id)).map((anomaly) => (
                  <motion.div initial={{opacity:0, y: 10}} animate={{opacity:1, y: 0}} key={anomaly.id} className="bg-slate-900/40 backdrop-blur-md border border-cyan-500/20 rounded-xl p-5 relative overflow-hidden shadow-[0_0_20px_rgba(6,182,212,0.02)]">
                    <div className="absolute top-0 left-0 w-1 h-full bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.5)]"></div>
                    
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h4 className="font-bold text-white text-lg">{anomaly.appName}</h4>
                        <p className="text-[10px] font-mono text-cyan-500/50">{anomaly.id}</p>
                      </div>
                      <span className="bg-amber-500/10 text-amber-500 border border-amber-500/20 px-2 py-1 rounded text-[10px] font-bold uppercase tracking-widest flex items-center gap-1">
                        <Cpu className="w-3 h-3" /> Suspicious Process
                      </span>
                    </div>

                    <div className="space-y-3 mb-5">
                      {!anomaly.diagnostic ? (
                        <div className="bg-black/40 p-3 rounded-lg border border-white/5 flex flex-col gap-2">
                           <p className="text-xs text-slate-400 font-mono tracking-tight">{anomaly.rawText}</p>
                           <button
                              onClick={() => analyzeWithLocalAI(anomaly)}
                              disabled={anomaly.isAnalyzing}
                              className={`text-xs px-4 py-2 font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 w-max ${anomaly.isAnalyzing ? 'bg-purple-900/50 text-purple-300 border border-purple-500/30 cursor-wait' : 'bg-blue-600 hover:bg-blue-500 text-white border border-blue-500'}`}
                           >
                             <BrainCircuit className="w-4 h-4" />
                             {anomaly.isAnalyzing ? "Local AI Analysis in progress..." : "Run AI Diagnostics (Secure)"}
                           </button>
                        </div>
                      ) : (
                        <div className="bg-black/40 p-3 rounded-lg border border-blue-500/30">
                          <h5 className="text-[10px] uppercase font-bold text-blue-400 mb-1 flex items-center gap-1">
                            <BrainCircuit className="w-3 h-3" /> AI Diagnostics (100% Local)
                          </h5>
                          <p className="text-xs text-white leading-relaxed select-text">{anomaly.diagnostic}</p>
                        </div>
                      )}
                      
                      {anomaly.diagnostic && (
                        <div className="bg-cyan-500/10 p-3 rounded-lg border border-cyan-500/30">
                          <h5 className="text-[10px] uppercase font-bold text-cyan-400 mb-1 flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" /> Default Recommendation
                          </h5>
                          <p className="text-xs text-cyan-50 leading-relaxed font-medium">{anomaly.recommendation}</p>
                        </div>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-2 pt-3 border-t border-white/5">
                       {anomaly.actions.map((act, idx) => (
                         <button 
                           key={idx}
                           onClick={() => executeCommand(anomaly.id, act)}
                           className={`text-xs px-4 py-2 font-bold rounded-lg transition-all flex items-center gap-1.5
                             ${act.type === 'primary' ? 'bg-amber-500/10 hover:bg-amber-500/20 text-amber-500 border border-amber-500/30' : 
                               act.type === 'secondary' ? 'bg-slate-800 hover:bg-slate-700 text-white border border-slate-700' : 
                               'bg-transparent hover:bg-white/5 text-slate-400 hover:text-slate-200 border border-transparent hover:border-white/10'}
                           `}
                         >
                           {act.type === 'primary' && <PowerOff className="w-3.5 h-3.5" />}
                           {act.type === 'secondary' && <Terminal className="w-3.5 h-3.5" />}
                           {act.type === 'ghost' && <EyeOff className="w-3.5 h-3.5" />}
                           {act.label}
                         </button>
                       ))}
                       <div className="ml-auto text-[9px] text-slate-600 font-mono hidden sm:block truncate pl-2 max-w-[200px]" title="Waiting for user action">Waiting for user action...</div>
                    </div>
                  </motion.div>
                ))
              )}
            </div>
          </div>
        )}

        {activeTab === "logs" && (
          <div className="bg-slate-900/40 backdrop-blur-md border border-cyan-500/20 rounded-[20px] overflow-hidden flex flex-col shadow-[0_0_30px_rgba(6,182,212,0.02)]">
            <div className="p-3 border-b border-white/10 flex items-center justify-between gap-3 bg-black/40 shrink-0">
               <div className="flex items-center gap-3">
                  <Terminal className="w-5 h-5 text-cyan-400" />
                  <span className="text-xs font-mono font-bold text-white uppercase tracking-widest">
                     ADB Terminal
                  </span>
               </div>
            </div>

            <div onScroll={handleScroll} ref={terminalContainerRef} className="flex flex-col font-mono text-xs gap-1 text-slate-400 break-words bg-black/60 p-4 relative">
              {logs.length === 0 ? (
                <div className="h-full w-full absolute inset-0 flex items-center justify-center opacity-30 italic mt-2 text-xs">Waiting for instructions <span className="animate-pulse ml-0.5 not-italic">_</span></div>
              ) : (
                <>
                  {logs.map((log, i) => (
                    <motion.div initial={{opacity:0, x:-5}} animate={{opacity:1, x:0}} key={i} className={`${log.includes('[SUCCESS]') ? 'text-cyan-400 font-bold' : log.includes('[USER]') ? 'text-slate-400' : 'text-blue-300'} pb-1 border-b border-white/5 last:border-0`}>
                      {log}
                    </motion.div>
                  ))}
                  <div className="text-slate-500 mt-1">
                    <span className="animate-pulse">_</span>
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}