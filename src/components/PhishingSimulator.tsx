/* COPYRIGHT ALEN PEPA */
import React, { useState, useMemo } from 'react';
import { 
  Mail, ShieldAlert, Send, Copy, RefreshCw, 
  Eye, Terminal, Sparkles, AlertTriangle, CheckCircle2,
  Lock, Smartphone, Phone, QrCode, Target, BarChart3,
  Search, MousePointer2, Info, X, ChevronRight, Brain, Link2, FileWarning,
  User, ShieldCheck, Zap
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { fetchAiGenerate } from '../lib/ai-fetch';
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
      const vectorSpecificInstructions = {
        'credential-harvesting': 'Focus on a fake login page or security alert asking for credentials. Use realistic corporate branding.',
        'malware-delivery': 'Focus on a "mandatory" software update or an "important" document attachment. Describe the file name and type (e.g., invoice.pdf.exe).',
        'bec': 'Focus on a high-pressure request from an executive (CEO/CFO) for a wire transfer or sensitive data. Use a professional, slightly hurried tone.',
        'smishing': 'Generate a short, urgent SMS message with a suspicious shortened link.',
        'vishing': 'Generate a script for a fraudulent phone call, including the caller ID name and the transcript of the automated or live voice.',
        'qr-phishing': 'Generate a scenario where a QR code is used (e.g., a "Scan to pay" or "Scan for menu" at a corporate cafeteria). Describe the physical context.',
        'spear-phishing': 'Tailor the content specifically to an individual\'s role or a recent project at the target company.',
        'whaling': 'Create a high-stakes legal or financial threat targeting a C-level executive.'
      };

      const prompt = `Generate a highly realistic, advanced, and sophisticated phishing campaign for a corporate security training simulation.
      Target Context/Company: ${target}
      Campaign Type: ${type}
      Difficulty Level: ${difficulty}
      
      Vector Specific Context: ${vectorSpecificInstructions[type as keyof typeof vectorSpecificInstructions]}
      
      Return a JSON object with:
      1. 'subject': The email subject line (or SMS/Call title). Make it highly convincing.
      2. 'content': The main content. 
         - For Email: Use HTML with realistic corporate language.
         - For SMS: Use short text with a link.
         - For Voice: Provide a transcript of the call.
         - For QR: Describe the context and provide the text/URL the QR points to.
      3. 'redFlags': An array of objects {id, description, location} explaining subtle signs of phishing.
      4. 'psychologicalTriggers': An array of strings describing the tactics (e.g., 'Urgency', 'Authority').
      5. 'phishScore': A rating from 1-100.
      6. 'metrics': Simulated success metrics including 'clickRate', 'reportRate', 'compromiseRate' and 'deptBreakdown'.
      
      Make it extremely sophisticated and tailored to the target context.`;

      const resData = await fetchAiGenerate({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        config: {
          responseMimeType: "application/json",
          systemInstruction: "You are a CyberSuite OS Advanced Phishing Simulation Expert. Generate highly realistic, safe, and educational phishing content for corporate training. Emulate advanced persistent threat (APT) tactics. Do not generate actual malicious links or malware. Your output must be valid JSON.",
        }
      });

      let text = resData.text || '{}';
      
      if (text.includes('```')) {
        const match = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
        if (match && match[1]) text = match[1];
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
      
      // Vector-specific Fallback Engine
      const getFallbackData = () => {
        switch(type) {
          case 'smishing':
            return {
              subject: 'SMS Alert',
              content: `[${target} Security] Unusual activity detected. Your account access is limited. Please verify your identity at: https://bit.ly/${target.toLowerCase().substring(0,3)}-verify-secure`,
              redFlags: [
                { id: '1', location: 'Link', description: 'Suspicious shortened URL (bit.ly) used for corporate verification.' },
                { id: '2', location: 'Sender', description: 'Message sent from an unknown 10-digit number instead of a short code.' }
              ],
              phishScore: 82
            };
          case 'vishing':
            return {
              subject: 'Automated Security Call',
              content: `This is an automated message from the ${target} IT Security Department. We have detected a potential breach of your workstation. To prevent data loss, please provide your employee ID and temporary password to the automated system now. Failure to comply will result in immediate account suspension.`,
              redFlags: [
                { id: '1', location: 'Request', description: 'Requesting sensitive credentials over an unsolicited phone call.' },
                { id: '2', location: 'Tone', description: 'Aggressive and threatening tone used to bypass critical thinking.' }
              ],
              phishScore: 75
            };
          case 'qr-phishing':
            return {
              subject: 'Cafeteria Reward Program',
              content: `Scan the QR code on the table to join the new ${target} Employee Rewards program and get 50% off your next meal! (Points to: https://rewards.${target.toLowerCase().replace(/\s+/g, '-')}.com.co/login)`,
              redFlags: [
                { id: '1', location: 'Domain', description: 'The domain ends in .com.co instead of the official corporate .com.' },
                { id: '2', location: 'Context', description: 'QR codes in public spaces can easily be replaced by attackers.' }
              ],
              phishScore: 88
            };
          case 'malware-delivery':
            return {
              subject: `INTERNAL: Mandatory ${target} Security Patch v4.2.1`,
              content: `
                <div style="font-family: sans-serif; color: #333;">
                  <p>All employees are required to install the latest security patch to comply with our updated data protection policy.</p>
                  <p>Please download and run the attached installer: <strong>patch_installer_v421.exe</strong></p>
                  <div style="background: #f5f5f5; padding: 15px; border-radius: 8px; border: 1px solid #ddd; margin: 20px 0;">
                    <div style="display: flex; align-items: center; gap: 10px;">
                      <div style="width: 32px; height: 32px; background: #d32f2f; color: white; display: flex; align-items: center; justify-content: center; border-radius: 4px; font-weight: bold;">EXE</div>
                      <div>
                        <div style="font-size: 13px; font-weight: bold;">patch_installer_v421.exe</div>
                        <div style="font-size: 11px; color: #666;">Size: 2.4 MB • Type: Application</div>
                      </div>
                    </div>
                  </div>
                </div>
              `,
              redFlags: [
                { id: '1', location: 'Attachment', description: 'Directly sending an executable (.exe) file via email is a major security risk.' },
                { id: '2', location: 'Policy', description: 'IT usually deploys patches automatically via MDM, not manual email attachments.' }
              ],
              phishScore: 91
            };
          default:
            return {
              subject: `[URGENT] Action Required: ${target} Security Update`,
              content: `
                <div style="font-family: sans-serif; color: #333; max-width: 600px;">
                  <h2 style="color: #d32f2f;">Security Alert: Unauthorized Access Attempt</h2>
                  <p>Dear Employee,</p>
                  <p>Our security systems have detected an unusual login attempt to your <strong>${target}</strong> corporate account from an unrecognized location.</p>
                  <div style="text-align: center; margin: 30px 0;">
                    <a href="#" style="background-color: #1976d2; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold;">Verify Account Identity</a>
                  </div>
                  <p>Thank you,<br><strong>${target} Global IT Security Team</strong></p>
                </div>
              `,
              redFlags: [
                { id: '1', location: 'Sender Address', description: 'The email claims to be from IT Security but the domain might be slightly off.' },
                { id: '2', location: 'Urgency', description: 'The message creates a false sense of panic.' }
              ],
              phishScore: 78
            };
        }
      };

      const fallbackData = {
        ...getFallbackData(),
        psychologicalTriggers: ['Urgency', 'Authority', 'Fear'],
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
      
      logToTerminal(`AI Core offline. Using Local ${type.toUpperCase()} Synthesis Engine.`, "warn");
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
        <div className="w-80 border-r border-white/5 p-6 space-y-8 bg-black/40 backdrop-blur-xl overflow-y-auto custom-scrollbar z-10">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-gray-400">
                <Target size={14} className="text-blue-400" />
                <label className="text-[10px] font-mono uppercase tracking-widest">Target Profiler</label>
              </div>
              <div className="px-2 py-0.5 bg-blue-500/10 border border-blue-500/20 rounded text-[8px] font-mono text-blue-400 uppercase">Active</div>
            </div>
            <div className="relative group">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-xl blur opacity-0 group-hover:opacity-100 transition duration-500" />
              <input 
                type="text"
                value={target}
                onChange={(e) => setTarget(e.target.value)}
                placeholder="Target Organization Name..."
                className="w-full bg-black/60 border border-white/10 rounded-xl px-4 py-3.5 text-xs text-white focus:border-blue-500/50 outline-none transition-all placeholder:text-gray-700 relative z-10"
              />
            </div>
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
            className="w-full py-4 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl font-mono text-[11px] font-bold uppercase tracking-[0.2em] shadow-2xl shadow-blue-500/20 transition-all flex items-center justify-center gap-3 group relative overflow-hidden"
          >
            <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_25%,rgba(255,255,255,0.1)_50%,transparent_75%)] bg-[length:250%_250%] animate-[shimmer_3s_infinite] pointer-events-none" />
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
                          
                          {/* Header Info (for Email types) */}
                          {!(type === 'smishing' || type === 'vishing' || type === 'qr-phishing') && (
                            <div className="bg-gray-50 border-b border-gray-200 p-4 space-y-2 text-[11px] font-sans text-gray-600">
                              <div className="flex gap-4">
                                <span className="w-12 font-bold text-gray-400">From:</span>
                                <span className="flex items-center gap-1">
                                  {target} IT Support <span className="text-blue-500">&lt;support@{target.toLowerCase().replace(/\s+/g, '-')}-internal.net&gt;</span>
                                  <ShieldAlert size={12} className="text-amber-500 ml-1" />
                                </span>
                              </div>
                              <div className="flex gap-4">
                                <span className="w-12 font-bold text-gray-400">To:</span>
                                <span>employee@your-company.com</span>
                              </div>
                              <div className="flex gap-4">
                                <span className="w-12 font-bold text-gray-400">Date:</span>
                                <span>{new Date().toLocaleString()}</span>
                              </div>
                              <div className="flex gap-4">
                                <span className="w-12 font-bold text-gray-400">Subject:</span>
                                <span className="font-bold text-gray-900">{campaign.subject}</span>
                              </div>
                            </div>
                          )}

                          <div className={cn(
                            "p-10 min-h-[500px] relative transition-all duration-500",
                            (type === 'smishing' || type === 'vishing' || type === 'qr-phishing') ? "bg-[#0a0a0a] flex items-center justify-center" : "bg-white"
                          )}>
                            {type === 'malware-delivery' && (
                              <div className="absolute top-4 right-4 z-10">
                                <div className="bg-red-500/10 border border-red-500/20 rounded-full px-3 py-1 flex items-center gap-2 animate-pulse">
                                  <FileWarning size={12} className="text-red-500" />
                                  <span className="text-[10px] font-mono text-red-500 uppercase font-bold">Malicious Payload Detected</span>
                                </div>
                              </div>
                            )}
                            
                            {(type === 'smishing' || type === 'vishing' || type === 'qr-phishing') ? (
                              <div className="w-72 bg-[#1c1c1e] rounded-[3rem] p-4 border-[6px] border-[#3a3a3c] shadow-2xl relative overflow-hidden">
                                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-6 bg-[#3a3a3c] rounded-b-3xl z-20" />
                                <div className="space-y-4 mt-8">
                                  {type === 'smishing' ? (
                                    <div className="space-y-2">
                                      <div className="flex items-center gap-2 mb-4">
                                        <div className="w-8 h-8 bg-gray-700 rounded-full flex items-center justify-center">
                                          <User size={14} className="text-gray-400" />
                                        </div>
                                        <div className="text-[10px] text-white font-medium">+1 (888) 234-9921</div>
                                      </div>
                                      <div className="bg-[#2c2c2e] p-4 rounded-2xl rounded-tl-none text-white text-xs leading-relaxed shadow-lg">
                                        {campaign.content}
                                      </div>
                                      <div className="text-[9px] text-gray-500 font-mono ml-1">Delivered</div>
                                    </div>
                                  ) : type === 'vishing' ? (
                                    <div className="flex flex-col items-center justify-center py-12 space-y-6">
                                      <div className="relative">
                                        <div className="w-20 h-20 bg-red-500/20 rounded-full flex items-center justify-center animate-pulse">
                                          <Phone className="w-10 h-10 text-red-500" />
                                        </div>
                                        <div className="absolute -inset-4 border border-red-500/20 rounded-full animate-[ping_3s_linear_infinite]" />
                                      </div>
                                      <div className="text-center">
                                        <div className="text-white font-bold mb-1">Unknown Caller</div>
                                        <div className="text-red-500 text-[10px] font-mono animate-pulse uppercase tracking-widest">Incoming Call...</div>
                                      </div>
                                      <div className="bg-[#2c2c2e]/50 backdrop-blur-md p-4 rounded-xl text-white text-[11px] leading-relaxed italic text-center w-full border border-white/5">
                                        <div className="text-[8px] text-gray-500 uppercase mb-2 font-mono tracking-tighter">Transcript</div>
                                        "{campaign.content}"
                                      </div>
                                      <div className="flex gap-8 pt-4">
                                        <div className="flex flex-col items-center gap-2">
                                          <div className="w-12 h-12 bg-red-500 rounded-full flex items-center justify-center shadow-lg shadow-red-500/20">
                                            <X size={20} className="text-white" />
                                          </div>
                                          <span className="text-[9px] text-gray-500 uppercase">Decline</span>
                                        </div>
                                        <div className="flex flex-col items-center gap-2">
                                          <div className="w-12 h-12 bg-emerald-500 rounded-full flex items-center justify-center shadow-lg shadow-emerald-500/20">
                                            <Phone size={20} className="text-white" />
                                          </div>
                                          <span className="text-[9px] text-gray-500 uppercase">Accept</span>
                                        </div>
                                      </div>
                                    </div>
                                  ) : (
                                    <div className="flex flex-col items-center justify-center py-12 space-y-8">
                                      <div className="text-center space-y-2">
                                        <div className="text-white font-bold text-sm">Scan QR Code</div>
                                        <div className="text-gray-400 text-[10px] uppercase tracking-widest font-mono">{target} Rewards</div>
                                      </div>
                                      <div className="p-4 bg-white rounded-3xl shadow-2xl relative group">
                                        <div className="absolute inset-0 bg-blue-500/10 blur-xl opacity-0 group-hover:opacity-100 transition-opacity" />
                                        <img 
                                          src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(campaign.content)}&color=050505&bgcolor=ffffff`}
                                          alt="Phishing QR Code"
                                          className="w-32 h-32 relative z-10"
                                          referrerPolicy="no-referrer"
                                        />
                                      </div>
                                      <div className="text-[10px] text-gray-500 text-center leading-relaxed px-4 italic">
                                        "{campaign.content.substring(0, 60)}..."
                                      </div>
                                    </div>
                                  )}
                                  <div className="text-[9px] text-center text-gray-500 font-mono mt-4">Today 10:42 AM</div>
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
