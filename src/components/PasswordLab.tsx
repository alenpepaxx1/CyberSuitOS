/* COPYRIGHT ALEN PEPA */
import React, { useState, useEffect, useMemo } from 'react';
import { 
  RefreshCw, 
  Copy, 
  Check, 
  Shield, 
  ShieldAlert, 
  ShieldCheck,
  Eye,
  EyeOff,
  Lock,
  Zap,
  Cpu,
  Server,
  Database,
  Hash,
  Activity,
  Info,
  ChevronRight,
  AlertTriangle,
  Search,
  Brain,
  Globe,
  Fingerprint,
  Network
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '@/src/lib/utils';
import { logToTerminal } from './Terminal';

// Simulated hashing function (for educational purposes)
const simulateHash = (text: string, algorithm: string) => {
  if (!text) return '';
  // This is a simplified simulation for UI purposes
  let hash = 0;
  for (let i = 0; i < text.length; i++) {
    const char = text.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  const hex = Math.abs(hash).toString(16).padStart(8, '0');
  
  if (algorithm === 'MD5') return hex.repeat(4).slice(0, 32);
  if (algorithm === 'SHA-1') return hex.repeat(5).slice(0, 40);
  if (algorithm === 'SHA-256') return hex.repeat(8).slice(0, 64);
  if (algorithm === 'bcrypt') return `$2b$12$${hex.repeat(7).slice(0, 53)}`;
  return hex;
};

const WORD_LIST = [
  'correct', 'horse', 'battery', 'staple', 'cyber', 'security', 'network', 'firewall',
  'encryption', 'protocol', 'database', 'server', 'cloud', 'kernel', 'binary', 'proxy',
  'packet', 'router', 'gateway', 'subnet', 'vortex', 'matrix', 'quantum', 'cipher'
];

export default function PasswordLab() {
  const [mode, setMode] = useState<'generator' | 'passphrase'>('generator');
  const [password, setPassword] = useState('');
  const [length, setLength] = useState(16);
  const [wordCount, setWordCount] = useState(4);
  const [options, setOptions] = useState({
    uppercase: true,
    lowercase: true,
    numbers: true,
    symbols: true,
    leetspeak: false,
  });
  const [copied, setCopied] = useState(false);
  const [showPassword, setShowPassword] = useState(true);
  const [activeTab, setActiveTab] = useState<'audit' | 'hashing' | 'bruteforce' | 'ai-analysis'>('audit');
  const [isPwned, setIsPwned] = useState<boolean | null>(null);
  const [isCheckingPwned, setIsCheckingPwned] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const applyLeetspeak = (text: string) => {
    return text
      .replace(/[aA]/g, '4')
      .replace(/[eE]/g, '3')
      .replace(/[iI]/g, '1')
      .replace(/[oO]/g, '0')
      .replace(/[sS]/g, '5')
      .replace(/[tT]/g, '7');
  };

  const generatePassword = () => {
    setIsPwned(null);
    setAiAnalysis(null);
    if (mode === 'generator') {
      const charset = {
        uppercase: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
        lowercase: 'abcdefghijklmnopqrstuvwxyz',
        numbers: '0123456789',
        symbols: '!@#$%^&*()_+~`|}{[]:;?><,./-=',
      };

      let characters = '';
      if (options.uppercase) characters += charset.uppercase;
      if (options.lowercase) characters += charset.lowercase;
      if (options.numbers) characters += charset.numbers;
      if (options.symbols) characters += charset.symbols;

      if (!characters) return;

      let generated = '';
      const array = new Uint32Array(length);
      window.crypto.getRandomValues(array);
      for (let i = 0; i < length; i++) {
        generated += characters.charAt(array[i] % characters.length);
      }
      
      if (options.leetspeak) {
        generated = applyLeetspeak(generated);
      }
      
      setPassword(generated);
    } else {
      let words = [];
      const array = new Uint32Array(wordCount);
      window.crypto.getRandomValues(array);
      for (let i = 0; i < wordCount; i++) {
        words.push(WORD_LIST[array[i] % WORD_LIST.length]);
      }
      let generated = words.join('-');
      
      if (options.leetspeak) {
        generated = applyLeetspeak(generated);
      }
      
      setPassword(generated);
    }
    logToTerminal(`New ${mode} generated with high entropy.`, 'success');
  };

  useEffect(() => {
    generatePassword();
  }, [length, wordCount, options, mode]);

  const stats = useMemo(() => {
    const pwd = password;
    if (!pwd) return { entropy: 0, score: 0, label: 'None', color: 'bg-gray-500' };

    let poolSize = 0;
    if (/[a-z]/.test(pwd)) poolSize += 26;
    if (/[A-Z]/.test(pwd)) poolSize += 26;
    if (/[0-9]/.test(pwd)) poolSize += 10;
    if (/[^A-Za-z0-9]/.test(pwd)) poolSize += 32;

    const entropy = Math.round(Math.log2(Math.pow(poolSize || 1, pwd.length)));
    
    let score = 0;
    if (entropy > 40) score = 1;
    if (entropy > 60) score = 2;
    if (entropy > 80) score = 3;
    if (entropy > 100) score = 4;
    if (entropy > 120) score = 5;

    const labels = ['Critical', 'Weak', 'Medium', 'Strong', 'Secure', 'Unbreakable'];
    const colors = ['bg-red-600', 'bg-red-500', 'bg-amber-500', 'bg-blue-500', 'bg-emerald-500', 'bg-cyber-green'];

    return {
      entropy,
      score,
      label: labels[score],
      color: colors[score],
      poolSize
    };
  }, [password]);

  const bruteForceTimes = useMemo(() => {
    const entropy = stats.entropy;
    const combinations = Math.pow(2, entropy);
    
    // Guesses per second
    const speeds = {
      consumer: 1e8,      // 100 Million/sec
      gpu_rig: 1e11,      // 100 Billion/sec
      supercomputer: 1e15, // 1 Quadrillion/sec
      quantum: 1e21       // 1 Sextillion/sec (Theoretical Grover's algorithm speedup)
    };

    const formatTime = (seconds: number) => {
      if (seconds < 1) return 'Instantly';
      if (seconds < 60) return `${Math.round(seconds)} seconds`;
      if (seconds < 3600) return `${Math.round(seconds / 60)} minutes`;
      if (seconds < 86400) return `${Math.round(seconds / 3600)} hours`;
      if (seconds < 31536000) return `${Math.round(seconds / 86400)} days`;
      if (seconds < 31536000000) return `${Math.round(seconds / 31536000)} years`;
      return 'Centuries';
    };

    return {
      consumer: formatTime(combinations / speeds.consumer),
      gpu_rig: formatTime(combinations / speeds.gpu_rig),
      supercomputer: formatTime(combinations / speeds.supercomputer),
      quantum: formatTime(combinations / speeds.quantum)
    };
  }, [stats.entropy]);

  const checkPwnedDatabase = () => {
    setIsCheckingPwned(true);
    setIsPwned(null);
    logToTerminal('Initiating secure k-Anonymity check against breach databases...', 'info');
    
    setTimeout(() => {
      // Simulated check
      const isCompromised = stats.entropy < 50 || password === 'password' || password === '123456';
      setIsPwned(isCompromised);
      setIsCheckingPwned(false);
      logToTerminal(isCompromised ? 'WARNING: Password found in breach database!' : 'Password is safe. No breaches found.', isCompromised ? 'error' : 'success');
    }, 2000);
  };

  const runAiAnalysis = async () => {
    if (!password) return;
    setIsAnalyzing(true);
    logToTerminal('Initializing Neural Threat Analysis on password structure...', 'info');
    
    try {
      const response = await fetch('/api/ai-generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ role: 'user', parts: [{ text: `Analyze this password from a cybersecurity perspective: "${password}". Provide a brief, highly technical 2-paragraph analysis of its structural weaknesses, predictability, and resistance to modern cracking techniques (dictionary, mask, rule-based, brute-force). Do not output markdown, just plain text.` }] }],
          config: {
            systemInstruction: "You are a CyberSuite OS Password Security Analyzer. Be highly technical, precise, and objective. Do not use markdown.",
          }
        })
      });

      if (!response.ok) throw new Error('AI Generation failed');

      const resData = await response.json();
      setAiAnalysis(resData.text);
      logToTerminal('Neural Threat Analysis complete.', 'success');
    } catch (error) {
      console.error("Failed to generate analysis:", error);
      setAiAnalysis("Analysis failed. Neural link severed.");
      logToTerminal('Neural Threat Analysis failed.', 'error');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(password);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex flex-col h-full bg-[#050505] border border-white/5 rounded-2xl overflow-hidden relative">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(16,185,129,0.03),transparent_50%)] pointer-events-none" />
      
      {/* Header */}
      <div className="p-6 border-b border-white/5 bg-black/40 backdrop-blur-md flex items-center justify-between z-10">
        <div className="flex items-center gap-4">
          <div className="p-2.5 bg-cyber-green/10 rounded-xl border border-cyber-green/20">
            <Lock className="w-6 h-6 text-cyber-green" />
          </div>
          <div>
            <h2 className="text-sm font-mono font-bold uppercase tracking-[0.2em] text-white">Password Audit Lab</h2>
            <div className="flex items-center gap-2 mt-1">
              <div className="w-1.5 h-1.5 rounded-full bg-cyber-green animate-pulse" />
              <span className="text-[10px] font-mono text-cyber-green/60 uppercase tracking-widest">Entropy Engine Online</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex p-1 bg-white/5 rounded-xl border border-white/5">
            <button 
              onClick={() => setMode('generator')}
              className={cn(
                "px-4 py-1.5 rounded-lg text-[10px] font-mono uppercase transition-all",
                mode === 'generator' ? "bg-cyber-green text-black font-bold" : "text-gray-500 hover:text-gray-300"
              )}
            >
              Generator
            </button>
            <button 
              onClick={() => setMode('passphrase')}
              className={cn(
                "px-4 py-1.5 rounded-lg text-[10px] font-mono uppercase transition-all",
                mode === 'passphrase' ? "bg-cyber-green text-black font-bold" : "text-gray-500 hover:text-gray-300"
              )}
            >
              Passphrase
            </button>
          </div>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Configuration Sidebar */}
        <div className="w-80 border-r border-white/5 p-6 space-y-8 bg-black/20 overflow-y-auto custom-scrollbar z-10">
          <div className="space-y-6">
            <div className="relative group">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-cyber-green/20 to-blue-500/20 rounded-xl blur opacity-30 group-hover:opacity-100 transition duration-1000"></div>
              <div className="relative bg-[#0a0a0a] border border-white/10 rounded-xl overflow-hidden">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  readOnly
                  className="w-full bg-transparent px-4 py-4 font-mono text-lg text-white focus:outline-none"
                />
                <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                  <button 
                    onClick={() => setShowPassword(!showPassword)}
                    className="p-2 text-gray-500 hover:text-white transition-colors"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                  <button 
                    onClick={copyToClipboard}
                    className="p-2 text-gray-500 hover:text-cyber-green transition-colors"
                  >
                    {copied ? <Check size={16} className="text-cyber-green" /> : <Copy size={16} />}
                  </button>
                  <button 
                    onClick={generatePassword}
                    className="p-2 text-gray-500 hover:text-blue-400 transition-colors"
                  >
                    <RefreshCw size={16} />
                  </button>
                </div>
              </div>
            </div>

            {/* Strength Meter */}
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-mono text-gray-500 uppercase tracking-widest">Security Level</span>
                <span className={cn("text-[10px] font-mono font-bold uppercase", stats.label === 'Secure' || stats.label === 'Unbreakable' ? "text-cyber-green" : "text-amber-500")}>
                  {stats.label}
                </span>
              </div>
              <div className="h-1.5 bg-white/5 rounded-full overflow-hidden flex gap-1">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div 
                    key={i}
                    className={cn(
                      "h-full flex-1 transition-all duration-500",
                      i <= stats.score ? stats.color : "bg-white/5"
                    )}
                  />
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-6">
            {mode === 'generator' ? (
              <>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <label className="text-[10px] font-mono text-gray-500 uppercase tracking-widest">Length</label>
                    <span className="font-mono text-cyber-green text-xs">{length}</span>
                  </div>
                  <input
                    type="range"
                    min="8"
                    max="64"
                    value={length}
                    onChange={(e) => setLength(parseInt(e.target.value))}
                    className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-cyber-green"
                  />
                </div>

                <div className="grid grid-cols-1 gap-2">
                  {Object.entries(options).map(([key, value]) => (
                    <button
                      key={key}
                      onClick={() => setOptions(prev => ({ ...prev, [key]: !value }))}
                      className={cn(
                        "flex items-center justify-between px-4 py-3 rounded-xl border transition-all duration-200",
                        value 
                          ? "bg-cyber-green/5 border-cyber-green/30 text-white shadow-[0_0_10px_rgba(16,185,129,0.1)]" 
                          : "bg-white/5 border-white/5 text-gray-500 hover:border-white/10"
                      )}
                    >
                      <span className="text-[10px] font-mono uppercase tracking-widest">{key}</span>
                      <div className={cn(
                        "w-4 h-4 rounded border flex items-center justify-center transition-colors",
                        value ? "bg-cyber-green border-cyber-green shadow-[0_0_5px_rgba(16,185,129,0.5)]" : "border-gray-700"
                      )}>
                        {value && <Check size={12} className="text-black font-bold" />}
                      </div>
                    </button>
                  ))}
                </div>
              </>
            ) : (
              <div className="space-y-6">
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <label className="text-[10px] font-mono text-gray-500 uppercase tracking-widest">Word Count</label>
                    <span className="font-mono text-cyber-green text-xs">{wordCount}</span>
                  </div>
                  <input
                    type="range"
                    min="3"
                    max="10"
                    value={wordCount}
                    onChange={(e) => setWordCount(parseInt(e.target.value))}
                    className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-cyber-green"
                  />
                  <p className="text-[9px] text-gray-600 leading-relaxed italic">
                    Passphrases are often easier to remember but harder for machines to crack due to high length.
                  </p>
                </div>
                
                <button
                  onClick={() => setOptions(prev => ({ ...prev, leetspeak: !prev.leetspeak }))}
                  className={cn(
                    "w-full flex items-center justify-between px-4 py-3 rounded-xl border transition-all duration-200",
                    options.leetspeak 
                      ? "bg-cyber-green/5 border-cyber-green/30 text-white shadow-[0_0_10px_rgba(16,185,129,0.1)]" 
                      : "bg-white/5 border-white/5 text-gray-500 hover:border-white/10"
                  )}
                >
                  <span className="text-[10px] font-mono uppercase tracking-widest">Leetspeak</span>
                  <div className={cn(
                    "w-4 h-4 rounded border flex items-center justify-center transition-colors",
                    options.leetspeak ? "bg-cyber-green border-cyber-green shadow-[0_0_5px_rgba(16,185,129,0.5)]" : "border-gray-700"
                  )}>
                    {options.leetspeak && <Check size={12} className="text-black font-bold" />}
                  </div>
                </button>
              </div>
            )}
          </div>

          <div className="p-5 bg-cyber-green/5 border border-cyber-green/10 rounded-2xl space-y-3">
            <div className="flex items-center gap-2 text-cyber-green">
              <Zap className="w-4 h-4" />
              <span className="text-[10px] font-mono uppercase tracking-widest">Entropy Data</span>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-[10px] font-mono">
                <span className="text-gray-500">Bits of Entropy:</span>
                <span className="text-white">{stats.entropy} bits</span>
              </div>
              <div className="flex justify-between text-[10px] font-mono">
                <span className="text-gray-500">Pool Size:</span>
                <span className="text-white">{stats.poolSize} chars</span>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 bg-[#030303] flex flex-col overflow-hidden">
          {/* Tabs */}
          <div className="flex px-8 border-b border-white/5 bg-black/20">
            {[
              { id: 'audit', label: 'Security Audit', icon: Search },
              { id: 'bruteforce', label: 'Cracking Estimation', icon: Activity },
              { id: 'hashing', label: 'Hash Simulator', icon: Hash },
              { id: 'ai-analysis', label: 'AI Threat Analysis', icon: Brain },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={cn(
                  "flex items-center gap-2 px-6 py-4 text-[10px] font-mono uppercase tracking-widest transition-all relative",
                  activeTab === tab.id ? "text-cyber-green" : "text-gray-500 hover:text-gray-300"
                )}
              >
                <tab.icon size={14} />
                {tab.label}
                {activeTab === tab.id && (
                  <motion.div layoutId="activeTabPass" className="absolute bottom-0 left-0 right-0 h-0.5 bg-cyber-green shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
                )}
              </button>
            ))}
          </div>

          <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
            <div className="max-w-4xl mx-auto space-y-8">
              {activeTab === 'audit' && (
                <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="space-y-8">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="p-6 bg-white/5 border border-white/5 rounded-2xl space-y-4">
                      <h3 className="text-xs font-mono font-bold text-white uppercase tracking-widest flex items-center gap-2">
                        <ShieldCheck className="text-cyber-green" size={16} />
                        Audit Results
                      </h3>
                      <div className="space-y-3">
                        {[
                          { label: 'Length Check', pass: password.length >= 12, text: 'Minimum 12 characters recommended' },
                          { label: 'Complexity', pass: stats.poolSize >= 62, text: 'Mixed case and numbers detected' },
                          { label: 'Entropy', pass: stats.entropy >= 80, text: 'High cryptographic randomness' },
                          { label: 'Pattern Check', pass: !/(.)\1\1/.test(password), text: 'No obvious repeating patterns' },
                        ].map((item, i) => (
                          <div key={i} className="flex items-start gap-3 p-3 bg-black/40 rounded-xl border border-white/5">
                            {item.pass ? <Check className="text-cyber-green mt-0.5" size={14} /> : <AlertTriangle className="text-amber-500 mt-0.5" size={14} />}
                            <div>
                              <div className="text-[10px] font-bold text-white uppercase">{item.label}</div>
                              <div className="text-[9px] text-gray-500">{item.text}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="p-6 bg-white/5 border border-white/5 rounded-2xl space-y-4">
                      <h3 className="text-xs font-mono font-bold text-white uppercase tracking-widest flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Globe className="text-blue-400" size={16} />
                          Breach Database Check
                        </div>
                        {isPwned !== null && (
                          <span className={cn("text-[9px] px-2 py-0.5 rounded-full border", isPwned ? "bg-red-500/10 text-red-500 border-red-500/30" : "bg-cyber-green/10 text-cyber-green border-cyber-green/30")}>
                            {isPwned ? 'COMPROMISED' : 'SAFE'}
                          </span>
                        )}
                      </h3>
                      <div className="space-y-4">
                        <p className="text-[10px] text-gray-400 leading-relaxed">
                          Simulate a secure k-Anonymity check against known data breaches (e.g., Have I Been Pwned).
                        </p>
                        
                        <button
                          onClick={checkPwnedDatabase}
                          disabled={isCheckingPwned}
                          className="w-full py-3 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl font-mono text-[10px] font-bold uppercase tracking-widest transition-all flex items-center justify-center gap-2"
                        >
                          {isCheckingPwned ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Network className="w-4 h-4" />}
                          {isCheckingPwned ? 'Querying Databases...' : 'Run Breach Check'}
                        </button>

                        <AnimatePresence>
                          {isPwned !== null && (
                            <motion.div 
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: 'auto' }}
                              className={cn(
                                "p-4 rounded-xl border text-[10px] leading-relaxed",
                                isPwned ? "bg-red-500/10 border-red-500/20 text-red-400" : "bg-cyber-green/10 border-cyber-green/20 text-cyber-green"
                              )}
                            >
                              {isPwned 
                                ? "WARNING: This password has been found in known data breaches. It is highly vulnerable to dictionary and credential stuffing attacks. Do not use it." 
                                : "Good news! This password was not found in any known data breaches. It appears to be unique."}
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {activeTab === 'ai-analysis' && (
                <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="space-y-8">
                  <div className="bg-[#0a0a0a] border border-white/5 rounded-2xl overflow-hidden shadow-2xl relative">
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(16,185,129,0.05),transparent_50%)] pointer-events-none" />
                    
                    <div className="p-6 border-b border-white/5 bg-white/[0.02] flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-cyber-green/10 rounded-lg border border-cyber-green/20">
                          <Brain className="w-5 h-5 text-cyber-green" />
                        </div>
                        <div>
                          <h3 className="text-sm font-mono font-bold text-white uppercase tracking-widest">Neural Threat Analysis</h3>
                          <p className="text-[10px] text-gray-500 font-mono">AI-Powered Structural Password Evaluation</p>
                        </div>
                      </div>
                      <button
                        onClick={runAiAnalysis}
                        disabled={isAnalyzing}
                        className="px-6 py-2.5 bg-cyber-green hover:bg-emerald-400 disabled:opacity-50 disabled:cursor-not-allowed text-black rounded-xl font-mono text-[10px] font-bold uppercase tracking-widest transition-all flex items-center gap-2 shadow-[0_0_15px_rgba(16,185,129,0.3)]"
                      >
                        {isAnalyzing ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Fingerprint className="w-4 h-4" />}
                        {isAnalyzing ? 'Analyzing...' : 'Run Analysis'}
                      </button>
                    </div>

                    <div className="p-8 min-h-[300px] flex flex-col">
                      {isAnalyzing ? (
                        <div className="flex-1 flex flex-col items-center justify-center space-y-4">
                          <div className="relative">
                            <div className="w-16 h-16 border-4 border-cyber-green/20 border-t-cyber-green rounded-full animate-spin" />
                            <Brain className="w-6 h-6 text-cyber-green absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-pulse" />
                          </div>
                          <div className="text-[10px] font-mono text-cyber-green uppercase tracking-widest animate-pulse">
                            Synthesizing Threat Vectors...
                          </div>
                        </div>
                      ) : aiAnalysis ? (
                        <motion.div 
                          initial={{ opacity: 0 }} 
                          animate={{ opacity: 1 }}
                          className="text-sm text-gray-300 font-mono leading-relaxed whitespace-pre-wrap"
                        >
                          {aiAnalysis}
                        </motion.div>
                      ) : (
                        <div className="flex-1 flex flex-col items-center justify-center text-center space-y-4 opacity-50">
                          <Brain className="w-16 h-16 text-gray-600" />
                          <p className="text-xs font-mono text-gray-500 max-w-sm">
                            Initiate the Neural Threat Analysis to evaluate the password's resistance to modern cracking techniques, including mask attacks and AI-driven guessing.
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              )}

              {activeTab === 'bruteforce' && (
                <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="space-y-8">
                  <div className="p-6 bg-amber-500/5 border border-amber-500/20 rounded-2xl flex items-start gap-4">
                    <AlertTriangle className="text-amber-500 shrink-0" size={20} />
                    <div>
                      <h4 className="text-xs font-mono font-bold text-amber-500 uppercase mb-1">Cracking Warning</h4>
                      <p className="text-[10px] text-gray-500 leading-relaxed">
                        These estimates assume an offline brute-force attack where the attacker has the hash. Online attacks (like logging into a website) are much slower due to rate limiting.
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    {[
                      { label: 'Consumer PC', speed: '100M H/s', time: bruteForceTimes.consumer, icon: Cpu, color: 'text-blue-400' },
                      { label: 'GPU Mining Rig', speed: '100B H/s', time: bruteForceTimes.gpu_rig, icon: Zap, color: 'text-amber-500' },
                      { label: 'Supercomputer', speed: '1Q H/s', time: bruteForceTimes.supercomputer, icon: Server, color: 'text-red-500' },
                      { label: 'Quantum Array', speed: '1S H/s', time: bruteForceTimes.quantum, icon: Network, color: 'text-purple-500' },
                    ].map((item) => (
                      <div key={item.label} className="p-6 bg-white/5 border border-white/5 rounded-2xl space-y-4 relative overflow-hidden group hover:border-white/20 transition-all">
                        <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                          <item.icon size={64} />
                        </div>
                        <div className="flex items-center gap-2 text-gray-500">
                          <item.icon size={14} />
                          <span className="text-[10px] font-mono uppercase tracking-widest">{item.label}</span>
                        </div>
                        <div className="space-y-1">
                          <div className="text-[9px] font-mono text-gray-600 uppercase">Est. Time to Crack</div>
                          <div className={cn("text-xl font-mono font-bold", item.color)}>{item.time}</div>
                        </div>
                        <div className="text-[9px] font-mono text-gray-500">Speed: {item.speed}</div>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}

              {activeTab === 'hashing' && (
                <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="space-y-6">
                  <div className="p-6 bg-white/5 border border-white/5 rounded-2xl space-y-6">
                    <div className="flex items-center justify-between">
                      <h3 className="text-xs font-mono font-bold text-white uppercase tracking-widest">Cryptographic Hashing</h3>
                      <span className="text-[9px] font-mono text-gray-500 uppercase">One-Way Transformation</span>
                    </div>
                    
                    <div className="space-y-4">
                      {['MD5', 'SHA-256', 'bcrypt'].map((algo) => (
                        <div key={algo} className="space-y-2">
                          <div className="flex justify-between items-center">
                            <span className="text-[10px] font-mono text-gray-500 uppercase">{algo}</span>
                            {algo === 'bcrypt' && <span className="text-[8px] font-mono text-cyber-green uppercase border border-cyber-green/30 px-1 rounded">Recommended</span>}
                          </div>
                          <div className="bg-black/60 border border-white/5 rounded-xl p-4 font-mono text-[11px] text-gray-400 break-all relative group">
                            {simulateHash(password, algo)}
                            <button 
                              onClick={() => {
                                navigator.clipboard.writeText(simulateHash(password, algo));
                                logToTerminal(`${algo} hash copied.`, 'info');
                              }}
                              className="absolute right-2 top-1/2 -translate-y-1/2 p-2 opacity-0 group-hover:opacity-100 transition-opacity hover:text-white"
                            >
                              <Copy size={14} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="p-4 bg-blue-500/5 border border-blue-500/10 rounded-xl flex items-start gap-3">
                      <Database className="text-blue-400 shrink-0 mt-1" size={16} />
                      <p className="text-[10px] text-gray-500 leading-relaxed">
                        In a real system, passwords are never stored in plain text. They are hashed (and salted) so that even if the database is leaked, the original passwords remain protected.
                      </p>
                    </div>
                  </div>
                </motion.div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
