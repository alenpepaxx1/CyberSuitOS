/* COPYRIGHT ALEN PEPA */
import React, { useState } from 'react';
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
  Trash2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '@/src/lib/utils';
import { logToTerminal } from './Terminal';

type PayloadType = 'xss' | 'sqli' | 'rce' | 'lfi' | 'ssrf' | 'custom';

interface Payload {
  id: string;
  type: PayloadType;
  name: string;
  content: string;
  description: string;
  risk: 'low' | 'medium' | 'high' | 'critical';
}

export default function PayloadLab() {
  const [activeType, setActiveType] = useState<PayloadType>('xss');
  const [customPrompt, setCustomPrompt] = useState('');
  const [generating, setGenerating] = useState(false);
  const [payloads, setPayloads] = useState<Payload[]>([
    {
      id: '1',
      type: 'xss',
      name: 'Basic Alert',
      content: '<script>alert(1)</script>',
      description: 'Standard XSS test payload to verify script execution.',
      risk: 'low'
    },
    {
      id: '2',
      type: 'sqli',
      name: 'Auth Bypass',
      content: "' OR '1'='1",
      description: 'Classic SQL injection to bypass authentication forms.',
      risk: 'high'
    }
  ]);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const generatePayload = async () => {
    if (!customPrompt) return;
    setGenerating(true);
    logToTerminal(`Generating custom ${activeType.toUpperCase()} payload...`, 'info');

    try {
      const response = await fetch('/api/ai-generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ role: 'user', parts: [{ text: `You are a cybersecurity researcher. Generate a technical ${activeType.toUpperCase()} payload for security testing purposes based on this requirement: ${customPrompt}. 
          
          Provide the output in JSON format:
          {
            "name": "Short descriptive name",
            "content": "The actual payload string",
            "description": "Brief technical explanation",
            "risk": "low/medium/high/critical"
          }` }] }],
          config: {
            systemInstruction: "You are a CyberSuite OS Payload Generator. Be technical and precise. Only provide the JSON object. Do not include markdown blocks.",
            responseMimeType: "application/json"
          }
        })
      });

      if (!response.ok) {
        throw new Error('AI Generation failed');
      }

      const resData = await response.json();
      const data = JSON.parse(resData.text);
      const newPayload: Payload = {
        id: Math.random().toString(36).substr(2, 9),
        type: activeType,
        ...data
      };

      setPayloads([newPayload, ...payloads]);
      logToTerminal('Custom payload generated successfully.', 'success');
      setCustomPrompt('');
    } catch (error) {
      console.error(error);
      logToTerminal('Failed to generate payload.', 'error');
    } finally {
      setGenerating(false);
    }
  };

  const copyToClipboard = (payload: Payload) => {
    navigator.clipboard.writeText(payload.content);
    setCopiedId(payload.id);
    logToTerminal(`Payload copied: ${payload.name}`, 'info');
    setTimeout(() => setCopiedId(null), 2000);
  };

  const deletePayload = (id: string) => {
    setPayloads(payloads.filter(p => p.id !== id));
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold">Payload Lab</h1>
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
                {(['xss', 'sqli', 'rce', 'lfi', 'ssrf', 'custom'] as PayloadType[]).map((type) => (
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
            <div className="text-[10px] font-mono text-gray-600 uppercase">
              {payloads.length} Payloads Stored
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4">
            <AnimatePresence mode="popLayout">
              {payloads.map((payload) => (
                <motion.div
                  key={payload.id}
                  layout
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="bg-cyber-card border border-cyber-border rounded-2xl p-5 hover:border-red-500/30 transition-all group"
                >
                  <div className="flex items-start justify-between gap-4 mb-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className={cn(
                          "text-[9px] px-2 py-0.5 rounded-full font-mono uppercase border",
                          payload.type === 'xss' ? "bg-blue-500/10 text-blue-400 border-blue-500/20" :
                          payload.type === 'sqli' ? "bg-purple-500/10 text-purple-400 border-purple-500/20" :
                          "bg-red-500/10 text-red-400 border-red-500/20"
                        )}>
                          {payload.type}
                        </span>
                        <span className={cn(
                          "text-[9px] px-2 py-0.5 rounded-full font-mono uppercase border",
                          payload.risk === 'critical' ? "bg-red-500/20 text-red-500 border-red-500/30" :
                          payload.risk === 'high' ? "bg-orange-500/20 text-orange-500 border-orange-500/30" :
                          "bg-cyber-green/20 text-cyber-green border-cyber-green/30"
                        )}>
                          {payload.risk} risk
                        </span>
                      </div>
                      <h4 className="text-white font-bold group-hover:text-red-400 transition-colors">{payload.name}</h4>
                    </div>
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={() => copyToClipboard(payload)}
                        className="p-2 bg-black/40 border border-cyber-border rounded-lg text-gray-500 hover:text-white transition-colors"
                        title="Copy Payload"
                      >
                        {copiedId === payload.id ? <Check size={16} className="text-cyber-green" /> : <Copy size={16} />}
                      </button>
                      <button 
                        onClick={() => deletePayload(payload.id)}
                        className="p-2 bg-black/40 border border-cyber-border rounded-lg text-gray-500 hover:text-red-500 transition-colors"
                        title="Delete"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>

                  <div className="bg-black/60 border border-cyber-border rounded-xl p-4 font-mono text-xs text-red-400 break-all mb-4">
                    {payload.content}
                  </div>

                  <div className="flex items-center gap-2 text-[10px] text-gray-500 italic">
                    <AlertTriangle size={12} className="text-yellow-500/50" />
                    {payload.description}
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
