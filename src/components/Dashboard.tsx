/* COPYRIGHT ALEN PEPA */
import React, { useState, useEffect } from 'react';
import { 
  Shield, AlertTriangle, Activity, Globe, Zap, Lock, 
  Terminal, Server, Cpu, Database, Eye, RefreshCw,
  TrendingUp, TrendingDown, Target, Radio, ShieldAlert, ShieldCheck, MessageSquare, ExternalLink, Clock, Loader2, Terminal as TerminalIcon,
  Mail, Hash, Search, Settings, Bot, User, BarChart3, PieChart as PieChartIcon, Map as MapIcon, Layers, Wifi, Fingerprint, Bug
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer, BarChart, Bar, Cell, PieChart, Pie,
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar
} from 'recharts';
import { cn } from '@/src/lib/utils';
import { logToTerminal } from './Terminal';
import ThreatMap from './ThreatMap';

import { useSystem } from '../contexts/SystemContext';

interface ThreatNews {
  title: string;
  summary: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  timestamp: string;
  source: string;
  link: string;
}

interface LogEntry {
  id: string;
  time: string;
  event: string;
  source: string;
  status: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  details?: string;
}

const ATTACK_TRENDS = [
  { time: '00:00', attacks: 45, blocked: 42 },
  { time: '04:00', attacks: 32, blocked: 31 },
  { time: '08:00', attacks: 68, blocked: 65 },
  { time: '12:00', attacks: 124, blocked: 120 },
  { time: '16:00', attacks: 85, blocked: 82 },
  { time: '20:00', attacks: 156, blocked: 150 },
  { time: '23:59', attacks: 92, blocked: 89 },
];

const GEOGRAPHIC_DATA = [
  { name: 'North America', value: 45, color: '#3b82f6' },
  { name: 'Europe', value: 30, color: '#10b981' },
  { name: 'Asia', value: 15, color: '#f59e0b' },
  { name: 'Other', value: 10, color: '#ef4444' },
];

const SYSTEM_INTEGRITY = [
  { subject: 'Firewall', A: 120, fullMark: 150 },
  { subject: 'VPN', A: 98, fullMark: 150 },
  { subject: 'AI Core', A: 86, fullMark: 150 },
  { subject: 'Encryption', A: 99, fullMark: 150 },
  { subject: 'Auth', A: 85, fullMark: 150 },
  { subject: 'Network', A: 65, fullMark: 150 },
];

interface DashboardProps {
  onNavigate?: (toolId: string, target?: string) => void;
}

