/* COPYRIGHT ALEN PEPA */
import React, { useState, useEffect, useRef } from 'react';
import { cn } from '@/src/lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Play, 
  Terminal as TerminalIcon, 
  Code, 
  Trash2, 
  Save, 
  FileCode, 
  Sparkles, 
  Cpu, 
  Zap, 
  Shield,
  Loader2,
  Copy,
  Download,
  AlertCircle,
  CheckCircle2
} from 'lucide-react';
import { logToTerminal } from './Terminal';
import { GoogleGenAI } from "@google/genai";

// Load Pyodide from CDN
const PYODIDE_URL = "https://cdn.jsdelivr.net/pyodide/v0.25.0/full/pyodide.js";

interface Script {
  id: string;
  name: string;
  code: string;
  description: string;
  category: 'Network' | 'Crypto' | 'Web' | 'Utility' | 'Data';
}

const DEFAULT_SCRIPTS: Script[] = [
  {
    id: '1',
    name: 'Network Scanner Pro',
    category: 'Network',
    description: 'Advanced network scanning simulation with latency and service detection.',
    code: `import time
import random

def scan_network(subnet):
    print(f"[*] Initializing Neural Network Scan on {subnet}...")
    print(f"[*] Loading service signatures...")
    time.sleep(0.5)
    
    hosts = []
    for i in range(1, 10):
        if random.random() > 0.4:
            ip = f"{subnet}.{i}"
            latency = round(random.uniform(10, 150), 2)
            services = random.sample(['SSH', 'HTTP', 'HTTPS', 'FTP', 'MySQL', 'Redis'], random.randint(1, 3))
            hosts.append({"ip": ip, "latency": latency, "services": services})
            
    print(f"[+] Found {len(hosts)} active hosts.")
    print("-" * 50)
    print(f"{'IP ADDRESS':<15} | {'LATENCY':<10} | {'SERVICES'}")
    print("-" * 50)
    
    for host in hosts:
        time.sleep(0.2)
        services_str = ", ".join(host['services'])
        print(f"{host['ip']:<15} | {host['latency']:<7} ms | {services_str}")

scan_network("192.168.1")`
  },
  {
    id: '2',
    name: 'AES-256 Simulation',
    category: 'Crypto',
    description: 'Simulates AES encryption process with key expansion and rounds.',
    code: `import hashlib
import os

def simulate_aes(data, key):
    print(f"[*] Starting AES-256 Simulation...")
    print(f"[*] Input: {data}")
    
    # Key Expansion
    expanded_key = hashlib.sha256(key.encode()).hexdigest()
    print(f"[*] Key Expanded: {expanded_key[:16]}...")
    
    # Rounds
    for i in range(1, 5):
        time_delay = 0.1
        print(f"[>] Round {i}: SubBytes -> ShiftRows -> MixColumns -> AddRoundKey")
        
    # Final Result (Simulated)
    ciphertext = hashlib.sha256((data + expanded_key).encode()).hexdigest()
    print(f"[+] Encryption Complete.")
    print(f"[+] Ciphertext: {ciphertext}")

simulate_aes("TOP_SECRET_CARGO", "NEURAL_CORE_ALPHA")`
  },
  {
    id: '3',
    name: 'Data Analysis Engine',
    category: 'Data',
    description: 'Processes system logs and generates statistical insights.',
    code: `import random
from collections import Counter

def analyze_logs(count=100):
    print(f"[*] Analyzing {count} system log entries...")
    
    event_types = ['AUTH_SUCCESS', 'AUTH_FAILURE', 'FILE_ACCESS', 'NET_CONNECT', 'SYS_UPDATE']
    logs = [random.choice(event_types) for _ in range(count)]
    
    stats = Counter(logs)
    
    print("-" * 30)
    print(f"{'EVENT TYPE':<15} | {'COUNT':<5} | {'PERCENT'}")
    print("-" * 30)
    
    for event, count_val in stats.items():
        percent = (count_val / count) * 100
        print(f"{event:<15} | {count_val:<5} | {percent:>6.1f}%")
    
    print("-" * 30)
    most_common = stats.most_common(1)[0]
    print(f"[!] Critical Insight: {most_common[0]} is the dominant event.")

analyze_logs(500)`
  },
  {
    id: '4',
    name: 'Web Scraper (Mock)',
    category: 'Web',
    description: 'Simulates scraping security advisories from a list of URLs.',
    code: `import json

def scrape_advisories():
    print("[*] Connecting to Global Threat Database...")
    targets = ["https://cve.mitre.org", "https://nvd.nist.gov", "https://security.google.com"]
    
    results = []
    for url in targets:
        print(f"[*] Fetching data from {url}...")
        # In a real environment, we'd use requests/urllib
        results.append({
            "source": url,
            "status": 200,
            "findings": random.randint(5, 25)
        })
        
    print("[+] Aggregated Results:")
    print(json.dumps(results, indent=2))

scrape_advisories()`
  }
];

