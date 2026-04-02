/* COPYRIGHT ALEN PEPA */
import React, { useState, useEffect } from 'react';
import { 
  Shield, AlertTriangle, Activity, Globe, Zap, Lock, 
  Terminal, Server, Cpu, Database, Eye, RefreshCw,
  TrendingUp, TrendingDown, Target, Radio, ShieldAlert, ShieldCheck, MessageSquare, ExternalLink, Clock, Loader2, Terminal as TerminalIcon,
  Mail, Hash, Search, Settings, Bot, User
} from 'lucide-react';
import { GoogleGenAI } from "@google/genai";
import { motion, AnimatePresence } from 'motion/react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer, BarChart, Bar, Cell, PieChart, Pie
} from 'recharts';
import { cn } from '@/src/lib/utils';
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
    
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey || apiKey === 'undefined' || apiKey === '') {
      setTimeout(() => {
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
          },
          {
            title: 'Supply Chain Attack Targets Software Developers',
            summary: 'Malicious packages have been found in popular package managers, targeting developers with credential-stealing malware.',
            severity: 'high',
            timestamp: '8 hours ago',
            source: 'DevSecOps Daily',
            link: '#'
          },
          {
            title: 'Phishing Campaign Targets Remote Workers',
            summary: 'A new phishing campaign is targeting remote workers with fake IT support emails, attempting to steal VPN credentials.',
            severity: 'medium',
            timestamp: '12 hours ago',
            source: 'PhishTank',
            link: '#'
          },
          {
            title: 'Critical Patch Released for Enterprise Firewall',
            summary: 'A major firewall vendor has released a critical security patch addressing multiple vulnerabilities. Admins are urged to apply it.',
            severity: 'high',
            timestamp: '1 day ago',
            source: 'NetSec News',
            link: '#'
          }
        ];
        setThreatNews(fallbackNews);
        setLastUpdated(new Date());
        setIsLoading(false);
      }, 1000);
      return;
    }

    try {
      const ai = new GoogleGenAI({ apiKey });
      
      // Fetch News
      const newsResponse = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: "Generate a list of 6 current global cybersecurity threat intelligence updates from the last 24-48 hours. Return a JSON array of objects with 'title', 'summary', 'severity' (low, medium, high, critical), 'timestamp', 'source', and 'link' (real URL).",
        config: { 
          responseMimeType: "application/json",
          tools: [{ googleSearch: {} }]
        }
      });
      const newsData = JSON.parse(newsResponse.text || '[]');
      setThreatNews(newsData);

      // Fetch Trends & Geo Data
      const trendsResponse = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `Analyze current global cyber attack trends for today. 
        Return a JSON object with:
        1. 'trends': an array of 7 objects with 'time' (HH:00) and 'attacks' (number), 'blocked' (number).
        2. 'geo': an array of 4 objects with 'name' (Region), 'value' (percentage), 'color' (hex).
        3. 'mapNodes': an array of 10 objects with 'long', 'lat', 'city', 'country', 'type' ('attack'|'node'), 'threatLevel', 'ip', 'attackType'.
        Focus on real current hotspots (e.g., Eastern Europe, East Asia, North America).`,
        config: { 
          responseMimeType: "application/json",
          tools: [{ googleSearch: {} }]
        }
      });
      const trendsData = JSON.parse(trendsResponse.text || '{}');
      if (trendsData.trends) setAttackTrends(trendsData.trends);
      if (trendsData.geo) setGeoData(trendsData.geo);
      if (trendsData.mapNodes) setMapNodes(trendsData.mapNodes);

      setLastUpdated(new Date());
    } catch (error) {
      console.error("Failed to fetch threat intelligence:", error);
      // Fallback data for when API is down or quota exceeded
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
        },
        {
          title: 'Supply Chain Attack Targets Software Developers',
          summary: 'Malicious packages have been found in popular package managers, targeting developers with credential-stealing malware.',
          severity: 'high',
          timestamp: '8 hours ago',
          source: 'DevSecOps Daily',
          link: '#'
        },
        {
          title: 'Phishing Campaign Uses AI-Generated Deepfakes',
          summary: 'A new phishing campaign is using AI-generated voice and video to impersonate corporate executives in business email compromise attacks.',
          severity: 'medium',
          timestamp: '12 hours ago',
          source: 'InfoSec Insider',
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
    <div className="space-y-6 p-6 bg-[#050505] min-h-full rounded-2xl border border-[#222]">
      {/* Live Ticker */}
      <div className="bg-red-500/10 border border-red-500/20 py-2 px-4 rounded-lg overflow-hidden whitespace-nowrap relative mb-4">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-red-500 font-mono text-[10px] font-bold uppercase shrink-0">
            <ShieldAlert size={12} /> LIVE THREAT FEED:
          </div>
          <AnimatePresence mode="wait">
            <motion.span
              key={tickerIndex}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="text-[10px] font-mono text-gray-300 uppercase tracking-widest truncate"
            >
              {TICKER_MESSAGES[tickerIndex]}
            </motion.span>
          </AnimatePresence>
        </div>
      </div>

      {/* Top Stats Bar */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Active Threats', value: firewallEnabled ? '1,242' : '8,421', icon: AlertTriangle, color: firewallEnabled ? 'text-amber-500' : 'text-red-500', trend: firewallEnabled ? '+12%' : '+450%', trendUp: !firewallEnabled },
          { label: 'Blocked Attacks', value: firewallEnabled ? '45.2k' : '0', icon: Shield, color: firewallEnabled ? 'text-emerald-500' : 'text-gray-500', trend: firewallEnabled ? '+5.4%' : '-100%', trendUp: firewallEnabled },
          { label: 'System Health', value: firewallEnabled ? '99.8%' : '64.2%', icon: Activity, color: firewallEnabled ? 'text-blue-500' : 'text-red-500', trend: firewallEnabled ? 'Stable' : 'Critical', trendUp: firewallEnabled },
          { label: 'Neural VPN', value: vpnEnabled ? 'CONNECTED' : 'OFFLINE', icon: Globe, color: vpnEnabled ? 'text-blue-500' : 'text-gray-500', trend: vpnEnabled ? 'Secure' : 'Exposed', trendUp: vpnEnabled },
        ].map((stat, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="cyber-card p-4 rounded-lg flex items-center justify-between group"
          >
            <div className="corner-accent corner-tl" />
            <div className="corner-accent corner-tr" />
            <div>
              <p className="text-[10px] font-mono text-[#555] uppercase tracking-widest mb-1">{stat.label}</p>
              <div className="flex items-baseline gap-2">
                <h3 className="text-2xl font-bold text-white font-mono">{stat.value}</h3>
                <span className={`text-[10px] font-mono ${stat.trendUp ? 'text-emerald-500' : 'text-red-500'}`}>
                  {stat.trendUp ? <TrendingUp className="inline w-3 h-3 mr-1" /> : <TrendingDown className="inline w-3 h-3 mr-1" />}
                  {stat.trend}
                </span>
              </div>
            </div>
            <div className={`p-3 rounded-full bg-black/40 border border-white/5 ${stat.color} group-hover:scale-110 transition-transform shadow-[0_0_10px_rgba(0,0,0,0.5)]`}>
              <stat.icon className="w-6 h-6" />
            </div>
          </motion.div>
        ))}
      </div>

      {/* System Stats Bar */}
      <div className="grid grid-cols-3 gap-4">
        <div className="cyber-card p-3 rounded-lg bg-black/40 border border-white/5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <User size={16} className="text-purple-500" />
            <span className="text-[10px] font-mono text-gray-500 uppercase tracking-widest">Operator</span>
          </div>
          <span className="text-sm font-mono font-bold text-white">{userName} (L{clearanceLevel})</span>
        </div>
        <div className="cyber-card p-3 rounded-lg bg-black/40 border border-white/5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Shield size={16} className={firewallEnabled ? "text-emerald-500" : "text-red-500"} />
            <span className="text-[10px] font-mono text-gray-500 uppercase tracking-widest">Firewall</span>
          </div>
          <span className={cn("text-sm font-mono font-bold", firewallEnabled ? "text-emerald-500" : "text-red-500")}>
            {firewallEnabled ? 'ACTIVE' : 'DISABLED'}
          </span>
        </div>
        <div className="cyber-card p-3 rounded-lg bg-black/40 border border-white/5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Globe className="w-4 h-4 text-blue-500" />
            <span className="text-[10px] font-mono text-gray-500 uppercase tracking-widest">VPN Tunnel</span>
          </div>
          <span className={cn("text-sm font-mono font-bold", vpnEnabled ? "text-blue-500" : "text-gray-500")}>
            {vpnEnabled ? 'ENCRYPTED' : 'PLAIN_TEXT'}
          </span>
        </div>
      </div>

      {/* Tools Overview */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-mono font-bold text-gray-500 uppercase tracking-[0.2em] flex items-center gap-2">
            <Zap className="w-3 h-3 text-cyber-green" /> Quick Access Tools
          </h2>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
          {[
            { id: 'topology', name: 'Net Map', icon: Globe, color: 'text-emerald-400' },
            { id: 'cyber-range', name: 'Cyber Range', icon: Target, color: 'text-red-400' },
            { id: 'phishing', name: 'Phishing', icon: Mail, color: 'text-blue-400' },
            { id: 'passwords', name: 'Passwords', icon: Lock, color: 'text-cyber-green' },
            { id: 'crypto', name: 'Crypto', icon: Hash, color: 'text-purple-400' },
            { id: 'network', name: 'OSINT', icon: Globe, color: 'text-orange-400' },
            { id: 'payloads', name: 'Payloads', icon: TerminalIcon, color: 'text-red-400' },
            { id: 'stego', name: 'Stego', icon: Eye, color: 'text-pink-400' },
            { id: 'scanner', name: 'Scanner', icon: Search, color: 'text-yellow-400' },
            { id: 'analyst', name: 'Analyst', icon: Bot, color: 'text-emerald-400' },
            { id: 'anonymous-chat', name: 'Chat', icon: MessageSquare, color: 'text-cyan-400' },
            { id: 'settings', name: 'Settings', icon: Settings, color: 'text-gray-400' },
          ].map((tool, i) => (
            <motion.button
              key={tool.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.05 }}
              onClick={() => onNavigate?.(tool.id)}
              className="cyber-card flex flex-col items-center justify-center gap-2 p-4 rounded-xl group"
            >
              <div className="corner-accent corner-tl opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="corner-accent corner-br opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className={cn("p-2 rounded-lg bg-black/40 group-hover:scale-110 transition-transform", tool.color)}>
                <tool.icon size={20} />
              </div>
              <span className="text-[10px] font-mono font-bold text-gray-400 uppercase tracking-wider group-hover:text-white transition-colors">
                {tool.name}
              </span>
            </motion.button>
          ))}
        </div>
      </div>

      {/* Global Threat Map */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="cyber-card rounded-lg overflow-hidden"
      >
        <div className="corner-accent corner-tl" />
        <div className="corner-accent corner-tr" />
        <div className="p-4 border-b border-white/5 bg-black/40 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Globe className="w-5 h-5 text-cyber-green" />
            <h2 className="text-sm font-mono uppercase tracking-widest text-white">Live Global Threat Map</h2>
          </div>
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-cyber-green rounded-full shadow-[0_0_5px_#00ff41]" />
              <span className="text-[10px] font-mono text-cyber-green/70 uppercase tracking-tighter">Secure Nodes</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse shadow-[0_0_5px_#ef4444]" />
              <span className="text-[10px] font-mono text-red-500/70 uppercase tracking-tighter">Active Attacks</span>
            </div>
            <div className="hidden md:flex items-center gap-2 border-l border-[#333] pl-6 ml-2">
              <span className="text-[10px] font-mono text-[#555] uppercase">Interactivity:</span>
              <span className="text-[10px] font-mono text-white/50 uppercase">Click nodes for intel</span>
            </div>
          </div>
        </div>
        <div className="h-[400px] w-full relative bg-black/20">
          <ThreatMap onAction={onNavigate} initialNodes={mapNodes} />
          
          {/* Map Overlay HUD */}
          <div className="absolute top-4 left-4 pointer-events-none space-y-2">
            <div className="bg-black/60 backdrop-blur-md border border-white/5 p-2 rounded text-[9px] font-mono">
              <div className="text-gray-500 mb-1 uppercase">Map Projection</div>
              <div className="text-white">MERCATOR_EPSG:3857</div>
            </div>
            <div className="bg-black/60 backdrop-blur-md border border-white/5 p-2 rounded text-[9px] font-mono">
              <div className="text-gray-500 mb-1 uppercase">Data Source</div>
              <div className="text-cyber-green">CYBER_CORE_INTEL</div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Attack Trends Chart */}
        <div className="lg:col-span-2 cyber-card rounded-lg p-6">
          <div className="corner-accent corner-tl" />
          <div className="corner-accent corner-tr" />
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <Activity className="w-5 h-5 text-blue-500" />
              <h2 className="text-sm font-mono uppercase tracking-widest text-white">Attack Trends (24h)</h2>
            </div>
            <div className="flex gap-4 text-[10px] font-mono">
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-blue-500" />
                <span className="text-blue-500/70">TOTAL ATTACKS</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-emerald-500" />
                <span className="text-emerald-500/70">BLOCKED</span>
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
                <CartesianGrid strokeDasharray="3 3" stroke="#222" vertical={false} />
                <XAxis 
                  dataKey="time" 
                  stroke="#444" 
                  fontSize={10} 
                  tickLine={false} 
                  axisLine={false} 
                />
                <YAxis 
                  stroke="#444" 
                  fontSize={10} 
                  tickLine={false} 
                  axisLine={false} 
                />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#111', border: '1px solid #333', fontSize: '10px' }}
                  itemStyle={{ fontSize: '10px' }}
                />
                <Area 
                  type="monotone" 
                  dataKey="attacks" 
                  stroke="#3b82f6" 
                  fillOpacity={1} 
                  fill="url(#colorAttacks)" 
                  strokeWidth={2}
                />
                <Area 
                  type="monotone" 
                  dataKey="blocked" 
                  stroke="#10b981" 
                  fillOpacity={1} 
                  fill="url(#colorBlocked)" 
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Geographic Distribution */}
        <div className="bg-[#111] border border-[#222] rounded-lg p-6">
          <div className="flex items-center gap-2 mb-6">
            <Globe className="w-5 h-5 text-amber-500" />
            <h2 className="text-sm font-mono uppercase tracking-widest text-white">Origin of Attacks</h2>
          </div>
          <div className="h-[200px] w-full mb-6">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={geoData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {geoData.map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ backgroundColor: '#111', border: '1px solid #333', fontSize: '10px' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="space-y-3">
            {geoData.map((item: any, i: number) => (
              <div key={i} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
                  <span className="text-[10px] font-mono text-[#888]">{item.name}</span>
                </div>
                <span className="text-[10px] font-mono text-white">{item.value}%</span>
              </div>
            ))}
          </div>
        </div>

        {/* SIEM Real-time Logs */}
        <div className="lg:col-span-2 cyber-card rounded-lg overflow-hidden flex flex-col">
          <div className="corner-accent corner-tl" />
          <div className="corner-accent corner-tr" />
          <div className="p-4 border-b border-white/5 bg-black/40 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Terminal className="w-5 h-5 text-emerald-500" />
                <h2 className="text-sm font-mono uppercase tracking-widest text-white">SIEM Real-time Logs</h2>
              </div>
              <div className="flex items-center gap-2 border-l border-[#333] pl-4">
                <select 
                  value={filter}
                  onChange={(e) => setFilter(e.target.value)}
                  className="bg-black border border-[#333] text-[10px] font-mono text-gray-400 px-2 py-1 rounded outline-none focus:border-cyber-green transition-colors"
                >
                  <option value="all">ALL EVENTS</option>
                  <option value="critical">CRITICAL</option>
                  <option value="high">HIGH</option>
                  <option value="medium">MEDIUM</option>
                  <option value="low">LOW</option>
                </select>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <button 
                onClick={() => setLogs([])}
                className="text-[10px] font-mono text-gray-500 hover:text-white transition-colors uppercase"
              >
                Clear
              </button>
              <button 
                onClick={() => setIsPaused(!isPaused)}
                className="flex items-center gap-2 px-3 py-1 bg-[#222] hover:bg-[#333] rounded border border-[#333] transition-all"
              >
                <div className={cn("w-2 h-2 rounded-full", isPaused ? "bg-amber-500" : "bg-emerald-500 animate-pulse")} />
                <span className={cn("text-[10px] font-mono uppercase", isPaused ? "text-amber-500" : "text-emerald-500")}>
                  {isPaused ? 'PAUSED' : 'LIVE STREAM'}
                </span>
              </button>
            </div>
          </div>
          <div className="overflow-x-auto flex-1 max-h-[400px]">
            <table className="w-full text-left text-[11px] font-mono">
              <thead className="sticky top-0 bg-[#1a1a1a] z-10">
                <tr className="border-b border-[#222] text-[#555] uppercase">
                  <th className="p-4">Timestamp</th>
                  <th className="p-4">Event Type</th>
                  <th className="p-4">Source IP</th>
                  <th className="p-4">Action</th>
                  <th className="p-4">Severity</th>
                </tr>
              </thead>
              <tbody className="text-[#ccc]">
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
                      className="border-b border-[#222] hover:bg-[#151515] transition-colors cursor-pointer group"
                    >
                      <td className="p-4 text-[#555]">{log.time}</td>
                      <td className="p-4 font-bold text-white group-hover:text-cyber-green transition-colors">{log.event}</td>
                      <td className="p-4 text-blue-400">{log.source}</td>
                      <td className="p-4">
                        <span className="px-2 py-0.5 rounded bg-[#222] border border-[#333] text-[9px]">
                          {log.status}
                        </span>
                      </td>
                      <td className="p-4">
                        <span className={`px-2 py-0.5 rounded text-[9px] uppercase font-bold ${
                          log.severity === 'critical' ? 'bg-red-500/20 text-red-500 border border-red-500/30' :
                          log.severity === 'high' ? 'bg-amber-500/20 text-amber-500 border border-amber-500/30' :
                          log.severity === 'medium' ? 'bg-blue-500/20 text-blue-500 border border-blue-500/30' :
                          'bg-emerald-500/20 text-emerald-500 border border-emerald-500/30'
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
          
          {/* Log Detail Modal */}
          <AnimatePresence>
            {selectedLog && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-6"
              >
                <motion.div 
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.9, opacity: 0 }}
                  className="cyber-card rounded-xl w-full max-w-md overflow-hidden shadow-2xl"
                >
                  <div className="corner-accent corner-tl" />
                  <div className="corner-accent corner-tr" />
                  <div className="p-4 border-b border-white/5 bg-black/40 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <ShieldAlert className={cn("w-4 h-4", 
                        selectedLog.severity === 'critical' ? "text-red-500" : "text-amber-500"
                      )} />
                      <h3 className="text-xs font-mono font-bold text-white uppercase">Event Forensics</h3>
                    </div>
                    <button onClick={() => setSelectedLog(null)} className="text-gray-500 hover:text-white transition-colors">
                      <Zap size={16} className="rotate-45" />
                    </button>
                  </div>
                  <div className="p-6 space-y-4">
                    <div className="space-y-1">
                      <div className="text-[10px] font-mono text-gray-500 uppercase">Event Signature</div>
                      <div className="text-lg font-bold text-white">{selectedLog.event}</div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <div className="text-[10px] font-mono text-gray-500 uppercase">Source IP</div>
                        <div className="text-sm font-mono text-blue-400">{selectedLog.source}</div>
                      </div>
                      <div className="space-y-1">
                        <div className="text-[10px] font-mono text-gray-500 uppercase">Timestamp</div>
                        <div className="text-sm font-mono text-gray-300">{selectedLog.time}</div>
                      </div>
                    </div>
                    <div className="p-3 bg-black/40 border border-[#222] rounded-lg">
                      <div className="text-[10px] font-mono text-gray-500 uppercase mb-2">Analysis</div>
                      <p className="text-xs text-gray-400 leading-relaxed font-mono">
                        {selectedLog.details || "No additional forensic data available for this event signature. Automated mitigation protocols have been engaged."}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <button 
                        onClick={() => onNavigate?.('scanner', selectedLog.source)}
                        className="flex-1 py-2 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 rounded-lg text-[10px] font-mono font-bold text-red-500 transition-all uppercase"
                      >
                        Block & Scan
                      </button>
                      <button 
                        onClick={() => onNavigate?.('network', selectedLog.source)}
                        className="flex-1 py-2 bg-cyber-green/10 hover:bg-cyber-green/20 border border-cyber-green/20 rounded-lg text-[10px] font-mono font-bold text-cyber-green transition-all uppercase"
                      >
                        Trace Route
                      </button>
                    </div>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Threat Intelligence Feed */}
        <div className="cyber-card rounded-lg flex flex-col">
          <div className="corner-accent corner-tl" />
          <div className="corner-accent corner-tr" />
          <div className="p-4 border-b border-white/5 bg-black/40 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Radio className="w-5 h-5 text-red-500" />
              <h2 className="text-sm font-mono uppercase tracking-widest text-white">Global Threat Feed</h2>
            </div>
            <button 
              onClick={fetchThreatIntelligence}
              className="p-1 hover:bg-[#333] rounded transition-colors"
              disabled={isLoading}
            >
              <RefreshCw className={`w-4 h-4 text-[#555] ${isLoading ? 'animate-spin' : ''}`} />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-hide max-h-[400px]">
            {isLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map(i => (
                  <div key={i} className="animate-pulse space-y-2">
                    <div className="h-3 bg-[#222] rounded w-3/4" />
                    <div className="h-2 bg-[#222] rounded w-full" />
                    <div className="h-2 bg-[#222] rounded w-1/2" />
                  </div>
                ))}
              </div>
            ) : (
              <AnimatePresence>
                {threatNews.map((news, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.1 }}
                    className="p-3 bg-[#151515] border border-[#222] rounded-lg hover:border-red-500/30 transition-all group"
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
                      <span className="text-[8px] font-mono text-[#444]">{news.timestamp}</span>
                    </div>
                    <h3 className="text-[11px] font-bold text-white mb-1 group-hover:text-red-400 transition-colors">{news.title}</h3>
                    <p className="text-[10px] text-[#888] leading-relaxed mb-2 line-clamp-2">{news.summary}</p>
                    <div className="flex items-center justify-between text-[8px] font-mono text-[#444]">
                      <div className="flex items-center gap-2">
                        <span>SOURCE: {news.source}</span>
                        {news.link && (
                          <a 
                            href={news.link} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-cyber-green hover:underline flex items-center gap-0.5"
                          >
                            <ExternalLink size={8} />
                            VIEW SOURCE
                          </a>
                        )}
                      </div>
                      <button 
                        onClick={() => onNavigate?.('scanner', news.title)}
                        className="text-blue-500 hover:underline"
                      >
                        ANALYZE
                      </button>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            )}
          </div>
          <div className="p-3 border-t border-[#222] bg-[#0a0a0a] text-[9px] font-mono text-[#444] flex justify-between">
            <span>LAST SYNC: {lastUpdated.toLocaleTimeString()}</span>
            <span>AI CORE ACTIVE</span>
          </div>
        </div>

      </div>
    </div>
  );
}