export default function Dashboard({ onNavigate }: DashboardProps) {
  const { stats, firewallEnabled, vpnEnabled, userName, clearanceLevel } = useSystem();
  const [attackTrends, setAttackTrends] = useState(ATTACK_TRENDS);
  const [geoData, setGeoData] = useState(GEOGRAPHIC_DATA);
  const [mapNodes, setMapNodes] = useState<any[]>([]);
  const [threatNews, setThreatNews] = useState<ThreatNews[]>([]);
  const [tickerIndex, setTickerIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  const TICKER_MESSAGES = [
    "CRITICAL: Zero-day exploit detected in major CDN provider",
    "ALERT: Massive DDoS attack targeting financial infrastructure in East Asia",
    "INFO: New ransomware strain 'CyberLock' identified by AI core",
    "WARNING: Unusual traffic spike detected from unknown ASN in Eastern Europe",
    "NOTICE: System firewall successfully blocked 12,432 intrusion attempts in the last hour",
    "UPDATE: Global threat level elevated to ORANGE due to increased C2 activity"
  ];
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [systemLoad, setSystemLoad] = useState(42);
  const [logs, setLogs] = useState<LogEntry[]>([
    { id: '1', time: new Date().toLocaleTimeString(), event: 'SSH Brute Force Attempt', source: '192.168.1.45', status: 'Blocked', severity: 'high' },
    { id: '2', time: new Date().toLocaleTimeString(), event: 'SQL Injection Detected', source: '45.12.33.102', status: 'Mitigated', severity: 'critical' },
    { id: '3', time: new Date().toLocaleTimeString(), event: 'Unauthorized API Access', source: '10.0.0.12', status: 'Logged', severity: 'medium' },
  ]);
  const [isPaused, setIsPaused] = useState(false);
  const [selectedLog, setSelectedLog] = useState<LogEntry | null>(null);
  const [filter, setFilter] = useState<string>('all');

  const fetchRealLogs = async () => {
    if (isPaused) return;
    try {
      const res = await fetch('/api/logs');
      const newLogs = await res.json();
      setLogs(prev => [...newLogs, ...prev].slice(0, 50));
    } catch (e) {
      console.error("Failed to fetch real logs:", e);
    }
  };

  const fetchThreatIntelligence = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/threat-intel');
      if (response.ok) {
        const data = await response.json();
        setThreatNews(data.news || []);
        if (data.trends?.length > 0) setAttackTrends(data.trends);
        if (data.geo?.length > 0) setGeoData(data.geo);
        if (data.mapNodes?.length > 0) setMapNodes(data.mapNodes);
        setLastUpdated(new Date());
      } else {
        throw new Error('Backend threat intel failed');
      }
    } catch (error) {
      console.error("Failed to fetch threat intelligence:", error);
      const fallbackNews: ThreatNews[] = [
        {
          title: 'New Zero-Day Vulnerability in Popular Web Browser',
          summary: 'A critical remote code execution vulnerability has been discovered in Chromium-based browsers. Users are advised to update immediately.',
          severity: 'critical',
          timestamp: '2 hours ago',
          source: 'CyberSecurity Hub',
          link: '#'
        },
        {
          title: 'Major Ransomware Attack on Healthcare Provider',
          summary: 'A large healthcare network has been hit by a sophisticated ransomware attack, disrupting patient services across multiple states.',
          severity: 'high',
          timestamp: '5 hours ago',
          source: 'Threat Monitor',
          link: '#'
        }
      ];
      setThreatNews(fallbackNews);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchThreatIntelligence();
    const interval = setInterval(fetchThreatIntelligence, 300000); // 5 mins
    const loadInterval = setInterval(() => {
      setSystemLoad(prev => Math.max(10, Math.min(95, prev + (Math.random() * 10 - 5))));
    }, 5000);

    const logInterval = setInterval(fetchRealLogs, 4000);

    const tickerInterval = setInterval(() => {
      setTickerIndex((prev) => (prev + 1) % TICKER_MESSAGES.length);
    }, 5000);

    return () => {
      clearInterval(interval);
      clearInterval(loadInterval);
      clearInterval(logInterval);
      clearInterval(tickerInterval);
    };
  }, [isPaused]);

  return (
    <div className="space-y-6 p-6 bg-[#050505] min-h-full rounded-2xl border border-[#222] cyber-grid">
      {/* Header HUD */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-2">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-cyber-green/10 rounded-xl border border-cyber-green/20 shadow-[0_0_15px_rgba(0,255,65,0.1)]">
            <ShieldCheck className="text-cyber-green animate-pulse" size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tighter uppercase font-mono flex items-center gap-2">
              CyberSuite <span className="text-cyber-green">OS</span> Dashboard
            </h1>
            <div className="flex items-center gap-3 text-[10px] font-mono text-gray-500 uppercase">
              <span className="flex items-center gap-1"><User size={10} className="text-cyber-green" /> Operator: {userName}</span>
              <span className="flex items-center gap-1"><Fingerprint size={10} className="text-cyber-green" /> Clearance: Level {clearanceLevel}</span>
              <span className="flex items-center gap-1"><Clock size={10} className="text-cyber-green" /> System Time: {new Date().toLocaleTimeString()}</span>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <div className="px-4 py-2 bg-black/60 border border-white/5 rounded-lg flex items-center gap-3 shadow-inner">
            <div className="flex flex-col items-end">
              <span className="text-[9px] font-mono text-gray-500 uppercase">System Load</span>
              <span className="text-xs font-mono text-white font-bold">{Math.round(systemLoad)}%</span>
            </div>
            <div className="w-24 h-1.5 bg-white/5 rounded-full overflow-hidden">
              <motion.div 
                className={cn("h-full transition-all duration-1000", 
                  systemLoad > 80 ? "bg-red-500" : systemLoad > 50 ? "bg-amber-500" : "bg-cyber-green"
                )}
                animate={{ width: `${systemLoad}%` }}
              />
            </div>
          </div>
          <button 
            onClick={fetchThreatIntelligence}
            className="p-2.5 bg-cyber-green/10 hover:bg-cyber-green/20 border border-cyber-green/20 rounded-lg text-cyber-green transition-all shadow-[0_0_10px_rgba(0,255,65,0.1)]"
          >
            <RefreshCw size={18} className={isLoading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* Live Ticker */}
      <div className="bg-red-500/5 border border-red-500/10 py-2 px-4 rounded-lg overflow-hidden whitespace-nowrap relative">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-red-500 font-mono text-[10px] font-bold uppercase shrink-0">
            <ShieldAlert size={12} className="animate-pulse" /> LIVE THREAT FEED:
          </div>
          <AnimatePresence mode="wait">
            <motion.span
              key={tickerIndex}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="text-[10px] font-mono text-gray-400 uppercase tracking-[0.2em] truncate"
            >
              {TICKER_MESSAGES[tickerIndex]}
            </motion.span>
          </AnimatePresence>
        </div>
      </div>

      {/* Main Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Active Threats', value: firewallEnabled ? '1,242' : '8,421', icon: AlertTriangle, color: firewallEnabled ? 'text-amber-500' : 'text-red-500', trend: firewallEnabled ? '+12%' : '+450%', trendUp: !firewallEnabled, desc: 'Real-time detected vectors' },
          { label: 'Blocked Attacks', value: firewallEnabled ? '45.2k' : '0', icon: Shield, color: firewallEnabled ? 'text-emerald-500' : 'text-gray-500', trend: firewallEnabled ? '+5.4%' : '-100%', trendUp: firewallEnabled, desc: 'Successfully mitigated probes' },
          { label: 'System Health', value: firewallEnabled ? '99.8%' : '64.2%', icon: Activity, color: firewallEnabled ? 'text-blue-500' : 'text-red-500', trend: firewallEnabled ? 'Stable' : 'Critical', trendUp: firewallEnabled, desc: 'Core kernel integrity status' },
          { label: 'Neural VPN', value: vpnEnabled ? 'CONNECTED' : 'OFFLINE', icon: Globe, color: vpnEnabled ? 'text-blue-500' : 'text-gray-500', trend: vpnEnabled ? 'Secure' : 'Exposed', trendUp: vpnEnabled, desc: 'Encrypted tunnel status' },
        ].map((stat, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="cyber-card p-5 rounded-xl group"
          >
            <div className="corner-accent corner-tl" />
            <div className="corner-accent corner-br" />
            <div className="flex justify-between items-start mb-4">
              <div className={cn("p-2.5 rounded-lg bg-black/40 border border-white/5 shadow-inner", stat.color)}>
                <stat.icon size={20} />
              </div>
              <div className={cn("text-[10px] font-mono px-2 py-0.5 rounded border", 
                stat.trendUp ? "text-emerald-500 border-emerald-500/20 bg-emerald-500/5" : "text-red-500 border-red-500/20 bg-red-500/5"
              )}>
                {stat.trend}
              </div>
            </div>
            <div>
              <p className="text-[10px] font-mono text-gray-500 uppercase tracking-widest mb-1">{stat.label}</p>
              <h3 className="text-3xl font-bold text-white font-mono tracking-tighter mb-1">{stat.value}</h3>
              <p className="text-[9px] font-mono text-gray-600 uppercase tracking-tight">{stat.desc}</p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Advanced Visualizations Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* System Integrity Radar */}
        <div className="cyber-card rounded-xl p-6 flex flex-col">
          <div className="corner-accent corner-tl" />
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <Cpu className="w-5 h-5 text-purple-500" />
              <h2 className="text-sm font-mono uppercase tracking-widest text-white">System Integrity Pulse</h2>
            </div>
            <div className="text-[10px] font-mono text-purple-500/70 uppercase">Real-time Vector Analysis</div>
          </div>
          <div className="flex-1 min-h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart cx="50%" cy="50%" outerRadius="80%" data={SYSTEM_INTEGRITY}>
                <PolarGrid stroke="#222" />
                <PolarAngleAxis dataKey="subject" stroke="#444" fontSize={10} />
                <PolarRadiusAxis angle={30} domain={[0, 150]} stroke="#222" tick={false} axisLine={false} />
                <Radar
                  name="Integrity"
                  dataKey="A"
                  stroke="#a855f7"
                  fill="#a855f7"
                  fillOpacity={0.3}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-2">
            <div className="p-2 bg-black/40 border border-white/5 rounded-lg text-center">
              <div className="text-[9px] font-mono text-gray-500 uppercase">Overall Score</div>
              <div className="text-lg font-bold text-cyber-green font-mono">92.4</div>
            </div>
            <div className="p-2 bg-black/40 border border-white/5 rounded-lg text-center">
              <div className="text-[9px] font-mono text-gray-500 uppercase">Threat Level</div>
              <div className="text-lg font-bold text-amber-500 font-mono">LOW</div>
            </div>
          </div>
        </div>

        {/* Attack Trends Chart */}
        <div className="lg:col-span-2 cyber-card rounded-xl p-6">
          <div className="corner-accent corner-tr" />
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <Activity className="w-5 h-5 text-blue-500" />
              <h2 className="text-sm font-mono uppercase tracking-widest text-white">Attack Surface Trends (24h)</h2>
            </div>
            <div className="flex gap-4 text-[10px] font-mono">
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]" />
                <span className="text-blue-500/70 uppercase">TOTAL ATTACKS</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                <span className="text-emerald-500/70 uppercase">MITIGATED</span>
              </div>
            </div>
          </div>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={attackTrends}>
                <defs>
                  <linearGradient id="colorAttacks" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorBlocked" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1a1a1a" vertical={false} />
                <XAxis 
                  dataKey="time" 
                  stroke="#333" 
                  fontSize={10} 
                  tickLine={false} 
                  axisLine={false} 
                  tick={{ fill: '#555' }}
                />
                <YAxis 
                  stroke="#333" 
                  fontSize={10} 
                  tickLine={false} 
                  axisLine={false} 
                  tick={{ fill: '#555' }}
                />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0d0d0d', border: '1px solid #222', borderRadius: '8px', fontSize: '10px', color: '#fff' }}
                  itemStyle={{ fontSize: '10px' }}
                  cursor={{ stroke: '#333', strokeWidth: 1 }}
                />
                <Area 
                  type="monotone" 
                  dataKey="attacks" 
                  stroke="#3b82f6" 
                  fillOpacity={1} 
                  fill="url(#colorAttacks)" 
                  strokeWidth={2}
                  animationDuration={2000}
                />
                <Area 
                  type="monotone" 
                  dataKey="blocked" 
                  stroke="#10b981" 
                  fillOpacity={1} 
                  fill="url(#colorBlocked)" 
                  strokeWidth={2}
                  animationDuration={2000}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Tools & Map Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        
        {/* Quick Tools Sidebar */}
        <div className="space-y-4">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-[10px] font-mono font-bold text-gray-500 uppercase tracking-[0.2em] flex items-center gap-2">
              <Layers className="w-3 h-3 text-cyber-green" /> Tactical Modules
            </h2>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {[
              { id: 'topology', name: 'Net Map', icon: Globe, color: 'text-emerald-400' },
              { id: 'cyber-range', name: 'Range', icon: Target, color: 'text-red-400' },
              { id: 'phishing', name: 'Phish', icon: Mail, color: 'text-blue-400' },
              { id: 'passwords', name: 'PassLab', icon: Lock, color: 'text-cyber-green' },
              { id: 'crypto', name: 'Crypto', icon: Hash, color: 'text-purple-400' },
              { id: 'network', name: 'OSINT', icon: Globe, color: 'text-orange-400' },
              { id: 'payloads', name: 'Payloads', icon: TerminalIcon, color: 'text-red-400' },
              { id: 'scanner', name: 'Scanner', icon: Search, color: 'text-yellow-400' },
            ].map((tool, i) => (
              <motion.button
                key={tool.id}
                whileHover={{ scale: 1.02, translateY: -2 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => onNavigate?.(tool.id)}
                className="cyber-card flex flex-col items-center justify-center gap-2 p-4 rounded-xl group"
              >
                <div className={cn("p-2 rounded-lg bg-black/40 group-hover:bg-white/5 transition-all", tool.color)}>
                  <tool.icon size={18} />
                </div>
                <span className="text-[9px] font-mono font-bold text-gray-500 uppercase tracking-wider group-hover:text-white transition-colors">
                  {tool.name}
                </span>
              </motion.button>
            ))}
          </div>
          
          {/* AI Insights Card */}
          <div className="cyber-card p-4 rounded-xl bg-gradient-to-br from-cyber-green/5 to-transparent border-cyber-green/10">
            <div className="flex items-center gap-2 mb-3">
              <Bot className="text-cyber-green" size={16} />
              <span className="text-[10px] font-mono text-cyber-green uppercase font-bold">Alen AI Insights</span>
            </div>
            <p className="text-[10px] font-mono text-gray-400 leading-relaxed italic">
              "System integrity is currently at 92%. I recommend rotating SSH keys for node 192.168.1.45 due to repeated brute-force attempts."
            </p>
          </div>
        </div>

        {/* Global Threat Map */}
        <div className="lg:col-span-3 cyber-card rounded-xl overflow-hidden flex flex-col">
          <div className="corner-accent corner-tl" />
          <div className="corner-accent corner-tr" />
          <div className="p-4 border-b border-white/5 bg-black/40 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MapIcon className="w-5 h-5 text-cyber-green" />
              <h2 className="text-sm font-mono uppercase tracking-widest text-white">Neural Threat Topology</h2>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-cyber-green rounded-full shadow-[0_0_8px_#00ff41]" />
                <span className="text-[9px] font-mono text-gray-500 uppercase">Active Nodes</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse shadow-[0_0_8px_#ef4444]" />
                <span className="text-[9px] font-mono text-gray-500 uppercase">Incursions</span>
              </div>
            </div>
          </div>
          <div className="flex-1 min-h-[400px] relative bg-black/20">
            <ThreatMap onAction={onNavigate} initialNodes={mapNodes} />
            
            {/* Map HUD Overlay */}
            <div className="absolute bottom-4 right-4 pointer-events-none flex flex-col gap-2">
              <div className="bg-black/80 backdrop-blur-md border border-white/10 p-3 rounded-lg flex items-center gap-4">
                <div className="flex flex-col">
                  <span className="text-[8px] font-mono text-gray-500 uppercase">Global Latency</span>
                  <span className="text-xs font-mono text-cyber-green font-bold">42ms</span>
                </div>
                <div className="w-px h-6 bg-white/10" />
                <div className="flex flex-col">
                  <span className="text-[8px] font-mono text-gray-500 uppercase">Traffic Flow</span>
                  <span className="text-xs font-mono text-blue-400 font-bold">1.2 GB/s</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* SIEM & News Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* SIEM Real-time Logs */}
        <div className="lg:col-span-2 cyber-card rounded-xl overflow-hidden flex flex-col">
          <div className="p-4 border-b border-white/5 bg-black/40 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <TerminalIcon className="w-5 h-5 text-emerald-500" />
                <h2 className="text-sm font-mono uppercase tracking-widest text-white">SIEM Event Stream</h2>
              </div>
              <div className="flex items-center gap-2 border-l border-white/5 pl-4">
                <select 
                  value={filter}
                  onChange={(e) => setFilter(e.target.value)}
                  className="bg-black/60 border border-white/10 text-[9px] font-mono text-gray-400 px-2 py-1 rounded outline-none focus:border-cyber-green transition-colors"
                >
                  <option value="all">ALL_EVENTS</option>
                  <option value="critical">CRITICAL</option>
                  <option value="high">HIGH</option>
                  <option value="medium">MEDIUM</option>
                </select>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button 
                onClick={() => setIsPaused(!isPaused)}
                className={cn("flex items-center gap-2 px-3 py-1 rounded border transition-all", 
                  isPaused ? "bg-amber-500/10 border-amber-500/20 text-amber-500" : "bg-emerald-500/10 border-emerald-500/20 text-emerald-500"
                )}
              >
                <div className={cn("w-1.5 h-1.5 rounded-full", isPaused ? "bg-amber-500" : "bg-emerald-500 animate-pulse")} />
                <span className="text-[9px] font-mono uppercase font-bold">{isPaused ? 'PAUSED' : 'LIVE'}</span>
              </button>
            </div>
          </div>
          <div className="overflow-x-auto flex-1 max-h-[350px] custom-scrollbar">
            <table className="w-full text-left text-[10px] font-mono">
              <thead className="sticky top-0 bg-[#0d0d0d] z-10 border-b border-white/5">
                <tr className="text-gray-500 uppercase">
                  <th className="p-4 font-normal">Timestamp</th>
                  <th className="p-4 font-normal">Event Signature</th>
                  <th className="p-4 font-normal">Source Vector</th>
                  <th className="p-4 font-normal">Action</th>
                  <th className="p-4 font-normal">Risk</th>
                </tr>
              </thead>
              <tbody className="text-gray-300">
                <AnimatePresence initial={false}>
                  {logs
                    .filter(log => filter === 'all' || log.severity === filter)
                    .map((log) => (
                    <motion.tr 
                      key={log.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 10 }}
                      onClick={() => setSelectedLog(log)}
                      className="border-b border-white/5 hover:bg-white/5 transition-colors cursor-pointer group"
                    >
                      <td className="p-4 text-gray-600">{log.time}</td>
                      <td className="p-4 font-bold text-white group-hover:text-cyber-green transition-colors">{log.event}</td>
                      <td className="p-4 text-blue-400/80">{log.source}</td>
                      <td className="p-4">
                        <span className="px-2 py-0.5 rounded bg-white/5 border border-white/10 text-[8px] text-gray-400">
                          {log.status}
                        </span>
                      </td>
                      <td className="p-4">
                        <span className={`px-2 py-0.5 rounded text-[8px] uppercase font-bold ${
                          log.severity === 'critical' ? 'bg-red-500/10 text-red-500 border border-red-500/20' :
                          log.severity === 'high' ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20' :
                          log.severity === 'medium' ? 'bg-blue-500/10 text-blue-500 border border-red-500/20' :
                          'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'
                        }`}>
                          {log.severity}
                        </span>
                      </td>
                    </motion.tr>
                  ))}
                </AnimatePresence>
              </tbody>
            </table>
          </div>
        </div>

        {/* Threat Intelligence Feed */}
        <div className="cyber-card rounded-xl flex flex-col">
          <div className="p-4 border-b border-white/5 bg-black/40 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Radio className="w-5 h-5 text-red-500" />
              <h2 className="text-sm font-mono uppercase tracking-widest text-white">Intel Feed</h2>
            </div>
            <div className="text-[9px] font-mono text-gray-500 uppercase">Source: Global_Net</div>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar max-h-[350px]">
            {isLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map(i => (
                  <div key={i} className="animate-pulse space-y-2">
                    <div className="h-3 bg-white/5 rounded w-3/4" />
                    <div className="h-2 bg-white/5 rounded w-full" />
                    <div className="h-2 bg-white/5 rounded w-1/2" />
                  </div>
                ))}
              </div>
            ) : (
              <AnimatePresence>
                {threatNews.map((news, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.1 }}
                    className="p-3 bg-white/5 border border-white/5 rounded-lg hover:border-red-500/30 transition-all group cursor-pointer"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className={`text-[8px] font-mono px-1.5 py-0.5 rounded uppercase font-bold ${
                        news.severity === 'critical' ? 'bg-red-500 text-white' :
                        news.severity === 'high' ? 'bg-amber-500 text-black' :
                        news.severity === 'medium' ? 'bg-blue-500 text-white' :
                        'bg-emerald-500 text-white'
                      }`}>
                        {news.severity}
                      </span>
                      <span className="text-[8px] font-mono text-gray-600">{news.timestamp}</span>
                    </div>
                    <h3 className="text-[11px] font-bold text-white mb-1 group-hover:text-red-400 transition-colors line-clamp-1">{news.title}</h3>
                    <p className="text-[10px] text-gray-500 leading-relaxed mb-2 line-clamp-2">{news.summary}</p>
                    <div className="flex items-center justify-between text-[8px] font-mono text-gray-600">
                      <span>{news.source}</span>
                      <button 
                        onClick={() => onNavigate?.('scanner', news.title)}
                        className="text-blue-500 hover:text-blue-400 uppercase font-bold"
                      >
                        Analyze
                      </button>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            )}
          </div>
          <div className="p-3 border-t border-white/5 bg-black/40 text-[9px] font-mono text-gray-600 flex justify-between">
            <span>SYNC: {lastUpdated.toLocaleTimeString()}</span>
            <span className="text-cyber-green animate-pulse">● LIVE</span>
          </div>
        </div>

      </div>

      {/* Log Detail Modal */}
      <AnimatePresence>
        {selectedLog && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-md flex items-center justify-center p-6"
            onClick={() => setSelectedLog(null)}
          >
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="cyber-card rounded-2xl w-full max-w-lg overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.8)]"
              onClick={e => e.stopPropagation()}
            >
              <div className="corner-accent corner-tl" />
              <div className="corner-accent corner-tr" />
              <div className="p-5 border-b border-white/10 bg-black/60 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={cn("p-2 rounded-lg", 
                    selectedLog.severity === 'critical' ? "bg-red-500/20 text-red-500" : "bg-amber-500/20 text-amber-500"
                  )}>
                    <ShieldAlert size={20} />
                  </div>
                  <div>
                    <h3 className="text-sm font-mono font-bold text-white uppercase tracking-widest">Event Forensic Analysis</h3>
                    <div className="text-[10px] font-mono text-gray-500 uppercase">ID: {selectedLog.id}</div>
                  </div>
                </div>
                <button onClick={() => setSelectedLog(null)} className="p-2 hover:bg-white/5 rounded-lg text-gray-500 transition-colors">
                  <Search size={18} className="rotate-45" />
                </button>
              </div>
              <div className="p-8 space-y-6">
                <div className="space-y-2">
                  <div className="text-[10px] font-mono text-gray-500 uppercase tracking-widest">Event Signature</div>
                  <div className="text-xl font-bold text-white tracking-tight">{selectedLog.event}</div>
                </div>
                
                <div className="grid grid-cols-2 gap-6 p-4 bg-white/5 border border-white/10 rounded-xl">
                  <div className="space-y-1">
                    <div className="text-[10px] font-mono text-gray-500 uppercase">Source Vector</div>
                    <div className="text-sm font-mono text-blue-400 font-bold">{selectedLog.source}</div>
                  </div>
                  <div className="space-y-1">
                    <div className="text-[10px] font-mono text-gray-500 uppercase">Timestamp</div>
                    <div className="text-sm font-mono text-gray-300">{selectedLog.time}</div>
                  </div>
                  <div className="space-y-1">
                    <div className="text-[10px] font-mono text-gray-500 uppercase">Status</div>
                    <div className="text-sm font-mono text-emerald-500 uppercase font-bold">{selectedLog.status}</div>
                  </div>
                  <div className="space-y-1">
                    <div className="text-[10px] font-mono text-gray-500 uppercase">Risk Level</div>
                    <div className={cn("text-sm font-mono uppercase font-bold", 
                      selectedLog.severity === 'critical' ? "text-red-500" : "text-amber-500"
                    )}>{selectedLog.severity}</div>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="text-[10px] font-mono text-gray-500 uppercase tracking-widest">Forensic Summary</div>
                  <div className="p-4 bg-black/40 border border-white/5 rounded-xl text-xs text-gray-400 leading-relaxed font-mono">
                    {selectedLog.details || "Automated heuristic analysis suggests a coordinated probe targeting legacy SSH protocols. Source IP has been flagged in global threat databases. Mitigation protocols successfully engaged."}
                  </div>
                </div>

                <div className="flex gap-3 pt-2">
                  <button 
                    onClick={() => onNavigate?.('scanner', selectedLog.source)}
                    className="flex-1 py-3 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 rounded-xl text-xs font-mono font-bold text-red-500 transition-all uppercase tracking-widest flex items-center justify-center gap-2"
                  >
                    <Bug size={14} /> Block & Scan
                  </button>
                  <button 
                    onClick={() => onNavigate?.('network', selectedLog.source)}
                    className="flex-1 py-3 bg-cyber-green/10 hover:bg-cyber-green/20 border border-cyber-green/30 rounded-xl text-xs font-mono font-bold text-cyber-green transition-all uppercase tracking-widest flex items-center justify-center gap-2"
                  >
                    <Wifi size={14} /> Trace Route
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
