/* COPYRIGHT ALEN PEPA */
import React from 'react';
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
  Globe
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

  const handleReset = () => {
    if (confirm("Are you sure you want to reset all system configurations to default?")) {
      setTheme('default');
      setShowScanlines(true);
      setShowGrid(true);
      setFirewallEnabled(true);
      setVpnEnabled(false);
      setUserName('ADMIN_ROOT');
      setClearanceLevel(4);
      logToTerminal("SYSTEM RESET: All configurations restored to factory defaults.", "warn");
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-12">
      <div className="flex items-center gap-4 mb-8">
        <div className="p-3 bg-white/5 rounded-2xl border border-white/10">
          <Settings className="text-gray-400 w-8 h-8" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">System Configuration</h1>
          <p className="text-gray-500 font-mono text-xs uppercase tracking-widest mt-1">Kernel v4.2.0 • Security Policy: Strict</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Appearance Settings */}
        <section className="bg-cyber-card border border-cyber-border rounded-2xl overflow-hidden">
          <div className="p-4 border-b border-cyber-border bg-white/5 flex items-center gap-2">
            <Palette size={18} className="text-emerald-500" />
            <h2 className="text-sm font-bold text-white uppercase tracking-wider">Appearance</h2>
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

            <div className="space-y-4">
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

        {/* Security Settings */}
        <section className="bg-cyber-card border border-cyber-border rounded-2xl overflow-hidden">
          <div className="p-4 border-b border-cyber-border bg-white/5 flex items-center gap-2">
            <ShieldCheck size={18} className="text-blue-500" />
            <h2 className="text-sm font-bold text-white uppercase tracking-wider">Security & Privacy</h2>
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

            <div className="p-4 bg-blue-500/5 border border-blue-500/10 rounded-xl">
              <div className="flex gap-3">
                <Info size={16} className="text-blue-400 shrink-0 mt-0.5" />
                <p className="text-[10px] text-blue-400/80 leading-relaxed font-mono">
                  Security protocols are enforced at the kernel level. Disabling the firewall may expose the system to simulated external threats.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* User Profile */}
        <section className="bg-cyber-card border border-cyber-border rounded-2xl overflow-hidden">
          <div className="p-4 border-b border-cyber-border bg-white/5 flex items-center gap-2">
            <User size={18} className="text-purple-500" />
            <h2 className="text-sm font-bold text-white uppercase tracking-wider">User Profile</h2>
          </div>
          <div className="p-6 space-y-6">
            <div className="space-y-2">
              <label className="text-xs font-mono text-gray-500 uppercase">Operator Identity</label>
              <input 
                type="text" 
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-purple-500/50 transition-all font-mono"
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
                className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer accent-purple-500"
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
            <h2 className="text-sm font-bold text-white uppercase tracking-wider">Maintenance</h2>
          </div>
          <div className="p-6 space-y-4">
            <p className="text-xs text-gray-500 leading-relaxed">
              Perform system-wide maintenance tasks. Be careful with factory reset as it will revert all your custom settings.
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
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
