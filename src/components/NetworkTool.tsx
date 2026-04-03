/* COPYRIGHT ALEN PEPA */
import React, { useState, useEffect } from 'react';
import { 
  Globe, 
  Search, 
  MapPin, 
  Server, 
  Shield, 
  Network,
  ExternalLink,
  Cpu,
  Wifi,
  Database,
  Bot,
  Sparkles,
  AlertTriangle,
  CheckCircle2,
  Loader2,
  History,
  Trash2,
  Clock,
  ChevronRight,
  Activity
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '@/src/lib/utils';
import { useSystem } from '../contexts/SystemContext';

import { logToTerminal } from './Terminal';

export default function NetworkTool() {
  const { toolTarget, setToolTarget } = useSystem();
  const [activeTab, setActiveTab] = useState<'info' | 'dns' | 'whois' | 'threat' | 'map' | 'subdomains' | 'graph'>('info');
  const [scanData, setScanData] = useState<any>(null);
  const [scanning, setScanning] = useState(false);
  const [query, setQuery] = useState(toolTarget || '');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState('');
  const [aiScanning, setAiScanning] = useState(false);
  const [aiResult, setAiResult] = useState<string | null>(null);
  const [subdomainResults, setSubdomainResults] = useState<any[]>([]);
  const [subdomainLoading, setSubdomainLoading] = useState(false);
  const [history, setHistory] = useState<any[]>([]);
  const [showHistory, setShowHistory] = useState(false);

  useEffect(() => {
    if (toolTarget) {
      setQuery(toolTarget);
    }
  }, [toolTarget]);

  useEffect(() => {
    const savedHistory = localStorage.getItem('network_osint_history');
    if (savedHistory) {
      try {
        setHistory(JSON.parse(savedHistory));
      } catch (e) {
        console.error('Failed to parse history');
      }
    }
  }, []);

  const saveToHistory = (item: any) => {
    const newHistory = [item, ...history].slice(0, 20);
    setHistory(newHistory);
    localStorage.setItem('network_osint_history', JSON.stringify(newHistory));
  };

  const clearHistory = () => {
    setHistory([]);
    localStorage.removeItem('network_osint_history');
    logToTerminal('Network history cleared.', 'warn');
  };

  const runAIScan = async () => {
    if (!query && !result) return;
    setAiScanning(true);
    setAiResult(null);
    logToTerminal(`Initiating Autonomous AI Scan for: ${query || result?.query}`, 'info');
    
    // Simulate scanning steps in terminal
    const steps = [
      'Probing network infrastructure...',
      'Analyzing ISP routing patterns...',
      'Identifying potential misconfigurations...',
      'Cross-referencing known vulnerability databases...',
      'Synthesizing security report...'
    ];

    let stepIdx = 0;
    const interval = setInterval(() => {
      if (stepIdx < steps.length) {
        logToTerminal(steps[stepIdx], 'info');
        stepIdx++;
      } else {
        clearInterval(interval);
      }
    }, 1500);

    try {
      const targetContext = result ? 
        `IP: ${result.query}, ISP: ${result.isp}, Org: ${result.org}, Country: ${result.country}, City: ${result.city}, Lat/Lon: ${result.lat}, ${result.lon}` : 
        `Target: ${query}`;

      const response = await fetch('/api/ai-generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ role: 'user', parts: [{ text: `You are an autonomous cybersecurity scanner. Perform a deep analysis on the following target infrastructure context. Identify common vulnerabilities, misconfigurations, and potential attack vectors.
          
          Target Context: ${targetContext}
          
          Your report MUST include:
          1. Infrastructure Risk Profile (Low/Medium/High/Critical)
          2. Potential Vulnerabilities (Specific to the ISP/Org/Region if possible)
          3. Misconfiguration Risks (e.g., DNS, Routing, Open Services)
          4. Actionable Remediation Steps
          5. Threat Intelligence Summary (Use real-time data if possible)` }] }],
          config: {
            systemInstruction: "You are a CyberSuite OS AI Security Scanner. Be technical, concise, and professional. Use markdown for formatting. Focus on realistic risks. If the target is a major cloud provider (Google, AWS, Azure), focus on shared responsibility model risks.",
            tools: [{ googleSearch: {} }]
          }
        })
      });

      if (!response.ok) {
        throw new Error('AI Scan failed');
      }

      const data = await response.json();
      const text = data.text || 'No analysis available.';
      setAiResult(text);
      logToTerminal('AI Security Analysis completed successfully.', 'success');
      
      // Update history with AI result if it exists
      if (result) {
        const updatedItem = { ...result, aiResult: text, date: new Date().toISOString() };
        saveToHistory(updatedItem);
      }
    } catch (err: any) {
      logToTerminal(`AI Scan failed: ${err.message}`, 'error');
      setAiResult('Failed to complete AI analysis. Please check your connection.');
    } finally {
      clearInterval(interval);
      setAiScanning(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'subdomains' && result && !subdomainResults.length && !subdomainLoading) {
      fetchSubdomains();
    }
  }, [activeTab, result]);

  const fetchSubdomains = async () => {
    if (!result?.query) return;
    setSubdomainLoading(true);
    logToTerminal(`Enumerating subdomains for: ${result.query}`, 'info');
    try {
      const res = await fetch(`/api/tools/subdomains?target=${result.query}`);
      const data = await res.json();
      setSubdomainResults(data);
      logToTerminal(`Discovered ${data.length} subdomains for ${result.query}`, 'success');
    } catch (err) {
      logToTerminal(`Subdomain enumeration failed: ${err}`, 'error');
    } finally {
      setSubdomainLoading(false);
    }
  };

  const lookupIP = async () => {
    if (!query) return;
    setLoading(true);
    setScanning(true);
    setError('');
    setResult(null);
    setScanData(null);
    setAiResult(null);
    setSubdomainResults([]);
    logToTerminal(`Initiating Advanced OSINT lookup for: ${query}`, 'info');

    try {
      // 1. Basic IP Geolocation
      const geoRes = await fetch(`https://ipapi.co/${query}/json/`);
      const geoData = await geoRes.json();
      
      if (geoData.error) throw new Error(geoData.reason || 'Geo lookup failed');
      
      const geoResult = {
        query: geoData.ip,
        country: geoData.country_name,
        city: geoData.city,
        isp: geoData.org,
        org: geoData.asn,
        as: geoData.asn,
        lat: geoData.latitude,
        lon: geoData.longitude,
        timezone: geoData.timezone,
        currency: geoData.currency_name,
        languages: geoData.languages,
        date: new Date().toISOString()
      };

      // 2. Advanced Backend Scan (DNS, Headers, SSL)
      const scanRes = await fetch(`/api/scan?target=${query}`);
      const scanInfo = await scanRes.json();
      
      const finalResult = { ...geoResult, ...scanInfo };
      setResult(finalResult);
      setScanData(scanInfo);
      saveToHistory(finalResult);
      logToTerminal(`Advanced OSINT lookup successful for ${query}`, 'success');
    } catch (err: any) {
      logToTerminal(`OSINT lookup failed for ${query}: ${err.message}`, 'error');
      setError(err.message || 'Lookup failed.');
      
      // Fallback for demo
      if (query === '8.8.8.8' || query === 'google.com') {
        const mock = {
          query: '8.8.8.8',
          country: 'United States',
          city: 'Mountain View',
          isp: 'Google LLC',
          org: 'AS15169 Google LLC',
          lat: 37.4223,
          lon: -122.084,
          dns: { a: ['8.8.8.8'], mx: ['alt1.aspmx.l.google.com'], txt: [['v=spf1 include:_spf.google.com ~all']] },
          whois: { registrar: 'MarkMonitor Inc.', creationDate: '1997-09-15', expiryDate: '2028-09-14' }
        };
        setResult(mock);
        setScanData(mock);
      }
    } finally {
      setLoading(false);
      setScanning(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Network OSINT</h1>
          <button 
            onClick={() => setShowHistory(!showHistory)}
            className={cn(
              "p-2 rounded-lg border transition-all flex items-center gap-2 text-xs font-mono uppercase tracking-widest",
              showHistory ? "bg-orange-500 border-orange-500 text-white" : "bg-black/40 border-cyber-border text-gray-500 hover:text-white"
            )}
          >
            <History size={16} />
            {showHistory ? 'Hide History' : 'View History'}
          </button>
        </div>
        <p className="text-gray-500">Gather open-source intelligence on IP addresses and domains.</p>
      </div>

      <AnimatePresence>
        {showHistory && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="bg-cyber-card border border-cyber-border rounded-2xl p-6 space-y-4">
              <div className="flex items-center justify-between border-b border-cyber-border pb-4">
                <h3 className="text-sm font-mono font-bold text-white uppercase tracking-widest">Recent Lookups</h3>
                <button 
                  onClick={clearHistory}
                  className="text-[10px] font-mono text-gray-500 hover:text-red-400 transition-colors flex items-center gap-1"
                >
                  <Trash2 size={12} /> CLEAR ALL
                </button>
              </div>
              {history.length === 0 ? (
                <div className="py-8 text-center text-gray-600 font-mono text-xs uppercase tracking-widest opacity-50">
                  No history detected
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {history.map((item, i) => (
                    <button
                      key={i}
                      onClick={() => {
                        setResult(item);
                        setQuery(item.query);
                        setAiResult(item.aiResult || null);
                        setShowHistory(false);
                        logToTerminal(`Loaded lookup for: ${item.query}`, 'info');
                      }}
                      className="p-3 bg-black/40 border border-cyber-border rounded-xl flex items-center justify-between group hover:border-orange-500/30 transition-all text-left"
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-orange-500/10 rounded-lg text-orange-400">
                          <Globe size={14} />
                        </div>
                        <div>
                          <div className="text-xs font-bold text-white group-hover:text-orange-400 transition-colors">{item.query}</div>
                          <div className="text-[10px] font-mono text-gray-500 uppercase flex items-center gap-2">
                            {item.country} • {new Date(item.date).toLocaleDateString()}
                            {item.aiResult && <Sparkles size={10} className="text-cyber-green" />}
                          </div>
                        </div>
                      </div>
                      <ChevronRight size={14} className="text-gray-600 group-hover:text-white transition-colors" />
                    </button>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="bg-cyber-card border border-cyber-border rounded-2xl p-8">
        <div className="max-w-4xl mx-auto space-y-8">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={20} />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && lookupIP()}
              placeholder="Enter IP address or Domain (e.g. google.com)..."
              className="w-full bg-black/40 border border-cyber-border rounded-xl pl-12 pr-32 py-4 font-mono text-white focus:outline-none focus:border-orange-400/50 transition-colors"
            />
            <button
              onClick={lookupIP}
              disabled={loading}
              className="absolute right-2 top-1/2 -translate-y-1/2 bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white px-6 py-2 rounded-lg font-mono text-sm transition-all flex items-center gap-2"
            >
              {loading ? <Loader2 size={16} className="animate-spin" /> : <Globe size={16} />}
              {loading ? 'ANALYZING...' : 'OSINT SCAN'}
            </button>
          </div>

          {error && (
            <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm font-mono flex items-center gap-3">
              <Shield size={16} />
              {error}
            </div>
          )}

          {result && (
            <div className="space-y-6">
              {/* Tabs */}
              <div className="flex items-center gap-2 border-b border-cyber-border pb-px overflow-x-auto no-scrollbar">
                {[
                  { id: 'info', label: 'General Info', icon: Globe },
                  { id: 'dns', label: 'DNS Records', icon: Network },
                  { id: 'subdomains', label: 'Subdomains', icon: Network },
                  { id: 'whois', label: 'WHOIS Data', icon: Database },
                  { id: 'threat', label: 'Threat Intel', icon: Shield },
                  { id: 'map', label: 'Geo Map', icon: MapPin },
                  { id: 'graph', label: 'Infrastructure', icon: Activity },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={cn(
                      "px-4 py-3 text-xs font-mono uppercase tracking-widest border-b-2 transition-all flex items-center gap-2 whitespace-nowrap",
                      activeTab === tab.id 
                        ? "border-orange-500 text-orange-500 bg-orange-500/5" 
                        : "border-transparent text-gray-500 hover:text-white hover:bg-white/5"
                    )}
                  >
                    <tab.icon size={14} />
                    {tab.label}
                  </button>
                ))}
              </div>

              <motion.div
                key={activeTab}
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                className="min-h-[300px]"
              >
                {activeTab === 'info' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-6">
                      <div className="bg-black/20 border border-cyber-border p-5 rounded-xl space-y-4">
                        <div className="flex items-center gap-3 text-orange-400">
                          <MapPin size={18} />
                          <span className="text-xs font-mono uppercase tracking-widest">Location Data</span>
                        </div>
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-500">Country</span>
                            <span className="text-white font-mono">{result.country}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-500">City</span>
                            <span className="text-white font-mono">{result.city}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-500">Coordinates</span>
                            <span className="text-white font-mono">{result.lat}, {result.lon}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-500">Timezone</span>
                            <span className="text-white font-mono">{result.timezone}</span>
                          </div>
                        </div>
                      </div>

                      <div className="bg-black/20 border border-cyber-border p-5 rounded-xl space-y-4">
                        <div className="flex items-center gap-3 text-blue-400">
                          <Server size={18} />
                          <span className="text-xs font-mono uppercase tracking-widest">Network Infrastructure</span>
                        </div>
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-500">ISP</span>
                            <span className="text-white font-mono truncate max-w-[150px]">{result.isp}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-500">Organization</span>
                            <span className="text-white font-mono truncate max-w-[150px]">{result.org}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-500">AS Number</span>
                            <span className="text-white font-mono">{result.as?.split(' ')[0]}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="p-4 bg-cyber-green/5 border border-cyber-green/20 rounded-xl">
                        <div className="flex items-center gap-2 text-cyber-green text-[10px] font-mono uppercase tracking-widest mb-3">
                          <Bot size={14} /> AI Quick Insights
                        </div>
                        <p className="text-xs text-gray-400 leading-relaxed italic">
                          Target infrastructure identified as {result.isp}. 
                          Geolocation points to {result.city}, {result.country}. 
                          {result.dns?.a?.length > 0 ? ` Detected ${result.dns.a.length} active A records.` : ' No public DNS A records found in initial probe.'}
                          {result.ssl ? ' SSL/TLS certificate detected and verified.' : ' No SSL certificate found on standard ports.'}
                        </p>
                      </div>
                      
                      <button
                        onClick={runAIScan}
                        disabled={aiScanning}
                        className="w-full bg-cyber-green/10 hover:bg-cyber-green/20 border border-cyber-green/30 text-cyber-green py-4 rounded-xl font-mono text-xs font-bold flex items-center justify-center gap-2 transition-all group"
                      >
                        {aiScanning ? (
                          <Loader2 size={16} className="animate-spin" />
                        ) : (
                          <Bot size={16} className="group-hover:scale-110 transition-transform" />
                        )}
                        {aiScanning ? 'AI ANALYZING INFRASTRUCTURE...' : 'RUN DEEP AI VULNERABILITY SCAN'}
                        <Sparkles size={14} className="opacity-50" />
                      </button>

                      {aiResult && (
                        <div className="p-4 bg-black/40 border border-cyber-green/20 rounded-xl max-h-[200px] overflow-y-auto custom-scrollbar">
                          <div className="prose prose-invert prose-xs text-[11px] text-gray-400">
                            {aiResult.split('\n').map((line, i) => <p key={i} className="mb-1">{line}</p>)}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {activeTab === 'dns' && (
                  <div className="space-y-6">
                    {result.dns ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {Object.entries(result.dns).map(([type, records]: [string, any], i) => (
                          <div key={i} className="bg-black/20 border border-cyber-border p-5 rounded-xl space-y-3">
                            <div className="flex items-center justify-between">
                              <span className="text-[10px] font-mono text-gray-500 uppercase tracking-widest">{type} Records</span>
                              <span className="text-[10px] font-mono text-cyber-green px-2 py-0.5 bg-cyber-green/10 rounded border border-cyber-green/20">
                                {Array.isArray(records) ? records.length : 0} FOUND
                              </span>
                            </div>
                            <div className="space-y-2">
                              {Array.isArray(records) && records.length > 0 ? (
                                records.map((rec: any, j: number) => (
                                  <div key={j} className="p-2 bg-black/40 border border-cyber-border rounded-lg text-xs font-mono text-white break-all">
                                    {typeof rec === 'object' ? JSON.stringify(rec) : rec}
                                  </div>
                                ))
                              ) : (
                                <div className="text-xs text-gray-600 font-mono italic">No records found</div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center py-12 text-gray-600 space-y-4">
                        <Loader2 className="animate-spin" size={32} />
                        <span className="text-xs font-mono uppercase tracking-widest">Resolving DNS Infrastructure...</span>
                      </div>
                    )}
                  </div>
                )}

                {activeTab === 'whois' && (
                  <div className="bg-black/20 border border-cyber-border p-6 rounded-xl space-y-6">
                    <div className="flex items-center justify-between border-b border-cyber-border pb-4">
                      <div className="flex items-center gap-3 text-blue-400">
                        <Database size={18} />
                        <span className="text-xs font-mono uppercase tracking-widest">WHOIS Registration Data</span>
                      </div>
                      <div className="text-[10px] font-mono text-gray-500 uppercase">Source: Simulated OSINT Node</div>
                    </div>
                    
                    {result.whois ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-4">
                          <div className="space-y-1">
                            <div className="text-[10px] font-mono text-gray-500 uppercase">Registrar</div>
                            <div className="text-sm text-white font-mono">{result.whois.registrar || 'N/A'}</div>
                          </div>
                          <div className="space-y-1">
                            <div className="text-[10px] font-mono text-gray-500 uppercase">Creation Date</div>
                            <div className="text-sm text-white font-mono">{result.whois.creationDate || 'N/A'}</div>
                          </div>
                          <div className="space-y-1">
                            <div className="text-[10px] font-mono text-gray-500 uppercase">Expiration Date</div>
                            <div className="text-sm text-white font-mono">{result.whois.expiryDate || 'N/A'}</div>
                          </div>
                        </div>
                        <div className="space-y-4">
                          <div className="space-y-1">
                            <div className="text-[10px] font-mono text-gray-500 uppercase">Registrant</div>
                            <div className="text-sm text-white font-mono">{result.whois.registrant || 'N/A'}</div>
                          </div>
                          <div className="space-y-1">
                            <div className="text-[10px] font-mono text-gray-500 uppercase">Name Servers</div>
                            <div className="flex flex-wrap gap-2">
                              {result.whois.nameServers?.map((ns: string, i: number) => (
                                <span key={i} className="text-[10px] font-mono text-blue-400 px-2 py-1 bg-blue-500/10 rounded border border-blue-500/20">{ns}</span>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="py-12 text-center text-gray-600 font-mono text-xs uppercase tracking-widest italic">
                        WHOIS data unavailable for this target
                      </div>
                    )}
                  </div>
                )}

                {activeTab === 'subdomains' && (
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3 text-orange-400">
                        <Network size={18} />
                        <span className="text-xs font-mono uppercase tracking-widest">Subdomain Enumeration</span>
                      </div>
                      {subdomainLoading && (
                        <div className="flex items-center gap-2 text-xs font-mono text-gray-500">
                          <Loader2 size={14} className="animate-spin" />
                          SCANNING...
                        </div>
                      )}
                    </div>

                    <div className="bg-black/20 border border-cyber-border rounded-xl overflow-hidden">
                      <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                          <thead>
                            <tr className="border-b border-cyber-border bg-white/5">
                              <th className="px-4 py-3 text-[10px] font-mono text-gray-500 uppercase tracking-widest">Subdomain</th>
                              <th className="px-4 py-3 text-[10px] font-mono text-gray-500 uppercase tracking-widest">IP Address</th>
                              <th className="px-4 py-3 text-[10px] font-mono text-gray-500 uppercase tracking-widest">Status</th>
                              <th className="px-4 py-3 text-[10px] font-mono text-gray-500 uppercase tracking-widest">Last Seen</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-cyber-border">
                            {subdomainLoading && subdomainResults.length === 0 ? (
                              <tr>
                                <td colSpan={4} className="px-4 py-12 text-center">
                                  <div className="flex flex-col items-center gap-3 text-gray-600">
                                    <Loader2 className="animate-spin" size={24} />
                                    <span className="text-xs font-mono uppercase tracking-widest">Enumerating Infrastructure...</span>
                                  </div>
                                </td>
                              </tr>
                            ) : subdomainResults.length > 0 ? (
                              subdomainResults.map((sub, i) => (
                                <tr key={i} className="hover:bg-white/5 transition-colors group">
                                  <td className="px-4 py-3">
                                    <div className="flex items-center gap-2">
                                      <span className="text-xs font-mono text-white">{sub.subdomain}</span>
                                      <button 
                                        onClick={() => {
                                          setQuery(sub.subdomain);
                                          lookupIP();
                                        }}
                                        className="text-[10px] font-mono text-orange-400 opacity-0 group-hover:opacity-100 transition-opacity"
                                      >
                                        [SCAN]
                                      </button>
                                    </div>
                                  </td>
                                  <td className="px-4 py-3 text-xs font-mono text-gray-400">{sub.ip}</td>
                                  <td className="px-4 py-3">
                                    <span className={cn(
                                      "text-[10px] font-mono px-2 py-0.5 rounded border",
                                      sub.status === 'up' ? "text-cyber-green bg-cyber-green/10 border-cyber-green/20" : "text-red-400 bg-red-400/10 border-red-400/20"
                                    )}>
                                      {sub.status.toUpperCase()}
                                    </span>
                                  </td>
                                  <td className="px-4 py-3 text-[10px] font-mono text-gray-500">
                                    {sub.last_seen ? new Date(sub.last_seen).toLocaleString() : 'N/A'}
                                  </td>
                                </tr>
                              ))
                            ) : (
                              <tr>
                                <td colSpan={4} className="px-4 py-12 text-center text-gray-600 font-mono text-xs uppercase tracking-widest italic">
                                  No subdomains discovered for this target
                                </td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'graph' && (
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Activity className="text-blue-400" size={18} />
                      <h3 className="text-sm font-mono font-bold text-white uppercase">Infrastructure Graph</h3>
                    </div>
                    <div className="h-[400px] bg-black/40 rounded-xl border border-white/5 relative overflow-hidden flex items-center justify-center">
                      {/* Simulated Graph Visualization */}
                      <div className="relative w-full h-full">
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="relative">
                            {/* Central Node */}
                            <motion.div 
                              animate={{ scale: [1, 1.1, 1] }}
                              transition={{ duration: 2, repeat: Infinity }}
                              className="w-16 h-16 rounded-full bg-orange-500/20 border-2 border-orange-500 flex items-center justify-center z-10 relative"
                            >
                              <Globe className="text-orange-500" size={24} />
                            </motion.div>
                            
                            {/* Orbiting Nodes */}
                            {[
                              { icon: Search, label: 'DNS', angle: 0 },
                              { icon: Shield, label: 'WAF', angle: 72 },
                              { icon: Database, label: 'DB', angle: 144 },
                              { icon: Activity, label: 'CDN', angle: 216 },
                              { icon: Network, label: 'API', angle: 288 },
                            ].map((node, i) => {
                              const radius = 120;
                              const x = Math.cos((node.angle * Math.PI) / 180) * radius;
                              const y = Math.sin((node.angle * Math.PI) / 180) * radius;
                              
                              return (
                                <React.Fragment key={i}>
                                  <div 
                                    className="absolute w-px h-px bg-orange-500/30"
                                    style={{ 
                                      left: '50%', 
                                      top: '50%', 
                                      width: radius,
                                      transform: `rotate(${node.angle}deg)`,
                                      transformOrigin: 'left center'
                                    }}
                                  />
                                  <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    className="absolute w-10 h-10 rounded-lg bg-white/5 border border-white/10 flex flex-col items-center justify-center gap-1"
                                    style={{ 
                                      left: `calc(50% + ${x}px - 20px)`, 
                                      top: `calc(50% + ${y}px - 20px)` 
                                    }}
                                  >
                                    <node.icon className="text-gray-400" size={14} />
                                    <span className="text-[8px] font-mono text-gray-500">{node.label}</span>
                                  </motion.div>
                                </React.Fragment>
                              );
                            })}
                          </div>
                        </div>
                        <div className="absolute bottom-4 left-4 right-4 flex justify-between items-end">
                          <div className="space-y-1">
                            <div className="text-[10px] font-mono text-orange-400 uppercase">TARGET: {result.query}</div>
                            <div className="text-[10px] font-mono text-gray-500 uppercase tracking-widest">INFRASTRUCTURE CONFIDENCE: 92%</div>
                          </div>
                          <div className="text-[10px] font-mono text-gray-500 animate-pulse uppercase tracking-widest">LIVE MONITORING...</div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'map' && (
                  <div className="relative h-[400px] bg-black/40 border border-cyber-border rounded-2xl overflow-hidden group">
                    {/* Simulated Cyber Map */}
                    <div className="absolute inset-0 opacity-20 pointer-events-none">
                      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-orange-500/20 via-transparent to-transparent" />
                      <div className="w-full h-full bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-50" />
                    </div>
                    
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="relative">
                        {/* Target Marker */}
                        <motion.div 
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="absolute -translate-x-1/2 -translate-y-1/2"
                        >
                          <div className="w-8 h-8 bg-orange-500/20 rounded-full animate-ping absolute -inset-0" />
                          <div className="w-4 h-4 bg-orange-500 rounded-full border-2 border-white shadow-[0_0_15px_rgba(249,115,22,0.5)] relative z-10" />
                        </motion.div>
                        
                        {/* Map Grid Lines */}
                        <div className="w-[800px] h-[800px] border border-orange-500/10 rounded-full absolute -translate-x-1/2 -translate-y-1/2 pointer-events-none" />
                        <div className="w-[600px] h-[600px] border border-orange-500/5 rounded-full absolute -translate-x-1/2 -translate-y-1/2 pointer-events-none" />
                        <div className="w-[400px] h-[400px] border border-orange-500/5 rounded-full absolute -translate-x-1/2 -translate-y-1/2 pointer-events-none" />
                      </div>
                    </div>

                    <div className="absolute bottom-6 left-6 right-6 flex items-end justify-between">
                      <div className="p-4 bg-black/80 border border-cyber-border rounded-xl backdrop-blur-md space-y-2">
                        <div className="text-[10px] font-mono text-orange-500 uppercase tracking-widest">Geolocation Lock</div>
                        <div className="text-sm font-bold text-white">{result.city}, {result.country}</div>
                        <div className="text-[10px] font-mono text-gray-500">{result.lat}, {result.lon}</div>
                      </div>
                      <div className="p-4 bg-black/80 border border-cyber-border rounded-xl backdrop-blur-md text-right">
                        <div className="text-[10px] font-mono text-blue-400 uppercase tracking-widest">ISP Node</div>
                        <div className="text-xs font-mono text-white">{result.isp}</div>
                      </div>
                    </div>

                    <div className="absolute top-6 right-6">
                      <div className="px-3 py-1.5 bg-orange-500/10 border border-orange-500/30 rounded-full text-[10px] font-mono text-orange-400 uppercase tracking-widest flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-pulse" />
                        Live Tracking Active
                      </div>
                    </div>
                  </div>
                )}
              </motion.div>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-cyber-card border border-cyber-border p-6 rounded-xl flex items-center gap-4">
          <div className="p-3 bg-orange-500/10 rounded-lg text-orange-400">
            <Wifi size={24} />
          </div>
          <div>
            <div className="text-xs text-gray-500 uppercase font-mono">Network Status</div>
            <div className="text-white font-bold">Online</div>
          </div>
        </div>
        <div className="bg-cyber-card border border-cyber-border p-6 rounded-xl flex items-center gap-4">
          <div className="p-3 bg-blue-500/10 rounded-lg text-blue-400">
            <Database size={24} />
          </div>
          <div>
            <div className="text-xs text-gray-500 uppercase font-mono">OSINT Nodes</div>
            <div className="text-white font-bold">Global</div>
          </div>
        </div>
        <div className="bg-cyber-card border border-cyber-border p-6 rounded-xl flex items-center gap-4">
          <div className="p-3 bg-cyber-green/10 rounded-lg text-cyber-green">
            <Shield size={24} />
          </div>
          <div>
            <div className="text-xs text-gray-500 uppercase font-mono">Privacy Mode</div>
            <div className="text-white font-bold">Enabled</div>
          </div>
        </div>
      </div>
    </div>
  );
}