export default function PythonLab() {
  const [code, setCode] = useState(DEFAULT_SCRIPTS[0].code);
  const [output, setOutput] = useState<string[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [isPyodideLoading, setIsPyodideLoading] = useState(true);
  const [pyodide, setPyodide] = useState<any>(null);
  const [activeScript, setActiveScript] = useState<string>(DEFAULT_SCRIPTS[0].id);
  const [installedPackages, setInstalledPackages] = useState<string[]>([]);
  const [isInstalling, setIsInstalling] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const outputEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const loadPyodide = async () => {
      try {
        if (!(window as any).loadPyodide) {
          const script = document.createElement("script");
          script.src = PYODIDE_URL;
          script.async = true;
          document.body.appendChild(script);
          
          script.onload = async () => {
            const py = await (window as any).loadPyodide();
            setPyodide(py);
            setIsPyodideLoading(false);
            logToTerminal("Python Neural Core (Pyodide) initialized.", "success");
          };
        } else {
          const py = await (window as any).loadPyodide();
          setPyodide(py);
          setIsPyodideLoading(false);
        }
      } catch (err) {
        console.error("Failed to load Pyodide:", err);
        logToTerminal("Failed to initialize Python Neural Core.", "error");
      }
    };

    loadPyodide();
  }, []);

  useEffect(() => {
    if (outputEndRef.current) {
      outputEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [output]);

  const runCode = async () => {
    if (!pyodide || isRunning) return;
    
    setIsRunning(true);
    setOutput([]);
    logToTerminal("Executing Python script...", "info");
    
    try {
      // Capture stdout
      pyodide.setStdout({
        batched: (msg: string) => {
          setOutput(prev => [...prev, msg]);
        }
      });

      await pyodide.runPythonAsync(code);
      logToTerminal("Python execution complete.", "success");
    } catch (err: any) {
      setOutput(prev => [...prev, `ERROR: ${err.message}`]);
      logToTerminal("Python execution failed.", "error");
    } finally {
      setIsRunning(false);
    }
  };

  const clearOutput = () => {
    setOutput([]);
    logToTerminal("Python output cleared.", "warn");
  };

  const installPackage = async (pkg: string) => {
    if (!pyodide || isInstalling) return;
    setIsInstalling(true);
    logToTerminal(`Installing Python package: ${pkg}...`, "info");
    try {
      await pyodide.loadPackage(pkg);
      setInstalledPackages(prev => [...prev, pkg]);
      logToTerminal(`Package ${pkg} installed successfully.`, "success");
    } catch (err: any) {
      logToTerminal(`Failed to install ${pkg}: ${err.message}`, "error");
    } finally {
      setIsInstalling(false);
    }
  };

  const analyzeCode = async () => {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || isAnalyzing) return;

    setIsAnalyzing(true);
    logToTerminal("AI Analyst is reviewing your code...", "info");
    try {
      const ai = new GoogleGenAI({ apiKey });
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `Analyze this Python code for security vulnerabilities, performance issues, and best practices. Provide a concise summary with actionable advice.\n\nCode:\n${code}`,
      });
      setAiAnalysis(response.text || "No analysis available.");
      logToTerminal("AI Code Analysis complete.", "success");
    } catch (err) {
      logToTerminal("AI Analysis failed.", "error");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const selectScript = (script: Script) => {
    setActiveScript(script.id);
    setCode(script.code);
    logToTerminal(`Loaded script: ${script.name}`, "info");
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Code className="text-yellow-500" size={32} />
            Python Scripting Lab
          </h1>
          <p className="text-gray-500">Write, test, and execute Python scripts directly in your secure environment.</p>
        </div>
        
        <div className="flex items-center gap-3">
          {isPyodideLoading ? (
            <div className="flex items-center gap-2 px-4 py-2 bg-yellow-500/10 border border-yellow-500/20 rounded-xl">
              <Loader2 className="text-yellow-500 animate-spin" size={18} />
              <span className="text-xs font-mono text-yellow-500 uppercase">Initializing Core...</span>
            </div>
          ) : (
            <div className="flex items-center gap-2 px-4 py-2 bg-cyber-green/10 border border-cyber-green/20 rounded-xl">
              <CheckCircle2 className="text-cyber-green" size={18} />
              <span className="text-xs font-mono text-cyber-green uppercase">Core Online</span>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar: Scripts Library */}
        <div className="lg:col-span-1 space-y-4">
          <div className="bg-cyber-card border border-cyber-border rounded-xl p-4">
            <h3 className="text-sm font-mono font-bold text-white mb-4 flex items-center gap-2">
              <FileCode size={16} className="text-cyan-400" />
              SCRIPT_LIBRARY
            </h3>
            <div className="space-y-2">
              {DEFAULT_SCRIPTS.map((script) => (
                <button
                  key={script.id}
                  onClick={() => selectScript(script)}
                  className={cn(
                    "w-full text-left p-3 rounded-lg border transition-all group",
                    activeScript === script.id
                      ? "bg-cyan-500/10 border-cyan-500/30"
                      : "bg-white/5 border-transparent hover:border-white/10"
                  )}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className={cn(
                      "text-xs font-bold",
                      activeScript === script.id ? "text-cyan-400" : "text-gray-300"
                    )}>
                      {script.name}
                    </span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/5 text-gray-500 uppercase">
                      {script.category}
                    </span>
                  </div>
                  <p className="text-[10px] text-gray-500 line-clamp-1">{script.description}</p>
                </button>
              ))}
            </div>
          </div>

          <div className="bg-cyber-card border border-cyber-border rounded-xl p-4">
            <h3 className="text-sm font-mono font-bold text-white mb-4 flex items-center gap-2">
              <Cpu size={16} className="text-purple-400" />
              PACKAGE_MANAGER
            </h3>
            <div className="space-y-2">
              {['numpy', 'pandas', 'matplotlib', 'scipy'].map((pkg) => (
                <button
                  key={pkg}
                  onClick={() => installPackage(pkg)}
                  disabled={isInstalling || installedPackages.includes(pkg)}
                  className={cn(
                    "w-full flex items-center justify-between p-2 rounded-lg border text-[10px] font-mono transition-all",
                    installedPackages.includes(pkg)
                      ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-500"
                      : "bg-white/5 border-transparent hover:border-white/10 text-gray-400"
                  )}
                >
                  <span>{pkg.toUpperCase()}</span>
                  {installedPackages.includes(pkg) ? (
                    <CheckCircle2 size={12} />
                  ) : isInstalling ? (
                    <Loader2 size={12} className="animate-spin" />
                  ) : (
                    <Download size={12} />
                  )}
                </button>
              ))}
            </div>
          </div>

          <div className="bg-cyber-card border border-cyber-border rounded-xl p-4">
            <h3 className="text-sm font-mono font-bold text-white mb-2 flex items-center gap-2">
              <Sparkles size={16} className="text-yellow-500" />
              SYSTEM_INFO
            </h3>
            <div className="space-y-2 text-[10px] font-mono">
              <div className="flex justify-between">
                <span className="text-gray-500">Python Version:</span>
                <span className="text-white">3.11.0 (Pyodide)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Environment:</span>
                <span className="text-white">WASM Sandbox</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Memory Limit:</span>
                <span className="text-white">Browser Shared</span>
              </div>
            </div>
          </div>
        </div>

        {/* Main Editor & Output */}
        <div className="lg:col-span-3 space-y-6">
          {/* Editor */}
          <div className="bg-cyber-card border border-cyber-border rounded-xl overflow-hidden flex flex-col h-[400px]">
            <div className="p-3 border-b border-cyber-border bg-cyber-card/50 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="flex gap-1.5 mr-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-red-500/50" />
                  <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/50" />
                  <div className="w-2.5 h-2.5 rounded-full bg-green-500/50" />
                </div>
                <span className="text-xs font-mono text-gray-400">script.py</span>
              </div>
              <div className="flex items-center gap-2">
                <button 
                  onClick={analyzeCode}
                  disabled={isAnalyzing || !process.env.GEMINI_API_KEY}
                  className="flex items-center gap-2 px-3 py-1.5 bg-purple-500/20 text-purple-400 border border-purple-500/30 rounded-lg text-xs font-bold hover:bg-purple-500/30 transition-colors disabled:opacity-50"
                >
                  {isAnalyzing ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
                  AI_ANALYZE
                </button>
                <button 
                  onClick={runCode}
                  disabled={isPyodideLoading || isRunning}
                  className="flex items-center gap-2 px-3 py-1.5 bg-cyber-green/20 text-cyber-green border border-cyber-green/30 rounded-lg text-xs font-bold hover:bg-cyber-green/30 transition-colors disabled:opacity-50"
                >
                  {isRunning ? <Loader2 size={14} className="animate-spin" /> : <Play size={14} />}
                  RUN_SCRIPT
                </button>
              </div>
            </div>
            <div className="flex-1 flex overflow-hidden">
              <div className="w-12 bg-black/20 border-r border-cyber-border flex flex-col items-center py-6 text-[10px] font-mono text-gray-600 select-none">
                {code.split('\n').map((_, i) => (
                  <div key={i} className="h-5 leading-5">{i + 1}</div>
                ))}
              </div>
              <textarea
                value={code}
                onChange={(e) => setCode(e.target.value)}
                spellCheck={false}
                className="flex-1 bg-cyber-bg p-6 font-mono text-sm text-gray-300 focus:outline-none resize-none custom-scrollbar leading-5"
              />
            </div>
          </div>

          {/* AI Analysis Overlay */}
          <AnimatePresence>
            {aiAnalysis && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="bg-purple-500/5 border border-purple-500/20 rounded-xl p-4 relative overflow-hidden"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2 text-purple-400">
                    <Sparkles size={14} />
                    <span className="text-xs font-bold uppercase tracking-wider">AI Security & Code Analysis</span>
                  </div>
                  <button 
                    onClick={() => setAiAnalysis(null)}
                    className="text-gray-500 hover:text-white transition-colors"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
                <div className="text-xs text-gray-400 leading-relaxed font-mono whitespace-pre-wrap">
                  {aiAnalysis}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Output Terminal */}
          <div className="bg-cyber-card border border-cyber-border rounded-xl overflow-hidden flex flex-col h-[250px]">
            <div className="p-3 border-b border-cyber-border bg-cyber-card/50 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <TerminalIcon size={14} className="text-cyber-green" />
                <span className="text-xs font-mono font-bold text-white uppercase tracking-wider">Console Output</span>
              </div>
              <button 
                onClick={clearOutput}
                className="p-1.5 text-gray-500 hover:text-red-400 transition-colors"
                title="Clear Output"
              >
                <Trash2 size={14} />
              </button>
            </div>
            <div className="flex-1 bg-black/40 p-4 font-mono text-xs overflow-y-auto custom-scrollbar">
              {output.length === 0 ? (
                <div className="h-full flex items-center justify-center text-gray-600 italic">
                  No output to display. Run a script to see results.
                </div>
              ) : (
                <div className="space-y-1">
                  {output.map((line, i) => (
                    <div key={i} className={cn(
                      "whitespace-pre-wrap",
                      line.startsWith('ERROR:') ? "text-red-400" : "text-cyber-green"
                    )}>
                      {line}
                    </div>
                  ))}
                  <div ref={outputEndRef} />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
