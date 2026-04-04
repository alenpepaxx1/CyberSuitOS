/* COPYRIGHT ALEN PEPA */
import React, { useState } from 'react';
import { cn } from '@/src/lib/utils';
import { motion } from 'motion/react';
import { 
  Settings, 
  Palette, 
  Monitor, 
  ShieldCheck, 
  User, 
  Info, 
  RotateCcw, 
  Check,
  Shield,
  Lock,
  Eye,
  EyeOff,
  Zap,
  Globe,
  Network,
  Cpu,
  TerminalSquare,
  Wifi,
  Server,
  Activity
} from 'lucide-react';
import { useSystem } from '../contexts/SystemContext';
import { logToTerminal } from './Terminal';

const THEMES = [
  { id: 'default', name: 'Emerald (Default)', color: 'bg-emerald-500' },
  { id: 'matrix', name: 'Matrix Green', color: 'bg-green-600' },
  { id: 'cobalt', name: 'Cobalt Blue', color: 'bg-blue-500' },
  { id: 'crimson', name: 'Crimson Red', color: 'bg-red-600' },
];

export default function SystemConfig() {
  const { 
    theme, setTheme, 
    showScanlines, setShowScanlines,
    showGrid, setShowGrid,
    firewallEnabled, setFirewallEnabled,
    vpnEnabled, setVpnEnabled,
    userName, setUserName,
    clearanceLevel, setClearanceLevel
  } = useSystem();

  // Advanced Local States
  const [dnsPrimary, setDnsPrimary] = useState('1.1.1.1');
  const [dnsSecondary, setDnsSecondary] = useState('8.8.8.8');
  const [macSpoofing, setMacSpoofing] = useState(false);
  const [idsMode, setIdsMode] = useState('ai-heuristic');
  const [encryptionProto, setEncryptionProto] = useState('quantum-ntru');
  const [honeypotEnabled, setHoneypotEnabled] = useState(true);
  const [cpuGovernor, setCpuGovernor] = useState('performance');
  const [memAllocation, setMemAllocation] = useState(85);
  const [verboseLogging, setVerboseLogging] = useState(false);
  const [kernelDebug, setKernelDebug] = useState(false);
  const [zeroTrust, setZeroTrust] = useState(true);
  const [kernelIntegrity, setKernelIntegrity] = useState(true);
  const [hsmStatus, setHsmStatus] = useState('active');
  const [aiAutonomy, setAiAutonomy] = useState(80);

  const handleReset = () => {
    if (confirm("Are you sure you want to reset all system configurations to default?")) {
      setTheme('default');
      setShowScanlines(true);
      setShowGrid(true);
      setFirewallEnabled(true);
      setVpnEnabled(false);
      setUserName('ADMIN_ROOT');
      setClearanceLevel(4);
      
      setDnsPrimary('1.1.1.1');
      setDnsSecondary('8.8.8.8');
      setMacSpoofing(false);
      setIdsMode('ai-heuristic');
      setEncryptionProto('quantum-ntru');
      setHoneypotEnabled(true);
      setCpuGovernor('performance');
      setMemAllocation(85);
      setVerboseLogging(false);
      setKernelDebug(false);

      logToTerminal("SYSTEM RESET: All configurations restored to factory defaults.", "warn");
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-12">
      <div className="flex items-center gap-4 mb-8">
        <div className="p-3 bg-white/5 rounded-2xl border border-white/10">
          <Settings className="text-gray-400 w-8 h-8" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Advanced System Configuration</h1>
          <p className="text-gray-500 font-mono text-xs uppercase tracking-widest mt-1">Kernel v4.2.0 • Security Policy: Strict • Root Access: Granted</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Appearance Settings */}
        <section className="bg-cyber-card border border-cyber-border rounded-2xl overflow-hidden">
          <div className="p-4 border-b border-cyber-border bg-white/5 flex items-center gap-2">
            <Palette size={18} className="text-emerald-500" />
            <h2 className="text-sm font-bold text-white uppercase tracking-wider">Interface & Appearance</h2>
          </div>
          <div className="p-6 space-y-6">
            <div className="space-y-3">
              <label className="text-xs font-mono text-gray-500 uppercase">System Theme</label>
              <div className="grid grid-cols-2 gap-2">
                {THEMES.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => {
                      setTheme(t.id);
                      logToTerminal(`Theme changed to: ${t.name}`, "info");
                    }}
                    className={cn(
                      "flex items-center gap-3 p-3 rounded-xl border transition-all text-left",
                      theme === t.id 
                        ? "bg-white/10 border-white/20 shadow-lg" 
                        : "bg-white/5 border-transparent hover:border-white/10"
                    )}
                  >
                    <div className={cn("w-4 h-4 rounded-full shrink-0", t.color)} />
                    <span className="text-xs font-medium text-gray-300">{t.name}</span>
                    {theme === t.id && <Check size={14} className="ml-auto text-emerald-500" />}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-4 pt-4 border-t border-white/5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Monitor size={18} className="text-gray-500" />
                  <div>
                    <div className="text-sm font-bold text-white">Visual Scanlines</div>
                    <div className="text-[10px] text-gray-500 font-mono">CRT-style overlay effect</div>
                  </div>
                </div>
                <button 
                  onClick={() => setShowScanlines(!showScanlines)}
                  className={cn(
                    "w-12 h-6 rounded-full transition-all relative",
                    showScanlines ? "bg-emerald-500" : "bg-white/10"
                  )}
                >
                  <motion.div 
                    animate={{ x: showScanlines ? 26 : 2 }}
                    className="absolute top-1 w-4 h-4 bg-white rounded-full shadow-sm"
                  />
                </button>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Zap size={18} className="text-gray-500" />
                  <div>
                    <div className="text-sm font-bold text-white">Cyber Grid</div>
                    <div className="text-[10px] text-gray-500 font-mono">Background structural grid</div>
                  </div>
                </div>
                <button 
                  onClick={() => setShowGrid(!showGrid)}
                  className={cn(
                    "w-12 h-6 rounded-full transition-all relative",
                    showGrid ? "bg-emerald-500" : "bg-white/10"
                  )}
                >
                  <motion.div 
                    animate={{ x: showGrid ? 26 : 2 }}
                    className="absolute top-1 w-4 h-4 bg-white rounded-full shadow-sm"
                  />
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* Advanced Security Settings */}
        <section className="bg-cyber-card border border-cyber-border rounded-2xl overflow-hidden">
          <div className="p-4 border-b border-cyber-border bg-white/5 flex items-center gap-2">
            <ShieldCheck size={18} className="text-blue-500" />
            <h2 className="text-sm font-bold text-white uppercase tracking-wider">Advanced Security</h2>
          </div>
          <div className="p-6 space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Shield size={18} className={cn(firewallEnabled ? "text-emerald-500" : "text-red-500")} />
                <div>
                  <div className="text-sm font-bold text-white">Active Firewall</div>
                  <div className="text-[10px] text-gray-500 font-mono">Real-time packet filtering</div>
                </div>
              </div>
              <button 
                onClick={() => {
                  setFirewallEnabled(!firewallEnabled);
                  logToTerminal(`Firewall ${!firewallEnabled ? 'ENABLED' : 'DISABLED'}`, firewallEnabled ? 'warn' : 'success');
                }}
                className={cn(
                  "w-12 h-6 rounded-full transition-all relative",
                  firewallEnabled ? "bg-emerald-500" : "bg-red-500/50"
                )}
              >
                <motion.div 
                  animate={{ x: firewallEnabled ? 26 : 2 }}
                  className="absolute top-1 w-4 h-4 bg-white rounded-full shadow-sm"
                />
              </button>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Globe size={18} className={cn(vpnEnabled ? "text-blue-500" : "text-gray-500")} />
                <div>
                  <div className="text-sm font-bold text-white">Neural VPN</div>
                  <div className="text-[10px] text-gray-500 font-mono">Encrypted node tunneling</div>
                </div>
              </div>
              <button 
                onClick={() => {
                  setVpnEnabled(!vpnEnabled);
                  logToTerminal(`Neural VPN ${!vpnEnabled ? 'CONNECTED' : 'DISCONNECTED'}`, vpnEnabled ? 'warn' : 'success');
                }}
                className={cn(
                  "w-12 h-6 rounded-full transition-all relative",
                  vpnEnabled ? "bg-blue-500" : "bg-white/10"
                )}
              >
                <motion.div 
                  animate={{ x: vpnEnabled ? 26 : 2 }}
                  className="absolute top-1 w-4 h-4 bg-white rounded-full shadow-sm"
                />
              </button>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-white/5">
              <div className="flex items-center gap-3">
                <Shield size={18} className={cn(zeroTrust ? "text-emerald-500" : "text-gray-500")} />
                <div>
                  <div className="text-sm font-bold text-white">Zero-Trust Architecture</div>
                  <div className="text-[10px] text-gray-500 font-mono">Micro-segmentation & continuous auth</div>
                </div>
              </div>
              <button 
                onClick={() => {
                  setZeroTrust(!zeroTrust);
                  logToTerminal(`Zero-Trust Architecture ${!zeroTrust ? 'ENFORCED' : 'RELAXED'}`, zeroTrust ? 'warn' : 'success');
                }}
                className={cn(
                  "w-12 h-6 rounded-full transition-all relative",
                  zeroTrust ? "bg-emerald-500" : "bg-white/10"
                )}
              >
                <motion.div 
                  animate={{ x: zeroTrust ? 26 : 2 }}
                  className="absolute top-1 w-4 h-4 bg-white rounded-full shadow-sm"
                />
              </button>
            </div>

            <div className="space-y-4 pt-4 border-t border-white/5">
              <div className="space-y-2">
                <label className="text-xs font-mono text-gray-500 uppercase">IDS/IPS Mode</label>
                <select 
                  value={idsMode}
                  onChange={(e) => {
                    setIdsMode(e.target.value);
                    logToTerminal(`IDS/IPS Mode set to: ${e.target.value.toUpperCase()}`, "info");
                  }}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:border-blue-500/50 transition-all font-mono"
                >
                  <option value="disabled">Disabled (Not Recommended)</option>
                  <option value="permissive">Permissive (Log Only)</option>
                  <option value="strict">Strict (Block Anomalies)</option>
                  <option value="ai-heuristic">AI-Heuristic (Predictive Blocking)</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-mono text-gray-500 uppercase">Encryption Protocol</label>
                <select 
                  value={encryptionProto}
                  onChange={(e) => {
                    setEncryptionProto(e.target.value);
                    logToTerminal(`Encryption Protocol set to: ${e.target.value.toUpperCase()}`, "info");
                  }}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:border-blue-500/50 transition-all font-mono"
                >
                  <option value="aes-256">AES-256-GCM</option>
                  <option value="chacha20">ChaCha20-Poly1305</option>
                  <option value="quantum-ntru">Quantum-Resistant NTRU</option>
                </select>
              </div>

              <div className="flex items-center justify-between pt-2">
                <div className="flex items-center gap-3">
                  <Server size={18} className={cn(honeypotEnabled ? "text-amber-500" : "text-gray-500")} />
                  <div>
                    <div className="text-sm font-bold text-white">Active Honeypots</div>
                    <div className="text-[10px] text-gray-500 font-mono">Deploy decoy nodes</div>
                  </div>
                </div>
                <button 
                  onClick={() => {
                    setHoneypotEnabled(!honeypotEnabled);
                    logToTerminal(`Honeypot Nodes ${!honeypotEnabled ? 'DEPLOYED' : 'OFFLINE'}`, honeypotEnabled ? 'warn' : 'info');
                  }}
                  className={cn(
                    "w-12 h-6 rounded-full transition-all relative",
                    honeypotEnabled ? "bg-amber-500" : "bg-white/10"
                  )}
                >
                  <motion.div 
                    animate={{ x: honeypotEnabled ? 26 : 2 }}
                    className="absolute top-1 w-4 h-4 bg-white rounded-full shadow-sm"
                  />
                </button>
              </div>

              <div className="space-y-2 pt-4 border-t border-white/5">
                <div className="flex justify-between">
                  <label className="text-xs font-mono text-gray-500 uppercase">AI Threat Response Autonomy</label>
                  <span className={cn("text-xs font-mono font-bold", aiAutonomy > 80 ? "text-red-400" : "text-blue-400")}>{aiAutonomy}%</span>
                </div>
                <input 
                  type="range" 
                  min="0" 
                  max="100" 
                  value={aiAutonomy}
                  onChange={(e) => setAiAutonomy(parseInt(e.target.value))}
                  className="w-full accent-blue-500"
                />
                <div className="flex justify-between text-[8px] font-mono text-gray-600 uppercase">
                  <span>Manual Only</span>
                  <span>Fully Autonomous (Lethal)</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Network Configuration */}
        <section className="bg-cyber-card border border-cyber-border rounded-2xl overflow-hidden">
          <div className="p-4 border-b border-cyber-border bg-white/5 flex items-center gap-2">
            <Network size={18} className="text-purple-500" />
            <h2 className="text-sm font-bold text-white uppercase tracking-wider">Network Routing</h2>
          </div>
          <div className="p-6 space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-xs font-mono text-gray-500 uppercase">Primary DNS</label>
                <input 
                  type="text" 
                  value={dnsPrimary}
                  onChange={(e) => setDnsPrimary(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:border-purple-500/50 transition-all font-mono"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-mono text-gray-500 uppercase">Secondary DNS</label>
                <input 
                  type="text" 
                  value={dnsSecondary}
                  onChange={(e) => setDnsSecondary(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:border-purple-500/50 transition-all font-mono"
                />
              </div>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-white/5">
              <div className="flex items-center gap-3">
                <Wifi size={18} className={cn(macSpoofing ? "text-emerald-500" : "text-gray-500")} />
                <div>
                  <div className="text-sm font-bold text-white">MAC Spoofing</div>
                  <div className="text-[10px] text-gray-500 font-mono">Randomize hardware address</div>
                </div>
              </div>
              <button 
                onClick={() => {
                  setMacSpoofing(!macSpoofing);
                  logToTerminal(`MAC Spoofing ${!macSpoofing ? 'ENABLED' : 'DISABLED'}`, 'info');
                }}
                className={cn(
                  "w-12 h-6 rounded-full transition-all relative",
                  macSpoofing ? "bg-emerald-500" : "bg-white/10"
                )}
              >
                <motion.div 
                  animate={{ x: macSpoofing ? 26 : 2 }}
                  className="absolute top-1 w-4 h-4 bg-white rounded-full shadow-sm"
                />
              </button>
            </div>
            
            {macSpoofing && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="p-3 bg-white/5 border border-white/10 rounded-xl flex justify-between items-center"
              >
                <span className="text-[10px] font-mono text-gray-500 uppercase">Current Virtual MAC:</span>
                <span className="text-xs font-mono text-emerald-400 font-bold">
                  {Array.from({length: 6}, () => Math.floor(Math.random()*256).toString(16).padStart(2, '0')).join(':').toUpperCase()}
                </span>
              </motion.div>
            )}
          </div>
        </section>

        {/* Hardware & Kernel Tuning */}
        <section className="bg-cyber-card border border-cyber-border rounded-2xl overflow-hidden">
          <div className="p-4 border-b border-cyber-border bg-white/5 flex items-center gap-2">
            <Cpu size={18} className="text-amber-500" />
            <h2 className="text-sm font-bold text-white uppercase tracking-wider">Hardware & Kernel</h2>
          </div>
          <div className="p-6 space-y-6">
            <div className="space-y-2">
              <label className="text-xs font-mono text-gray-500 uppercase">CPU Governor</label>
              <select 
                value={cpuGovernor}
                onChange={(e) => {
                  setCpuGovernor(e.target.value);
                  logToTerminal(`CPU Governor set to: ${e.target.value.toUpperCase()}`, "warn");
                }}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:border-amber-500/50 transition-all font-mono"
              >
                <option value="powersave">Powersave (Low Energy)</option>
                <option value="ondemand">Ondemand (Dynamic Scaling)</option>
                <option value="performance">Performance (Max Clocks)</option>
                <option value="overclocked">Overclocked (Extreme Risk)</option>
              </select>
            </div>

            <div className="space-y-2 pt-2">
              <div className="flex justify-between">
                <label className="text-xs font-mono text-gray-500 uppercase">Memory Allocation Limit</label>
                <span className="text-xs font-mono text-amber-400 font-bold">{memAllocation}%</span>
              </div>
              <input 
                type="range" 
                min="50" 
                max="100" 
                step="1"
                value={memAllocation}
                onChange={(e) => setMemAllocation(parseInt(e.target.value))}
                className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer accent-amber-500"
              />
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-white/5">
              <div className="flex items-center gap-3">
                <TerminalSquare size={18} className={cn(kernelDebug ? "text-red-500" : "text-gray-500")} />
                <div>
                  <div className="text-sm font-bold text-white">Kernel Debug Mode</div>
                  <div className="text-[10px] text-gray-500 font-mono">Expose raw system calls</div>
                </div>
              </div>
              <button 
                onClick={() => {
                  setKernelDebug(!kernelDebug);
                  logToTerminal(`Kernel Debug Mode ${!kernelDebug ? 'ENABLED' : 'DISABLED'}`, 'warn');
                }}
                className={cn(
                  "w-12 h-6 rounded-full transition-all relative",
                  kernelDebug ? "bg-red-500" : "bg-white/10"
                )}
              >
                <motion.div 
                  animate={{ x: kernelDebug ? 26 : 2 }}
                  className="absolute top-1 w-4 h-4 bg-white rounded-full shadow-sm"
                />
              </button>
            </div>
          </div>
        </section>

        {/* User Profile */}
        <section className="bg-cyber-card border border-cyber-border rounded-2xl overflow-hidden">
          <div className="p-4 border-b border-cyber-border bg-white/5 flex items-center gap-2">
            <User size={18} className="text-pink-500" />
            <h2 className="text-sm font-bold text-white uppercase tracking-wider">Operator Profile</h2>
          </div>
          <div className="p-6 space-y-6">
            <div className="space-y-2">
              <label className="text-xs font-mono text-gray-500 uppercase">Operator Identity</label>
              <input 
                type="text" 
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-pink-500/50 transition-all font-mono"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-mono text-gray-500 uppercase">Clearance Level: {clearanceLevel}</label>
              <input 
                type="range" 
                min="1" 
                max="5" 
                step="1"
                value={clearanceLevel}
                onChange={(e) => setClearanceLevel(parseInt(e.target.value))}
                className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer accent-pink-500"
              />
              <div className="flex justify-between text-[8px] font-mono text-gray-600 uppercase">
                <span>Guest</span>
                <span>User</span>
                <span>Analyst</span>
                <span>Admin</span>
                <span>Root</span>
              </div>
            </div>
          </div>
        </section>

        {/* System Maintenance */}
        <section className="bg-cyber-card border border-cyber-border rounded-2xl overflow-hidden">
          <div className="p-4 border-b border-cyber-border bg-white/5 flex items-center gap-2">
            <RotateCcw size={18} className="text-red-500" />
            <h2 className="text-sm font-bold text-white uppercase tracking-wider">Maintenance & Reset</h2>
          </div>
          <div className="p-6 space-y-4">
            <p className="text-xs text-gray-500 leading-relaxed">
              Perform system-wide maintenance tasks. Be careful with factory reset as it will revert all your custom settings, including advanced network and security configurations.
            </p>
            
            <button 
              onClick={handleReset}
              className="w-full flex items-center justify-center gap-2 p-3 bg-red-500/10 text-red-500 border border-red-500/20 rounded-xl text-xs font-bold hover:bg-red-500/20 transition-all"
            >
              <RotateCcw size={14} />
              FACTORY_RESET_OS
            </button>

            <div className="pt-4 border-t border-white/5">
              <div className="flex items-center justify-between text-[10px] font-mono">
                <span className="text-gray-500">Kernel Version</span>
                <span className="text-white">4.2.0-STABLE</span>
              </div>
              <div className="flex items-center justify-between text-[10px] font-mono mt-2">
                <span className="text-gray-500">Build ID</span>
                <span className="text-white">CS-2026-04-01</span>
              </div>
              <div className="flex items-center justify-between text-[10px] font-mono mt-2">
                <span className="text-gray-500">Uptime</span>
                <span className="text-emerald-400">99.999%</span>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
