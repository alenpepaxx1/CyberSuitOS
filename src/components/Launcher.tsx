/* COPYRIGHT ALEN PEPA */
import React from 'react';
import { motion } from 'motion/react';
import { 
  LayoutDashboard, Globe, Target, Mail, Lock, Hash, 
  Terminal, Eye, Search, MessageSquare, Settings, X, Zap, Code
} from 'lucide-react';
import { cn } from '@/src/lib/utils';
import { ToolId } from '../types';

interface LauncherProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (toolId: ToolId) => void;
  activeTool: ToolId;
}

export default function Launcher({ isOpen, onClose, onSelect, activeTool }: LauncherProps) {
  const tools = [
    { id: 'dashboard', name: 'System Status', icon: LayoutDashboard, color: 'text-blue-400', desc: 'Main control center and real-time SIEM monitoring.' },
    { id: 'topology', name: 'Network Map', icon: Globe, color: 'text-emerald-400', desc: 'Interactive D3 visualization of network infrastructure.' },
    { id: 'cyber-range', name: 'Cyber Range', icon: Target, color: 'text-red-400', desc: 'Advanced attack simulation and log analysis training.' },
    { id: 'phishing', name: 'Phishing Lab', icon: Mail, color: 'text-blue-400', desc: 'AI-driven social engineering campaign generator.' },
    { id: 'passwords', name: 'Password Lab', icon: Lock, color: 'text-cyber-green', desc: 'Brute-force simulation and entropy analysis.' },
    { id: 'crypto', name: 'Crypto Engine', icon: Hash, color: 'text-purple-400', desc: 'Multi-algorithm encryption and decryption suite.' },
    { id: 'network', name: 'Network OSINT', icon: Globe, color: 'text-orange-400', desc: 'Domain and IP intelligence gathering tools.' },
    { id: 'payloads', name: 'Payload Lab', icon: Terminal, color: 'text-red-400', desc: 'Exploit development and payload obfuscation.' },
    { id: 'stego', name: 'Stego Lab', icon: Eye, color: 'text-pink-400', desc: 'Hidden data detection and extraction engine.' },
    { id: 'python-lab', name: 'Python Lab', icon: Code, color: 'text-yellow-400', desc: 'WASM-powered Python scripting environment for security automation.' },
    { id: 'dorks', name: 'Dork Explorer', icon: Search, color: 'text-orange-400', desc: 'Advanced Google Dorking and OSINT search operator engine.' },
    { id: 'scanner', name: 'Vulnerability Scan', icon: Search, color: 'text-yellow-400', desc: 'Automated security auditing and AI reporting.' },
    { id: 'anonymous-chat', name: 'Anonymous System', icon: MessageSquare, color: 'text-cyan-400', desc: 'Secure, end-to-end encrypted communication.' },
    { id: 'settings', name: 'System Settings', icon: Settings, color: 'text-gray-400', desc: 'OS configuration and interface customization.' },
  ];

  if (!isOpen) return null;

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] bg-cyber-bg/95 backdrop-blur-xl p-12 overflow-y-auto custom-scrollbar"
    >
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-12">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-cyber-green/10 rounded-xl border border-cyber-green/20">
              <Zap className="text-cyber-green w-8 h-8" />
            </div>
            <div>
              <h1 className="text-3xl font-mono font-bold text-cyber-header tracking-tighter">TOOL<span className="text-cyber-green">LAUNCHER</span></h1>
              <p className="text-xs font-mono text-cyber-text/60 uppercase tracking-widest mt-1">Select an operational module to begin</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-4 hover:bg-white/5 rounded-full text-cyber-text/60 hover:text-cyber-header transition-all border border-white/5"
          >
            <X size={32} />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {tools.map((tool, i) => (
            <motion.button
              key={tool.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              onClick={() => {
                onSelect(tool.id as ToolId);
                onClose();
              }}
              className={cn(
                "group flex flex-col p-6 rounded-2xl border transition-all text-left relative overflow-hidden",
                activeTool === tool.id 
                  ? "bg-cyber-green/5 border-cyber-green/30" 
                  : "bg-cyber-card/5 border-cyber-border hover:border-cyber-green/30 hover:bg-cyber-card/10"
              )}
            >
              <div className={cn("p-4 rounded-xl bg-black/40 w-fit mb-6 group-hover:scale-110 transition-transform", tool.color)}>
                <tool.icon size={32} />
              </div>
              <h3 className="text-lg font-bold text-cyber-header mb-2 font-mono uppercase tracking-tight">{tool.name}</h3>
              <p className="text-sm text-cyber-text/60 leading-relaxed font-sans">{tool.desc}</p>
              
              {activeTool === tool.id && (
                <div className="absolute top-4 right-4 flex items-center gap-2 px-2 py-1 bg-cyber-green/20 rounded border border-cyber-green/30">
                  <div className="w-1.5 h-1.5 rounded-full bg-cyber-green animate-pulse" />
                  <span className="text-[8px] font-mono text-cyber-green uppercase font-bold">Active</span>
                </div>
              )}
            </motion.button>
          ))}
        </div>
      </div>
    </motion.div>
  );
}
