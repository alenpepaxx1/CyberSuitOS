/* COPYRIGHT ALEN PEPA */
import React, { useState, useEffect, useRef } from 'react';
import { cn } from '@/src/lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { fetchAiGenerate } from '../lib/ai-fetch';
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
  CheckCircle2,
  FolderTree,
  Wand2,
  FileText,
  RefreshCw
} from 'lucide-react';
import { logToTerminal } from './Terminal';
import Editor from 'react-simple-code-editor';
import Prism from 'prismjs';
import 'prismjs/components/prism-python';
import 'prismjs/themes/prism-tomorrow.css';

// Load Pyodide from CDN
const PYODIDE_URL = "https://cdn.jsdelivr.net/pyodide/v0.25.0/full/pyodide.js";

interface Script {
  id: string;
  name: string;
  code: string;
  description: string;
  category: 'Network' | 'Crypto' | 'Web' | 'Utility' | 'Data' | 'AI';
}

const DEFAULT_SCRIPTS: Script[] = [
  {
    id: '1',
    name: 'Network Scanner Pro',
    category: 'Network',
    description: 'Advanced network scanning simulation with latency and service detection.',
    code: `import time\nimport random\n\ndef scan_network(subnet):\n    print(f"[*] Initializing Neural Network Scan on {subnet}...")\n    print(f"[*] Loading service signatures...")\n    time.sleep(0.5)\n    \n    hosts = []\n    for i in range(1, 10):\n        if random.random() > 0.4:\n            ip = f"{subnet}.{i}"\n            latency = round(random.uniform(10, 150), 2)\n            services = random.sample(['SSH', 'HTTP', 'HTTPS', 'FTP', 'MySQL', 'Redis'], random.randint(1, 3))\n            hosts.append({"ip": ip, "latency": latency, "services": services})\n            \n    print(f"[+] Found {len(hosts)} active hosts.")\n    print("-" * 50)\n    print(f"{'IP ADDRESS':<15} | {'LATENCY':<10} | {'SERVICES'}")\n    print("-" * 50)\n    \n    for host in hosts:\n        time.sleep(0.2)\n        services_str = ", ".join(host['services'])\n        print(f"{host['ip']:<15} | {host['latency']:<7} ms | {services_str}")\n\nscan_network("192.168.1")`
  },
  {
    id: '2',
    name: 'AES-256 Simulation',
    category: 'Crypto',
    description: 'Simulates AES encryption process with key expansion and rounds.',
    code: `import hashlib\nimport time\n\ndef simulate_aes(data, key):\n    print(f"[*] Starting AES-256 Simulation...")\n    print(f"[*] Input: {data}")\n    \n    # Key Expansion\n    expanded_key = hashlib.sha256(key.encode()).hexdigest()\n    print(f"[*] Key Expanded: {expanded_key[:16]}...")\n    \n    # Rounds\n    for i in range(1, 5):\n        time.sleep(0.1)\n        print(f"[>] Round {i}: SubBytes -> ShiftRows -> MixColumns -> AddRoundKey")\n        \n    # Final Result (Simulated)\n    ciphertext = hashlib.sha256((data + expanded_key).encode()).hexdigest()\n    print(f"[+] Encryption Complete.")\n    print(f"[+] Ciphertext: {ciphertext}")\n\nsimulate_aes("TOP_SECRET_CARGO", "NEURAL_CORE_ALPHA")`
  },
  {
    id: '3',
    name: 'Data Analysis Engine',
    category: 'Data',
    description: 'Processes system logs and generates statistical insights.',
    code: `import random\nfrom collections import Counter\n\ndef analyze_logs(count=100):\n    print(f"[*] Analyzing {count} system log entries...")\n    \n    event_types = ['AUTH_SUCCESS', 'AUTH_FAILURE', 'FILE_ACCESS', 'NET_CONNECT', 'SYS_UPDATE']\n    logs = [random.choice(event_types) for _ in range(count)]\n    \n    stats = Counter(logs)\n    \n    print("-" * 30)\n    print(f"{'EVENT TYPE':<15} | {'COUNT':<5} | {'PERCENT'}")\n    print("-" * 30)\n    \n    for event, count_val in stats.items():\n        percent = (count_val / count) * 100\n        print(f"{event:<15} | {count_val:<5} | {percent:>6.1f}%")\n    \n    print("-" * 30)\n    most_common = stats.most_common(1)[0]\n    print(f"[!] Critical Insight: {most_common[0]} is the dominant event.")\n\nanalyze_logs(500)`
  },
  {
    id: '4',
    name: 'Blockchain Simulator',
    category: 'Crypto',
    description: 'Simulates a simple blockchain with proof-of-work.',
    code: `import hashlib\nimport time\n\nclass Block:\n    def __init__(self, index, previous_hash, timestamp, data, hash):\n        self.index = index\n        self.previous_hash = previous_hash\n        self.timestamp = timestamp\n        self.data = data\n        self.hash = hash\n\ndef calculate_hash(index, previous_hash, timestamp, data):\n    value = str(index) + str(previous_hash) + str(timestamp) + str(data)\n    return hashlib.sha256(value.encode('utf-8')).hexdigest()\n\ndef create_genesis_block():\n    return Block(0, "0", int(time.time()), "Genesis Block", calculate_hash(0, "0", int(time.time()), "Genesis Block"))\n\ndef next_block(last_block, data):\n    this_index = last_block.index + 1\n    this_timestamp = int(time.time())\n    this_hash = calculate_hash(this_index, last_block.hash, this_timestamp, data)\n    return Block(this_index, last_block.hash, this_timestamp, data, this_hash)\n\n# Create the blockchain and add the genesis block\nblockchain = [create_genesis_block()]\nprevious_block = blockchain[0]\n\nprint(f"[*] Genesis Block created: {previous_block.hash}")\n\n# Add blocks to the blockchain\nnum_of_blocks_to_add = 3\nfor i in range(0, num_of_blocks_to_add):\n    time.sleep(0.5)\n    block_to_add = next_block(previous_block, f"Block #{i+1} Data")\n    blockchain.append(block_to_add)\n    previous_block = block_to_add\n    print(f"[+] Block #{block_to_add.index} added to blockchain!")\n    print(f"    Hash: {block_to_add.hash}")\n`
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
  const [vfsFiles, setVfsFiles] = useState<string[]>([]);
  const [aiPrompt, setAiPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  
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
            refreshVFS(py);
          };
        } else {
          const py = await (window as any).loadPyodide();
          setPyodide(py);
          setIsPyodideLoading(false);
          refreshVFS(py);
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

  const refreshVFS = (pyInstance: any = pyodide) => {
    if (!pyInstance) return;
    try {
      const files = pyInstance.FS.readdir('.');
      setVfsFiles(files.filter((f: string) => f !== '.' && f !== '..' && f !== 'tmp' && f !== 'home' && f !== 'dev' && f !== 'proc' && f !== 'lib'));
    } catch (e) {
      console.error("Error reading VFS:", e);
    }
  };

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
      refreshVFS(); // Refresh VFS in case script created files
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
    if (isAnalyzing) return;

    setIsAnalyzing(true);
    logToTerminal("AI Analyst is reviewing your code...", "info");
    try {
      const data = await fetchAiGenerate({
        contents: [{ role: 'user', parts: [{ text: `Analyze this Python code for security vulnerabilities, performance issues, and best practices. Provide a concise summary with actionable advice.\n\nCode:\n${code}` }] }],
        config: {
          systemInstruction: "You are Alen, the CyberSuite OS AI Security Analyst. Be technical, concise, and professional. Use markdown for formatting.",
        }
      });
      setAiAnalysis(data.text || "No analysis available.");
      logToTerminal("AI Code Analysis complete.", "success");
    } catch (err) {
      console.error("AI Analysis failed:", err);
      setAiAnalysis("### [OFFLINE_ANALYSIS] AI Core Offline\n\n**Status:** Simulated Heuristics\n\n**Summary:** Unable to connect to the neural core for deep analysis. Local heuristics suggest the code is functional but should be audited for input sanitization and resource management.\n\n**Actionable Advice:**\n1. Ensure all user inputs are validated.\n2. Check for potential infinite loops.\n3. Verify memory usage in large-scale operations.");
      logToTerminal("AI Analysis failed. Falling back to local heuristics.", "error");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const generateCode = async () => {
    if (!aiPrompt || isGenerating) return;
    setIsGenerating(true);
    logToTerminal(`Neural Core generating Python script: "${aiPrompt}"...`, "info");
    try {
      const data = await fetchAiGenerate({
        contents: [{ role: 'user', parts: [{ text: `Write a Python script for the following request: ${aiPrompt}. Output ONLY the raw Python code, no markdown formatting, no explanation.` }] }],
        config: {
          systemInstruction: "You are a CyberSuite OS AI Python Developer. Output ONLY raw Python code. Do not use markdown code blocks (```).",
        }
      });
      let newCode = data.text || '';
      newCode = newCode.replace(/^```python\n/, '').replace(/^```\n/, '').replace(/```$/, '');
      setCode(newCode);
      setActiveScript('custom');
      logToTerminal("Neural script generation complete.", "success");
      setAiPrompt('');
    } catch (err) {
      logToTerminal("Neural generation failed.", "error");
    } finally {
      setIsGenerating(false);
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
            Advanced Python Lab
          </h1>
          <p className="text-gray-500">Write, test, and execute Python scripts with Neural AI Assistance.</p>
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
        {/* Sidebar: Scripts Library & VFS */}
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
              {['numpy', 'pandas', 'matplotlib', 'scipy', 'regex'].map((pkg) => (
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
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-mono font-bold text-white flex items-center gap-2">
                <FolderTree size={16} className="text-yellow-500" />
                VIRTUAL_FS
              </h3>
              <button onClick={() => refreshVFS()} className="text-gray-500 hover:text-white transition-colors">
                <RefreshCw size={12} />
              </button>
            </div>
            <div className="space-y-1 text-[10px] font-mono">
              {vfsFiles.length === 0 ? (
                <div className="text-gray-600 italic py-2">No files in virtual system.</div>
              ) : (
                vfsFiles.map((file, i) => (
                  <div key={i} className="flex items-center gap-2 text-gray-400 py-1 px-2 rounded hover:bg-white/5">
                    <FileText size={12} className="text-blue-400" />
                    <span>{file}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Main Editor & Output */}
        <div className="lg:col-span-3 space-y-6">
          
          {/* AI Code Generator */}
          <div className="bg-cyber-card border border-cyber-border rounded-xl p-4 flex gap-3 items-center">
            <Wand2 className="text-purple-400" size={20} />
            <input 
              type="text"
              value={aiPrompt}
              onChange={(e) => setAiPrompt(e.target.value)}
              placeholder="Describe a Python script for the Neural AI to generate..."
              className="flex-1 bg-black/40 border border-cyber-border rounded-lg px-4 py-2 font-mono text-sm text-white focus:outline-none focus:border-purple-500/50 transition-colors"
              onKeyDown={(e) => e.key === 'Enter' && generateCode()}
            />
            <button
              onClick={generateCode}
              disabled={isGenerating || !aiPrompt}
              className="px-4 py-2 bg-purple-500/10 hover:bg-purple-500/20 text-purple-400 border border-purple-500/30 rounded-lg text-xs font-bold font-mono transition-all disabled:opacity-50 flex items-center gap-2"
            >
              {isGenerating ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
              GENERATE
            </button>
          </div>

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
                  disabled={isAnalyzing}
                  className="flex items-center gap-2 px-3 py-1.5 bg-purple-500/20 text-purple-400 border border-purple-500/30 rounded-lg text-xs font-bold hover:bg-purple-500/30 transition-colors disabled:opacity-50"
                >
                  {isAnalyzing ? <Loader2 size={14} className="animate-spin" /> : <Shield size={14} />}
                  AUDIT_CODE
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
            <div className="flex-1 overflow-auto bg-[#1d1f21] custom-scrollbar relative">
              <Editor
                value={code}
                onValueChange={code => setCode(code)}
                highlight={code => Prism.highlight(code, Prism.languages.python, 'python')}
                padding={20}
                style={{
                  fontFamily: '"JetBrains Mono", "Fira Code", monospace',
                  fontSize: 14,
                  minHeight: '100%',
                }}
                className="editor-container"
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
                    <Shield size={14} />
                    <span className="text-xs font-bold uppercase tracking-wider">AI Security & Code Audit</span>
                  </div>
                  <button 
                    onClick={() => setAiAnalysis(null)}
                    className="text-gray-500 hover:text-white transition-colors"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
                <div className="text-xs text-gray-300 leading-relaxed font-mono whitespace-pre-wrap">
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
