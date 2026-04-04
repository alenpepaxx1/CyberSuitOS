/* COPYRIGHT ALEN PEPA */
import React, { useState, useMemo } from 'react';
import { 
  Mail, ShieldAlert, Send, Copy, RefreshCw, 
  Eye, Terminal, Sparkles, AlertTriangle, CheckCircle2,
  Lock, Smartphone, Phone, QrCode, Target, BarChart3,
  Search, MousePointer2, Info, X, ChevronRight, Brain, Link2, FileWarning
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '@/src/lib/utils';
import { logToTerminal } from './Terminal';

interface RedFlag {
  id: string;
  description: string;
  location: string;
}

interface PhishingCampaign {
  id: string;
  target: string;
  subject: string;
  content: string;
  type: 'credential-harvesting' | 'malware-delivery' | 'bec' | 'smishing' | 'vishing' | 'qr-phishing' | 'spear-phishing' | 'whaling';
  difficulty: 'low' | 'medium' | 'high' | 'expert';
  psychologicalTriggers: string[];
  redFlags: RedFlag[];
  metrics: {
    clickRate: number;
    reportRate: number;
    compromiseRate: number;
    deptBreakdown: { dept: string; rate: number }[];
  };
  phishScore: number;
}

export default function PhishingSimulator() {
  const [target, setTarget] = useState('');
  const [type, setType] = useState<PhishingCampaign['type']>('credential-harvesting');
  const [difficulty, setDifficulty] = useState<PhishingCampaign['difficulty']>('medium');
  const [campaign, setCampaign] = useState<PhishingCampaign | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showPreview, setShowPreview] = useState(true);
  const [foundFlags, setFoundFlags] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<'preview' | 'analytics' | 'analysis'>('preview');

  const generateCampaign = async () => {
    if (!target) return;
    setIsLoading(true);
    setFoundFlags([]);
    setActiveTab('preview');
    
    try {
      const prompt = `Generate a highly realistic, advanced, and sophisticated phishing campaign for a corporate security training simulation.
      Target Context/Company: ${target}
      Campaign Type: ${type}
      Difficulty Level: ${difficulty}
      
      Return a JSON object with:
      1. 'subject': The email subject line (or SMS/Call title). Make it highly convincing.
      2. 'content': The main content (HTML for email, Text for SMS/Call). Use realistic corporate language, formatting, and urgency.
      3. 'redFlags': An array of objects {id, description, location} explaining subtle signs of phishing (e.g., mismatched domains, slight urgency, unusual requests).
      4. 'psychologicalTriggers': An array of strings describing the psychological manipulation tactics used (e.g., 'Urgency', 'Authority', 'Fear of Missing Out').
      5. 'phishScore': A rating from 1-100 of how effective and deceptive this attack would be.
      6. 'metrics': Simulated success metrics including 'clickRate', 'reportRate', 'compromiseRate' (percentages) and 'deptBreakdown' (array of {dept, rate}).
      
      Make it extremely sophisticated, tailored to the target context, and difficult to spot for the specified difficulty level.`;

      const response = await fetch('/api/ai-generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ role: 'user', parts: [{ text: prompt }] }],
          config: {
            responseMimeType: "application/json",
            systemInstruction: "You are a CyberSuite OS Advanced Phishing Simulation Expert. Generate highly realistic, safe, and educational phishing content for corporate training. Emulate advanced persistent threat (APT) tactics. Do not generate actual malicious links or malware.",
          }
        })
      });

      if (!response.ok) {
        throw new Error(`AI Generation failed with status: ${response.status}`);
      }

      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const textBody = await response.text();
        console.error('Expected JSON but received:', textBody.substring(0, 100));
        throw new Error('Server returned non-JSON response (likely an error page)');
      }

      const resData = await response.json();
      let text = resData.text || '{}';
      
      // Strip markdown code blocks if present
      if (text.includes('```')) {
        const match = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
        if (match && match[1]) {
          text = match[1];
        }
      }
      
      const data = JSON.parse(text);
      setCampaign({
        id: Math.random().toString(36).substr(2, 9),
        target,
        type,
        difficulty,
        subject: data.subject || 'Urgent: Action Required',
        content: data.content || '<p>Default phishing content</p>',
        redFlags: data.redFlags || [],
        psychologicalTriggers: data.psychologicalTriggers || ['Urgency', 'Authority'],
        phishScore: data.phishScore || 50,
        metrics: data.metrics || {
          clickRate: 10,
          reportRate: 5,
          compromiseRate: 2,
          deptBreakdown: []
        }
      });
    } catch (error) {
      console.error("Failed to generate campaign, using local engine:", error);
      
      // Fallback Engine
      const fallbackData = {
        subject: `[URGENT] Action Required: ${target} Security Update`,
        content: `
          <div style="font-family: sans-serif; color: #333; max-width: 600px;">
            <h2 style="color: #d32f2f;">Security Alert: Unauthorized Access Attempt</h2>
            <p>Dear Employee,</p>
            <p>Our security systems have detected an unusual login attempt to your <strong>${target}</strong> corporate account from an unrecognized location (IP: 103.45.21.99 - Moscow, RU).</p>
            <p>As a precautionary measure, your account access has been temporarily restricted. To restore full access and verify your identity, please click the secure link below within the next 4 hours.</p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="#" style="background-color: #1976d2; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold;">Verify Account Identity</a>
            </div>
            <p style="font-size: 12px; color: #666;">If you do not complete this verification, your account will be permanently locked for security reasons.</p>
            <p>Thank you,<br><strong>${target} Global IT Security Team</strong></p>
            <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;">
            <p style="font-size: 10px; color: #999;">This is an automated message. Please do not reply to this email.</p>
          </div>
        `,
        redFlags: [
          { id: '1', location: 'Sender Address', description: 'The email claims to be from IT Security but the domain might be slightly off (e.g., internal-security.net instead of company.com).' },
          { id: '2', location: 'Urgency', description: 'The message creates a false sense of panic by threatening to lock the account within 4 hours.' },
          { id: '3', location: 'Link Destination', description: 'Hovering over the button reveals a suspicious URL that does not belong to the corporate domain.' }
        ],
        psychologicalTriggers: ['Urgency', 'Authority', 'Fear'],
        phishScore: 78,
        metrics: {
          clickRate: 14.5,
          reportRate: 6.2,
          compromiseRate: 3.1,
          deptBreakdown: [
            { dept: 'Finance', rate: 18 },
            { dept: 'HR', rate: 12 },
            { dept: 'Engineering', rate: 5 },
            { dept: 'Sales', rate: 22 }
          ]
        }
      };

      setCampaign({
        id: Math.random().toString(36).substr(2, 9),
        target,
        type,
        difficulty,
        ...fallbackData
      });
      
      logToTerminal("AI Core offline. Using Local Phishing Synthesis Engine.", "warn");
    } finally {
      setIsLoading(false);
    }
  };

  const toggleFlag = (id: string) => {
    setFoundFlags(prev => 
      prev.includes(id) ? prev.filter(f => f !== id) : [...prev, id]
    );
  };

  return (
    <div className="flex flex-col h-full bg-[#050505] border border-white/5 rounded-2xl overflow-hidden relative">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(59,130,246,0.05),transparent_50%)] pointer-events-none" />
      
      {/* Header */}
      <div className="p-6 border-b border-white/5 bg-black/40 backdrop-blur-md flex items-center justify-between z-10">
        <div className="flex items-center gap-4">
          <div className="p-2.5 bg-blue-500/10 rounded-xl border border-blue-500/20">
            <Mail className="w-6 h-6 text-blue-400" />
          </div>
          <div>
            <h2 className="text-sm font-mono font-bold uppercase tracking-[0.2em] text-white">Advanced Phishing Lab</h2>
            <div className="flex items-center gap-2 mt-1">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[10px] font-mono text-emerald-500/60 uppercase tracking-widest">AI Simulation Core Active</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {campaign && (
            <div className="flex items-center gap-4 px-4 py-2 bg-white/5 border border-white/10 rounded-xl">
              <div className="flex flex-col items-end">
                <span className="text-[8px] font-mono text-gray-500 uppercase">Phish Score</span>
                <span className={cn(
                  "text-xs font-mono font-bold",
                  campaign.phishScore > 70 ? "text-red-500" : "text-amber-500"
                )}>{campaign.phishScore}/100</span>
              </div>
              <div className="w-px h-6 bg-white/10" />
              <div className="flex flex-col items-end">
                <span className="text-[8px] font-mono text-gray-500 uppercase">Difficulty</span>
                <span className="text-xs font-mono text-blue-400 uppercase">{campaign.difficulty}</span>
              </div>
            </div>
          )}
          <button 
            onClick={() => setCampaign(null)}
            className="p-2.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-gray-400 transition-all"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Configuration Sidebar */}
        <div className="w-80 border-r border-white/5 p-6 space-y-8 bg-black/20 overflow-y-auto custom-scrollbar z-10">
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-gray-400">
              <Target size={14} />
              <label className="text-[10px] font-mono uppercase tracking-widest">Target Context</label>
            </div>
            <input 
              type="text"
              value={target}
              onChange={(e) => setTarget(e.target.value)}
              placeholder="e.g. Global Finance Corp"
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-xs text-white focus:border-blue-500/50 outline-none transition-all placeholder:text-gray-700"
            />
          </div>

          <div className="space-y-4">
            <div className="flex items-center gap-2 text-gray-400">
              <Send size={14} />
              <label className="text-[10px] font-mono uppercase tracking-widest">Attack Vector</label>
            </div>
            <div className="grid grid-cols-1 gap-2">
              {[
                { id: 'credential-harvesting', label: 'Credential Harvesting', icon: Link2 },
                { id: 'malware-delivery', label: 'Malware Delivery', icon: FileWarning },
                { id: 'spear-phishing', label: 'Spear Phishing', icon: Target },
                { id: 'whaling', label: 'Whaling (Exec Target)', icon: ShieldAlert },
                { id: 'bec', label: 'BEC Attack', icon: Mail },
                { id: 'smishing', label: 'Smishing (SMS)', icon: Smartphone },
                { id: 'vishing', label: 'Vishing (Voice)', icon: Phone },
                { id: 'qr-phishing', label: 'QR Quishing', icon: QrCode },
              ].map((t) => (
                <button
                  key={t.id}
                  onClick={() => setType(t.id as any)}
                  className={cn(
                    "flex items-center gap-3 px-4 py-3 rounded-xl border text-left transition-all group",
                    type === t.id 
                      ? 'bg-blue-500/10 border-blue-500/40 text-blue-400 shadow-[0_0_15px_rgba(59,130,246,0.15)]' 
                      : 'bg-white/5 border-white/5 text-gray-500 hover:border-white/10 hover:text-gray-300'
                  )}
                >
                  <t.icon className={cn("w-4 h-4 transition-colors", type === t.id ? "text-blue-400" : "text-gray-600 group-hover:text-gray-400")} />
                  <span className="text-[11px] font-mono uppercase tracking-wider">{t.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center gap-2 text-gray-400">
              <BarChart3 size={14} />
              <label className="text-[10px] font-mono uppercase tracking-widest">Complexity</label>
            </div>
            <div className="flex gap-2 p-1 bg-white/5 border border-white/5 rounded-xl">
              {['low', 'medium', 'high', 'expert'].map((d) => (
                <button
                  key={d}
                  onClick={() => setDifficulty(d as any)}
                  className={cn(
                    "flex-1 py-2 rounded-lg text-[10px] font-mono uppercase transition-all",
                    difficulty === d 
                      ? d === 'expert' ? 'bg-red-600 text-white shadow-[0_0_10px_rgba(239,68,68,0.4)]' : 'bg-blue-600 text-white shadow-lg' 
                      : 'text-gray-500 hover:text-gray-300'
                  )}
                >
                  {d}
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={generateCampaign}
            disabled={isLoading || !target}
            className="w-full py-4 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl font-mono text-[11px] font-bold uppercase tracking-[0.2em] shadow-2xl shadow-blue-500/20 transition-all flex items-center justify-center gap-3 group"
          >
            {isLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4 group-hover:rotate-12 transition-transform" />}
            {isLoading ? 'Synthesizing...' : 'Launch Simulation'}
          </button>

          <div className="p-5 bg-blue-500/5 border border-blue-500/10 rounded-2xl space-y-3">
            <div className="flex items-center gap-2 text-blue-400">
              <ShieldAlert className="w-4 h-4" />
              <span className="text-[10px] font-mono uppercase tracking-widest">Compliance Protocol</span>
            </div>
            <p className="text-[10px] text-gray-500 leading-relaxed font-sans">
              This environment is strictly for authorized security training. All generated payloads are non-malicious and intended for awareness education.
            </p>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 bg-[#030303] flex flex-col overflow-hidden">
          <AnimatePresence mode="wait">
            {campaign ? (
              <motion.div
                key={campaign.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex-1 flex flex-col overflow-hidden"
              >
                {/* Tabs */}
                <div className="flex px-8 border-b border-white/5 bg-black/20">
                  {[
                    { id: 'preview', label: 'Attack Preview', icon: Eye },
                    { id: 'analysis', label: 'Red Flag Analysis', icon: Search },
                    { id: 'analytics', label: 'Simulated Metrics', icon: BarChart3 },
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id as any)}
                      className={cn(
                        "flex items-center gap-2 px-6 py-4 text-[10px] font-mono uppercase tracking-widest transition-all relative",
                        activeTab === tab.id ? "text-blue-400" : "text-gray-500 hover:text-gray-300"
                      )}
                    >
                      <tab.icon size={14} />
                      {tab.label}
                      {activeTab === tab.id && (
                        <motion.div layoutId="activeTab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-500" />
                      )}
                    </button>
                  ))}
                </div>

                <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
                  <div className="max-w-4xl mx-auto space-y-8">
                    {activeTab === 'preview' && (
                      <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="space-y-6">
                        <div className="bg-[#0a0a0a] border border-white/5 rounded-2xl overflow-hidden shadow-2xl">
                          <div className="p-6 border-b border-white/5 bg-white/[0.02] space-y-3">
                            <div className="flex items-center gap-4">
                              <span className="text-[10px] font-mono text-gray-600 w-16 uppercase">Subject:</span>
                              <span className="text-sm font-medium text-white">{campaign.subject}</span>
                            </div>
                            <div className="flex items-center gap-4">
                              <span className="text-[10px] font-mono text-gray-600 w-16 uppercase">From:</span>
                              <span className="text-sm text-blue-400 font-mono">
                                {type === 'smishing' ? '+1 (888) 234-9921' : 
                                 type === 'vishing' ? 'Unknown Caller' :
                                 `security@${target.toLowerCase().replace(/\s+/g, '-')}-internal.net`}
                              </span>
                            </div>
                          </div>
                          
                          <div className={cn(
                            "p-10 min-h-[500px] relative",
                            (type === 'smishing' || type === 'vishing') ? "bg-[#0a0a0a] flex items-center justify-center" : "bg-white"
                          )}>
                            {(type === 'smishing' || type === 'vishing') ? (
                              <div className="w-72 bg-[#1c1c1e] rounded-[3rem] p-4 border-[6px] border-[#3a3a3c] shadow-2xl relative overflow-hidden">
                                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-6 bg-[#3a3a3c] rounded-b-3xl z-20" />
                                <div className="space-y-4 mt-8">
                                  {type === 'smishing' ? (
                                    <div className="bg-[#2c2c2e] p-4 rounded-2xl rounded-tl-none text-white text-xs leading-relaxed">
                                      {campaign.content}
                                    </div>
                                  ) : (
                                    <div className="flex flex-col items-center justify-center py-12 space-y-6">
                                      <div className="w-20 h-20 bg-red-500/20 rounded-full flex items-center justify-center animate-pulse">
                                        <Phone className="w-10 h-10 text-red-500" />
                                      </div>
                                      <div className="text-center">
                                        <div className="text-white font-bold mb-1">Unknown Caller</div>
                                        <div className="text-gray-400 text-xs">00:42</div>
                                      </div>
                                      <div className="bg-[#2c2c2e] p-4 rounded-xl text-white text-xs leading-relaxed italic text-center w-full">
                                        "{campaign.content}"
                                      </div>
                                    </div>
                                  )}
                                  <div className="text-[9px] text-center text-gray-500 font-mono">Today 10:42 AM</div>
                                </div>
                              </div>
                            ) : (
                              <div className="text-black font-sans" dangerouslySetInnerHTML={{ __html: campaign.content }} />
                            )}
                          </div>
                        </div>
                      </motion.div>
                    )}

                    {activeTab === 'analysis' && (
                      <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-6">
                          <div className="flex items-center gap-3 mb-2">
                            <Search className="text-blue-400" size={18} />
                            <h3 className="text-sm font-mono font-bold text-white uppercase tracking-widest">Red Flag Detection</h3>
                          </div>
                          <p className="text-xs text-gray-500 leading-relaxed">
                            Analyze the campaign below and identify the subtle indicators of a phishing attempt. Click on the flags to mark them as "Identified".
                          </p>
                          
                          <div className="space-y-3">
                            {campaign.redFlags.map((flag) => (
                              <button
                                key={flag.id}
                                onClick={() => toggleFlag(flag.id)}
                                className={cn(
                                  "w-full p-4 rounded-2xl border text-left transition-all flex items-start gap-4",
                                  foundFlags.includes(flag.id)
                                    ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.1)]"
                                    : "bg-white/5 border-white/5 text-gray-400 hover:border-white/10 hover:bg-white/10"
                                )}
                              >
                                <div className={cn(
                                  "mt-1 p-1 rounded-full transition-colors",
                                  foundFlags.includes(flag.id) ? "bg-emerald-500 text-black shadow-[0_0_10px_rgba(16,185,129,0.5)]" : "bg-gray-800 text-gray-500"
                                )}>
                                  <CheckCircle2 size={12} />
                                </div>
                                <div>
                                  <div className="text-[11px] font-bold uppercase mb-1">{flag.location}</div>
                                  <div className="text-[10px] leading-relaxed opacity-80">{flag.description}</div>
                                </div>
                              </button>
                            ))}
                          </div>
                        </div>

                        <div className="space-y-6">
                          <div className="bg-white/5 border border-white/5 rounded-3xl p-8 flex flex-col items-center justify-center text-center space-y-6 relative overflow-hidden">
                            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500/0 via-blue-500/50 to-blue-500/0" />
                            <div className="relative">
                              <svg className="w-32 h-32 transform -rotate-90">
                                <circle cx="64" cy="64" r="58" stroke="currentColor" strokeWidth="8" fill="transparent" className="text-white/5" />
                                <circle 
                                  cx="64" cy="64" r="58" stroke="currentColor" strokeWidth="8" fill="transparent" 
                                  strokeDasharray={364.4}
                                  strokeDashoffset={364.4 - (foundFlags.length / campaign.redFlags.length) * 364.4}
                                  className="text-blue-500 transition-all duration-1000 ease-out"
                                  style={{ filter: 'drop-shadow(0 0 8px rgba(59,130,246,0.5))' }}
                                />
                              </svg>
                              <div className="absolute inset-0 flex flex-col items-center justify-center">
                                <span className="text-2xl font-mono font-bold text-white">{Math.round((foundFlags.length / campaign.redFlags.length) * 100)}%</span>
                                <span className="text-[8px] font-mono text-gray-500 uppercase">Detection</span>
                              </div>
                            </div>
                            <div>
                              <h4 className="text-xs font-mono text-white uppercase mb-2">Analysis Progress</h4>
                              <p className="text-[10px] text-gray-500">You have identified {foundFlags.length} out of {campaign.redFlags.length} critical red flags in this campaign.</p>
                            </div>
                          </div>

                          {/* Psychological Triggers */}
                          <div className="bg-purple-500/5 border border-purple-500/20 rounded-3xl p-6">
                            <div className="flex items-center gap-2 text-purple-400 mb-4">
                              <Brain size={16} />
                              <h4 className="text-[10px] font-mono uppercase tracking-widest">Psychological Triggers</h4>
                            </div>
                            <div className="flex flex-wrap gap-2">
                              {campaign.psychologicalTriggers?.map((trigger, idx) => (
                                <span key={idx} className="px-3 py-1.5 bg-purple-500/10 border border-purple-500/30 rounded-lg text-[10px] font-mono text-purple-300">
                                  {trigger}
                                </span>
                              ))}
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    )}

                    {activeTab === 'analytics' && (
                      <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="space-y-8">
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                          {[
                            { label: 'Click Rate', value: campaign.metrics.clickRate, color: 'text-amber-500', icon: MousePointer2 },
                            { label: 'Report Rate', value: campaign.metrics.reportRate, color: 'text-emerald-500', icon: ShieldAlert },
                            { label: 'Compromise', value: campaign.metrics.compromiseRate, color: 'text-red-500', icon: AlertTriangle },
                          ].map((m) => (
                            <div key={m.label} className="p-6 bg-white/5 border border-white/5 rounded-2xl space-y-3">
                              <div className="flex items-center gap-2 text-gray-500">
                                <m.icon size={14} />
                                <span className="text-[10px] font-mono uppercase tracking-widest">{m.label}</span>
                              </div>
                              <div className={cn("text-2xl font-mono font-bold", m.color)}>{m.value}%</div>
                              <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
                                <motion.div 
                                  initial={{ width: 0 }}
                                  animate={{ width: `${m.value}%` }}
                                  className={cn("h-full", m.color.replace('text', 'bg'))}
                                />
                              </div>
                            </div>
                          ))}
                        </div>

                        <div className="bg-white/5 border border-white/5 rounded-2xl p-8">
                          <div className="flex items-center justify-between mb-8">
                            <h4 className="text-xs font-mono text-white uppercase tracking-[0.2em]">Departmental Vulnerability</h4>
                            <span className="text-[9px] font-mono text-gray-500 uppercase">Simulated Data</span>
                          </div>
                          <div className="space-y-6">
                            {campaign.metrics.deptBreakdown.map((dept) => (
                              <div key={dept.dept} className="space-y-2">
                                <div className="flex justify-between text-[10px] font-mono">
                                  <span className="text-gray-300">{dept.dept}</span>
                                  <span className="text-blue-400">{dept.rate}%</span>
                                </div>
                                <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden">
                                  <motion.div 
                                    initial={{ width: 0 }}
                                    animate={{ width: `${dept.rate}%` }}
                                    className="h-full bg-blue-500/50"
                                  />
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </div>
                </div>
              </motion.div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center p-12 text-center">
                <div className="relative mb-8">
                  <div className="absolute inset-0 bg-blue-500/20 blur-3xl rounded-full" />
                  <Mail className="w-24 h-24 text-white/5 relative z-10" />
                </div>
                <h3 className="text-lg font-mono text-white uppercase tracking-[0.3em] mb-4">Neural Phishing Lab</h3>
                <p className="text-xs text-gray-600 max-w-md leading-relaxed mb-8">
                  Configure your simulation parameters on the left and use the AI core to synthesize a sophisticated social engineering campaign for training analysis.
                </p>
                <div className="grid grid-cols-2 gap-4 w-full max-w-sm">
                  <div className="p-4 bg-white/5 border border-white/5 rounded-2xl text-left">
                    <div className="text-blue-400 mb-1"><Info size={16} /></div>
                    <div className="text-[10px] font-mono text-white uppercase mb-1">Step 1</div>
                    <div className="text-[9px] text-gray-500">Define target context & vector</div>
                  </div>
                  <div className="p-4 bg-white/5 border border-white/5 rounded-2xl text-left">
                    <div className="text-emerald-400 mb-1"><Zap size={16} /></div>
                    <div className="text-[10px] font-mono text-white uppercase mb-1">Step 2</div>
                    <div className="text-[9px] text-gray-500">Analyze & detect red flags</div>
                  </div>
                </div>
              </div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

function Zap({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon>
    </svg>
  );
}
