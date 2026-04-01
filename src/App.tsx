/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/* COPYRIGHT ALEN PEPA */
import React, { useState, useEffect } from 'react';
import { 
  Shield, 
  Lock, 
  Hash, 
  Globe, 
  Terminal as TerminalIcon, 
  Settings, 
  LayoutDashboard,
  Menu,
  ChevronRight,
  Mail,
  Target,
  Cpu,
  Activity,
  Zap,
  Eye,
  Search,
  MessageSquare,
  Bot,
  Code
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '@/src/lib/utils';
import { ToolId } from './types';

// Components
import Dashboard from './components/Dashboard';
import PasswordLab from './components/PasswordLab';
import CryptoTool from './components/CryptoTool';
import NetworkTool from './components/NetworkTool';
import VulnerabilityScanner from './components/VulnerabilityScanner';
import NetworkTopology from './components/NetworkTopology';
import CyberRange from './components/CyberRange';
import PhishingSimulator from './components/PhishingSimulator';
import PayloadLab from './components/PayloadLab';
import StegoTool from './components/StegoTool';
import AnonymousChat from './components/AnonymousChat';
import PythonLab from './components/PythonLab';
import SecurityAnalyst from './components/SecurityAnalyst';
import AIAnalyst from './components/AIAnalyst';
import Launcher from './components/Launcher';
import Terminal, { logToTerminal } from './components/Terminal';
import CustomCursor from './components/CustomCursor';

// Contexts & Error Handling
import { SystemProvider, useSystem } from './contexts/SystemContext';
import { ErrorBoundary } from './components/ErrorBoundary';

type Theme = 'default' | 'matrix' | 'cobalt' | 'crimson';

function MainContent() {
  const { activeTool, setActiveTool, setToolTarget, stats } = useSystem();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isAnalystOpen, setIsAnalystOpen] = useState(false);
  const [booting, setBooting] = useState(true);
  const [theme, setTheme] = useState<Theme>('default');
  const [isScanning, setIsScanning] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLauncherOpen, setIsLauncherOpen] = useState(false);

  const handleNavigate = (toolId: string, target?: string) => {
    setActiveTool(toolId);
    if (target) {
      setToolTarget(target);
    } else {
      setToolTarget('');
    }
  };

  const triggerScan = () => {
    setIsScanning(true);
    logToTerminal('SYSTEM SCAN INITIATED: Analyzing all modules...', 'info');
    setTimeout(() => {
      setIsScanning(false);
      logToTerminal('SCAN COMPLETE: No threats detected. System optimized.', 'success');
    }, 3000);
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsLauncherOpen(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    const handleNavigateEvent = (e: any) => {
      if (e.detail?.toolId) {
        handleNavigate(e.detail.toolId, e.detail.target);
      }
    };
    window.addEventListener('navigate-tool', handleNavigateEvent);
    return () => window.removeEventListener('navigate-tool', handleNavigateEvent);
  }, [setActiveTool, setToolTarget]);

  useEffect(() => {
    const timer = setTimeout(() => setBooting(false), 2500);
    return () => clearTimeout(timer);
  }, []);

  const tools = [
    { id: 'dashboard', name: 'Dashboard', icon: LayoutDashboard, color: 'text-emerald-500' },
    { id: 'scanner', name: 'Vulnerability Scanner', icon: Search, color: 'text-red-500' },
    { id: 'topology', name: 'Network Topology', icon: Globe, color: 'text-blue-500' },
    { id: 'cyber-range', name: 'Cyber Range', icon: Target, color: 'text-amber-500' },
    { id: 'payloads', name: 'Payload Lab', icon: TerminalIcon, color: 'text-red-500' },
    { id: 'phishing', name: 'Phishing Lab', icon: Mail, color: 'text-purple-500' },
    { id: 'passwords', name: 'Password Lab', icon: Lock, color: 'text-cyan-500' },
    { id: 'crypto', name: 'Crypto Engine', icon: Hash, color: 'text-indigo-500' },
    { id: 'stego', name: 'Stego Analysis', icon: Eye, color: 'text-pink-500' },
    { id: 'python-lab', name: 'Python Lab', icon: Code, color: 'text-yellow-500' },
    { id: 'network', name: 'Network OSINT', icon: Globe, color: 'text-orange-500' },
    { id: 'analyst', name: 'Security Analyst', icon: Bot, color: 'text-emerald-500' },
    { id: 'anonymous-chat', name: 'Secure Chat', icon: MessageSquare, color: 'text-cyan-500' },
    { id: 'settings', name: 'System Config', icon: Settings, color: 'text-gray-500' },
  ];

  const renderTool = () => {
    switch (activeTool) {
      case 'dashboard': return <Dashboard onNavigate={handleNavigate} />;
      case 'scanner': return <VulnerabilityScanner />;
      case 'topology': return <NetworkTopology />;
      case 'cyber-range': return <CyberRange />;
      case 'payloads': return <PayloadLab />;
      case 'phishing': return <PhishingSimulator />;
      case 'passwords': return <PasswordLab />;
      case 'crypto': return <CryptoTool />;
      case 'stego': return <StegoTool />;
      case 'python-lab': return <PythonLab />;
      case 'network': return <NetworkTool />;
      case 'analyst': return <SecurityAnalyst />;
      case 'anonymous-chat': return <AnonymousChat />;
      case 'settings': return <div className="p-8 text-center text-gray-500 font-mono uppercase tracking-widest">System Configuration Module - Access Restricted</div>;
      default: return <Dashboard onNavigate={handleNavigate} />;
    }
  };

  if (booting) {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center font-mono relative overflow-hidden">
        <div className="cyber-grid opacity-20" />
        <div className="scanline" />
        
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="relative z-10 flex flex-col items-center gap-8"
        >
          <div className="relative">
            <motion.div 
              animate={{ rotate: 360 }}
              transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
              className="w-24 h-24 border-2 border-emerald-500/20 rounded-full border-t-emerald-500"
            />
            <Shield className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-emerald-500 w-10 h-10" />
          </div>
          
          <div className="space-y-2 text-center">
            <h1 className="text-2xl font-bold text-white tracking-[0.3em] uppercase">CyberSuite OS</h1>
            <div className="flex items-center gap-2 text-emerald-500/60 text-[10px] uppercase tracking-widest">
              <span className="animate-pulse">Initializing Kernel</span>
              <span className="w-12 h-[1px] bg-emerald-500/20" />
              <span>v4.2.0-stable</span>
            </div>
          </div>

          <div className="w-64 h-1 bg-white/5 rounded-full overflow-hidden">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: "100%" }}
              transition={{ duration: 2, ease: "easeInOut" }}
              className="h-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]"
            />
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className={cn(
      "min-h-screen bg-[#050505] text-gray-300 font-sans selection:bg-emerald-500/30 selection:text-emerald-500 flex cursor-none",
      theme === 'matrix' && 'matrix-theme',
      theme === 'cobalt' && 'cobalt-theme',
      theme === 'crimson' && 'crimson-theme'
    )}>
      <CustomCursor />
      <div className="cyber-grid" />
      <div className="scanline" />

      {/* Sidebar */}
      <motion.aside 
        initial={false}
        animate={{ width: isSidebarOpen ? 280 : 80 }}
        className="relative z-30 border-r border-white/5 bg-[#0a0a0a] flex flex-col transition-all duration-300"
      >
        <div className="p-6 flex items-center justify-between border-b border-white/5">
          <AnimatePresence mode="wait">
            {isSidebarOpen ? (
              <motion.div 
                key="logo-full"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="flex items-center gap-3"
              >
                <div className="p-2 bg-emerald-500/10 rounded-lg">
                  <Shield className="w-6 h-6 text-emerald-500" />
                </div>
                <span className="font-mono font-bold text-white tracking-tighter text-lg">CYBERSUITE</span>
              </motion.div>
            ) : (
              <motion.div 
                key="logo-small"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="mx-auto p-2 bg-emerald-500/10 rounded-lg"
              >
                <Shield className="w-6 h-6 text-emerald-500" />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <nav className="flex-1 p-4 space-y-2 overflow-y-auto custom-scrollbar">
          {tools.map((tool) => (
            <button
              key={tool.id}
              onClick={() => handleNavigate(tool.id)}
              className={cn(
                "w-full flex items-center gap-4 p-3 rounded-xl transition-all duration-200 group relative",
                activeTool === tool.id 
                  ? "bg-white/5 text-white shadow-[inset_0_0_20px_rgba(255,255,255,0.02)]" 
                  : "text-gray-500 hover:bg-white/[0.02] hover:text-gray-300"
              )}
            >
              <tool.icon className={cn("w-5 h-5 shrink-0", activeTool === tool.id ? tool.color : "group-hover:text-gray-300")} />
              {isSidebarOpen && (
                <span className="text-sm font-medium tracking-wide">{tool.name}</span>
              )}
              {activeTool === tool.id && (
                <motion.div 
                  layoutId="active-pill"
                  className="absolute left-0 w-1 h-6 bg-emerald-500 rounded-r-full"
                />
              )}
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-white/5 space-y-2">
          <button 
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="w-full flex items-center gap-4 p-3 rounded-xl text-gray-500 hover:bg-white/[0.02] transition-all"
          >
            <Menu className="w-5 h-5 shrink-0" />
            {isSidebarOpen && <span className="text-sm">Collapse Sidebar</span>}
          </button>
          <button className="w-full flex items-center gap-4 p-3 rounded-xl text-gray-500 hover:bg-white/[0.02] transition-all">
            <Settings className="w-5 h-5 shrink-0" />
            {isSidebarOpen && <span className="text-sm">System Config</span>}
          </button>
        </div>
      </motion.aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col relative z-10 overflow-hidden">
        {/* Header */}
        <header className="h-16 border-b border-white/5 bg-black/20 backdrop-blur-md flex items-center justify-between px-8">
          <div className="flex items-center gap-6 flex-1">
            <div className="relative max-w-md w-full group">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600 group-focus-within:text-emerald-500 transition-colors" />
              <input 
                type="text" 
                placeholder="Search tools, threats, or documentation... (Ctrl+K)"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-white/5 border border-white/5 rounded-lg pl-10 pr-4 py-2 text-sm focus:outline-none focus:border-emerald-500/50 transition-all"
              />
              
              <AnimatePresence>
                {searchQuery && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="absolute top-full left-0 right-0 mt-2 bg-[#0a0a0a] border border-white/10 rounded-xl shadow-2xl overflow-hidden z-50"
                  >
                    <div className="p-2 max-h-[300px] overflow-y-auto">
                      {tools.filter(t => t.name.toLowerCase().includes(searchQuery.toLowerCase())).length > 0 ? (
                        tools
                          .filter(t => t.name.toLowerCase().includes(searchQuery.toLowerCase()))
                          .map(tool => (
                            <button
                              key={tool.id}
                              onClick={() => {
                                handleNavigate(tool.id);
                                setSearchQuery('');
                              }}
                              className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-white/5 transition-colors text-left group"
                            >
                              <div className={cn("p-2 rounded-lg bg-black/40", tool.color)}>
                                <tool.icon size={16} />
                              </div>
                              <div>
                                <div className="text-sm font-bold text-white group-hover:text-emerald-400 transition-colors">{tool.name}</div>
                                <div className="text-[10px] font-mono text-gray-500 uppercase">System Tool • /{tool.id}</div>
                              </div>
                            </button>
                          ))
                      ) : (
                        <div className="p-4 text-center text-gray-500 font-mono text-xs uppercase tracking-widest">
                          No tools matching "{searchQuery}"
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-500/10 rounded-full border border-emerald-500/20">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[10px] font-mono font-bold text-emerald-500 uppercase tracking-widest">System Secure</span>
            </div>
            
            <div className="w-[1px] h-4 bg-white/10 mx-2" />
            
            <button 
              onClick={() => setIsAnalystOpen(true)}
              className="p-2 text-gray-500 hover:text-white transition-colors relative"
            >
              <MessageSquare className="w-5 h-5" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full border-2 border-[#050505]" />
            </button>
            
            <div className="flex items-center gap-3 pl-4 border-l border-white/10">
              <div className="text-right hidden sm:block">
                <div className="text-xs font-bold text-white">ADMIN_ROOT</div>
                <div className="text-[10px] text-emerald-500/60 font-mono">Level 4 Clearance</div>
              </div>
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white font-bold shadow-lg shadow-emerald-500/20">
                AR
              </div>
            </div>
          </div>
        </header>

        {/* Tool Viewport */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTool}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="h-full"
            >
              {renderTool()}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Footer Stats */}
        <footer className="h-10 border-t border-white/5 bg-black/40 backdrop-blur-md flex items-center justify-between px-6 text-[10px] font-mono uppercase tracking-widest text-gray-500">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <Cpu className="w-3 h-3 text-emerald-500" />
              <span>CPU: <span className="text-white">{stats?.cpu || '0'}%</span></span>
            </div>
            <div className="flex items-center gap-2">
              <Activity className="w-3 h-3 text-blue-500" />
              <span>RAM: <span className="text-white">{stats?.ram || '0'}%</span></span>
            </div>
            <div className="flex items-center gap-2">
              <Zap className="w-3 h-3 text-amber-500" />
              <span>LATENCY: <span className="text-white">24ms</span></span>
            </div>
          </div>
          
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <Globe className="w-3 h-3 text-emerald-500" />
              <span>NODE: <span className="text-white">{stats?.hostname || 'LOCAL_HOST'}</span></span>
            </div>
            <div className="flex items-center gap-2">
              <TerminalIcon className="w-3 h-3 text-gray-500" />
              <span>SHELL: <span className="text-white">ZSH</span></span>
            </div>
            <div className="text-emerald-500/40">
              {new Date().toLocaleTimeString()}
            </div>
          </div>
        </footer>
      </main>

      {/* Permanent Copyright Footer */}
      <div 
        data-copyright="alen-pepa"
        className="fixed bottom-0 left-0 w-full h-1 bg-cyber-green/10 z-[9999] pointer-events-none" 
      />
      <div 
        data-copyright="alen-pepa"
        className="fixed bottom-2 left-1/2 -translate-x-1/2 z-[9999] pointer-events-none select-none opacity-40 hover:opacity-100 transition-opacity duration-500"
      >
        <span className="text-[8px] font-mono text-cyber-green uppercase tracking-[0.5em] whitespace-nowrap">
          © {new Date().getFullYear()} ALEN PEPA • CYBERSUITE OS • ALL RIGHTS RESERVED
        </span>
      </div>

      {/* AI Analyst Overlay */}
      <AIAnalyst isOpen={isAnalystOpen} onClose={() => setIsAnalystOpen(false)} />
      
      {/* Quick Launcher */}
      <Launcher 
        isOpen={isLauncherOpen} 
        onClose={() => setIsLauncherOpen(false)} 
        onSelect={(id) => {
          handleNavigate(id);
          setIsLauncherOpen(false);
        }}
        activeTool={activeTool as ToolId}
      />

      {/* Terminal Overlay */}
      <Terminal />
    </div>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <SystemProvider>
        <MainContent />
      </SystemProvider>
    </ErrorBoundary>
  );
}
